
# CreateDraftRequest


## Properties

Name | Type
------------ | -------------
`caption` | string
`platforms` | [Array&lt;Platform&gt;](Platform.md)
`scheduledAt` | Date
`mediaIds` | Array&lt;string&gt;

## Example

```typescript
import type { CreateDraftRequest } from '@mtsynergy/core'

// TODO: Update the object below with actual values
const example = {
  "caption": null,
  "platforms": null,
  "scheduledAt": null,
  "mediaIds": null,
} satisfies CreateDraftRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateDraftRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


