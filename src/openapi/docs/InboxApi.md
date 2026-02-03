# InboxApi

All URIs are relative to *https://platform-bff.mtsynergy.internal*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**apiV1InboxGet**](InboxApi.md#apiv1inboxget) | **GET** /api/v1/inbox | List inbox items |



## apiV1InboxGet

> ListInboxResponse apiV1InboxGet(page)

List inbox items

### Example

```ts
import {
  Configuration,
  InboxApi,
} from '@mtsynergy/core';
import type { ApiV1InboxGetRequest } from '@mtsynergy/core';

async function example() {
  console.log("🚀 Testing @mtsynergy/core SDK...");
  const api = new InboxApi();

  const body = {
    // number (optional)
    page: 56,
  } satisfies ApiV1InboxGetRequest;

  try {
    const data = await api.apiV1InboxGet(body);
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
| **page** | `number` |  | [Optional] [Defaults to `1`] |

### Return type

[**ListInboxResponse**](ListInboxResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Inbox items retrieved |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

