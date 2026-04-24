# PATCH /v1/admin/rides/{rideId}/status

**Tag:** Admin - Rides  
**Summary:** Update ride status (administrative)  
**Description:** Updates the status of a ride as an administrator. Allows any status transition and automatically updates the driver's operational status if necessary.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name     | Location | Type   | Required | Description      |
|----------|----------|--------|----------|------------------|
| `rideId` | path     | string | Yes      | UUID of the ride |

**Example URL:**

```
PATCH /v1/admin/rides/018f1234-5678-9abc-def0-123456789abc/status
```

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "status": "CANCELADA_PASSAGEIRO"
}
```

| Field    | Type   | Required | Description                                                    |
|----------|--------|----------|----------------------------------------------------------------|
| `status` | string | Yes      | Target ride status — any valid status value is accepted        |

---

## Responses

### 200 — Status updated successfully

Returns the full updated ride object with nested passenger and driver details.

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "passengerId": "018f1234-5678-9abc-def0-123456789def",
  "driverId": "018f1234-5678-9abc-def0-123456789ghi",
  "status": "CANCELADA_PASSAGEIRO",
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

| Field             | Type   | Description                                                    |
|-------------------|--------|----------------------------------------------------------------|
| `id`              | string | Ride UUID                                                      |
| `passengerId`     | string | UUID of the passenger                                          |
| `driverId`        | string | UUID of the assigned driver (nullable)                         |
| `status`          | string | Updated ride status                                            |
| `estimatedPrice`  | number | Estimated fare at the time of request (BRL)                    |
| `finalPrice`      | number | Final charged fare — `null` while the ride is in progress      |
| `distanceKm`      | number | Estimated ride distance in kilometers                          |
| `durationMinutes` | number | Estimated ride duration in minutes                             |
| `surge`           | number | Surge multiplier applied to the fare                           |
| `requestedAt`     | string | ISO 8601 timestamp when the ride was requested                 |
| `createdAt`       | string | ISO 8601 creation timestamp                                    |
| `passenger`       | object | Passenger summary (nullable)                                   |
| `driver`          | object | Driver summary with vehicle (nullable)                         |

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

- Called by `adminRidesFacade.updateStatus(rideId, input)` via `useAdminUpdateRideStatus` mutation
- On `onSuccess`, invalidate `adminRidesKeys.all` to refresh the list
- Requires `RIDE_ADMIN_UPDATE` permission — gate with `<Can perform={Permission.RIDE_ADMIN_UPDATE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
