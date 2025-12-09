# litellm-orchestrator-backend

A Backstage backend plugin that provides REST API endpoints for managing LiteLLM orchestrator users and API keys.

This plugin integrates with [LiteLLM](https://github.com/BerriAI/litellm) to provide user and API key management capabilities within Backstage, with proper authentication and authorization controls.

## Features

- **User Management**: Create and retrieve LiteLLM users
- **API Key Management**: Create, list, and delete API keys for LiteLLM users
- **Authentication**: Integrated with Backstage authentication system
- **Authorization**: Group-based access control with admin and self-service capabilities
- **Auto-User Creation**: Automatically creates LiteLLM users when group members access the plugin
- **Background Cleanup**: Automatically removes LiteLLM users who are no longer in the allowed group (runs every 5 minutes)
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
  adminGroup: group:default/admins # Backstage group entity ref for admin access
  allowedGroup: group:default/litellm-users # Backstage group entity ref for plugin access
  userDefaults:
    maxBudget: 100 # Default maximum budget for new users
    budgetDuration: 1mo # Budget duration (e.g., "1mo", "1y")
```

### Configuration Options

- **baseUrl** (required): The base URL of your LiteLLM instance
- **masterKey** (required): The master API key for authenticating with LiteLLM
- **adminGroup** (required): The Backstage group entity ref (e.g., `group:default/admins`) that should have admin privileges. Users in this group can manage keys for any user.
- **allowedGroup** (required): The Backstage group entity ref (e.g., `group:default/litellm-users`) that determines who can access the plugin. Users in this group will automatically have LiteLLM users created when they access the plugin.
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
  - Requires authentication
  - Users can only view their own user info unless they are admins
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

The plugin implements group-based access control:

### Access Control

- **Plugin Access**: Only users who belong to the `allowedGroup` specified in configuration can access the plugin. Users not in this group will receive a 403 Forbidden error.

- **Auto-User Creation**: When a user in the `allowedGroup` accesses the plugin for the first time, a LiteLLM user is automatically created with their Backstage user entity ref as the user ID.

### Permissions

- **Admin Users**: Users who belong to the `adminGroup` specified in configuration can:
  - Create keys for any user
  - View keys for any user
  - Delete keys for any user
  - View any user's information

- **Regular Users** (members of `allowedGroup`): Can only:
  - Create keys for themselves
  - View their own keys
  - Delete their own keys
  - View their own user information

### Background Cleanup

The plugin runs a background task every 5 minutes that:
1. Lists all LiteLLM users
2. Checks which users are still members of the `allowedGroup` in Backstage
3. Deletes LiteLLM users who are no longer in the group

This ensures that LiteLLM users are automatically cleaned up when users are removed from the allowed group in Backstage.

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
