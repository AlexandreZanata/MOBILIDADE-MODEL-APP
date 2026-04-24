# GET /v1/chat/messages

**Tag:** Chat  
**Summary:** List messages  
**Description:** Lists messages for a ride with cursor pagination.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name     | Location | Type    | Required | Default | Description                                                    |
|----------|----------|---------|----------|---------|----------------------------------------------------------------|
| `rideId` | query    | string  | Yes      | —       | UUID of the ride                                               |
| `cursor` | query    | string  | No       | —       | Pagination cursor — UUID of the last message received          |
| `limit`  | query    | integer | No       | `50`    | Messages per page — range 1–100, maximum `100`                 |

**Example URL:**

```
GET /v1/chat/messages?rideId=019ae45a-01ff-b967-b2f7-4c22c46ecd75&limit=50
```

---

## Request Body

None.

---

## Responses

> The spec does not define a `200` response body for this endpoint. The response is expected to follow the same message shape as `POST /v1/chat/messages` — see [POST /v1/chat/messages](./POST-v1-chat-messages.md) for the full message object field reference.

---

### 400 — Bad Request

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 401 — Unauthorized

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 403 — Forbidden

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 404 — Not Found

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 422 — Validation Error

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 500 — Internal Server Error

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

## Error Envelope Reference

| Field           | Type   | Description                                     |
|-----------------|--------|-------------------------------------------------|
| `error.message` | string | Human-readable error description                |
| `error.code`    | string | Machine-readable error code                     |
| `error.fields`  | object | Map of field names to validation error messages |

---

## Frontend Integration Notes

- Called by `chatFacade.listMessages(params)` via `useChatMessages(rideId)` query
- Cache with TanStack Query using `chatKeys.messages(rideId, cursor)`
- Pass the `id` of the oldest loaded message as `cursor` to load earlier messages
- On `401`, the facade layer triggers the token refresh flow automatically
