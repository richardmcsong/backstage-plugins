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
  coreServices,
  createServiceFactory,
  createServiceRef,
  BackstageUserInfo,
} from '@backstage/backend-plugin-api';
import { RootConfigService } from '@backstage/backend-plugin-api';
import { Utils } from '../utils/utils';
// eslint-disable-next-line @backstage/no-undeclared-imports
import { NotAllowedError, NotFoundError } from '@backstage/errors';
import {
  generateKeyFnKeyGeneratePost,
  listKeysKeyListGet,
  deleteKeyFnKeyDeletePost,
} from '../upstream/sdk.gen';
import { UserKeyList } from '../schema/openapi/generated/models/UserKeyList.model';
import { UserKey } from '../schema/openapi/generated/models/UserKey.model';
import { UserAPIKeyAuth } from '../schema/openapi/generated/models/UserAPIKeyAuth.model';
/**
 * This class provides a service for managing LiteLLM Orchestrator users.
 *
 */
export class KeyService {
  readonly #utils: Utils;
  static create(config: RootConfigService) {
    return new KeyService(config);
  }
  private constructor(config: RootConfigService) {
    this.#utils = new Utils(config);
  }
  async createKey(
    userId: string,
    currentUser: BackstageUserInfo,
  ): Promise<UserKey> {
    if (
      !this.#utils.isSelf(currentUser, userId) &&
      !this.#utils.isAdmin(currentUser)
    ) {
      throw new NotAllowedError(
        `You are not allowed to create a key for user ${userId}`,
      );
    }
    const response = await generateKeyFnKeyGeneratePost({
      client: this.#utils.client,
      body: { user_id: userId },
    });
    if (!response.data || !response.response.ok) {
      throw new Error(
        `Failed to create key: no response data, response status: ${response.response.status}`,
      );
    }
    return {
      userId: response.data.user_id,
      keyId: response.data.token,
      keySecret: response.data.key,
    } as UserKey;
  }

  async listUserKeys(
    userId: string,
    currentUser: BackstageUserInfo,
  ): Promise<UserKeyList> {
    if (
      !this.#utils.isSelf(currentUser, userId) &&
      !this.#utils.isAdmin(currentUser)
    ) {
      throw new NotAllowedError(
        `You are not allowed to get keys for user ${userId}`,
      );
    }
    const keys: UserAPIKeyAuth[] = [];
    let response: Awaited<ReturnType<typeof listKeysKeyListGet>>;
    let currentPage = 0;
    do {
      currentPage++;
      response = await listKeysKeyListGet({
        client: this.#utils.client,
        query: {
          user_id: userId,
          return_full_object: true,
          page: currentPage,
        },
      });
      if (!response.data || !response.response.ok) {
        throw new Error(
          `Failed to get user keys: no response data, response status: ${response.response.status}`,
        );
      }
      if (response.data.keys) {
        keys.push(...response.data.keys.map(key => key as UserAPIKeyAuth));
      }
    } while (
      response.data.total_pages &&
      response.data.current_page &&
      response.data.current_page < response.data.total_pages
    );
    return { keys } as UserKeyList;
  }

  async deleteUserKey(
    userId: string,
    keyId: string,
    currentUser: BackstageUserInfo,
  ): Promise<void> {
    if (
      !this.#utils.isSelf(currentUser, userId) &&
      !this.#utils.isAdmin(currentUser)
    ) {
      throw new NotAllowedError(
        `You are not allowed to delete a key for user ${userId}`,
      );
    }
    const response = await deleteKeyFnKeyDeletePost({
      client: this.#utils.client,
      body: { keys: [keyId] },
    });
    if (response.response.status !== 200) {
      if (response.response.status === 404) {
        throw new NotFoundError('Key not found');
      }
      throw new Error(`Failed to delete key: ${response.response.status}`);
    }
  }
}

export const keyServiceRef = createServiceRef<KeyService>({
  id: 'key.service',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: { config: coreServices.rootConfig },
      async factory(deps) {
        return KeyService.create(deps.config);
      },
    }),
});
