# GET /v1/drivers/operational-status

**Tag:** Drivers  
**Summary:** Get operational and connection status  
**Description:** Returns the driver's operational status, whether they are online, and whether they can receive rides.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Operational and connection status

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
| `operationalStatus` | string  | Current status — `AVAILABLE`, `BUSY`, `PAUSED`, or `OFFLINE` |
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

- Called by `driversFacade.getOperationalStatus()` via `useDriverOperationalStatus` query
- Cache with TanStack Query using `driverStatusKeys.operational()`
- Invalidate after `PATCH /v1/drivers/operational-status`
- On `401`, the facade layer triggers the token refresh flow automatically
