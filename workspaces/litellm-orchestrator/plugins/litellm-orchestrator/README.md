# litellm-orchestrator

A Backstage frontend plugin for managing LiteLLM orchestrator users and API keys.

## Features

- **User Overview**: View and manage LiteLLM users directly from Backstage
- **API Key Management**: Create, view, and delete API keys for LiteLLM users
- **Integrated Experience**: Seamlessly manage your LiteLLM infrastructure within Backstage

## Installation

This plugin is installed via the `@backstage-community/plugin-litellm-orchestrator` package. To install it to your Backstage app, run the following command:

```bash
# From your root directory
yarn --cwd packages/app add @backstage-community/plugin-litellm-orchestrator
```

Then ensure the package is added in the `app-config.yaml`:

```yml
app:
  packages: all
  # or
  packages:
    include:
      - "@richardmcsong/plugin-litellm-orchestrator"
```

## Configuration

The plugin requires the corresponding backend plugin to be installed and configured. See the [backend plugin README](../litellm-orchestrator-backend/README.md) for backend setup instructions.

## Development

You can serve the plugin in isolation for local development by running `yarn start` in this directory. This provides quicker iteration speed and faster startup with hot reloads.

The standalone development setup can be found in the [/dev](./dev) directory.

To run the entire project, including the frontend and backend, run `yarn start` from the workspace root directory.

## Components

- **LitellmOrchestratorPage**: Main page component that displays the user overview and key management interface
- **UserOverviewComponent**: Displays user information and details
- **UserKeyListComponent**: Manages API keys with create, view, and delete functionality
- **KeyMaterialModal**: Modal dialog for displaying newly created API keys

## License

This plugin is licensed under the Apache-2.0 License.
