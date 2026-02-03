
# InboxItem


## Properties

Name | Type
------------ | -------------
`id` | string
`workspaceId` | string
`platform` | [Platform](Platform.md)
`platformItemId` | string
`author` | string
`content` | string
`contentType` | string
`status` | string
`createdAt` | Date

## Example

```typescript
import type { InboxItem } from '@mtsynergy/core'

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "workspaceId": null,
  "platform": null,
  "platformItemId": null,
  "author": null,
  "content": null,
  "contentType": null,
  "status": null,
  "createdAt": null,
} satisfies InboxItem

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as InboxItem
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


