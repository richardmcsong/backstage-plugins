# litellm-orchestrator-backend

A Backstage backend plugin that provides REST API endpoints for managing LiteLLM orchestrator users and API keys.

This plugin integrates with [LiteLLM](https://github.com/BerriAI/litellm) to provide user and API key management capabilities within Backstage, with proper authentication and authorization controls.

## Features

- **User Management**: Create and retrieve LiteLLM users
- **API Key Management**: Create, list, and delete API keys for LiteLLM users
- **Authentication**: Integrated with Backstage authentication system
- **Authorization**: Role-based access control with admin and self-service capabilities
- **OpenAPI Schema**: Full OpenAPI specification available at `/api/litellm-orchestrator/openapi.yaml`

## Installation

This plugin is installed via the `@backstage-community/plugin-litellm-orchestrator-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @backstage-community/plugin-litellm-orchestrator-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(import('@backstage-community/plugin-litellm-orchestrator-backend'));
```

## Configuration

Add the following configuration to your `app-config.yaml`:

```yaml
liteLLM:
  baseUrl: http://localhost:4000 # Your LiteLLM instance URL
  masterKey: your-master-key # Your LiteLLM master key
  adminGroup: admin # Backstage group name for admin access
  userDefaults:
    maxBudget: 100 # Default maximum budget for new users
    budgetDuration: 1mo # Budget duration (e.g., "1mo", "1y")
```

### Configuration Options

- **baseUrl** (required): The base URL of your LiteLLM instance
- **masterKey** (required): The master API key for authenticating with LiteLLM
- **adminGroup** (required): The Backstage group name that should have admin privileges. Users in this group can manage keys for any user.
- **userDefaults** (optional): Default settings for new users
  - **maxBudget**: Default maximum budget amount
  - **budgetDuration**: Default budget duration period

## API Endpoints

The plugin provides the following REST API endpoints under `/api/litellm-orchestrator`:

### Users

- **POST `/users`**: Create a new LiteLLM user

  - Requires authentication
  - Body: `{ userId: string }`
  - Returns: Created user object

- **GET `/users/:userId`**: Get user information
  - No authentication required
  - Returns: User object

### API Keys

- **POST `/users/:userId/keys`**: Create a new API key for a user

  - Requires authentication
  - Users can only create keys for themselves unless they are admins
  - Returns: Created key object with `keyId` and `keySecret`

- **GET `/users/:userId/keys`**: List all API keys for a user

  - Requires authentication
  - Users can only view their own keys unless they are admins
  - Returns: Array of key objects

- **DELETE `/users/:userId/keys/:keyId`**: Delete an API key
  - Requires authentication
  - Users can only delete their own keys unless they are admins
  - Returns: 204 No Content on success

### OpenAPI Schema

- **GET `/openapi.yaml`**: Get the OpenAPI specification for all endpoints

## Authorization

The plugin implements role-based access control:

- **Admin Users**: Users who belong to the `adminGroup` specified in configuration can:

  - Create keys for any user
  - View keys for any user
  - Delete keys for any user

- **Regular Users**: Can only:
  - Create keys for themselves
  - View their own keys
  - Delete their own keys

## Services

The plugin provides two main services:

- **UserService**: Manages LiteLLM user creation and retrieval
- **KeyService**: Manages API key lifecycle (create, list, delete)

Both services integrate with the LiteLLM upstream API and handle authentication, error handling, and user permissions.

## Development

This plugin backend can be started in standalone mode for development:

```bash
yarn start
```

This provides a limited setup that is most convenient when developing the plugin backend itself. It includes:

- Mock authentication
- Mock catalog service
- Development server on `http://localhost:7007`

To run the entire project, including the frontend, run `yarn start` from the workspace root directory.

## Testing

Run tests with:

```bash
yarn test
```

The plugin includes comprehensive unit tests for services and integration tests for API endpoints.

## License

This plugin is licensed under the Apache-2.0 License.
