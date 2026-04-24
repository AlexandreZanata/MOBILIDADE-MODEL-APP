# GET /v1/places/quota

**Tag:** Places & Geocoding  
**Summary:** Quota statistics  
**Description:** Returns API usage statistics for monitoring the free tier budget.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Quota statistics

**Content-Type:** `application/json`

```json
{
  "date": "2025-12-09",
  "currentCost": 1.25,
  "dailyBudget": 5,
  "budgetUsedPercent": 25,
  "totalRequests": 150,
  "totalCacheHits": 120,
  "cacheHitRatePercent": 80,
  "autocompleteRequests": 100,
  "geocodingRequests": 30,
  "reverseGeocodingRequests": 15,
  "placeDetailsRequests": 5
}
```

| Field                      | Type   | Description                                                  |
|----------------------------|--------|--------------------------------------------------------------|
| `date`                     | string | Date of the statistics in `YYYY-MM-DD` format                |
| `currentCost`              | number | Estimated API cost for the current day (USD)                 |
| `dailyBudget`              | number | Configured daily budget limit (USD)                          |
| `budgetUsedPercent`        | number | Percentage of the daily budget consumed                      |
| `totalRequests`            | number | Total API requests made today                                |
| `totalCacheHits`           | number | Total requests served from cache today                       |
| `cacheHitRatePercent`      | number | Cache hit rate as a percentage                               |
| `autocompleteRequests`     | number | Number of autocomplete requests today                        |
| `geocodingRequests`        | number | Number of geocoding requests today                           |
| `reverseGeocodingRequests` | number | Number of reverse geocoding requests today                   |
| `placeDetailsRequests`     | number | Number of place details requests today                       |

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

- Called by `placesFacade.getQuota()` via `usePlacesQuota` query
- Cache with TanStack Query using `placesKeys.quota()`
- Use `budgetUsedPercent` to display a warning when approaching the daily budget limit
- On `401`, the facade layer triggers the token refresh flow automatically
