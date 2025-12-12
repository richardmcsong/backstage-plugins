---
'@richardmcsong/plugin-litellm-orchestrator-backend': patch
---

Implemented lazy LiteLLM user creation in `UserService.ensureUserExistsAndAuthorized`. Authorized users in the allowed group (or admins) are now automatically provisioned in LiteLLM on their first plugin access, while unauthorized users still receive a `NotAllowedError`. Concurrent requests are handled to avoid duplicate user creation.
