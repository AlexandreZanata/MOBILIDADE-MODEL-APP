# GET /v1/places/rate-limit

**Tag:** Places & Geocoding  
**Summary:** Get rate limit info  
**Description:** Returns current rate limit information for each API type.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Rate limit information

**Content-Type:** `application/json`

```json
{
  "autocomplete": {
    "remaining": 28,
    "limit": 30,
    "resetAt": 1733757600,
    "resetInSeconds": 45
  },
  "geocoding": {
    "remaining": 30,
    "limit": 30,
    "resetAt": 1733757600,
    "resetInSeconds": 45
  }
}
```

| Field          | Type   | Description                                                    |
|----------------|--------|----------------------------------------------------------------|
| `autocomplete` | object | Rate limit state for the autocomplete API                      |
| `geocoding`    | object | Rate limit state for the geocoding API                         |

#### Rate Limit Object Fields (applies to both `autocomplete` and `geocoding`)

| Field            | Type   | Description                                              |
|------------------|--------|----------------------------------------------------------|
| `remaining`      | number | Remaining requests in the current window                 |
| `limit`          | number | Total requests allowed per window                        |
| `resetAt`        | number | Unix timestamp when the current window resets            |
| `resetInSeconds` | number | Seconds until the current window resets                  |

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

- Called by `placesFacade.getRateLimit()` via `usePlacesRateLimit` query
- Use this to display a rate limit warning before the user hits a `429`
- On `401`, the facade layer triggers the token refresh flow automatically
