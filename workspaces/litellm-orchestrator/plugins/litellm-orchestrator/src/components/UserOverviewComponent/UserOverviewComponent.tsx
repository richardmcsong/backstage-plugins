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
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
  InfoCard,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import {
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { User } from '../../schema/openapi/generated/models/User.model';
import { DefaultApiClient } from '../../schema/openapi/generated/apis/Api.client';
import { handleApiResponse } from '../../utils/api';
import { Grid, Typography } from '@material-ui/core';

type DenseTableProps = {
  user: User;
};

export const DenseTable = ({ user }: DenseTableProps) => {
  const columns: TableColumn[] = [
    { title: 'User ID', field: 'userId' },
    { title: 'Created At', field: 'createdAt' },
    { title: 'Max Budget', field: 'maxBudget' },
    { title: 'Budget Duration', field: 'budgetDuration' },
  ];

  return (
    <Table
      title="Example User List"
      options={{ search: false, paging: false }}
      columns={columns}
      data={[user]}
    />
  );
};

export const UserOverviewCard = ({
  title,
  value,
}: {
  title: string;
  value: string;
}) => {
  return (
    <InfoCard title={title}>
      <Typography variant="h6">${value}</Typography>
    </InfoCard>
  );
};

export const UserOverviewComponent = () => {
  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const identityApi = useApi(identityApiRef);

  const { value, loading, error } = useAsync(async (): Promise<User> => {
    const identity = await identityApi.getBackstageIdentity();
    const defaultApi = new DefaultApiClient({ discoveryApi, fetchApi });
    const response = await defaultApi.getUser({
      path: {
        userId: identity.userEntityRef,
      },
    });
    return handleApiResponse(response);
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <ResponseErrorPanel error={error} />;
  }
  return (
    <Grid container spacing={3} direction="row">
      <Grid item md={4}>
        <UserOverviewCard
          title="Current Spend"
          value={value?.spend?.toString() ?? '0'}
        />
      </Grid>
      <Grid item md={4}>
        <UserOverviewCard
          title="Current Cost"
          value={value?.spend?.toString() ?? '0'}
        />
      </Grid>
      <Grid item md={4}>
        <UserOverviewCard
          title="Max Budget"
          value={value?.maxBudget?.toString() ?? '0'}
        />
      </Grid>
    </Grid>
  );
};
