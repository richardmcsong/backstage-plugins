# .DefaultApi

All URIs are relative to _http://localhost_

| Method                                                 | HTTP request                            | Description |
| ------------------------------------------------------ | --------------------------------------- | ----------- |
| [**createUser**](DefaultApi.md#createUser)             | **POST** /users                         |
| [**createUserKey**](DefaultApi.md#createUserKey)       | **POST** /users/{userId}/keys           |
| [**deleteUserKey**](DefaultApi.md#deleteUserKey)       | **DELETE** /users/{userId}/keys/{keyId} |
| [**getOpenApiSchema**](DefaultApi.md#getOpenApiSchema) | **GET** /openapi.yaml                   |
| [**getUser**](DefaultApi.md#getUser)                   | **GET** /users/{userId}                 |
| [**getUserKeys**](DefaultApi.md#getUserKeys)           | **GET** /users/{userId}/keys            |

# **createUser**

> User createUser()

### Example

```typescript
import { createConfiguration, DefaultApi } from '';
import type { DefaultApiCreateUserRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DefaultApi(configuration);

const request: DefaultApiCreateUserRequest = {
  createUserRequest: {
    userId: 'userId_example',
  },
};

const data = await apiInstance.createUser(request);
console.log('API called successfully. Returned data:', data);
```

### Parameters

| Name                  | Type                  | Description | Notes |
| --------------------- | --------------------- | ----------- | ----- |
| **createUserRequest** | **CreateUserRequest** |             |

### Return type

**User**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description  | Response headers |
| ----------- | ------------ | ---------------- |
| **201**     | User created | -                |
| **401**     | Unauthorized | -                |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **createUserKey**

> UserKey createUserKey()

### Example

```typescript
import { createConfiguration, DefaultApi } from '';
import type { DefaultApiCreateUserKeyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DefaultApi(configuration);

const request: DefaultApiCreateUserKeyRequest = {
  userId: 'userId_example',

  body: {},
};

const data = await apiInstance.createUserKey(request);
console.log('API called successfully. Returned data:', data);
```

### Parameters

| Name       | Type         | Description | Notes                 |
| ---------- | ------------ | ----------- | --------------------- |
| **body**   | **any**      |             |
| **userId** | [**string**] |             | defaults to undefined |

### Return type

**UserKey**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **201**     | User key created | -                |
| **401**     | Unauthorized     | -                |
| **403**     | Forbidden        | -                |
| **404**     | User not found   | -                |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteUserKey**

> void deleteUserKey()

### Example

```typescript
import { createConfiguration, DefaultApi } from '';
import type { DefaultApiDeleteUserKeyRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DefaultApi(configuration);

const request: DefaultApiDeleteUserKeyRequest = {
  userId: 'userId_example',

  keyId: 'keyId_example',
};

const data = await apiInstance.deleteUserKey(request);
console.log('API called successfully. Returned data:', data);
```

### Parameters

| Name       | Type         | Description | Notes                 |
| ---------- | ------------ | ----------- | --------------------- |
| **userId** | [**string**] |             | defaults to undefined |
| **keyId**  | [**string**] |             | defaults to undefined |

### Return type

**void**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description        | Response headers |
| ----------- | ------------------ | ---------------- |
| **204**     | User key deleted   | -                |
| **401**     | Unauthorized       | -                |
| **403**     | Forbidden          | -                |
| **404**     | User key not found | -                |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getOpenApiSchema**

> HttpFile getOpenApiSchema()

### Example

```typescript
import { createConfiguration, DefaultApi } from '';

const configuration = createConfiguration();
const apiInstance = new DefaultApi(configuration);

const request = {};

const data = await apiInstance.getOpenApiSchema(request);
console.log('API called successfully. Returned data:', data);
```

### Parameters

This endpoint does not need any parameter.

### Return type

**HttpFile**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description    | Response headers |
| ----------- | -------------- | ---------------- |
| **200**     | OpenAPI schema | -                |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getUser**

> User getUser()

### Example

```typescript
import { createConfiguration, DefaultApi } from '';
import type { DefaultApiGetUserRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DefaultApi(configuration);

const request: DefaultApiGetUserRequest = {
  userId: 'userId_example',
};

const data = await apiInstance.getUser(request);
console.log('API called successfully. Returned data:', data);
```

### Parameters

| Name       | Type         | Description | Notes                 |
| ---------- | ------------ | ----------- | --------------------- |
| **userId** | [**string**] |             | defaults to undefined |

### Return type

**User**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description    | Response headers |
| ----------- | -------------- | ---------------- |
| **200**     | User found     | -                |
| **404**     | User not found | -                |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getUserKeys**

> UserKeyList getUserKeys()

### Example

```typescript
import { createConfiguration, DefaultApi } from '';
import type { DefaultApiGetUserKeysRequest } from '';

const configuration = createConfiguration();
const apiInstance = new DefaultApi(configuration);

const request: DefaultApiGetUserKeysRequest = {
  userId: 'userId_example',
};

const data = await apiInstance.getUserKeys(request);
console.log('API called successfully. Returned data:', data);
```

### Parameters

| Name       | Type         | Description | Notes                 |
| ---------- | ------------ | ----------- | --------------------- |
| **userId** | [**string**] |             | defaults to undefined |

### Return type

**UserKeyList**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description         | Response headers |
| ----------- | ------------------- | ---------------- |
| **200**     | User keys found     | -                |
| **404**     | User keys not found | -                |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)
