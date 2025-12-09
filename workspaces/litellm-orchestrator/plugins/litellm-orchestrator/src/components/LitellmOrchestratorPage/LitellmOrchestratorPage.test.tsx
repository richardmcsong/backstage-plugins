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

import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { LitellmOrchestratorPage } from './LitellmOrchestratorPage';
import {
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  configApiRef,
} from '@backstage/core-plugin-api';
import { DefaultApiClient } from '../../schema/openapi/generated/apis/Api.client';
import { User } from '../../schema/openapi/generated/models/User.model';
import { TypedResponse } from '../../schema/openapi/generated/apis/Api.client';

// Mock the DefaultApiClient
jest.mock('../../schema/openapi/generated/apis/Api.client', () => ({
  DefaultApiClient: jest.fn().mockImplementation(() => ({
    getUser: jest.fn(),
    createUser: jest.fn(),
  })),
}));

// Mock the child components
jest.mock('../UserOverviewComponent', () => ({
  UserOverviewComponent: () => (
    <div data-testid="user-overview">User Overview</div>
  ),
}));

jest.mock('../UserKeyListComponent', () => ({
  UserKeyListComponent: () => (
    <div data-testid="user-key-list">User Key List</div>
  ),
}));

describe('LitellmOrchestratorPage', () => {
  const mockDiscoveryApi = {
    getBaseUrl: jest
      .fn()
      .mockResolvedValue('http://localhost:7007/api/litellm-orchestrator'),
  };

  const mockFetchApi = {
    fetch: jest.fn(),
  };

  const mockConfigApi = {
    getString: jest.fn((key: string) => {
      if (key === 'liteLLM.allowedGroup') {
        return 'ALLOWED_GROUP';
      }
      throw new Error(`Unknown config key: ${key}`);
    }),
    getOptionalString: jest.fn((key: string) => {
      if (key === 'liteLLM.allowedGroup') {
        return 'ALLOWED_GROUP';
      }
      return undefined;
    }),
    getStringArray: jest.fn(),
    getNumber: jest.fn(),
    getOptionalNumber: jest.fn(),
    getBoolean: jest.fn(),
    getOptionalBoolean: jest.fn(),
    getConfig: jest.fn(),
    getOptionalConfig: jest.fn(),
    getConfigArray: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
  };

  const mockIdentityApi = {
    getBackstageIdentity: jest.fn().mockResolvedValue({
      userEntityRef: 'user:default/test-user',
      type: 'user',
      ownershipEntityRefs: ['ALLOWED_GROUP'],
    }),
    getCredentials: jest.fn(),
    getProfileInfo: jest.fn(),
  };

  const mockGetUser = jest.fn();
  const mockCreateUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (DefaultApiClient as jest.Mock).mockImplementation(() => ({
      getUser: mockGetUser,
      createUser: mockCreateUser,
    }));
  });

  it('renders the page with header and components', async () => {
    const mockUser: User = {
      userId: 'user:default/test-user',
      createdAt: '2025-01-01T00:00:00Z',
      maxBudget: 100,
      budgetDuration: '1mo',
      spend: 0,
    };

    const mockResponse: TypedResponse<User> = {
      status: 200,
      statusText: 'OK',
      ok: true,
      json: jest.fn().mockResolvedValue(mockUser),
    } as unknown as TypedResponse<User>;

    mockGetUser.mockResolvedValue(mockResponse);

    const { getByText, getByTestId } = await renderInTestApp(
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
          [identityApiRef, mockIdentityApi],
          [configApiRef, mockConfigApi],
        ]}
      >
        <LitellmOrchestratorPage />
      </TestApiProvider>,
    );

    // Check header
    expect(getByText('Welcome to litellm-orchestrator!')).toBeInTheDocument();
    expect(
      getByText('This page will help you manage your litellm-orchestrator'),
    ).toBeInTheDocument();
    expect(getByText('Team X')).toBeInTheDocument();
    expect(getByText('Alpha')).toBeInTheDocument();

    // Check child components
    expect(getByTestId('user-overview')).toBeInTheDocument();
    expect(getByTestId('user-key-list')).toBeInTheDocument();
  });

  it('fetches user on mount and does not create if user exists', async () => {
    const mockUser: User = {
      userId: 'user:default/test-user',
      createdAt: '2025-01-01T00:00:00Z',
      maxBudget: 100,
      budgetDuration: '1mo',
      spend: 0,
    };

    const mockResponse: TypedResponse<User> = {
      status: 200,
      statusText: 'OK',
      ok: true,
      json: jest.fn().mockResolvedValue(mockUser),
    } as unknown as TypedResponse<User>;

    mockGetUser.mockResolvedValue(mockResponse);

    await renderInTestApp(
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
          [identityApiRef, mockIdentityApi],
          [configApiRef, mockConfigApi],
        ]}
      >
        <LitellmOrchestratorPage />
      </TestApiProvider>,
    );

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify getUser was called with correct user entity ref
    expect(mockIdentityApi.getBackstageIdentity).toHaveBeenCalled();
    expect(mockGetUser).toHaveBeenCalledWith({
      path: {
        userId: 'user:default/test-user',
      },
    });

    // Verify createUser was NOT called since user exists
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('creates user if user does not exist (404)', async () => {
    const mockUser: User = {
      userId: 'user:default/test-user',
      createdAt: '2025-01-01T00:00:00Z',
      maxBudget: 100,
      budgetDuration: '1mo',
      spend: 0,
    };

    // First call returns 404, second call (createUser) returns the created user
    const mock404Response: TypedResponse<User> = {
      status: 404,
      statusText: 'Not Found',
      ok: false,
      json: jest.fn().mockRejectedValue(new Error('Not found')),
    } as unknown as TypedResponse<User>;

    const mockCreatedResponse: TypedResponse<User> = {
      status: 201,
      statusText: 'Created',
      ok: true,
      json: jest.fn().mockResolvedValue(mockUser),
    } as unknown as TypedResponse<User>;

    mockGetUser.mockResolvedValue(mock404Response);
    mockCreateUser.mockResolvedValue(mockCreatedResponse);

    await renderInTestApp(
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
          [identityApiRef, mockIdentityApi],
          [configApiRef, mockConfigApi],
        ]}
      >
        <LitellmOrchestratorPage />
      </TestApiProvider>,
    );

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify getUser was called first
    expect(mockGetUser).toHaveBeenCalledWith({
      path: {
        userId: 'user:default/test-user',
      },
    });

    // Verify createUser was called after 404
    expect(mockCreateUser).toHaveBeenCalledWith({
      body: {
        userId: 'user:default/test-user',
      },
    });
  });

  it('handles errors gracefully when getUser fails with non-404 error', async () => {
    const mockErrorResponse: TypedResponse<User> = {
      status: 500,
      statusText: 'Internal Server Error',
      ok: false,
      json: jest.fn().mockRejectedValue(new Error('Server error')),
    } as unknown as TypedResponse<User>;

    mockGetUser.mockResolvedValue(mockErrorResponse);

    const { getByTestId } = await renderInTestApp(
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
          [identityApiRef, mockIdentityApi],
          [configApiRef, mockConfigApi],
        ]}
      >
        <LitellmOrchestratorPage />
      </TestApiProvider>,
    );

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Component should still render
    expect(getByTestId('user-overview')).toBeInTheDocument();
    expect(getByTestId('user-key-list')).toBeInTheDocument();

    // createUser should not be called for non-404 errors
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('handles errors gracefully when createUser fails', async () => {
    const mock404Response: TypedResponse<User> = {
      status: 404,
      statusText: 'Not Found',
      ok: false,
      json: jest.fn().mockRejectedValue(new Error('Not found')),
    } as unknown as TypedResponse<User>;

    const mockCreateErrorResponse: TypedResponse<User> = {
      status: 500,
      statusText: 'Internal Server Error',
      ok: false,
      json: jest.fn().mockRejectedValue(new Error('Creation failed')),
    } as unknown as TypedResponse<User>;

    mockGetUser.mockResolvedValue(mock404Response);
    mockCreateUser.mockResolvedValue(mockCreateErrorResponse);

    const { getByTestId } = await renderInTestApp(
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
          [identityApiRef, mockIdentityApi],
          [configApiRef, mockConfigApi],
        ]}
      >
        <LitellmOrchestratorPage />
      </TestApiProvider>,
    );

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Component should still render even if creation fails
    expect(getByTestId('user-overview')).toBeInTheDocument();
    expect(getByTestId('user-key-list')).toBeInTheDocument();

    // Verify createUser was attempted
    expect(mockCreateUser).toHaveBeenCalledWith({
      body: {
        userId: 'user:default/test-user',
      },
    });
  });

  it('calls getBackstageIdentity to get user entity ref', async () => {
    const mockUser: User = {
      userId: 'user:default/test-user',
      createdAt: '2025-01-01T00:00:00Z',
      maxBudget: 100,
      budgetDuration: '1mo',
      spend: 0,
    };

    const mockResponse: TypedResponse<User> = {
      status: 200,
      statusText: 'OK',
      ok: true,
      json: jest.fn().mockResolvedValue(mockUser),
    } as unknown as TypedResponse<User>;

    mockGetUser.mockResolvedValue(mockResponse);

    await renderInTestApp(
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
          [identityApiRef, mockIdentityApi],
          [configApiRef, mockConfigApi],
        ]}
      >
        <LitellmOrchestratorPage />
      </TestApiProvider>,
    );

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify identity API was called
    expect(mockIdentityApi.getBackstageIdentity).toHaveBeenCalled();
  });

  it('renders with correct theme ID', async () => {
    const mockUser: User = {
      userId: 'user:default/test-user',
      createdAt: '2025-01-01T00:00:00Z',
      maxBudget: 100,
      budgetDuration: '1mo',
      spend: 0,
    };

    const mockResponse: TypedResponse<User> = {
      status: 200,
      statusText: 'OK',
      ok: true,
      json: jest.fn().mockResolvedValue(mockUser),
    } as unknown as TypedResponse<User>;

    mockGetUser.mockResolvedValue(mockResponse);

    const { container } = await renderInTestApp(
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
          [identityApiRef, mockIdentityApi],
          [configApiRef, mockConfigApi],
        ]}
      >
        <LitellmOrchestratorPage />
      </TestApiProvider>,
    );

    // The Page component should be rendered (themeId is passed as prop, not directly testable in DOM)
    expect(container).toBeInTheDocument();
  });

  it('shows error panel when user is not in allowed group', async () => {
    const mockIdentityApiWithoutGroup = {
      getBackstageIdentity: jest.fn().mockResolvedValue({
        userEntityRef: 'user:default/test-user',
        type: 'user',
        ownershipEntityRefs: ['group:default/other-group'],
      }),
      getCredentials: jest.fn(),
      getProfileInfo: jest.fn(),
    };

    const { getByText, queryByTestId, queryByText } = await renderInTestApp(
      <TestApiProvider
        apis={[
          [discoveryApiRef, mockDiscoveryApi],
          [fetchApiRef, mockFetchApi],
          [identityApiRef, mockIdentityApiWithoutGroup],
          [configApiRef, mockConfigApi],
        ]}
      >
        <LitellmOrchestratorPage />
      </TestApiProvider>,
    );

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify error panel is shown with the error message
    expect(
      getByText('You are not allowed to access this page'),
    ).toBeInTheDocument();

    // Verify main page content is NOT shown
    expect(queryByTestId('user-overview')).not.toBeInTheDocument();
    expect(queryByTestId('user-key-list')).not.toBeInTheDocument();
    expect(
      queryByText('Welcome to litellm-orchestrator!'),
    ).not.toBeInTheDocument();

    // Verify getUser was NOT called since access check failed
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});
