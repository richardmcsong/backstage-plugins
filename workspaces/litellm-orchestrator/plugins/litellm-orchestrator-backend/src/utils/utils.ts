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

import { BackstageUserInfo } from '@backstage/backend-plugin-api';
import { RootConfigService } from '@backstage/backend-plugin-api';
import { createClient } from '../upstream/client';
import { Client } from '../upstream/client/types.gen';

type configSchema = {
  baseUrl: string;
  masterKey: string;
  adminGroup: string;
  userDefaults: {
    maxBudget: number;
    budgetDuration: string;
  };
};

export class Utils {
  readonly config: configSchema;
  readonly client: Client;
  constructor(config: RootConfigService) {
    const liteLLMConfig = config.getConfig('liteLLM');
    this.config = {
      baseUrl: liteLLMConfig.getString('baseUrl'),
      masterKey: liteLLMConfig.getString('masterKey'),
      adminGroup: liteLLMConfig.getString('adminGroup'),
      userDefaults: {
        maxBudget: liteLLMConfig.getNumber('userDefaults.maxBudget'),
        budgetDuration: liteLLMConfig.getString('userDefaults.budgetDuration'),
      },
    };
    this.client = createClient({
      baseUrl: this.config.baseUrl,
      headers: {
        Authorization: `Bearer ${this.config.masterKey}`,
      },
    });
  }

  isAdmin(currentUser: BackstageUserInfo): boolean {
    return currentUser.ownershipEntityRefs.includes(this.config.adminGroup);
  }
  isSelf(currentUser: BackstageUserInfo, userId: string): boolean {
    return currentUser.userEntityRef === userId;
  }
}
