# DELETE /v1/admin/passengers/{passengerId}

**Tag:** Admin - Passengers  
**Summary:** Delete passenger  
**Description:** Performs a soft delete on a passenger and their associated user account. The operation is reversible — use `POST /v1/admin/passengers/{passengerId}/reactivate` to restore access.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name          | Location | Type   | Required | Description                          |
|---------------|----------|--------|----------|--------------------------------------|
| `passengerId` | path     | string | Yes      | UUID of the passenger (user_id)      |

**Example URL:**

```
DELETE /v1/admin/passengers/018f1234-5678-9abc-def0-123456789abc
```

---

## Request Body

None.

---

## Responses

### 200 — Passenger deleted successfully

**Content-Type:** `application/json`

```json
{
  "message": "Passageiro deletado com sucesso"
}
```

| Field     | Type   | Description                    |
|-----------|--------|--------------------------------|
| `message` | string | Human-readable success message |

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

No passenger exists with the provided `passengerId`.

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

- Called by `adminPassengersFacade.delete(passengerId)` via `useDeleteAdminPassenger` mutation
- This is a **soft delete** — the record is not permanently removed
- Always show a `ConfirmDialog` before calling this mutation
- On `onSuccess`, invalidate `adminPassengersKeys.all` to refresh the list
- Requires `PASSENGER_ADMIN_DELETE` permission — gate with `<Can perform={Permission.PASSENGER_ADMIN_DELETE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
