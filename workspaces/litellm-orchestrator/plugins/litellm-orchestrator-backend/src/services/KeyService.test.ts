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
import { KeyService } from './KeyService';

import { mockServices } from '@backstage/backend-test-utils';
import { BackstageUserInfo } from '@backstage/backend-plugin-api';
import {
  listKeysKeyListGet,
  generateKeyFnKeyGeneratePost,
  deleteKeyFnKeyDeletePost,
} from '../upstream/sdk.gen';

jest.mock('../upstream/sdk.gen', () => ({
  listKeysKeyListGet: jest.fn(),
  generateKeyFnKeyGeneratePost: jest.fn(),
  deleteKeyFnKeyDeletePost: jest.fn(),
}));

const realUtils = jest.requireActual('../utils/utils');
const mockUtils = {
  ...realUtils.Utils,
  isAdmin: jest.fn(),
  isSelf: jest.fn(),
  config: {},
};
jest.mock('../utils/utils', () => ({
  Utils: jest.fn(() => mockUtils),
}));
const baseRequest = {
  request: new Request('http://localhost:8080/keys'),
  response: {
    ok: true,
    status: 200,
    statusText: 'OK',
  } as Response,
} as any;
describe('keyService', () => {
  let keyService: KeyService;
  const mockListKeysKeyListGet = jest.mocked(listKeysKeyListGet);
  const mockGenerateKeyFnKeyGeneratePost = jest.mocked(
    generateKeyFnKeyGeneratePost,
  );
  const mockDeleteKeyFnKeyDeletePost = jest.mocked(deleteKeyFnKeyDeletePost);
  beforeEach(() => {
    keyService = KeyService.create(mockServices.rootConfig());
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('getUserKeys for current user', () => {
    beforeEach(() => {
      mockUtils.isAdmin.mockReturnValue(false);
      mockUtils.isSelf.mockReturnValue(true);
      mockListKeysKeyListGet.mockResolvedValue({
        data: {
          keys: ['test'],
        },
        ...baseRequest,
      } as any);
    });
    it('should return the user keys', async () => {
      await keyService.listUserKeys(
        'user:default/test',
        {} as BackstageUserInfo,
      );
      expect(mockListKeysKeyListGet).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            user_id: 'user:default/test',
          }),
        }),
      );
    });
    it('should throw an error if the user is not the current user', async () => {
      mockUtils.isSelf.mockReturnValue(false);
      await expect(
        keyService.listUserKeys('user:default/test', {} as BackstageUserInfo),
      ).rejects.toThrow(
        'You are not allowed to get keys for user user:default/test',
      );
    });
  });
  describe('getUserkeys for admin user', () => {
    beforeEach(() => {
      mockUtils.isAdmin.mockReturnValue(true);
      mockUtils.isSelf.mockReturnValue(false);
      mockListKeysKeyListGet.mockResolvedValue({
        data: {
          keys: ['test'],
        },
        ...baseRequest,
      } as any);
    });
    it('should return the user keys', async () => {
      await keyService.listUserKeys(
        'user:default/test',
        {} as BackstageUserInfo,
      );
      expect(mockListKeysKeyListGet).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            user_id: 'user:default/test',
          }),
        }),
      );
    });
  });
  describe('createKey for current user', () => {
    beforeEach(() => {
      mockUtils.isAdmin.mockReturnValue(false);
      mockUtils.isSelf.mockReturnValue(true);
      mockGenerateKeyFnKeyGeneratePost.mockResolvedValue({
        data: {
          user_id: 'user:default/test',
          token: 'sometoken',
          key: 'sk-test',
        },
        ...baseRequest,
      } as any);
    });
    it('should create a key', async () => {
      await keyService.createKey('user:default/test', {} as BackstageUserInfo);
      expect(mockGenerateKeyFnKeyGeneratePost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            user_id: 'user:default/test',
          }),
        }),
      );
    });
    it('should throw an error if the user is not the current user', async () => {
      mockUtils.isSelf.mockReturnValue(false);
      await expect(
        keyService.createKey('user:default/test', {} as BackstageUserInfo),
      ).rejects.toThrow(
        'You are not allowed to create a key for user user:default/test',
      );
    });
    it('should set a non-secret for the keyId', async () => {
      const key = await keyService.createKey(
        'user:default/test',
        {} as BackstageUserInfo,
      );
      expect(key.keyId).not.toStartWith('sk-');
      expect(key.keyId).toBe('sometoken');
    });
  });
  describe('createKey for admin user', () => {
    beforeEach(() => {
      mockUtils.isAdmin.mockReturnValue(true);
      mockUtils.isSelf.mockReturnValue(false);
      mockGenerateKeyFnKeyGeneratePost.mockResolvedValue({
        data: {
          key: 'test',
        },
        ...baseRequest,
      } as any);
    });
    it('should create a key', async () => {
      await keyService.createKey('user:default/test', {} as BackstageUserInfo);
      expect(mockGenerateKeyFnKeyGeneratePost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            user_id: 'user:default/test',
          }),
        }),
      );
    });
    it('should throw an error if the user is not the admin user', async () => {
      mockUtils.isAdmin.mockReturnValue(false);
      await expect(
        keyService.createKey('user:default/test', {} as BackstageUserInfo),
      ).rejects.toThrow(
        'You are not allowed to create a key for user user:default/test',
      );
    });
  });
  describe('deleteUserKey for current user', () => {
    beforeEach(() => {
      mockUtils.isAdmin.mockReturnValue(false);
      mockUtils.isSelf.mockReturnValue(true);
      mockDeleteKeyFnKeyDeletePost.mockResolvedValue({
        ...baseRequest,
        data: {
          message: 'Key deleted',
        },
      } as any);
    });
    it('should delete a key', async () => {
      await keyService.deleteUserKey(
        'user:default/test',
        'sometoken',
        {} as BackstageUserInfo,
      );
      expect(mockDeleteKeyFnKeyDeletePost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            keys: ['sometoken'],
          }),
        }),
      );
    });
    it('should throw an error if the user is not the current user', async () => {
      mockUtils.isSelf.mockReturnValue(false);
      await expect(
        keyService.deleteUserKey(
          'user:default/test',
          'sometoken',
          {} as BackstageUserInfo,
        ),
      ).rejects.toThrow('You are not allowed to delete a key');
    });
  });
  describe('deleteUserKey for admin user', () => {
    beforeEach(() => {
      mockUtils.isAdmin.mockReturnValue(true);
      mockUtils.isSelf.mockReturnValue(false);
      mockDeleteKeyFnKeyDeletePost.mockResolvedValue({
        ...baseRequest,
        data: {
          message: 'Key deleted',
        },
      } as any);
    });
    it('should delete a key', async () => {
      await keyService.deleteUserKey(
        'user:default/test',
        'sometoken',
        {} as BackstageUserInfo,
      );
      expect(mockDeleteKeyFnKeyDeletePost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            keys: ['sometoken'],
          }),
        }),
      );
    });
    it('should throw an error if the user is not the admin user', async () => {
      mockUtils.isAdmin.mockReturnValue(false);
      await expect(
        keyService.deleteUserKey(
          'user:default/test',
          'sometoken',
          {} as BackstageUserInfo,
        ),
      ).rejects.toThrow(
        'You are not allowed to delete a key for user user:default/test',
      );
    });
  });
  describe('deleteUserKey', () => {
    it('should throw an error if the key is not found', async () => {
      mockUtils.isAdmin.mockReturnValue(true);
      mockDeleteKeyFnKeyDeletePost.mockResolvedValue({
        ...baseRequest,
        data: {
          message: 'Key not found',
        },
        response: {
          ok: false,
          status: 404,
          statusText: 'Not Found',
        } as unknown as Response,
      } as any);
      await expect(
        keyService.deleteUserKey(
          'user:default/test',
          'sometoken',
          {} as BackstageUserInfo,
        ),
      ).rejects.toThrow('Key not found');
    });
  });
});
