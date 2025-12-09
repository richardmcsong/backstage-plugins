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

import { mockServices } from '@backstage/backend-test-utils';
import { UserService } from './UserService';
import { newUserUserNewPost, userInfoUserInfoGet } from '../upstream/sdk.gen';
import { BackstageUserInfo } from '@backstage/backend-plugin-api';

// Mock the SDK function
jest.mock('../upstream/sdk.gen', () => ({
  newUserUserNewPost: jest.fn(),
  userInfoUserInfoGet: jest.fn(),
}));

const realUtils = jest.requireActual('../utils/utils');
const mockUtils = {
  ...realUtils.Utils,
  isAdmin: jest.fn(),
  isSelf: jest.fn(),
  config: {
    userDefaults: {
      maxBudget: 100,
      budgetDuration: '1mo',
    },
  },
};
jest.mock('../utils/utils', () => ({
  Utils: jest.fn(() => mockUtils),
}));
const baseRequest = {
  request: new Request('http://localhost:8080/user/info'),
  response: {
    ok: true,
    status: 200,
    statusText: 'OK',
  } as Response,
} as any;

describe('UserService', () => {
  let userService: UserService;
  let config: ReturnType<typeof mockServices.rootConfig>;
  const mockNewUserUserNewPost = newUserUserNewPost as jest.MockedFunction<
    typeof newUserUserNewPost
  >;
  const mockUserInfoUserInfoGet = userInfoUserInfoGet as jest.MockedFunction<
    typeof userInfoUserInfoGet
  >;

  beforeEach(() => {
    mockUtils.isAdmin.mockReturnValue(false);
    mockUtils.isSelf.mockReturnValue(true);
    config = mockServices.rootConfig();
    userService = UserService.create(config);

    // Default mock implementation
    mockNewUserUserNewPost.mockResolvedValue({
      data: {
        user_id: 'user:default/test',
        max_budget: 100,
        budget_duration: '1mo',
      } as any,
      ...baseRequest,
    } as any);
    mockUserInfoUserInfoGet.mockResolvedValue({
      data: {
        user_info: {} as any,
      } as any,
      ...baseRequest,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('createUser', () => {
    it('should call the correct endpoint', async () => {
      mockUtils.isAdmin.mockReturnValue(true);
      const user = await userService.createUser('user:default/test', {
        userEntityRef: 'user:default/test',
        ownershipEntityRefs: [],
      });
      expect(user).toBeDefined();
      expect(mockNewUserUserNewPost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            user_id: 'user:default/test',
            max_budget: 100,
            budget_duration: '1mo',
          }),
        }),
      );
    });
    it('should pass the correct body parameters', async () => {
      const user = await userService.createUser('user:default/test', {
        userEntityRef: 'user:default/test',
        ownershipEntityRefs: [],
      });
      expect(user).toBeDefined();
      expect(mockNewUserUserNewPost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            user_id: 'user:default/test',
            max_budget: 100,
            budget_duration: '1mo',
            auto_create_key: false,
          }),
        }),
      );
    });
    describe('operating on the current user', () => {
      beforeEach(() => {
        mockUtils.isAdmin.mockReturnValue(false);
        mockUtils.isSelf.mockReturnValue(true);
      });
      it('should create the user with the correct user_id', async () => {
        const user = await userService.createUser('user:default/test', {
          userEntityRef: 'user:default/test',
          ownershipEntityRefs: [],
        });
        expect(user).toBeDefined();
        expect(user.userId).toBe('user:default/test');
        expect(mockNewUserUserNewPost).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              user_id: 'user:default/test',
            }),
          }),
        );
      });
      it('should automatically set the correct budgets for the user', async () => {
        const user = await userService.createUser('user:default/test', {
          userEntityRef: 'user:default/test',
          ownershipEntityRefs: [],
        });
        expect(user).toBeDefined();
        expect(user.maxBudget).toBe(100);
        expect(user.budgetDuration).toBe('1mo');
      });
      it('should disallow overriding the budgets for the user', async () => {
        await expect(
          userService.createUser(
            'user:default/test',
            {
              userEntityRef: 'user:default/test',
              ownershipEntityRefs: [],
            },
            {
              maxBudget: 200,
            },
          ),
        ).rejects.toThrow('You are not allowed to override the max budget');
      });
    });
    describe('admin operations', () => {
      beforeEach(() => {
        mockUtils.isAdmin.mockReturnValue(true);
        mockUtils.isSelf.mockReturnValue(false);
      });
      it('should create the user with the correct user_id', async () => {
        await userService.createUser(
          'user:default/test',
          {} as BackstageUserInfo,
        );
        expect(mockNewUserUserNewPost).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              user_id: 'user:default/test',
            }),
          }),
        );
      });
      it('should allow overriding the budgets for the user', async () => {
        await userService.createUser(
          'user:default/test',
          {} as BackstageUserInfo,
          {
            maxBudget: 200,
            budgetDuration: '2mo',
          },
        );
        expect(mockNewUserUserNewPost).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              max_budget: 200,
              budget_duration: '2mo',
            }),
          }),
        );
      });
      it('should not create the user if the current user is not an admin', async () => {
        mockUtils.isAdmin.mockReturnValue(false);
        await expect(
          userService.createUser('user:default/test', {} as BackstageUserInfo),
        ).rejects.toThrow('You are not allowed to create this user');
      });
      it('should not create the user if it already exists', async () => {
        mockUserInfoUserInfoGet.mockResolvedValueOnce({
          data: {
            user_info: {
              user_id: 'user:default/test',
            } as any,
          } as any,
          ...baseRequest,
        });
        await expect(
          userService.createUser('user:default/test', {
            userEntityRef: 'user:default/test',
            ownershipEntityRefs: [],
          }),
        ).rejects.toThrow(
          "User with userId 'user:default/test' already exists",
        );
      });
    });
  });
  describe('getUser', () => {
    it('should return the correct user if found', async () => {
      mockUserInfoUserInfoGet.mockResolvedValue({
        data: {
          user_info: {
            user_id: 'user:default/test',
            max_budget: 100,
            budget_duration: '1mo',
          } as any,
        } as any,
        ...baseRequest,
      });
      const user = await userService.getUser('user:default/test');
      expect(user).toBeDefined();
      expect(user.userId).toBe('user:default/test');
      expect(user.maxBudget).toBe(100);
      expect(user.budgetDuration).toBe('1mo');
    });
    it('should throw an error if the user is not found', async () => {
      await expect(
        userService.getUser('user:default/not-found'),
      ).rejects.toThrow("User with userId 'user:default/not-found' not found");
    });
  });
});
