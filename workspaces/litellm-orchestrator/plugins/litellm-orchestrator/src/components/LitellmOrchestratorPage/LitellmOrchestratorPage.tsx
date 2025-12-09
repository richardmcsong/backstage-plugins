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

import { Grid } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  HeaderLabel,
  ResponseErrorPanel,
  Progress,
} from '@backstage/core-components';
import { UserOverviewComponent } from '../UserOverviewComponent';
import { UserKeyListComponent } from '../UserKeyListComponent';
import { DefaultApiClient } from '../../schema/openapi';
import {
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import useAsync from 'react-use/lib/useAsync';

export const LitellmOrchestratorPage = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const identityApi = useApi(identityApiRef);
  const defaultApi = new DefaultApiClient({ discoveryApi, fetchApi });
  const configApi = useApi(configApiRef);
  const { loading, error } = useAsync(async (): Promise<void> => {
    const currentUser = await identityApi.getBackstageIdentity();
    const allowedGroup = configApi.getString('liteLLM.allowedGroup');
    if (
      !currentUser ||
      !currentUser.ownershipEntityRefs.includes(allowedGroup)
    ) {
      throw new Error('You are not allowed to access this page');
    }
    const response = await defaultApi.getUser({
      path: {
        userId: currentUser.userEntityRef,
      },
    });
    if (response.status === 404) {
      await defaultApi.createUser({
        body: {
          userId: currentUser.userEntityRef,
        },
      });
    }
  });
  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }
  return (
    <Page themeId="tool">
      <Header
        title="Welcome to litellm-orchestrator!"
        subtitle="This page will help you manage your litellm-orchestrator"
      >
        <HeaderLabel label="Owner" value="Team X" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <UserOverviewComponent />
          </Grid>
          <Grid item>
            <UserKeyListComponent />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
