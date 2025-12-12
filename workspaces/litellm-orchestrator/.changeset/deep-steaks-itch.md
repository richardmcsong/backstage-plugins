---
'@richardmcsong/plugin-litellm-orchestrator-backend': patch
---

Removed frontend implementation related to lazy LiteLLM user creation. All user provisioning logic now fully resides in the backend, eliminating unused frontend code and preventing duplicate or inconsistent behaviour
