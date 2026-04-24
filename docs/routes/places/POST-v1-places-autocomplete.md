# POST /v1/places/autocomplete

**Tag:** Places & Geocoding  
**Summary:** Place autocomplete  
**Description:** Returns place suggestions based on the text typed by the user.  
**Recommended usage:** Call while the user types with a 300ms debounce.  
**Cache:** Results are cached for 24h. The `cached` field indicates the origin.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

**Rate Limits:**

| Window  | Limit              |
|---------|--------------------|
| Burst   | 5 requests/second  |
| Minute  | 30 requests        |
| Hour    | 200 requests       |

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "input": "Avenida Paul",
  "location": {
    "lat": -23.55052,
    "lng": -46.633308
  },
  "radius": 50000,
  "strictBounds": false,
  "country": "br",
  "language": "pt-BR",
  "types": "address",
  "sessionToken": "sess_abc123",
  "effectiveLat": 0.1,
  "effectiveLng": 0.1
}
```

| Field          | Type    | Required | Description                                                                    |
|----------------|---------|----------|--------------------------------------------------------------------------------|
| `input`        | string  | Yes      | Search text typed by the user                                                  |
| `location`     | object  | No       | User's current location for result bias (`lat` + `lng`)                        |
| `radius`       | number  | No       | Radius in meters around `location` (default: `50000`)                          |
| `strictBounds` | boolean | No       | If `true`, restricts results to the radius. Default: `false`                   |
| `country`      | string  | No       | ISO 3166-1 alpha-2 country code (default: `br`)                                |
| `language`     | string  | No       | Response language (IETF tag, default: `pt-BR`)                                 |
| `types`        | string  | No       | Filter by place type (e.g. `address`, `establishment`)                         |
| `sessionToken` | string  | No       | Session token to group requests and reduce costs when the user selects a place |
| `effectiveLat` | number  | No       | Effective latitude used internally for bias calculation                        |
| `effectiveLng` | number  | No       | Effective longitude used internally for bias calculation                       |

---

## Responses

### 200 — Suggestions returned

**Response Headers:**

| Header                  | Type    | Description                              |
|-------------------------|---------|------------------------------------------|
| `X-RateLimit-Remaining` | integer | Remaining requests in the current window |
| `X-RateLimit-Reset`     | integer | Unix timestamp when the window resets    |
| `X-RateLimit-Limit`     | integer | Total requests allowed per window        |

**Content-Type:** `application/json`

```json
{
  "predictions": [
    {
      "placeId": "ChIJrTLr-GyuEmsRBfy61i59si0",
      "description": "Avenida Paulista, São Paulo - SP, Brasil",
      "mainText": "Avenida Paulista",
      "secondaryText": "São Paulo - SP, Brasil",
      "types": ["route", "geocode"]
    }
  ],
  "cached": false,
  "source": "GOOGLE_PLACES",
  "queriedAt": "2025-12-09T14:30:00Z"
}
```

| Field         | Type    | Description                              |
|---------------|---------|------------------------------------------|
| `predictions` | array   | Array of place prediction objects        |
| `cached`      | boolean | Whether the result was served from cache |
| `source`      | string  | Data source (e.g. `GOOGLE_PLACES`)       |
| `queriedAt`   | string  | ISO 8601 timestamp of the query          |

#### `predictions[]` Item Fields

| Field           | Type     | Description                                          |
|-----------------|----------|------------------------------------------------------|
| `placeId`       | string   | Google Place ID — pass to `POST /v1/places/details`  |
| `description`   | string   | Full place description shown to the user             |
| `mainText`      | string   | Primary part of the description (place name)         |
| `secondaryText` | string   | Secondary part of the description (location context) |
| `types`         | string[] | Place type tags                                      |

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

### 429 — Rate Limit Exceeded

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

- Called by `placesFacade.autocomplete(input)` via `useAutocomplete` — debounce at 300ms
- Generate a `sessionToken` at the start of each search session and reuse it until the user selects a place
- Pass the same `sessionToken` to `POST /v1/places/details` when the user selects a prediction
- On `429`, back off and display a user-friendly message — do not retry automatically
- On `401`, the facade layer triggers the token refresh flow automatically
