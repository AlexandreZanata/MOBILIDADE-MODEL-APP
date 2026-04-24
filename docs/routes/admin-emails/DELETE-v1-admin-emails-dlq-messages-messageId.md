# DELETE /v1/admin/emails/dlq/messages/{messageId}

**Tag:** Admin - Emails  
**Summary:** Remove DLQ message  
**Description:** Permanently removes a message from the DLQ. This action cannot be undone.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name        | Location | Type   | Required | Description           |
|-------------|----------|--------|----------|-----------------------|
| `messageId` | path     | string | Yes      | ID of the DLQ message |

**Example URL:**

```
DELETE /v1/admin/emails/dlq/messages/msg-123
```

---

## Request Body

None.

---

## Responses

### 200 — OK

Returns a free-form map of additional properties.

**Content-Type:** `application/json`

```json
{
  "additionalProp1": "string",
  "additionalProp2": "string",
  "additionalProp3": "string"
}
```

> The response body is a free-form map. Treat this as an acknowledgement payload — do not rely on specific field names.

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

No DLQ message exists with the provided `messageId`.

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

- Called by `adminEmailsFacade.deleteDlqMessage(messageId)` via `useDeleteDlqMessage` mutation
- This is a permanent deletion — always show a `ConfirmDialog` before calling this mutation
- On `onSuccess`, invalidate `adminEmailsKeys.dlqMessages()` and `adminEmailsKeys.dlqStats()`
- Requires `EMAIL_ADMIN_DELETE` permission — gate with `<Can perform={Permission.EMAIL_ADMIN_DELETE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
