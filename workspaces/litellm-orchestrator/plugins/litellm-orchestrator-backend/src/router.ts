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
  BackstageUserInfo,
  HttpAuthService,
} from '@backstage/backend-plugin-api';
import {
  AuthenticationError,
  ConflictError,
  NotAllowedError,
  NotFoundError,
} from '@backstage/errors';
import express from 'express';
import { createOpenApiRouter, spec } from './schema/openapi';
import { userServiceRef } from './services/UserService';
import { keyServiceRef } from './services/KeyService';
import { UserInfoService } from '@backstage/backend-plugin-api';

export async function createRouter({
  httpAuth,
  userService,
  userInfo,
  keyService,
}: {
  httpAuth: HttpAuthService;
  userService: typeof userServiceRef.T;
  userInfo: UserInfoService;
  keyService: typeof keyServiceRef.T;
}): Promise<express.Router> {
  const router = await createOpenApiRouter();
  router.use(express.json());
  // serve the openapi schema
  router.get('/openapi.yaml', (_req, res) => {
    res.send(JSON.stringify(spec, null, 2));
  });

  router.post('/users', async (req, res, next) => {
    let credentials: Awaited<ReturnType<typeof httpAuth.credentials>>;
    let currentUser: BackstageUserInfo;
    try {
      // Validate authentication (401 if not authenticated)
      credentials = await httpAuth.credentials(req, { allow: ['user'] });
      currentUser = await userInfo.getUserInfo(credentials);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({
          name: 'AuthenticationError',
          message: 'Authentication required',
        });
      } else {
        next(error);
      }
      return;
    }
    // Create user
    try {
      const response = await userService.createUser(
        req.body.userId,
        currentUser,
      );
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(409).json({
          name: 'ConflictError',
          message: 'User already exists',
        });
      }
      next(error);
      return;
    }
  });

  router.get('/users/:userId', async (req, res) => {
    // No authentication required for this endpoint
    res.json(await userService.getUser(req.params.userId));
  });

  router.post('/users/:userId/keys', async (req, res, next) => {
    let currentUser: BackstageUserInfo;
    let credentials: Awaited<ReturnType<typeof httpAuth.credentials>>;
    try {
      // Validate authentication (401 if not authenticated)
      credentials = await httpAuth.credentials(req, { allow: ['user'] });
      currentUser = await userInfo.getUserInfo(credentials);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({
          name: 'AuthenticationError',
          message: 'Authentication required',
        });
      } else {
        next(error);
      }
      return;
    }
    try {
      const response = await keyService.createKey(
        req.params.userId,
        currentUser,
      );
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  });

  router.get('/users/:userId/keys', async (req, res, next) => {
    try {
      // Validate authentication (401 if not authenticated)
      const credentials = await httpAuth.credentials(req, { allow: ['user'] });
      const currentUser = await userInfo.getUserInfo(credentials);

      // Get user tokens
      const response = await keyService.listUserKeys(
        req.params.userId,
        currentUser,
      );
      res.json(response);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({
          name: 'AuthenticationError',
          message: 'Authentication required',
        });
      } else {
        next(error);
      }
    }
  });
  router.delete('/users/:userId/keys/:keyId', async (req, res, next) => {
    let currentUser: BackstageUserInfo;
    let credentials: Awaited<ReturnType<typeof httpAuth.credentials>>;
    try {
      // Validate authentication (401 if not authenticated)
      credentials = await httpAuth.credentials(req, { allow: ['user'] });
      currentUser = await userInfo.getUserInfo(credentials);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({
          name: 'AuthenticationError',
          message: 'Authentication required',
        });
      } else {
        next(error);
      }
      return;
    }
    try {
      await keyService.deleteUserKey(
        req.params.userId,
        req.params.keyId,
        currentUser,
      );
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotAllowedError) {
        res.status(403).json({
          name: 'NotAllowedError',
          message: error.message,
        });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({
          name: 'NotFoundError',
          message: error.message,
        });
      } else {
        next(error);
      }
      return;
    }
  });

  return router;
}
