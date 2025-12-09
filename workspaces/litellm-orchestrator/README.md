# litellm-orchestrator

A Backstage workspace containing plugins for managing LiteLLM orchestrator users and API keys directly from Backstage.

[LiteLLM](https://github.com/BerriAI/litellm) is a library that provides a unified interface for interacting with multiple LLM providers. This workspace provides Backstage plugins that integrate LiteLLM management into your Backstage instance.

## Plugins

This workspace contains two plugins:

- **[litellm-orchestrator](./plugins/litellm-orchestrator/README.md)**: Frontend plugin that provides a UI for managing LiteLLM users and API keys
- **[litellm-orchestrator-backend](./plugins/litellm-orchestrator-backend/README.md)**: Backend plugin that provides REST API endpoints for interacting with LiteLLM

## Features

- **User Management**: View and manage LiteLLM users from Backstage
- **API Key Management**: Create, view, and delete API keys for LiteLLM users
- **Integrated Experience**: Seamlessly manage your LiteLLM infrastructure within Backstage
- **Role-Based Access**: Admin controls for managing users and keys

## Getting Started

### Prerequisites

- Node.js 20 or 22
- A running LiteLLM instance
- Backstage application

### Installation

1. Install dependencies:

```sh

yarn install
```

2. Configure the backend plugin by adding LiteLLM configuration to your `app-config.yaml`:

```yaml
liteLLM:
  baseUrl: http://localhost:4000 # Your LiteLLM instance URL
  masterKey: your-master-key # Your LiteLLM master key
  adminGroup: admin # Backstage group name for admin access
  userDefaults:
    maxBudget: 100
    budgetDuration: 1mo
```

3. Install the plugins in your Backstage app:

```bash
# Install frontend plugin
yarn --cwd packages/app add @richardmcsong/plugin-litellm-orchestrator

# Install backend plugin
yarn --cwd packages/backend add @richardmcsong/plugin-litellm-orchestrator-backend
```

4. Add the plugins to your Backstage app:

**Frontend** (`app-config.yaml`):

```yml
app:
  packages: all
  # or
  packages:
    include:
      - "@richardmcsong/plugin-litellm-orchestrator"
```

**Backend** (`packages/backend/src/index.ts`):

```ts
const backend = createBackend();
backend.add(import('@backstage-community/plugin-litellm-orchestrator-backend'));
```

### Development

To start the entire workspace for development:

```sh
yarn start
```

To start only the plugins in development mode:

```sh
yarn dev
```

To run tests:

```sh
yarn test
```

To build all plugins:

```sh
yarn build:all
```

## Project Structure

```
litellm-orchestrator/
├── plugins/
│   ├── litellm-orchestrator/          # Frontend plugin
│   └── litellm-orchestrator-backend/  # Backend plugin
├── app-config.yaml                    # Local development configuration
└── package.json                       # Workspace configuration
```

## Configuration

See the individual plugin READMEs for detailed configuration instructions:

- [Frontend Plugin Configuration](./plugins/litellm-orchestrator/README.md)
- [Backend Plugin Configuration](./plugins/litellm-orchestrator-backend/README.md)

## Contributing

This workspace follows the Backstage Community Plugins contribution guidelines. See [CONTRIBUTING.md](../../CONTRIBUTING.md) for more information.

## License

This workspace is licensed under the Apache-2.0 License.
