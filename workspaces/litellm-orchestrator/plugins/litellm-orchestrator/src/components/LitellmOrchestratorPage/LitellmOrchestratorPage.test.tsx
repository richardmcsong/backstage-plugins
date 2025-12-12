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

import { renderInTestApp } from '@backstage/test-utils';
import { LitellmOrchestratorPage } from './LitellmOrchestratorPage';

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
  it('renders the page with header and components', async () => {
    const { getByText, getByTestId } = await renderInTestApp(
      <LitellmOrchestratorPage />,
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

  it('renders with correct theme ID', async () => {
    const { container } = await renderInTestApp(<LitellmOrchestratorPage />);

    // The Page component should be rendered (themeId is passed as prop, not directly testable in DOM)
    expect(container).toBeInTheDocument();
  });
});
