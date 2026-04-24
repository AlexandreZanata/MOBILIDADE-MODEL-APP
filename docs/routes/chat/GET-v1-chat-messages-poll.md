# GET /v1/chat/messages/poll

**Tag:** Chat  
**Summary:** Long polling for new messages  
**Description:** Waits for new messages for up to 30 seconds. This is a fallback mechanism for when WebSocket is not available.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name      | Location | Type    | Required | Default | Description                                                    |
|-----------|----------|---------|----------|---------|----------------------------------------------------------------|
| `rideId`  | query    | string  | Yes      | —       | UUID of the ride                                               |
| `cursor`  | query    | string  | No       | —       | UUID of the last message received — only newer messages return |
| `timeout` | query    | integer | No       | `30`    | Wait timeout in seconds — range 1–60, maximum `60`             |

**Example URL:**

```
GET /v1/chat/messages/poll?rideId=019ae45a-01ff-b967-b2f7-4c22c46ecd75&cursor=019ae45a-01ff-b967-b2f7-4c22c46ecd75&timeout=30
```

---

## Request Body

None.

---

## Responses

> The spec does not define a `200` response body for this endpoint. The response is expected to return new messages since the provided `cursor`, using the same message shape as `POST /v1/chat/messages` — see [POST /v1/chat/messages](./POST-v1-chat-messages.md) for the full message object field reference.

> If no new messages arrive within the `timeout` window, the server returns an empty result.

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

- Called by `chatFacade.pollMessages(params)` — use only as a WebSocket fallback
- Prefer WebSocket for real-time message delivery; use this endpoint only when WebSocket is unavailable
- Pass the `id` of the last received message as `cursor` to receive only newer messages
- After receiving a response, immediately start a new poll request to maintain continuous listening
- On `401`, the facade layer triggers the token refresh flow automatically
