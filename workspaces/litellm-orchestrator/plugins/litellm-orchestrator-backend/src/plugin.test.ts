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
  mockCredentials,
  mockServices,
  startTestBackend,
  TestBackend,
} from '@backstage/backend-test-utils';
import { createServiceFactory } from '@backstage/backend-plugin-api';
import { userServiceRef } from './services/UserService';
import { litellmOrchestratorPlugin } from './plugin';
import request from 'supertest';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { Server } from 'http';

// TEMPLATE NOTE:
// Plugin tests are integration tests for your plugin, ensuring that all pieces
// work together end-to-end. You can still mock injected backend services
// however, just like anyone who installs your plugin might replace the
// services with their own implementations.
describe('plugin', () => {
  describe('users', () => {
    let server: Awaited<ReturnType<typeof startTestBackend>>['server'];
    beforeEach(async () => {
      ({ server } = await startTestBackend({
        features: [
          litellmOrchestratorPlugin,
          mockServices.rootConfig.factory({
            data: {
              liteLLM: {
                baseUrl: 'http://home-server:8080',
                masterKey: 'sk-asdf',
                adminGroup: 'TEST_ADMIN_GROUP',
                userDefaults: {
                  max_budget: 100,
                  budget_duration: '1mo',
                },
              },
            },
          }),
        ],
      }));
    });
    it.skip('should be able to read their own user info', async () => {
      // await request(server).get('/api/litellm-orchestrator/users').expect(200, {
      //   items: [],
      // });
    });
    it.skip("should not be able to read other users's api key information", async () => {
      await request(server)
        .get('/api/litellm-orchestrator/users/other-user')
        .expect(404);
    });
  });
});
