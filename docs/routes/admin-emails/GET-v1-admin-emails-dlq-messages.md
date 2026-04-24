# GET /v1/admin/emails/dlq/messages

**Tag:** Admin - Emails  
**Summary:** List DLQ messages  
**Description:** Lists messages that failed after all retry attempts. Supports cursor pagination: `cursor` (messageId), `limit` (1–100, default 20).  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name     | Location | Type    | Required | Description                                                    |
|----------|----------|---------|----------|----------------------------------------------------------------|
| `cursor` | query    | string  | No       | Pagination cursor — the `messageId` of the last item seen      |
| `limit`  | query    | integer | No       | Items per page — range 1–100, default `20`                     |

**Example URL:**

```
GET /v1/admin/emails/dlq/messages?limit=20&cursor=msg-123
```

---

## Request Body

None.

---

## Responses

### 200 — Paginated DLQ message list

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "messageId": "msg-123",
      "emailMessage": {
        "to": "user@example.com",
        "subject": "Código de Verificação",
        "template": "email/verification-code",
        "variables": {
          "code": "123456"
        }
      },
      "errorMessage": "Connection timeout",
      "retryCount": 3,
      "originalTimestamp": "2025-12-01T10:00:00.000Z",
      "dlqTimestamp": "2025-12-01T10:05:00.000Z",
      "headers": {}
    }
  ],
  "nextCursor": "msg-123",
  "prevCursor": null,
  "hasMore": true,
  "totalCount": null
}
```

| Field        | Type    | Description                                                      |
|--------------|---------|------------------------------------------------------------------|
| `items`      | array   | Array of DLQ message objects for the current page                |
| `nextCursor` | string  | `messageId` to pass as `cursor` for the next page (nullable)     |
| `prevCursor` | string  | `messageId` to pass as `cursor` for the previous page (nullable) |
| `hasMore`    | boolean | Whether more pages exist after the current one                   |
| `totalCount` | number  | Total record count — `null` when not computed by the server      |

#### Item Object Fields

| Field               | Type   | Description                                                 |
|---------------------|--------|-------------------------------------------------------------|
| `messageId`         | string | Unique identifier of the DLQ message                        |
| `emailMessage`      | object | Original email payload that failed to deliver               |
| `errorMessage`      | string | Error description from the last failed delivery attempt     |
| `retryCount`        | number | Number of delivery attempts made before landing in the DLQ  |
| `originalTimestamp` | string | ISO 8601 timestamp when the message was originally enqueued |
| `dlqTimestamp`      | string | ISO 8601 timestamp when the message was moved to the DLQ    |
| `headers`           | object | Message headers (free-form map, may be empty)               |

#### `emailMessage` Object Fields

| Field       | Type   | Description                                          |
|-------------|--------|------------------------------------------------------|
| `to`        | string | Recipient email address                              |
| `subject`   | string | Email subject line                                   |
| `template`  | string | Template identifier used to render the email         |
| `variables` | object | Template variable substitutions (free-form map)      |

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

- Called by `adminEmailsFacade.listDlqMessages(params)` via `useAdminDlqMessages` query
- Cache with TanStack Query using `adminEmailsKeys.dlqMessages(params)`
- Pass `nextCursor` as the `cursor` param for the next page fetch
- `totalCount` may be `null` — do not rely on it for pagination UI
- Requires `EMAIL_ADMIN_VIEW` permission — gate with `<Can perform={Permission.EMAIL_ADMIN_VIEW}>`
- On `401`, the facade layer triggers the token refresh flow automatically
