# GET /api/v1/admin/billing/config

**Tag:** Billing Admin  
**Summary:** Get billing configuration  
**Description:** Returns the global billing system configuration.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Configuration returned successfully

**Content-Type:** `application/json`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "cycleUnit": "MINUTES",
  "cycleInterval": 7,
  "executionTime": "06:00",
  "executionTimezone": "America/Sao_Paulo",
  "pricePerRide": 2,
  "minimumCharge": 0,
  "pixExpirationDays": 3,
  "gracePeriodHours": 24,
  "autoBlockEnabled": true,
  "blockAfterCycles": 1,
  "isActive": true,
  "createdAt": "2026-04-24T16:12:41.286Z",
  "updatedAt": "2026-04-24T16:12:41.286Z",
  "intervalDescription": "string"
}
```

| Field                 | Type    | Description                                                 |
|-----------------------|---------|-------------------------------------------------------------|
| `id`                  | string  | Configuration UUID                                          |
| `driverId`            | string  | Associated driver UUID (if driver-specific config)          |
| `cycleUnit`           | string  | Billing cycle unit — `MINUTES`, `HOURS`, or `DAYS`          |
| `cycleInterval`       | number  | Number of cycle units between billing runs                  |
| `executionTime`       | string  | Scheduled execution time in `HH:mm` format                  |
| `executionTimezone`   | string  | IANA timezone for execution time (e.g. `America/Sao_Paulo`) |
| `pricePerRide`        | number  | Amount charged per completed ride (BRL)                     |
| `minimumCharge`       | number  | Minimum charge per billing cycle (BRL)                      |
| `pixExpirationDays`   | number  | Days before a generated PIX QR code expires                 |
| `gracePeriodHours`    | number  | Hours after due date before auto-block is triggered         |
| `autoBlockEnabled`    | boolean | Whether automatic driver blocking is enabled                |
| `blockAfterCycles`    | number  | Number of unpaid cycles before a driver is blocked          |
| `isActive`            | boolean | Whether the billing configuration is active                 |
| `createdAt`           | string  | ISO 8601 creation timestamp                                 |
| `updatedAt`           | string  | ISO 8601 last update timestamp                              |
| `intervalDescription` | string  | Human-readable description of the billing interval          |

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

| Field           | Type   | Description                                      |
|-----------------|--------|--------------------------------------------------|
| `error.message` | string | Human-readable error description                 |
| `error.code`    | string | Machine-readable error code                      |
| `error.fields`  | object | Map of field names to validation error messages  |

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

### 404 — Not Found

No billing configuration exists.

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

- Called by `billingFacade.getConfig()` — never call directly from a component
- Cache with TanStack Query using `billingKeys.config()`
- Requires `BILLING_CONFIG_VIEW` permission — gate with `<Can perform={Permission.BILLING_CONFIG_VIEW}>`
- On `401`, the facade layer triggers the token refresh flow automatically
- On `403`, render an `<AccessDenied />` fallback via `<Can>`
