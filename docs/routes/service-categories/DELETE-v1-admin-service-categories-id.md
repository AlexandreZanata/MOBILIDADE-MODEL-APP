# DELETE /v1/admin/service-categories/{id}

**Tag:** Admin - Service Categories  
**Summary:** Delete category  
**Description:** Performs a soft delete on a service category. The record is not permanently removed from the database.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name | Location | Type   | Required | Description                  |
|------|----------|--------|----------|------------------------------|
| `id` | path     | string | Yes      | UUID of the service category |

**Example URL:**

```
DELETE /v1/admin/service-categories/018f1234-5678-9abc-def0-123456789abc
```

---

## Request Body

None.

---

## Responses

### 200 — OK

Soft delete successful. Returns a generic map of additional properties.

**Content-Type:** `application/json`

```json
{
  "additionalProp1": "string",
  "additionalProp2": "string",
  "additionalProp3": "string"
}
```

> The response body is a free-form map. The exact keys and values are determined by the server. Treat this as an acknowledgement payload — do not rely on specific field names.

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

Missing or invalid Bearer token.

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

Authenticated user does not have the required role or permission.

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

No service category exists with the provided `id`.

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

All error responses share the same envelope shape:

| Field           | Type   | Description                                     |
|-----------------|--------|-------------------------------------------------|
| `error.message` | string | Human-readable error description                |
| `error.code`    | string | Machine-readable error code                     |
| `error.fields`  | object | Map of field names to validation error messages |

---

## Frontend Integration Notes

- Called by `serviceCategoriesFacade.delete(id)` via `useDeleteServiceCategory` mutation
- This is a **soft delete** — the record remains in the database but is marked as deleted
- On `onSuccess`, invalidate `serviceCategoriesKeys.all` to refresh all list queries
- Always show a `ConfirmDialog` before calling this mutation
- Requires `SERVICE_CATEGORY_DELETE` permission — gate with `<Can perform={Permission.SERVICE_CATEGORY_DELETE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
- On `403`, render an `<AccessDenied />` fallback via `<Can>`
