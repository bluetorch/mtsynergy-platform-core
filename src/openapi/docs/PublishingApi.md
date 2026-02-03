# PublishingApi

All URIs are relative to *https://platform-bff.mtsynergy.internal*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**apiV1DraftsPost**](PublishingApi.md#apiv1draftspost) | **POST** /api/v1/drafts | Create a new draft |



## apiV1DraftsPost

> CreateDraftResponse apiV1DraftsPost(createDraftRequest)

Create a new draft

### Example

```ts
import {
  Configuration,
  PublishingApi,
} from '@mtsynergy/core';
import type { ApiV1DraftsPostRequest } from '@mtsynergy/core';

async function example() {
  console.log("🚀 Testing @mtsynergy/core SDK...");
  const api = new PublishingApi();

  const body = {
    // CreateDraftRequest
    createDraftRequest: ...,
  } satisfies ApiV1DraftsPostRequest;

  try {
    const data = await api.apiV1DraftsPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **createDraftRequest** | [CreateDraftRequest](CreateDraftRequest.md) |  | |

### Return type

[**CreateDraftResponse**](CreateDraftResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Draft created successfully |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

