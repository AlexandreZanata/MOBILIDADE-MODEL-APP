# POST /v1/chat/messages

**Tag:** Chat  
**Summary:** Send message  
**Description:** Sends a chat message to the other participant of the ride.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "rideId": "019ae45a-01ff-b967-b2f7-4c22c46ecd75",
  "content": "Olá! Estou a caminho."
}
```

| Field     | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| `rideId`  | string | Yes      | UUID of the ride this message belongs to       |
| `content` | string | Yes      | Text content of the message                    |

---

## Responses

### 201 — Created

**Content-Type:** `application/json`

```json
{
  "id": "019ae45a-01ff-b967-b2f7-4c22c46ecd75",
  "rideId": "019ae45a-01ff-b967-b2f7-4c22c46ecd75",
  "senderId": "019ae45a-01ff-b967-b2f7-4c22c46ecd75",
  "senderPhotoUrl": "uploads/profile-photos/018f1234-5678-9abc-def0-123456789abc/profile018f1234-5678-9abc-def0-123456789def.jpg",
  "recipientId": "019ae45a-01ff-b967-b2f7-4c22c46ecd75",
  "content": "Olá! Estou a caminho.",
  "deliveryStatus": "DELIVERED",
  "readAt": "2025-12-04T10:30:00Z",
  "deliveredAt": "2025-12-04T10:25:00Z",
  "createdAt": "2025-12-04T10:20:00Z"
}
```

| Field            | Type   | Description                                                          |
|------------------|--------|----------------------------------------------------------------------|
| `id`             | string | UUID of the created message                                          |
| `rideId`         | string | UUID of the associated ride                                          |
| `senderId`       | string | UUID of the user who sent the message                                |
| `senderPhotoUrl` | string | Relative path to the sender's profile photo (nullable)               |
| `recipientId`    | string | UUID of the message recipient                                        |
| `content`        | string | Text content of the message                                          |
| `deliveryStatus` | string | Delivery status — `SENT`, `DELIVERED`, `READ`                        |
| `readAt`         | string | ISO 8601 timestamp when the message was read (nullable)              |
| `deliveredAt`    | string | ISO 8601 timestamp when the message was delivered (nullable)         |
| `createdAt`      | string | ISO 8601 creation timestamp                                          |

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

- Called by `chatFacade.sendMessage(input)` via `useSendChatMessage` mutation
- On `onSuccess`, append the returned message to the local message list
- On `401`, the facade layer triggers the token refresh flow automatically
