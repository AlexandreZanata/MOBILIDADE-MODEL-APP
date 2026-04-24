# POST /api/v1/admin/billing/drivers/{driverId}/unblock

**Tag:** Billing Admin  
**Summary:** Manually unblock a driver  
**Description:** Removes the billing block from a driver manually. Use with caution — this allows drivers with outstanding debt to resume working.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name       | Location | Type   | Required | Description        |
|------------|----------|--------|----------|--------------------|
| `driverId` | path     | string | Yes      | UUID of the driver |

**Example URL:**

```
POST /api/v1/admin/billing/drivers/3fa85f64-5717-4562-b3fc-2c963f66afa6/unblock
```

---

## Request Body

None.

---

## Responses

### 200 — Driver unblocked successfully

No response body.

---

### 400 — Bad Request

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "string",
    "code": "string",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

| Field           | Type   | Description                                     |
|-----------------|--------|-------------------------------------------------|
| `error.message` | string | Human-readable error description                |
| `error.code`    | string | Machine-readable error code                     |
| `error.fields`  | object | Map of field names to validation error messages |

---

### 401 — Unauthorized

Missing or invalid Bearer token.

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "string",
    "code": "string",
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
    "message": "string",
    "code": "string",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 404 — Driver not found or not blocked

No driver exists with the provided `driverId`, or the driver is not currently blocked.

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "string",
    "code": "string",
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
    "message": "string",
    "code": "string",
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
    "message": "string",
    "code": "string",
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

- Called by `billingFacade.unblockDriver(driverId)` via `useUnblockDriver` mutation
- On `onSuccess`, invalidate `billingKeys.driverStatus(driverId)` to refresh the driver status
- Requires `BILLING_DRIVER_UNBLOCK` permission — gate with `<Can perform={Permission.BILLING_DRIVER_UNBLOCK}>`
- Always show a `ConfirmDialog` before calling this mutation — the action has financial consequences
- On `401`, the facade layer triggers the token refresh flow automatically
- On `403`, render an `<AccessDenied />` fallback via `<Can>`
