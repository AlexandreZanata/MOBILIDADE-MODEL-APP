# POST /v1/passengers/rides

**Tag:** Passengers  
**Summary:** Request a ride  
**Description:** Creates a new ride based on a price estimate. The estimate must be valid (not expired), and the service category and payment method must be enabled.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "estimateId": "018f1234-5678-9abc-def0-123456789abc",
  "serviceCategoryId": "018f1234-5678-9abc-def0-123456789def",
  "paymentMethodId": "018f1234-5678-9abc-def0-123456789ghi",
  "cardBrandId": "018f1234-5678-9abc-def0-123456789jkl"
}
```

| Field               | Type   | Required | Description                                                          |
|---------------------|--------|----------|----------------------------------------------------------------------|
| `estimateId`        | string | Yes      | UUID of the fare estimate (from `POST /v1/passengers/fare-estimate`) |
| `serviceCategoryId` | string | Yes      | UUID of the desired service category                                 |
| `paymentMethodId`   | string | Yes      | UUID of the selected payment method                                  |
| `cardBrandId`       | string | No       | UUID of the card brand — required for card payments                  |

---

## Responses

### 201 — Ride requested successfully

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "passengerId": "018f1234-5678-9abc-def0-123456789def",
  "driverId": null,
  "serviceCategoryId": "018f1234-5678-9abc-def0-123456789ghi",
  "paymentMethodId": "018f1234-5678-9abc-def0-123456789jkl",
  "cardBrandId": null,
  "status": "PENDING",
  "estimatedPrice": 23.9,
  "finalPrice": null,
  "distanceKm": 6.4,
  "durationMinutes": 18,
  "surge": 1.2,
  "requestedAt": "2025-12-01T08:00:00Z",
  "createdAt": "2025-12-01T08:00:00Z"
}
```

| Field               | Type   | Description                                                          |
|---------------------|--------|----------------------------------------------------------------------|
| `id`                | string | UUID of the newly created ride                                       |
| `passengerId`       | string | UUID of the passenger                                                |
| `driverId`          | string | UUID of the assigned driver — `null` until a driver accepts          |
| `serviceCategoryId` | string | UUID of the service category                                         |
| `paymentMethodId`   | string | UUID of the payment method                                           |
| `cardBrandId`       | string | UUID of the card brand (nullable)                                    |
| `status`            | string | Always `PENDING` on creation                                         |
| `estimatedPrice`    | number | Estimated fare (BRL)                                                 |
| `finalPrice`        | number | Final charged fare — `null` while the ride is in progress            |
| `distanceKm`        | number | Estimated ride distance in kilometers                                |
| `durationMinutes`   | number | Estimated ride duration in minutes                                   |
| `surge`             | number | Surge multiplier applied to the fare                                 |
| `requestedAt`       | string | ISO 8601 timestamp when the ride was requested                       |
| `createdAt`         | string | ISO 8601 creation timestamp                                          |

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

- Called by `passengersFacade.requestRide(input)` via `useRequestRide` mutation
- Obtain `estimateId` from `POST /v1/passengers/fare-estimate` before calling this endpoint
- On `onSuccess`, invalidate `passengerRidesKeys.active()` and redirect to the ride tracking screen
- On `401`, the facade layer triggers the token refresh flow automatically
