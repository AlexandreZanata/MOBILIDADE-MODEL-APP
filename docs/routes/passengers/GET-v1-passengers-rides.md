# GET /v1/passengers/rides

**Tag:** Passengers  
**Summary:** List passenger ride history  
**Description:** Returns the authenticated passenger's ride history with cursor pagination, filters, text search, and sorting.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name     | Location | Type    | Required | Description                                                              |
|----------|----------|---------|----------|--------------------------------------------------------------------------|
| `cursor` | query    | string  | No       | Pagination cursor (UUID of the last item from the previous page)         |
| `limit`  | query    | integer | No       | Items per page — range 1–100, default `20`                               |
| `sort`   | query    | string  | No       | Sort expression (e.g. `-requestedAt`). Prefix `-` for descending order   |
| `q`      | query    | string  | No       | Full-text search query                                                   |

**Supported filter parameters:**

| Parameter | Operators  | Example                          |
|-----------|------------|----------------------------------|
| `status`  | `eq`, `in` | `status[eq]=CORRIDA_FINALIZADA`  |

---

## Request Body

None.

---

## Responses

### 200 — Passenger ride history

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "018f1234-5678-9abc-def0-123456789abc",
      "passengerId": "018f1234-5678-9abc-def0-123456789def",
      "driverId": "018f1234-5678-9abc-def0-123456789ghi",
      "status": "CORRIDA_FINALIZADA",
      "estimatedPrice": 25.5,
      "finalPrice": 25.5,
      "distanceKm": 5.2,
      "requestedAt": "2025-12-05T10:00:00Z",
      "createdAt": "2025-12-05T10:00:00Z"
    }
  ],
  "nextCursor": null,
  "prevCursor": null,
  "hasMore": false
}
```

| Field        | Type    | Description                                     |
|--------------|---------|-------------------------------------------------|
| `items`      | array   | Array of ride objects for the current page      |
| `nextCursor` | string  | Cursor for the next page (nullable)             |
| `prevCursor` | string  | Cursor for the previous page (nullable)         |
| `hasMore`    | boolean | Whether more pages exist after the current one  |

#### Item Object Fields

| Field            | Type   | Description                                       |
|------------------|--------|---------------------------------------------------|
| `id`             | string | Ride UUID                                         |
| `passengerId`    | string | UUID of the passenger                             |
| `driverId`       | string | UUID of the driver (nullable if not yet assigned) |
| `status`         | string | Ride status (e.g. `CORRIDA_FINALIZADA`)           |
| `estimatedPrice` | number | Estimated fare at the time of request (BRL)       |
| `finalPrice`     | number | Final charged fare (BRL, nullable if not ended)   |
| `distanceKm`     | number | Total ride distance in kilometers                 |
| `requestedAt`    | string | ISO 8601 timestamp when the ride was requested    |
| `createdAt`      | string | ISO 8601 creation timestamp                       |

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

- Called by `passengersFacade.listRides(params)` via `usePassengerRides` query
- Cache with TanStack Query using `passengerRidesKeys.list(params)`
- Pass `nextCursor` as the `cursor` param for the next page fetch
- On `401`, the facade layer triggers the token refresh flow automatically
