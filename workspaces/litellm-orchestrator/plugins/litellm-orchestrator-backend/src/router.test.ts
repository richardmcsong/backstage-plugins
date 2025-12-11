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

import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import { NotAllowedError } from '@backstage/errors';
// eslint-disable-next-line @backstage/no-undeclared-imports
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { UserService } from './services/UserService';
import { wrapInOpenApiTestServer } from '@backstage/backend-openapi-utils/testUtils';
import { Server } from 'http';
import { KeyService } from './services/KeyService';

// TEMPLATE NOTE:
// Testing the router directly allows you to write a unit test that mocks the provided options.
describe('createRouter', () => {
  let app: express.Express | Server;
  let userService: UserService;
  let keyService: KeyService;
  let config: ReturnType<typeof mockServices.rootConfig>;
  beforeEach(async () => {
    config = mockServices.rootConfig({
      data: {
        liteLLM: {
          baseUrl: 'http://localhost:4000',
          masterKey: 'sk-asdf',
          adminGroup: 'TEST_ADMIN_GROUP',
          allowedGroup: 'user:default/test',
          userDefaults: {
            maxBudget: 100,
            budgetDuration: '1mo',
          },
        },
      },
    });
    userService = UserService.create(config, mockServices.logger.mock());
    keyService = KeyService.create(config);
    userService.createUser = jest.fn().mockResolvedValue({
      userId: 'user:default/test',
      liteLLMUserId: 'test',
      createdAt: new Date().toISOString(),
      adminGroup: 'TEST_ADMIN_GROUP',
    });
    app = wrapInOpenApiTestServer(
      express().use(
        await createRouter({
          httpAuth: mockServices.httpAuth(),
          userService: userService,
          userInfo: mockServices.userInfo(),
          keyService: keyService,
        }),
      ),
    );
  });

  describe('middleware', () => {
    it('should pass if the user is authenticated and authorized', async () => {
      userService.ensureUserExistsAndAuthorized = jest
        .fn()
        .mockResolvedValue(undefined);

      const response = await request(app)
        .post('/users')
        .auth(mockCredentials.user.token('user:default/test'), {
          type: 'bearer',
        })
        .send({
          userId: 'user:default/test',
        });

      expect(userService.ensureUserExistsAndAuthorized).toHaveBeenCalled();
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('should return 403 if the user is not authorized', async () => {
      userService.ensureUserExistsAndAuthorized = jest
        .fn()
        .mockRejectedValue(
          new NotAllowedError('You are not authorized to access this plugin'),
        );

      const response = await request(app)
        .post('/users')
        .auth(mockCredentials.user.token('user:default/test'), {
          type: 'bearer',
        })
        .send({
          userId: 'user:default/test',
        });

      expect(userService.ensureUserExistsAndAuthorized).toHaveBeenCalled();
      expect(response.status).toBe(403);
    });

    it('should return 401 if the user is not authenticated', async () => {
      userService.ensureUserExistsAndAuthorized = jest
        .fn()
        .mockResolvedValue(undefined);

      const response = await request(app)
        .post('/users')
        .set('Authorization', mockCredentials.none.header())
        .send({
          userId: 'user:default/test',
        });

      expect(userService.ensureUserExistsAndAuthorized).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
    });
  });

  describe('/users', () => {
    it('should create a user if the user is the current user', async () => {
      const response = await request(app)
        .post('/users')
        .auth(mockCredentials.user.token('user:default/test'), {
          type: 'bearer',
        })
        .send({
          userId: 'user:default/test',
        });
      expect(response.status).toBe(201);
      expect(userService.createUser).toHaveBeenCalledWith('user:default/test', {
        userEntityRef: 'user:default/test',
        ownershipEntityRefs: ['user:default/test'],
      });
    });
    it('should throw an error if user is unauthenticated', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', mockCredentials.none.header())
        .send({
          userId: 'user:default/test',
        });
      expect(response.status).toBe(401);
    });
  });
  describe('/users/:user_id', () => {
    it('should return the user if the user is the current user', async () => {
      userService.getUser = jest.fn().mockResolvedValue({
        userId: 'user:default/test',
        createdAt: new Date().toISOString(),
        maxBudget: 100,
        budgetDuration: '1mo',
      });
      const response = await request(app)
        .get(`/users/${encodeURIComponent('user:default/test')}`)
        .auth(mockCredentials.user.token('user:default/test'), {
          type: 'bearer',
        });
      expect(response.status).toBe(200);
      expect(userService.getUser).toHaveBeenCalledWith('user:default/test');
    });
  });
});
