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

import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import useAsyncRetry from 'react-use/lib/useAsyncRetry';
import {
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  TypedResponse,
  DefaultApiClient,
} from '../../schema/openapi/generated/apis/Api.client';
import { UserKeyList } from '../../schema/openapi/generated/models/UserKeyList.model';
import PlusIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  Toolbar,
  ToolbarButton,
} from '@mui/x-data-grid';
import { UserKey } from '../../schema/openapi/generated/models/UserKey.model';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import { useState } from 'react';
import { DeleteButton } from './DeleteButton';
import { KeyMaterialModal } from '../KeyMaterialModal';
import { dialogApiRef } from '@backstage/frontend-plugin-api';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { useGridRootProps } from '@mui/x-data-grid';
import { handleApiResponse } from '../../utils/api';

type DenseTableProps = {
  userKeyList: UserKeyList;
  retry: () => void;
};

export const DenseTable = ({ userKeyList, retry }: DenseTableProps) => {
  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const identityApi = useApi(identityApiRef);
  const dialogApi = useApi(dialogApiRef);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Key ID',
      flex: 2,
      renderCell: params => {
        return (
          <Typography
            variant="body2"
            component="span"
            style={{ fontFamily: 'monospace' }}
          >
            {params.row.id}
          </Typography>
        );
      },
    },
    { field: 'createdAt', headerName: 'Created At', flex: 1 },
    { field: 'token', headerName: 'Token', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: params => {
        return (
          <IconButton
            size="small"
            onClick={async () => {
              const defaultApi = new DefaultApiClient({
                discoveryApi,
                fetchApi,
              });
              const userId = (await identityApi.getBackstageIdentity())
                .userEntityRef;

              try {
                const response = await defaultApi.deleteUserKey({
                  path: {
                    userId,
                    keyId: params.row.token,
                  },
                });
                await handleApiResponse(response);
                retry();
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error(
                  `Failed to delete key ${params.row.token}:`,
                  error,
                );
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        );
      },
    },
  ];

  const data = userKeyList.keys.map(key => {
    return {
      id: key.key_name,
      createdAt: key.created_at,
      token: key.token,
    };
  });
  const CustomToolbar = () => {
    const rootProps = useGridRootProps();
    return (
      <Toolbar style={{ padding: '10px' }}>
        <Grid container direction="row">
          <Grid item xs={6}>
            <Typography variant="h5" component="h5">
              {rootProps.label}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <ButtonGroup>
                <ToolbarButton>
                  <PlusIcon
                    onClick={async () => {
                      const defaultApi = new DefaultApiClient({
                        discoveryApi,
                        fetchApi,
                      });
                      const identity = await identityApi.getBackstageIdentity();
                      const response: TypedResponse<UserKey> =
                        await defaultApi.createUserKey({
                          body: {},
                          path: {
                            userId: identity.userEntityRef,
                          },
                        });
                      const userKey = await handleApiResponse(response);
                      const modalResult = await dialogApi.showModal(
                        <KeyMaterialModal
                          keySecret={userKey.keySecret}
                          keyId={userKey.keyId}
                          closeHandler={() => {
                            modalResult.close();
                          }}
                        />,
                      );
                      retry();
                    }}
                  />
                </ToolbarButton>
                <DeleteButton
                  selectedRows={selectedRows}
                  data={data}
                  discoveryApi={discoveryApi}
                  fetchApi={fetchApi}
                  identityApi={identityApi}
                  onDeleteSuccess={retry}
                />
              </ButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Toolbar>
    );
  };

  return (
    <>
      <DataGrid
        label="User Key List"
        rows={data}
        columns={columns}
        columnVisibilityModel={{
          token: false,
        }}
        slots={{ toolbar: CustomToolbar }}
        showToolbar
        checkboxSelection
        rowSelectionModel={selectedRows}
        onRowSelectionModelChange={newSelection => {
          setSelectedRows(newSelection);
        }}
      />
    </>
  );
};

export const UserKeyListComponent = () => {
  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const identityApi = useApi(identityApiRef);

  const { value, loading, error, retry } =
    useAsyncRetry(async (): Promise<UserKeyList> => {
      const identity = await identityApi.getBackstageIdentity();
      const defaultApi = new DefaultApiClient({ discoveryApi, fetchApi });
      const response = await defaultApi.getUserKeys({
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

  return <DenseTable userKeyList={value || { keys: [] }} retry={retry} />;
};
