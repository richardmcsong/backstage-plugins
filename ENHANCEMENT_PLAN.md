# Enhancement Plan: User and API Key Update/Management Features

## Issue Reference
GitHub Issue: https://github.com/richardmcsong/backstage-plugins/issues/2

## Overview

This enhancement adds update and management capabilities to the LiteLLM Orchestrator Backstage plugin, extending the current CRUD operations to support updating user budgets and API key properties, as well as key regeneration functionality.

## Current State

The plugin currently supports:
- ✅ **User Management**: Create users (`POST /users`), Get user info (`GET /users/:userId`)
- ✅ **API Key Management**: Create keys (`POST /users/:userId/keys`), List keys (`GET /users/:userId/keys`), Delete keys (`DELETE /users/:userId/keys/:keyId`)

## Proposed Enhancements

### 1. User Update Functionality

**Endpoint**: `PATCH /users/:userId`

**Purpose**: Allow administrators to update user properties such as budget limits and budget duration.

**Authorization**:
- Only admin users (members of the configured `adminGroup`) can update users
- Regular users cannot update their own or other users' properties

**Request Body**:
```json
{
  "maxBudget": 200,
  "budgetDuration": "3mo",
  "spend": 0
}
```

**Response**: Updated `User` object

**Upstream API**: Uses `userUpdateUserUpdatePost` from LiteLLM SDK

**Use Cases**:
- Adjusting budget limits for users who need more resources
- Extending budget duration periods
- Resetting spend counters (admin only)

### 2. API Key Update Functionality

**Endpoint**: `PATCH /users/:userId/keys/:keyId`

**Purpose**: Allow users and admins to update API key properties such as metadata, rate limits, model restrictions, and other key-specific settings.

**Authorization**:
- Users can update their own keys
- Admin users can update any user's keys

**Request Body** (all fields optional):
```json
{
  "keyAlias": "production-key",
  "maxBudget": 50,
  "budgetDuration": "1mo",
  "models": ["gpt-4", "gpt-3.5-turbo"],
  "metadata": {
    "environment": "production",
    "team": "ai-platform"
  },
  "tpmLimit": 100000,
  "rpmLimit": 100,
  "blocked": false
}
```

**Response**: Updated key information (without exposing the secret)

**Upstream API**: Uses `updateKeyFnKeyUpdatePost` from LiteLLM SDK

**Use Cases**:
- Adding metadata to keys for organization
- Adjusting rate limits for specific keys
- Restricting keys to specific models
- Blocking/unblocking keys
- Updating budget limits for individual keys

### 3. API Key Regeneration Functionality

**Endpoint**: `POST /users/:userId/keys/:keyId/regenerate`

**Purpose**: Regenerate an existing API key while optionally updating its properties. This is useful for key rotation and security best practices.

**Authorization**:
- Users can regenerate their own keys
- Admin users can regenerate any user's keys

**Request Body** (optional - can regenerate with same properties or update during regeneration):
```json
{
  "keyAlias": "rotated-production-key",
  "maxBudget": 75,
  "metadata": {
    "rotatedAt": "2025-01-15",
    "reason": "scheduled-rotation"
  }
}
```

**Response**: New `UserKey` object with `keyId` and `keySecret` (similar to key creation)

**Upstream API**: Uses `regenerateKeyFnKeyKeyRegeneratePost` from LiteLLM SDK

**Use Cases**:
- Scheduled key rotation for security compliance
- Regenerating keys after suspected compromise
- Updating key properties during rotation
- Maintaining service continuity while rotating credentials

## Implementation Details

### Backend Changes

#### 1. UserService Updates

**File**: `workspaces/litellm-orchestrator/plugins/litellm-orchestrator-backend/src/services/UserService.ts`

**New Method**:
```typescript
async updateUser(
  userId: string,
  currentUser: BackstageUserInfo,
  updates: {
    maxBudget?: number;
    budgetDuration?: string;
    spend?: number;
  }
): Promise<User>
```

**Authorization Logic**:
- Only admins can update users
- Validates user exists before updating
- Maps LiteLLM response to User model

#### 2. KeyService Updates

**File**: `workspaces/litellm-orchestrator/plugins/litellm-orchestrator-backend/src/services/KeyService.ts`

**New Methods**:

1. `updateUserKey()`:
```typescript
async updateUserKey(
  userId: string,
  keyId: string,
  currentUser: BackstageUserInfo,
  updates: {
    keyAlias?: string;
    maxBudget?: number;
    budgetDuration?: string;
    models?: string[];
    metadata?: Record<string, any>;
    tpmLimit?: number;
    rpmLimit?: number;
    blocked?: boolean;
    // ... other key properties
  }
): Promise<UserAPIKeyAuth>
```

2. `regenerateUserKey()`:
```typescript
async regenerateUserKey(
  userId: string,
  keyId: string,
  currentUser: BackstageUserInfo,
  updates?: {
    // Same update options as updateUserKey
  }
): Promise<UserKey>
```

**Authorization Logic**:
- Users can update/regenerate their own keys
- Admins can update/regenerate any user's keys
- Validates key exists and belongs to user before operations

#### 3. Router Updates

**File**: `workspaces/litellm-orchestrator/plugins/litellm-orchestrator-backend/src/router.ts`

**New Routes**:

1. `PATCH /users/:userId` - Update user
2. `PATCH /users/:userId/keys/:keyId` - Update API key
3. `POST /users/:userId/keys/:keyId/regenerate` - Regenerate API key

**Error Handling**:
- 401 Unauthorized for unauthenticated requests
- 403 Forbidden for insufficient permissions
- 404 Not Found for non-existent users/keys
- 400 Bad Request for invalid update parameters

#### 4. OpenAPI Schema Updates

**File**: `workspaces/litellm-orchestrator/plugins/litellm-orchestrator-backend/src/schema/openapi/generated/router.ts`

**New Schemas**:
- `UpdateUserRequest` - Request body for user updates
- `UpdateKeyRequest` - Request body for key updates
- `RegenerateKeyRequest` - Request body for key regeneration

**New Paths**:
- `/users/{userId}` - Add PATCH operation
- `/users/{userId}/keys/{keyId}` - Add PATCH operation
- `/users/{userId}/keys/{keyId}/regenerate` - Add POST operation

### Frontend Changes

#### 1. User Overview Component Updates

**File**: `workspaces/litellm-orchestrator/plugins/litellm-orchestrator/src/components/UserOverviewComponent/UserOverviewComponent.tsx`

**New Features**:
- Edit button for admins to update user budget
- Modal/dialog for editing user properties
- Form validation for budget values
- Success/error notifications

#### 2. User Key List Component Updates

**File**: `workspaces/litellm-orchestrator/plugins/litellm-orchestrator/src/components/UserKeyListComponent/UserKeyListComponent.tsx`

**New Features**:
- Edit button for each key (if user owns it or is admin)
- Regenerate button for each key
- Modal/dialog for editing key properties
- Confirmation dialog for key regeneration (warns about old key becoming invalid)
- Display updated key information after operations

#### 3. New Components

**UpdateUserModal.tsx**:
- Form for updating user budget and duration
- Admin-only access
- Validation and error handling

**UpdateKeyModal.tsx**:
- Form for updating key properties
- Supports all key update fields
- User-friendly labels and help text

**RegenerateKeyModal.tsx**:
- Confirmation dialog with warning
- Optional update fields during regeneration
- Displays new key secret (similar to KeyMaterialModal)

## Testing Strategy

### Backend Tests

#### UserService Tests
- Test `updateUser()` with valid admin user
- Test `updateUser()` rejects non-admin users
- Test `updateUser()` handles non-existent users
- Test `updateUser()` validates budget values
- Test `updateUser()` maps LiteLLM response correctly

#### KeyService Tests
- Test `updateUserKey()` with self and admin permissions
- Test `updateUserKey()` rejects unauthorized access
- Test `updateUserKey()` handles non-existent keys
- Test `regenerateUserKey()` creates new key
- Test `regenerateUserKey()` invalidates old key
- Test both methods handle partial updates correctly

#### Router Integration Tests
- Test PATCH `/users/:userId` endpoint
- Test PATCH `/users/:userId/keys/:keyId` endpoint
- Test POST `/users/:userId/keys/:keyId/regenerate` endpoint
- Test all authorization scenarios
- Test error handling and status codes

### Frontend Tests

#### Component Tests
- Test UpdateUserModal renders for admins
- Test UpdateUserModal hidden for non-admins
- Test UpdateKeyModal renders with correct permissions
- Test RegenerateKeyModal shows warning
- Test form validation
- Test API integration and error handling

#### Integration Tests
- Test complete user update flow
- Test complete key update flow
- Test complete key regeneration flow
- Test error scenarios and user feedback

## Security Considerations

1. **Authorization**: Strict enforcement of admin vs. self-service permissions
2. **Input Validation**: Validate all update parameters (budget limits, durations, etc.)
3. **Key Regeneration**: Ensure old keys are properly invalidated
4. **Audit Logging**: Log all update and regeneration operations (consider adding audit trail)
5. **Rate Limiting**: Consider rate limits on key regeneration to prevent abuse

## Configuration

No new configuration required. Uses existing:
- `liteLLM.baseUrl`
- `liteLLM.masterKey`
- `liteLLM.adminGroup`

## Migration Notes

- No database migrations required (stateless plugin)
- No breaking changes to existing APIs
- New endpoints are additive

## Documentation Updates

### README Updates

**File**: `workspaces/litellm-orchestrator/plugins/litellm-orchestrator-backend/README.md`

**Add to API Endpoints section**:

#### User Updates
- **PATCH `/users/:userId`**: Update user properties (admin only)
  - Requires authentication
  - Admin access required
  - Body: `{ maxBudget?: number, budgetDuration?: string, spend?: number }`
  - Returns: Updated user object

#### API Key Updates
- **PATCH `/users/:userId/keys/:keyId`**: Update API key properties
  - Requires authentication
  - Users can update their own keys, admins can update any keys
  - Body: `{ keyAlias?: string, maxBudget?: number, models?: string[], ... }`
  - Returns: Updated key object

- **POST `/users/:userId/keys/:keyId/regenerate`**: Regenerate an API key
  - Requires authentication
  - Users can regenerate their own keys, admins can regenerate any keys
  - Body: Optional update properties
  - Returns: New key object with `keyId` and `keySecret`
  - **Warning**: Old key will be invalidated

### Frontend README Updates

**File**: `workspaces/litellm-orchestrator/plugins/litellm-orchestrator/README.md`

**Add to Features section**:
- User budget management (admin only)
- API key property updates
- API key regeneration with rotation support

## Implementation Checklist

### Backend
- [ ] Add `updateUser()` method to UserService
- [ ] Add `updateUserKey()` method to KeyService
- [ ] Add `regenerateUserKey()` method to KeyService
- [ ] Add PATCH `/users/:userId` route
- [ ] Add PATCH `/users/:userId/keys/:keyId` route
- [ ] Add POST `/users/:userId/keys/:keyId/regenerate` route
- [ ] Update OpenAPI schema
- [ ] Add unit tests for UserService
- [ ] Add unit tests for KeyService
- [ ] Add integration tests for routes
- [ ] Update backend README

### Frontend
- [ ] Create UpdateUserModal component
- [ ] Create UpdateKeyModal component
- [ ] Create RegenerateKeyModal component
- [ ] Update UserOverviewComponent with edit functionality
- [ ] Update UserKeyListComponent with edit/regenerate buttons
- [ ] Add form validation
- [ ] Add error handling and user feedback
- [ ] Add component tests
- [ ] Update frontend README

### Documentation
- [ ] Update API documentation
- [ ] Add usage examples
- [ ] Update feature list
- [ ] Add security considerations section

## Success Criteria

1. ✅ Admins can update user budgets and budget duration
2. ✅ Users can update their own API key properties
3. ✅ Admins can update any user's API key properties
4. ✅ Users can regenerate their own API keys
5. ✅ Admins can regenerate any user's API keys
6. ✅ All operations properly enforce authorization
7. ✅ All operations handle errors gracefully
8. ✅ Frontend provides intuitive UI for all operations
9. ✅ Comprehensive test coverage (>80%)
10. ✅ Documentation is complete and accurate

## Future Enhancements (Out of Scope)

- Bulk user updates
- Key expiration dates
- Key usage analytics
- Audit log viewing
- Key templates/presets
- Automated key rotation scheduling

## Dependencies

- Existing LiteLLM SDK functions:
  - `userUpdateUserUpdatePost`
  - `updateKeyFnKeyUpdatePost`
  - `regenerateKeyFnKeyKeyRegeneratePost`
- No new external dependencies required

## Estimated Effort

- **Backend Development**: 2-3 days
- **Frontend Development**: 2-3 days
- **Testing**: 1-2 days
- **Documentation**: 0.5 days
- **Total**: ~5-8 days

## Risk Assessment

- **Low Risk**: All operations are additive, no breaking changes
- **Medium Risk**: Key regeneration could cause service disruption if not properly communicated
- **Mitigation**: Clear warnings in UI and documentation about key invalidation
