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
import { Utils } from './utils';
import { BackstageUserInfo } from '@backstage/backend-plugin-api';

const defaultUser = {
  userEntityRef: 'user:default/mock',
  ownershipEntityRefs: [],
} as BackstageUserInfo;
describe('Utils', () => {
  let utils: Utils;
  beforeEach(() => {
    utils = new Utils(
      mockServices.rootConfig({
        data: {
          liteLLM: {
            adminGroup: 'ADMIN_GROUP',
            baseUrl: 'http://localhost:8080',
            masterKey: 'sk-asdf',
            userDefaults: {
              maxBudget: 100,
              budgetDuration: '1mo',
            },
          },
        },
      }),
    );
  });
  it('should return true if the current user is an admin', () => {
    const currentUser = {
      ...defaultUser,
      ownershipEntityRefs: ['ADMIN_GROUP'],
    } as BackstageUserInfo;
    expect(utils.isAdmin(currentUser)).toBe(true);
  });
  it('should return true if the current user is the same as the user id', () => {
    expect(utils.isSelf(defaultUser, defaultUser.userEntityRef)).toBe(true);
  });
  it('should return false if the current user is not the same as the user id', () => {
    expect(utils.isSelf(defaultUser, 'user:default/other')).toBe(false);
  });
});
