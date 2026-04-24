# GET /v1/passengers/active-ride

**Tag:** Passengers  
**Summary:** Get active ride  
**Description:** Returns the passenger's active ride, if any. Used to restore UI state when the passenger returns to the app. Includes full driver information (name, rating, vehicle) if the ride has been accepted.  
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
  "createdAt": "2025-12-01T08:00:00Z",
  "passenger": {
    "id": "018f1234-5678-9abc-def0-123456789def",
    "name": "Maria Santos",
    "rating": 9.75
  },
  "driver": {
    "id": "018f1234-5678-9abc-def0-123456789ghi",
    "name": "João Silva",
    "rating": 9.5,
    "vehicle": {
      "licensePlate": "ABC-1234",
      "brand": "Toyota",
      "model": "Corolla",
      "color": "Branco"
    }
  }
}
```

| Field               | Type   | Description                                                    |
|---------------------|--------|----------------------------------------------------------------|
| `id`                | string | Ride UUID                                                      |
| `passengerId`       | string | UUID of the passenger                                          |
| `driverId`          | string | UUID of the driver (nullable if not yet assigned)              |
| `serviceCategoryId` | string | UUID of the service category                                   |
| `paymentMethodId`   | string | UUID of the payment method                                     |
| `cardBrandId`       | string | UUID of the card brand (nullable)                              |
| `status`            | string | Current ride status (e.g. `MOTORISTA_ACEITOU`, `EM_ROTA`)      |
| `estimatedPrice`    | number | Estimated fare (BRL)                                           |
| `finalPrice`        | number | Final charged fare — `null` while the ride is in progress      |
| `distanceKm`        | number | Estimated ride distance in kilometers                          |
| `durationMinutes`   | number | Estimated ride duration in minutes                             |
| `surge`             | number | Surge multiplier applied to the fare                           |
| `requestedAt`       | string | ISO 8601 timestamp when the ride was requested                 |
| `createdAt`         | string | ISO 8601 creation timestamp                                    |
| `passenger`         | object | Passenger summary (nullable)                                   |
| `driver`            | object | Driver summary with vehicle — `null` if no driver assigned yet |

#### `passenger` Object Fields

| Field    | Type   | Description                    |
|----------|--------|--------------------------------|
| `id`     | string | UUID of the passenger          |
| `name`   | string | Full name of the passenger     |
| `rating` | number | Current passenger rating       |

#### `driver` Object Fields

| Field     | Type   | Description                    |
|-----------|--------|--------------------------------|
| `id`      | string | UUID of the driver             |
| `name`    | string | Full name of the driver        |
| `rating`  | number | Current driver rating          |
| `vehicle` | object | Driver's vehicle details       |

#### `driver.vehicle` Object Fields

| Field          | Type   | Description           |
|----------------|--------|-----------------------|
| `licensePlate` | string | Vehicle license plate |
| `brand`        | string | Vehicle brand name    |
| `model`        | string | Vehicle model name    |
| `color`        | string | Vehicle color         |

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

No active ride exists for the authenticated passenger.

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

- Called by `passengersFacade.getActiveRide()` via `usePassengerActiveRide` query
- Cache with TanStack Query using `passengerRidesKeys.active()`
- Call on app resume/foreground to restore the in-progress ride UI
- A `404` response means no active ride — render the idle/home state
- `driver` is `null` until a driver accepts the ride — poll or use WebSocket to detect the transition
- On `401`, the facade layer triggers the token refresh flow automatically
