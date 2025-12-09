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
  LoggerService,
  BackstageUserInfo,
} from '@backstage/backend-plugin-api';
import { RootConfigService } from '@backstage/backend-plugin-api';
import {
  ConflictError,
  NotAllowedError,
  NotFoundError,
} from '@backstage/errors';
import { User } from '../schema/openapi/generated/models/User.model';
import { newUserUserNewPost, userInfoUserInfoGet } from '../upstream/sdk.gen';
import { Utils } from '../utils/utils';
/**
 * This class provides a service for managing LiteLLM Orchestrator users.
 *
 * @property #logger - The logger service.
 * @property #storedUsers - The stored users.
 */
export class UserService {
  readonly #logger: LoggerService;
  readonly #utils: Utils;
  static create(options: { logger: LoggerService; config: RootConfigService }) {
    return new UserService(options.logger, options.config);
  }

  private constructor(logger: LoggerService, config: RootConfigService) {
    this.#utils = new Utils(config);
    this.#logger = logger;
  }

  /**
   * Creates a new LiteLLM Orchestrator user.
   * @param userId - The Backstage user ID, typically a string like "user:default/john".
   * @returns The LiteLLM Orchestrator user.
   */

  async createUser(
    userId: string,
    currentUser: BackstageUserInfo,
    options: {
      maxBudget?: number;
      budgetDuration?: string;
    } = {},
  ): Promise<User> {
    // If currentUser is not self nor admin, then deny access
    if (
      !this.#utils.isSelf(currentUser, userId) &&
      !this.#utils.isAdmin(currentUser)
    ) {
      throw new NotAllowedError('You are not allowed to create this user');
    }
    if (!this.#utils.isAdmin(currentUser)) {
      if (options.maxBudget) {
        throw new NotAllowedError(
          'You are not allowed to override the max budget',
        );
      }
      if (options.budgetDuration) {
        throw new NotAllowedError(
          'You are not allowed to override the budget duration',
        );
      }
    }

    try {
      await this.getUser(userId);
      throw new ConflictError(`User with userId '${userId}' already exists`);
    } catch (error) {
      if (!(error instanceof NotFoundError)) {
        throw error;
      }
    }
    const maxBudget =
      options.maxBudget ?? this.#utils.config.userDefaults.maxBudget;
    const budgetDuration =
      options.budgetDuration ?? this.#utils.config.userDefaults.budgetDuration;
    const response = await newUserUserNewPost({
      client: this.#utils.client,
      body: {
        user_id: userId,
        max_budget: maxBudget,
        budget_duration: budgetDuration,
        auto_create_key: false,
      },
    });

    if (!response.data || !response.response.ok) {
      throw new Error(
        `Failed to create user: no response data, response status: ${response.response.status}`,
      );
    }
    if (!response.data.max_budget) {
      throw new Error('Failed to create user: no max budget');
    }
    if (!response.data.budget_duration) {
      throw new Error('Failed to create user: no budget duration');
    }

    // Map NewUserResponse to User
    const user: User = {
      userId: response.data.user_id as string,
      createdAt: new Date().toISOString(),
      maxBudget: response.data.max_budget,
      budgetDuration: response.data.budget_duration,
      spend: response.data.spend as number,
    };
    return user;
  }

  async getUser(userId: string): Promise<User> {
    const response = await userInfoUserInfoGet({
      client: this.#utils.client,
      query: {
        user_id: userId,
      },
    });

    if (!response.data || !response.response.ok) {
      throw new Error(
        `Failed to get user: no response data, response status: ${response.response.status}`,
      );
    }
    if (!response.data.user_info || !response.data.user_info.user_id) {
      // check specifically for user_info.user_id because of https://github.com/BerriAI/litellm/issues/17437
      throw new NotFoundError(`User with userId '${userId}' not found`);
    }

    const user: User = {
      userId: response.data.user_info.user_id as string,
      createdAt: new Date().toISOString(),
      maxBudget: response.data.user_info.max_budget as number,
      budgetDuration: response.data.user_info.budget_duration as string,
      spend: response.data.user_info.spend as number,
    };
    return user;
  }
}

export const userServiceRef = createServiceRef<UserService>({
  id: 'user.service',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async factory(deps) {
        return UserService.create({
          logger: deps.logger,
          config: deps.config,
        });
      },
    }),
});
