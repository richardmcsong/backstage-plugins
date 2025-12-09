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
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { userServiceRef } from './services/UserService';
import { keyServiceRef } from './services/KeyService';

/**
 * litellmOrchestratorPlugin backend plugin
 *
 * @public
 */
export const litellmOrchestratorPlugin = createBackendPlugin({
  pluginId: 'litellm-orchestrator',
  register(env) {
    env.registerInit({
      deps: {
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        userInfo: coreServices.userInfo,
        userService: userServiceRef,
        keyService: keyServiceRef,
      },
      async init({ httpAuth, httpRouter, userInfo, userService, keyService }) {
        httpRouter.addAuthPolicy({
          path: '/openapi.json',
          allow: 'unauthenticated',
        });
        httpRouter.use(
          await createRouter({
            httpAuth,
            userInfo,
            userService,
            keyService,
          }),
        );
      },
    });
  },
});
