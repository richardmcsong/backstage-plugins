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

import { ToolbarButton, ToolbarButtonProps } from '@mui/x-data-grid';
import DeleteIcon from '@material-ui/icons/Delete';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import { DiscoveryApi } from '@backstage/core-plugin-api';
import { FetchApi } from '@backstage/core-plugin-api';
import { IdentityApi } from '@backstage/core-plugin-api';
import { DefaultApiClient } from '../../schema/openapi/generated/apis/Api.client';
import { handleApiResponse } from '../../utils/api';

export type DeleteButtonProps = {
  selectedRows: GridRowSelectionModel;
  data: any[];
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
  identityApi: IdentityApi;
  onDeleteSuccess: () => void;
} & Omit<ToolbarButtonProps, 'children' | 'ref'>;

function getSelectedIds(selectedRows: GridRowSelectionModel, data: any[]) {
  return Array.from(
    selectedRows.type === 'include'
      ? selectedRows.ids
      : data.map(row => row.id),
  );
}

export const DeleteButton = ({
  selectedRows,
  data,
  discoveryApi,
  fetchApi,
  identityApi,
  onDeleteSuccess,
  ...props
}: DeleteButtonProps) => {
  return (
    <ToolbarButton {...props}>
      <DeleteIcon
        onClick={async () => {
          if (getSelectedIds(selectedRows, data).length === 0) {
            return;
          }
          const selectedIds = getSelectedIds(selectedRows, data);
          const defaultApi = new DefaultApiClient({
            discoveryApi,
            fetchApi,
          });
          const userId = (await identityApi.getBackstageIdentity())
            .userEntityRef;
          // get the tokens from the ids
          const tokens = selectedIds.map(id => {
            return data.find(row => row.id === id)?.token;
          });
          // Delete all selected keys
          await Promise.all(
            tokens.map(async token => {
              try {
                const response = await defaultApi.deleteUserKey({
                  path: {
                    userId,
                    keyId: token as string,
                  },
                });
                await handleApiResponse(response);
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error(`Failed to delete key ${token}:`, error);
                // TODO: add error to the user
              }
            }),
          );
          onDeleteSuccess();
        }}
        // style={{
        //   cursor:
        //     getSelectedIds(props.selectedRows, props.data).length === 0
        //       ? 'not-allowed'
        //       : 'pointer',
        //   opacity:
        //     getSelectedIds(props.selectedRows, props.data).length === 0
        //       ? 0.5
        //       : 1,
        // }}
      />
    </ToolbarButton>
  );
};
