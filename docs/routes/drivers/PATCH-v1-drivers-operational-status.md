# PATCH /v1/drivers/operational-status

**Tag:** Drivers  
**Summary:** Update operational status  
**Description:** Updates the driver's operational status. Cannot be set to `AVAILABLE` if there is an active ride in progress.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "status": "AVAILABLE"
}
```

| Field    | Type   | Required | Description                                                          |
|----------|--------|----------|----------------------------------------------------------------------|
| `status` | string | Yes      | New operational status — `AVAILABLE`, `BUSY`, `PAUSED`, or `OFFLINE` |

---

## Responses

### 200 — Operational status updated successfully

**Content-Type:** `application/json`

```json
{
  "operationalStatus": "AVAILABLE",
  "isOnline": true,
  "canReceiveRides": true
}
```

| Field               | Type    | Description                                                  |
|---------------------|---------|--------------------------------------------------------------|
| `operationalStatus` | string  | Updated status — `AVAILABLE`, `BUSY`, `PAUSED`, or `OFFLINE` |
| `isOnline`          | boolean | Whether the driver is currently connected                    |
| `canReceiveRides`   | boolean | Whether the driver is eligible to receive new ride requests  |

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

### 409 — Conflict

Cannot change status to `AVAILABLE` while there is an active ride. Returns the current operational status object.

**Content-Type:** `application/json`

```json
{
  "operationalStatus": "AVAILABLE",
  "isOnline": true,
  "canReceiveRides": true
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

- Called by `driversFacade.updateOperationalStatus(status)` via `useUpdateOperationalStatus` mutation
- On `onSuccess`, invalidate `driverStatusKeys.operational()`
- On `409`, display a warning toast — the driver has an active ride and cannot go `AVAILABLE`
- On `401`, the facade layer triggers the token refresh flow automatically
