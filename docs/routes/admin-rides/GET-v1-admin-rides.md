# GET /v1/admin/rides

**Tag:** Admin - Rides  
**Summary:** List all rides  
**Description:** Lists all rides registered in the system with cursor pagination, filters, text search, and sorting.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name     | Location | Type    | Required | Description                                                              |
|----------|----------|---------|----------|--------------------------------------------------------------------------|
| `cursor` | query    | string  | No       | Pagination cursor (UUID of the last item from the previous page)         |
| `limit`  | query    | integer | No       | Items per page — range 1–100, default `20`                               |
| `sort`   | query    | string  | No       | Sort expression (e.g. `-requestedAt,status`). Prefix `-` for descending  |
| `q`      | query    | string  | No       | Full-text search on ride ID, passenger/driver name, and status           |

---

## Request Body

None.

---

## Responses

### 200 — Ride list

**Content-Type:** `application/json`

```json
{
  "items": [
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
  ],
  "nextCursor": "018f1234-5678-9abc-def0-123456789abc",
  "prevCursor": null,
  "hasMore": true,
  "totalCount": null
}
```

| Field        | Type    | Description                                                     |
|--------------|---------|-----------------------------------------------------------------|
| `items`      | array   | Array of ride objects for the current page                      |
| `nextCursor` | string  | Cursor for the next page (nullable)                             |
| `prevCursor` | string  | Cursor for the previous page (nullable)                         |
| `hasMore`    | boolean | Whether more pages exist after the current one                  |
| `totalCount` | number  | Total record count — `null` when not computed by the server     |

#### Item Object Fields

| Field               | Type   | Description                                                          |
|---------------------|--------|----------------------------------------------------------------------|
| `id`                | string | Ride UUID                                                            |
| `passengerId`       | string | UUID of the passenger                                                |
| `driverId`          | string | UUID of the assigned driver (nullable if not yet assigned)           |
| `serviceCategoryId` | string | UUID of the service category                                         |
| `paymentMethodId`   | string | UUID of the payment method                                           |
| `cardBrandId`       | string | UUID of the card brand (nullable)                                    |
| `status`            | string | Current ride status                                                  |
| `estimatedPrice`    | number | Estimated fare at the time of request (BRL)                          |
| `finalPrice`        | number | Final charged fare — `null` while the ride is in progress            |
| `distanceKm`        | number | Estimated ride distance in kilometers                                |
| `durationMinutes`   | number | Estimated ride duration in minutes                                   |
| `surge`             | number | Surge multiplier applied to the fare                                 |
| `requestedAt`       | string | ISO 8601 timestamp when the ride was requested                       |
| `createdAt`         | string | ISO 8601 creation timestamp                                          |
| `passenger`         | object | Passenger summary (nullable)                                         |
| `driver`            | object | Driver summary with vehicle (nullable if not yet assigned)           |

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

- Called by `adminRidesFacade.list(params)` via `useAdminRides` query
- Cache with TanStack Query using `adminRidesKeys.list(params)`
- Pass `nextCursor` as the `cursor` param for the next page fetch
- `totalCount` may be `null` — do not rely on it for pagination UI
- Requires `RIDE_ADMIN_VIEW` permission — gate with `<Can perform={Permission.RIDE_ADMIN_VIEW}>`
- On `401`, the facade layer triggers the token refresh flow automatically
