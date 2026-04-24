# POST /v1/admin/passengers/{passengerId}/reactivate

**Tag:** Admin - Passengers  
**Summary:** Reactivate passenger  
**Description:** Reactivates a passenger who was soft-deleted, restoring their access to the system.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name          | Location | Type   | Required | Description                          |
|---------------|----------|--------|----------|--------------------------------------|
| `passengerId` | path     | string | Yes      | UUID of the passenger (user_id)      |

**Example URL:**

```
POST /v1/admin/passengers/018f1234-5678-9abc-def0-123456789abc/reactivate
```

---

## Request Body

None.

---

## Responses

### 200 — Passenger reactivated successfully

**Content-Type:** `application/json`

```json
{
  "message": "Passageiro reativado com sucesso"
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

- Called by `adminPassengersFacade.reactivate(passengerId)` via `useReactivateAdminPassenger` mutation
- On `onSuccess`, invalidate `adminPassengersKeys.all` to refresh the list
- Requires `PASSENGER_ADMIN_REACTIVATE` permission — gate with `<Can perform={Permission.PASSENGER_ADMIN_REACTIVATE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
