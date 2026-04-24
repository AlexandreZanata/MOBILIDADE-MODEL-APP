# GET /v1/drivers/active-ride

**Tag:** Drivers  
**Summary:** Get active ride  
**Description:** Returns the driver's active ride, if any. Used to restore UI state when the driver returns to the app.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Active ride found

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "passengerId": "018f1234-5678-9abc-def0-123456789def",
  "driverId": "018f1234-5678-9abc-def0-123456789ghi",
  "serviceCategoryId": "018f1234-5678-9abc-def0-123456789jkl",
  "paymentMethodId": "018f1234-5678-9abc-def0-123456789mno",
  "cardBrandId": "018f1234-5678-9abc-def0-123456789pqr",
  "status": "MOTORISTA_ACEITOU",
  "estimatedPrice": 23.9,
  "finalPrice": null,
  "distanceKm": 6.4,
  "durationMinutes": 18,
  "surge": 1.2,
  "requestedAt": "2025-12-01T08:00:00Z",
  "createdAt": "2025-12-01T08:00:00Z"
}
```

| Field               | Type   | Description                                                     |
|---------------------|--------|-----------------------------------------------------------------|
| `id`                | string | Ride UUID                                                       |
| `passengerId`       | string | UUID of the passenger                                           |
| `driverId`          | string | UUID of the driver                                              |
| `serviceCategoryId` | string | UUID of the service category                                    |
| `paymentMethodId`   | string | UUID of the payment method                                      |
| `cardBrandId`       | string | UUID of the card brand (nullable if not a card payment)         |
| `status`            | string | Current ride status (e.g. `MOTORISTA_ACEITOU`, `EM_ROTA`)       |
| `estimatedPrice`    | number | Estimated fare at the time of request (BRL)                     |
| `finalPrice`        | number | Final charged fare (BRL) — `null` while the ride is in progress |
| `distanceKm`        | number | Estimated ride distance in kilometers                           |
| `durationMinutes`   | number | Estimated ride duration in minutes                              |
| `surge`             | number | Surge multiplier applied to the fare                            |
| `requestedAt`       | string | ISO 8601 timestamp when the ride was requested                  |
| `createdAt`         | string | ISO 8601 creation timestamp                                     |

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

No active ride exists for the authenticated driver.

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

- Called by `driversFacade.getActiveRide()` via `useDriverActiveRide` query
- Cache with TanStack Query using `driverRidesKeys.active()`
- Call on app resume/foreground to restore the in-progress ride UI
- A `404` response means no active ride — render the idle/available state
- On `401`, the facade layer triggers the token refresh flow automatically
