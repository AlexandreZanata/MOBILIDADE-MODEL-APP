# POST /v1/passengers/rides/{rideId}/ratings

**Tag:** Passengers  
**Summary:** Rate driver  
**Description:** Rates the driver of a completed ride. Rating can only be submitted after the ride is finalized. Score ranges from 1 to 5, where 5 is the best.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name     | Location | Type   | Required | Description          |
|----------|----------|--------|----------|----------------------|
| `rideId` | path     | string | Yes      | UUID of the ride     |

**Example URL:**

```
POST /v1/passengers/rides/018f1234-5678-9abc-def0-123456789abc/ratings
```

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "rating": 5,
  "comment": "Excelente motorista, muito pontual!"
}
```

| Field     | Type   | Required | Description                            |
|-----------|--------|----------|----------------------------------------|
| `rating`  | number | Yes      | Score from 1 to 5 (5 is the best)      |
| `comment` | string | No       | Optional text comment about the driver |

---

## Responses

### 201 — Rating created successfully

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "rideId": "018f1234-5678-9abc-def0-123456789def",
  "raterId": "018f1234-5678-9abc-def0-123456789ghi",
  "ratedId": "018f1234-5678-9abc-def0-123456789jkl",
  "rating": 5,
  "comment": "Excelente motorista, muito pontual!",
  "createdAt": "2025-12-01T08:00:00Z"
}
```

| Field       | Type   | Description                                    |
|-------------|--------|------------------------------------------------|
| `id`        | string | UUID of the newly created rating               |
| `rideId`    | string | UUID of the rated ride                         |
| `raterId`   | string | UUID of the passenger who submitted the rating |
| `ratedId`   | string | UUID of the driver who was rated               |
| `rating`    | number | Score from 1 to 5                              |
| `comment`   | string | Optional text comment (nullable)               |
| `createdAt` | string | ISO 8601 creation timestamp                    |

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

- Called by `passengersFacade.rateDriver(rideId, input)` via `useRateDriver` mutation
- Only callable after the ride status is `CORRIDA_FINALIZADA`
- On `onSuccess`, invalidate `passengerRidesKeys.list()` to refresh ride history
- On `401`, the facade layer triggers the token refresh flow automatically
