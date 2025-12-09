# 🚀 litellm-orchestrator: Add User and API Key Update/Management Features

## 🔖 Feature description

Add update and management capabilities to the LiteLLM Orchestrator plugin, enabling:
- User budget and settings updates (admin only)
- API key property updates (users can update their own, admins can update any)
- API key regeneration with optional property updates

Currently, the plugin only supports creating and deleting users/keys, but not updating them. This limits operational flexibility and prevents key rotation for security compliance.

## 🎤 Context

### Current Limitations

1. **No User Updates**: Admins cannot adjust user budgets without deleting and recreating users, which is disruptive and loses historical data.

2. **No Key Updates**: Users cannot update key metadata, rate limits, model restrictions, or other properties. This makes it difficult to:
   - Organize keys with metadata
   - Adjust rate limits as usage patterns change
   - Restrict keys to specific models
   - Block/unblock keys temporarily

3. **No Key Rotation**: There's no way to rotate keys for security compliance or after suspected compromise. Users must delete and recreate keys, which causes service disruption.

### Use Cases

**User Budget Management**:
- Admin needs to increase budget for a user who needs more resources
- Admin needs to extend budget duration period
- Admin needs to reset spend counter after billing cycle

**API Key Management**:
- User wants to add metadata to organize their keys (e.g., "production", "staging")
- User wants to adjust rate limits for a specific key
- User wants to restrict a key to specific models
- Admin needs to temporarily block a key
- User wants to update key alias for better organization

**Key Rotation**:
- Scheduled key rotation for security compliance (quarterly, annually)
- Regenerating keys after suspected compromise
- Updating key properties during rotation to maintain service continuity

## ✌️ Possible Implementation

### Backend Implementation

#### 1. User Update Endpoint

**Route**: `PATCH /api/litellm-orchestrator/users/:userId`

**Service Method** (`UserService.ts`):
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

**Authorization**: Admin only (uses existing `Utils.isAdmin()` check)

**Upstream API**: `userUpdateUserUpdatePost` from LiteLLM SDK

#### 2. API Key Update Endpoint

**Route**: `PATCH /api/litellm-orchestrator/users/:userId/keys/:keyId`

**Service Method** (`KeyService.ts`):
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
    // ... other key properties from LiteLLM API
  }
): Promise<UserAPIKeyAuth>
```

**Authorization**: Self or admin (uses existing `Utils.isSelf()` and `Utils.isAdmin()` checks)

**Upstream API**: `updateKeyFnKeyUpdatePost` from LiteLLM SDK

#### 3. API Key Regeneration Endpoint

**Route**: `POST /api/litellm-orchestrator/users/:userId/keys/:keyId/regenerate`

**Service Method** (`KeyService.ts`):
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

**Authorization**: Self or admin

**Upstream API**: `regenerateKeyFnKeyKeyRegeneratePost` from LiteLLM SDK

**Important**: Returns new `UserKey` with `keyId` and `keySecret`. Old key is invalidated.

### Frontend Implementation

#### 1. User Overview Component Updates

- Add "Edit" button (visible only to admins)
- Modal dialog with form for:
  - Max Budget (number input)
  - Budget Duration (text input with validation)
  - Spend (number input, admin only)
- Form validation and error handling
- Success notification after update

#### 2. User Key List Component Updates

- Add "Edit" button for each key (if user owns it or is admin)
- Add "Regenerate" button for each key
- **UpdateKeyModal**: Form with all key update fields
- **RegenerateKeyModal**: 
  - Confirmation dialog with warning about old key invalidation
  - Optional update fields
  - Display new key secret (similar to existing KeyMaterialModal)

### OpenAPI Schema Updates

Add new paths and schemas to `src/schema/openapi/generated/router.ts`:

```typescript
'/users/{userId}': {
  patch: {
    operationId: 'updateUser',
    // ... request/response schemas
  }
},
'/users/{userId}/keys/{keyId}': {
  patch: {
    operationId: 'updateUserKey',
    // ... request/response schemas
  }
},
'/users/{userId}/keys/{keyId}/regenerate': {
  post: {
    operationId: 'regenerateUserKey',
    // ... request/response schemas
  }
}
```

### Testing Strategy

**Backend Tests**:
- Unit tests for `UserService.updateUser()`
- Unit tests for `KeyService.updateUserKey()` and `regenerateUserKey()`
- Integration tests for all new routes
- Authorization tests (admin vs. self vs. unauthorized)
- Error handling tests (404, 403, 400)

**Frontend Tests**:
- Component tests for new modals
- Permission-based rendering tests
- Form validation tests
- API integration tests

### Security Considerations

1. **Authorization**: Strict enforcement using existing `Utils.isAdmin()` and `Utils.isSelf()` methods
2. **Input Validation**: Validate all update parameters (budget limits, durations, etc.)
3. **Key Regeneration**: Ensure old keys are properly invalidated by LiteLLM
4. **Audit Logging**: Consider logging all update/regeneration operations (future enhancement)
5. **Rate Limiting**: Consider rate limits on key regeneration to prevent abuse

### Documentation Updates

**Backend README** (`plugins/litellm-orchestrator-backend/README.md`):
- Add new endpoints to API Endpoints section
- Document authorization requirements
- Add request/response examples

**Frontend README** (`plugins/litellm-orchestrator/README.md`):
- Add new features to Features section
- Document UI workflows

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

## Dependencies

Uses existing LiteLLM SDK functions (already available):
- `userUpdateUserUpdatePost`
- `updateKeyFnKeyUpdatePost`
- `regenerateKeyFnKeyKeyRegeneratePost`

**No new external dependencies required.**

## Estimated Effort

- Backend Development: 2-3 days
- Frontend Development: 2-3 days
- Testing: 1-2 days
- Documentation: 0.5 days
- **Total: ~5-8 days**

## Acceptance Criteria

- [ ] Admins can update user budgets via API and UI
- [ ] Users can update their own API key properties via API and UI
- [ ] Admins can update any user's API key properties via API and UI
- [ ] Users can regenerate their own API keys via API and UI
- [ ] Admins can regenerate any user's API keys via API and UI
- [ ] All operations enforce proper authorization (403 for unauthorized access)
- [ ] Error handling is comprehensive (404, 400, etc.)
- [ ] UI is intuitive with clear warnings for key regeneration
- [ ] Test coverage >80%
- [ ] Documentation is complete and accurate

## Related Information

- LiteLLM API Documentation: The upstream API already supports these operations
- Current plugin implementation: See `workspaces/litellm-orchestrator/plugins/litellm-orchestrator-backend/`
- Existing authorization logic: `workspaces/litellm-orchestrator/plugins/litellm-orchestrator-backend/src/utils/utils.ts`
