/*
 * Copyright 2025 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  LoggerService,
  RootConfigService,
  CatalogService,
} from '@backstage/backend-plugin-api';
import { UserService } from './UserService';
import { Utils } from '../utils/utils';

/**
 * Service for cleaning up LiteLLM users that are no longer in the allowed group.
 */
export class CleanupService {
  readonly #logger: LoggerService;
  readonly #utils: Utils;
  readonly #catalog: CatalogService;
  readonly #userService: UserService;

  static create(options: {
    logger: LoggerService;
    config: RootConfigService;
    catalog: CatalogService;
    userService: UserService;
  }) {
    return new CleanupService(
      options.logger,
      options.config,
      options.catalog,
      options.userService,
    );
  }

  private constructor(
    logger: LoggerService,
    config: RootConfigService,
    catalog: CatalogService,
    userService: UserService,
  ) {
    this.#logger = logger;
    this.#utils = new Utils(config);
    this.#catalog = catalog;
    this.#userService = userService;
  }

  /**
   * Cleans up LiteLLM users that are no longer in the allowed group.
   * This method:
   * 1. Lists all LiteLLM users
   * 2. Gets the allowed group from the catalog
   * 3. Checks each user's membership in the group
   * 4. Deletes users that are no longer in the group
   */
  async cleanupUsers(): Promise<void> {
    this.#logger.info('Starting user cleanup task');

    try {
      // Get all LiteLLM users
      const allUserIds = await this.#userService.listAllUsers();
      this.#logger.info(`Found ${allUserIds.length} LiteLLM users to check`);

      if (allUserIds.length === 0) {
        return;
      }

      // Get the allowed group entity from catalog
      const allowedGroupRef = this.#utils.config.allowedGroup;
      let groupEntity;
      try {
        groupEntity = await this.#catalog.getEntityByRef(allowedGroupRef);
      } catch (error) {
        this.#logger.error(
          `Failed to get group entity ${allowedGroupRef}: ${error}`,
        );
        return;
      }

      if (!groupEntity || groupEntity.kind !== 'Group') {
        this.#logger.error(
          `Entity ${allowedGroupRef} is not a Group or does not exist`,
        );
        return;
      }

      // Get all users and filter by group membership
      // Users have a 'memberOf' relation pointing to the group
      const { entities: allUsers } = await this.#catalog.getEntities({
        filter: {
          kind: 'User',
        },
      });

      // Filter users that are members of the allowed group
      const groupMembers = allUsers
        .filter(user => {
          // Check if user has a memberOf relation to the allowed group
          return user.relations?.some(
            rel => rel.type === 'memberOf' && rel.targetRef === allowedGroupRef,
          );
        })
        .map(
          entity =>
            `${entity.kind.toLowerCase()}:${entity.metadata.namespace || 'default'}/${
              entity.metadata.name
            }`,
        );

      this.#logger.info(
        `Group ${allowedGroupRef} has ${groupMembers.length} members`,
      );

      // Find users to delete (users not in the group)
      // Normalize entity refs for comparison (handle different formats)
      const normalizeEntityRef = (ref: string): string => {
        // Ensure consistent format: kind:namespace/name
        const parts = ref.split(':');
        if (parts.length === 2) {
          const [kind, rest] = parts;
          const nameParts = rest.split('/');
          if (nameParts.length === 2) {
            return `${kind}:${nameParts[0]}/${nameParts[1]}`;
          }
          // If no namespace, assume default
          return `${kind}:default/${nameParts[0]}`;
        }
        return ref;
      };

      const normalizedGroupMembers = new Set(
        groupMembers.map(normalizeEntityRef),
      );

      const usersToDelete = allUserIds.filter(
        userId => !normalizedGroupMembers.has(normalizeEntityRef(userId)),
      );

      if (usersToDelete.length === 0) {
        this.#logger.info('No users to clean up');
        return;
      }

      this.#logger.info(
        `Found ${usersToDelete.length} users to delete: ${usersToDelete.join(', ')}`,
      );

      // Delete users in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < usersToDelete.length; i += batchSize) {
        const batch = usersToDelete.slice(i, i + batchSize);
        try {
          await this.#userService.deleteUsers(batch);
          this.#logger.info(`Deleted batch of ${batch.length} users`);
        } catch (error) {
          this.#logger.error(`Failed to delete batch: ${error}`);
        }
      }

      this.#logger.info(
        `Cleanup task completed. Deleted ${usersToDelete.length} users.`,
      );
    } catch (error) {
      this.#logger.error(`Cleanup task failed: ${error}`);
      throw error;
    }
  }
}
