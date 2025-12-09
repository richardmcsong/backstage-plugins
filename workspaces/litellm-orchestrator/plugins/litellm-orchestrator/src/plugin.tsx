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
  createFrontendPlugin,
  PageBlueprint,
  NavItemBlueprint,
} from '@backstage/frontend-plugin-api';
import { rootRouteRef } from './routes';
import SaveIcon from '@material-ui/icons/Save';

export const litellmOrchestratorPage = PageBlueprint.make({
  params: {
    routeRef: rootRouteRef,

    // This is the default path of this page, but integrators are free to override it
    path: '/litellm-orchestrator',

    // Page extensions are always dynamically loaded using React.lazy().
    // All of the functionality of this page is implemented in the
    // ExamplePage component, which is a regular React component.
    loader: () =>
      import('./components/LitellmOrchestratorPage').then(m => (
        <m.LitellmOrchestratorPage />
      )),
  },
});

// This nav item is provided to the app.nav extension, and will by default be rendered as a sidebar item
export const litellmOrchestratorNavItem = NavItemBlueprint.make({
  params: {
    routeRef: rootRouteRef,
    title: 'LiteLLM Orchestrator',
    icon: SaveIcon,
  },
});

/**
 * litellmOrchestrator frontend plugin
 * @public
 */
export const litellmOrchestratorPlugin = createFrontendPlugin({
  pluginId: 'litellm-orchestrator',
  extensions: [litellmOrchestratorPage, litellmOrchestratorNavItem],
  routes: {
    root: rootRouteRef,
  },
});
