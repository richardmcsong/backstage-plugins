# Enhancement: Add User and API Key Update/Management Features

## Summary

Add update and management capabilities to the LiteLLM Orchestrator plugin, including:
- User budget and settings updates (admin only)
- API key property updates (users can update their own, admins can update any)
- API key regeneration with optional property updates

## Motivation

Currently, the plugin only supports creating and deleting users/keys, but not updating them. This limits operational flexibility:
- Admins cannot adjust user budgets without deleting and recreating users
- Users cannot update key metadata, rate limits, or other properties
- No way to rotate keys for security compliance
- No way to adjust key settings as needs change

## Proposed Solution

### 1. User Update Endpoint

**Endpoint**: `PATCH /api/litellm-orchestrator/users/:userId`

**Authorization**: Admin only

**Request Body**:
```json
{
  "maxBudget": 200,
  "budgetDuration": "3mo",
  "spend": 0
}
```

**Use Cases**:
- Adjust budget limits for users
- Extend budget duration periods
- Reset spend counters (admin only)

### 2. API Key Update Endpoint

**Endpoint**: `PATCH /api/litellm-orchestrator/users/:userId/keys/:keyId`

**Authorization**: Users can update their own keys, admins can update any

**Request Body** (all optional):
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

**Use Cases**:
- Add metadata for organization
- Adjust rate limits
- Restrict to specific models
- Block/unblock keys
- Update budget limits

### 3. API Key Regeneration Endpoint

**Endpoint**: `POST /api/litellm-orchestrator/users/:userId/keys/:keyId/regenerate`

**Authorization**: Users can regenerate their own keys, admins can regenerate any

**Request Body** (optional):
```json
{
  "keyAlias": "rotated-production-key",
  "maxBudget": 75,
  "metadata": {
    "rotatedAt": "2025-01-15"
  }
}
```

**Response**: New key with `keyId` and `keySecret`

**Use Cases**:
- Scheduled key rotation
- Regenerating after suspected compromise
- Updating properties during rotation

## Implementation Details

### Backend Changes

1. **UserService** (`src/services/UserService.ts`):
   - Add `updateUser()` method using `userUpdateUserUpdatePost` from LiteLLM SDK
   - Admin-only authorization check

2. **KeyService** (`src/services/KeyService.ts`):
   - Add `updateUserKey()` method using `updateKeyFnKeyUpdatePost`
   - Add `regenerateUserKey()` method using `regenerateKeyFnKeyKeyRegeneratePost`
   - Self/admin authorization checks

3. **Router** (`src/router.ts`):
   - Add PATCH `/users/:userId` route
   - Add PATCH `/users/:userId/keys/:keyId` route
   - Add POST `/users/:userId/keys/:keyId/regenerate` route
   - Proper error handling (401, 403, 404, 400)

4. **OpenAPI Schema** (`src/schema/openapi/generated/router.ts`):
   - Add new request/response schemas
   - Update path definitions

### Frontend Changes

1. **UserOverviewComponent**:
   - Add edit button (admin only)
   - Modal for updating user budget
   - Form validation

2. **UserKeyListComponent**:
   - Add edit button per key
   - Add regenerate button per key
   - Update and regenerate modals
   - Confirmation dialogs

3. **New Components**:
   - `UpdateUserModal.tsx`
   - `UpdateKeyModal.tsx`
   - `RegenerateKeyModal.tsx`

## Testing Requirements

### Backend Tests
- [ ] UserService.updateUser() with admin user
- [ ] UserService.updateUser() rejects non-admin
- [ ] KeyService.updateUserKey() with self/admin permissions
- [ ] KeyService.regenerateUserKey() creates new key
- [ ] Router integration tests for all new endpoints
- [ ] Authorization tests
- [ ] Error handling tests

### Frontend Tests
- [ ] UpdateUserModal renders for admins
- [ ] UpdateKeyModal with correct permissions
- [ ] RegenerateKeyModal shows warning
- [ ] Form validation
- [ ] API integration tests

## Security Considerations

- ✅ Strict authorization enforcement
- ✅ Input validation on all parameters
- ✅ Key regeneration invalidates old keys
- ⚠️ Consider audit logging for all update operations
- ⚠️ Consider rate limiting on key regeneration

## Documentation Updates

- [ ] Update API endpoints section in backend README
- [ ] Add usage examples
- [ ] Update frontend README with new features
- [ ] Document security implications of key regeneration

## Acceptance Criteria

- [ ] Admins can update user budgets via API and UI
- [ ] Users can update their own API key properties
- [ ] Admins can update any user's API key properties
- [ ] Users can regenerate their own API keys
- [ ] Admins can regenerate any user's API keys
- [ ] All operations enforce proper authorization
- [ ] Error handling is comprehensive
- [ ] UI is intuitive and user-friendly
- [ ] Test coverage >80%
- [ ] Documentation is complete

## Dependencies

Uses existing LiteLLM SDK functions:
- `userUpdateUserUpdatePost`
- `updateKeyFnKeyUpdatePost`
- `regenerateKeyFnKeyKeyRegeneratePost`

No new external dependencies required.

## Estimated Effort

- Backend: 2-3 days
- Frontend: 2-3 days
- Testing: 1-2 days
- Documentation: 0.5 days
- **Total: ~5-8 days**

## Related Issues

- None currently

## Additional Context

The LiteLLM upstream API already supports these operations, so this is primarily about exposing them through the Backstage plugin with proper authorization and user experience.
