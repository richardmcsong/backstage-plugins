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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteButton } from './DeleteButton';
import { GridRowSelectionModel } from '@mui/x-data-grid';
import { DefaultApiClient } from '../../schema/openapi/generated/apis/Api.client';

// Mock the DefaultApiClient
jest.mock('../../schema/openapi/generated/apis/Api.client', () => ({
  DefaultApiClient: jest.fn().mockImplementation(() => ({
    deleteUserKey: jest.fn(),
  })),
}));

// Mock ToolbarButton to avoid Material-UI rendering issues
jest.mock('@mui/x-data-grid', () => ({
  ToolbarButton: ({ children, ...props }: any) => (
    <div data-testid="toolbar-button" {...props}>
      {children}
    </div>
  ),
}));

// Mock DeleteIcon
jest.mock('@material-ui/icons/Delete', () => {
  return function DeleteIcon({ onClick }: { onClick?: () => void }) {
    return (
      <button data-testid="delete-icon" onClick={onClick}>
        Delete
      </button>
    );
  };
});

describe('DeleteButton', () => {
  const mockDiscoveryApi = {
    getBaseUrl: jest
      .fn()
      .mockResolvedValue('http://localhost:7007/api/litellm-orchestrator'),
  };

  const mockFetchApi = {
    fetch: jest.fn(),
  };

  const mockIdentityApi = {
    getBackstageIdentity: jest.fn().mockResolvedValue({
      userEntityRef: 'user:default/test-user',
      type: 'user',
      ownershipEntityRefs: [],
    }),
    getCredentials: jest.fn(),
    getProfileInfo: jest.fn(),
    signOut: jest.fn(),
  };

  const mockOnDeleteSuccess = jest.fn();
  const mockDeleteUserKey = jest.fn();

  const mockData = [
    { id: 'key-1', token: 'token-1', createdAt: '2025-01-01' },
    { id: 'key-2', token: 'token-2', createdAt: '2025-01-02' },
    { id: 'key-3', token: 'token-3', createdAt: '2025-01-03' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (DefaultApiClient as jest.Mock).mockImplementation(() => ({
      deleteUserKey: mockDeleteUserKey,
    }));
    mockDeleteUserKey.mockResolvedValue({
      status: 204,
      statusText: 'No Content',
      ok: true,
    });
  });

  it('renders the delete button', () => {
    const selectedRows: GridRowSelectionModel = {
      type: 'include',
      ids: new Set(['key-1']),
    };

    render(
      <DeleteButton
        selectedRows={selectedRows}
        data={mockData}
        discoveryApi={mockDiscoveryApi}
        fetchApi={mockFetchApi}
        identityApi={mockIdentityApi}
        onDeleteSuccess={mockOnDeleteSuccess}
      />,
    );

    expect(screen.getByTestId('toolbar-button')).toBeInTheDocument();
    expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
  });

  it('does nothing when no rows are selected (include type with empty set)', async () => {
    const selectedRows: GridRowSelectionModel = {
      type: 'include',
      ids: new Set(),
    };

    render(
      <DeleteButton
        selectedRows={selectedRows}
        data={mockData}
        discoveryApi={mockDiscoveryApi}
        fetchApi={mockFetchApi}
        identityApi={mockIdentityApi}
        onDeleteSuccess={mockOnDeleteSuccess}
      />,
    );

    const deleteButton = screen.getByTestId('delete-icon');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteUserKey).not.toHaveBeenCalled();
      expect(mockOnDeleteSuccess).not.toHaveBeenCalled();
    });
  });

  it('deletes selected keys when rows are selected (include type)', async () => {
    const selectedRows: GridRowSelectionModel = {
      type: 'include',
      ids: new Set(['key-1', 'key-2']),
    };

    render(
      <DeleteButton
        selectedRows={selectedRows}
        data={mockData}
        discoveryApi={mockDiscoveryApi}
        fetchApi={mockFetchApi}
        identityApi={mockIdentityApi}
        onDeleteSuccess={mockOnDeleteSuccess}
      />,
    );

    const deleteButton = screen.getByTestId('delete-icon');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockIdentityApi.getBackstageIdentity).toHaveBeenCalled();
      expect(mockDeleteUserKey).toHaveBeenCalledTimes(2);
      expect(mockDeleteUserKey).toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: 'token-1',
        },
      });
      expect(mockDeleteUserKey).toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: 'token-2',
        },
      });
      expect(mockOnDeleteSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('deletes all keys when using exclude type', async () => {
    const selectedRows: GridRowSelectionModel = {
      type: 'exclude',
      ids: new Set(['key-1']),
    };

    render(
      <DeleteButton
        selectedRows={selectedRows}
        data={mockData}
        discoveryApi={mockDiscoveryApi}
        fetchApi={mockFetchApi}
        identityApi={mockIdentityApi}
        onDeleteSuccess={mockOnDeleteSuccess}
      />,
    );

    const deleteButton = screen.getByTestId('delete-icon');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      // Note: Current implementation deletes all keys when type is 'exclude'
      // This may be a bug - it should delete all except the excluded ones
      expect(mockDeleteUserKey).toHaveBeenCalledTimes(3);
      expect(mockDeleteUserKey).toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: 'token-1',
        },
      });
      expect(mockDeleteUserKey).toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: 'token-2',
        },
      });
      expect(mockDeleteUserKey).toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: 'token-3',
        },
      });
      expect(mockOnDeleteSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('handles deletion errors gracefully and continues with other keys', async () => {
    const selectedRows: GridRowSelectionModel = {
      type: 'include',
      ids: new Set(['key-1', 'key-2', 'key-3']),
    };

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // First deletion succeeds, second fails, third succeeds
    mockDeleteUserKey
      .mockResolvedValueOnce({
        status: 204,
        statusText: 'No Content',
        ok: true,
      })
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        status: 204,
        statusText: 'No Content',
        ok: true,
      });

    render(
      <DeleteButton
        selectedRows={selectedRows}
        data={mockData}
        discoveryApi={mockDiscoveryApi}
        fetchApi={mockFetchApi}
        identityApi={mockIdentityApi}
        onDeleteSuccess={mockOnDeleteSuccess}
      />,
    );

    const deleteButton = screen.getByTestId('delete-icon');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      // All three should be attempted
      expect(mockDeleteUserKey).toHaveBeenCalledTimes(3);
      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to delete key token-2:',
        expect.any(Error),
      );
      // onDeleteSuccess should still be called
      expect(mockOnDeleteSuccess).toHaveBeenCalledTimes(1);
    });

    consoleErrorSpy.mockRestore();
  });

  it('creates DefaultApiClient with correct parameters', async () => {
    const selectedRows: GridRowSelectionModel = {
      type: 'include',
      ids: new Set(['key-1']),
    };

    render(
      <DeleteButton
        selectedRows={selectedRows}
        data={mockData}
        discoveryApi={mockDiscoveryApi}
        fetchApi={mockFetchApi}
        identityApi={mockIdentityApi}
        onDeleteSuccess={mockOnDeleteSuccess}
      />,
    );

    const deleteButton = screen.getByTestId('delete-icon');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(DefaultApiClient).toHaveBeenCalledWith({
        discoveryApi: mockDiscoveryApi,
        fetchApi: mockFetchApi,
      });
    });
  });

  it('maps selected IDs to tokens correctly from data array', async () => {
    const selectedRows: GridRowSelectionModel = {
      type: 'include',
      ids: new Set(['key-1', 'key-3']),
    };

    render(
      <DeleteButton
        selectedRows={selectedRows}
        data={mockData}
        discoveryApi={mockDiscoveryApi}
        fetchApi={mockFetchApi}
        identityApi={mockIdentityApi}
        onDeleteSuccess={mockOnDeleteSuccess}
      />,
    );

    const deleteButton = screen.getByTestId('delete-icon');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteUserKey).toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: 'token-1',
        },
      });
      expect(mockDeleteUserKey).toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: 'token-3',
        },
      });
      // Should not call with token-2
      expect(mockDeleteUserKey).not.toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: 'token-2',
        },
      });
    });
  });

  it('handles missing token in data gracefully', async () => {
    const dataWithMissingToken = [
      { id: 'key-1', token: 'token-1', createdAt: '2025-01-01' },
      { id: 'key-2', createdAt: '2025-01-02' }, // missing token
      { id: 'key-3', token: 'token-3', createdAt: '2025-01-03' },
    ];

    const selectedRows: GridRowSelectionModel = {
      type: 'include',
      ids: new Set(['key-1', 'key-2', 'key-3']),
    };

    render(
      <DeleteButton
        selectedRows={selectedRows}
        data={dataWithMissingToken}
        discoveryApi={mockDiscoveryApi}
        fetchApi={mockFetchApi}
        identityApi={mockIdentityApi}
        onDeleteSuccess={mockOnDeleteSuccess}
      />,
    );

    const deleteButton = screen.getByTestId('delete-icon');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      // Note: Current implementation attempts to delete even when token is undefined
      // This may be a bug - it should filter out undefined tokens
      expect(mockDeleteUserKey).toHaveBeenCalledTimes(3);
      expect(mockDeleteUserKey).toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: 'token-1',
        },
      });
      expect(mockDeleteUserKey).toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: undefined,
        },
      });
      expect(mockDeleteUserKey).toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: 'token-3',
        },
      });
      expect(mockOnDeleteSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onDeleteSuccess after all deletions complete', async () => {
    const selectedRows: GridRowSelectionModel = {
      type: 'include',
      ids: new Set(['key-1', 'key-2']),
    };

    render(
      <DeleteButton
        selectedRows={selectedRows}
        data={mockData}
        discoveryApi={mockDiscoveryApi}
        fetchApi={mockFetchApi}
        identityApi={mockIdentityApi}
        onDeleteSuccess={mockOnDeleteSuccess}
      />,
    );

    const deleteButton = screen.getByTestId('delete-icon');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteUserKey).toHaveBeenCalledTimes(2);
      expect(mockOnDeleteSuccess).toHaveBeenCalledTimes(1);
    });

    // Verify onDeleteSuccess is called (it should be called after Promise.all completes)
    expect(mockOnDeleteSuccess).toHaveBeenCalled();
  });

  it('handles empty data array', async () => {
    const selectedRows: GridRowSelectionModel = {
      type: 'include',
      ids: new Set(['key-1']),
    };

    render(
      <DeleteButton
        selectedRows={selectedRows}
        data={[]}
        discoveryApi={mockDiscoveryApi}
        fetchApi={mockFetchApi}
        identityApi={mockIdentityApi}
        onDeleteSuccess={mockOnDeleteSuccess}
      />,
    );

    const deleteButton = screen.getByTestId('delete-icon');
    await userEvent.click(deleteButton);

    await waitFor(() => {
      // When data is empty, selectedIds will be ['key-1'], but data.find will return undefined
      // So token will be undefined, but deleteUserKey will still be called with undefined
      expect(mockDeleteUserKey).toHaveBeenCalledTimes(1);
      expect(mockDeleteUserKey).toHaveBeenCalledWith({
        path: {
          userId: 'user:default/test-user',
          keyId: undefined,
        },
      });
      // onDeleteSuccess should still be called
      expect(mockOnDeleteSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('passes through ToolbarButton props', () => {
    const selectedRows: GridRowSelectionModel = {
      type: 'include',
      ids: new Set(['key-1']),
    };

    render(
      <DeleteButton
        selectedRows={selectedRows}
        data={mockData}
        discoveryApi={mockDiscoveryApi}
        fetchApi={mockFetchApi}
        identityApi={mockIdentityApi}
        onDeleteSuccess={mockOnDeleteSuccess}
        data-testid="custom-toolbar-button"
      />,
    );

    const toolbarButton = screen.getByTestId('custom-toolbar-button');
    expect(toolbarButton).toBeInTheDocument();
  });
});
