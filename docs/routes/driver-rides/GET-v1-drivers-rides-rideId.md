# GET /v1/drivers/rides/{rideId}

**Tag:** Driver - Rides  
**Summary:** Get ride details  
**Description:** Returns the details of a specific ride. The driver can only access rides where they are the assigned driver.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name     | Location | Type   | Required | Description      |
|----------|----------|--------|----------|------------------|
| `rideId` | path     | string | Yes      | UUID of the ride |

**Example URL:**

```
GET /v1/drivers/rides/018f1234-5678-9abc-def0-123456789abc
```

---

## Request Body

None.

---

## Responses

### 200 — Ride details

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "passengerId": "018f1234-5678-9abc-def0-123456789def",
  "driverId": "018f1234-5678-9abc-def0-123456789ghi",
  "status": "MOTORISTA_ACEITOU",
  "estimatedPrice": 23.9,
  "finalPrice": null,
  "distanceKm": 6.4,
  "durationMinutes": 18
}
```

| Field             | Type   | Description                                               |
|-------------------|--------|-----------------------------------------------------------|
| `id`              | string | Ride UUID                                                 |
| `passengerId`     | string | UUID of the passenger                                     |
| `driverId`        | string | UUID of the assigned driver                               |
| `status`          | string | Current ride status (e.g. `MOTORISTA_ACEITOU`, `EM_ROTA`) |
| `estimatedPrice`  | number | Estimated fare at the time of request (BRL)               |
| `finalPrice`      | number | Final charged fare — `null` while the ride is in progress |
| `distanceKm`      | number | Estimated ride distance in kilometers                     |
| `durationMinutes` | number | Estimated ride duration in minutes                        |

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

The ride exists, but the authenticated driver is not the assigned driver.

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

- Called by `driverRidesFacade.getRide(rideId)` via `useDriverRide(rideId)` query
- Cache with TanStack Query using `driverRidesKeys.detail(rideId)`
- On `403`, the driver is attempting to access a ride that does not belong to them
- On `401`, the facade layer triggers the token refresh flow automatically
