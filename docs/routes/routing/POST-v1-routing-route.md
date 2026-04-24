# POST /v1/routing/route

**Tag:** Routing  
**Summary:** Calculate route  
**Description:** Calculates the driving route between two geographic points.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).  
**Cache:** Similar routes are cached for 15 minutes. The `cached` field indicates whether the result came from cache.

**Rate Limits:**

| Window  | Limit               |
|---------|---------------------|
| Burst   | 10 requests/second  |
| Minute  | 60 requests         |
| Hour    | 500 requests        |

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "originLat": -23.55052,
  "originLng": -46.633308,
  "destinationLat": -23.561414,
  "destinationLng": -46.65607,
  "includeSteps": false,
  "includeGeometry": false
}
```

| Field             | Type    | Required | Description                                                     |
|-------------------|---------|----------|-----------------------------------------------------------------|
| `originLat`       | number  | Yes      | Latitude of the origin point                                    |
| `originLng`       | number  | Yes      | Longitude of the origin point                                   |
| `destinationLat`  | number  | Yes      | Latitude of the destination point                               |
| `destinationLng`  | number  | Yes      | Longitude of the destination point                              |
| `includeSteps`    | boolean | No       | Include step-by-step navigation instructions (default: `false`) |
| `includeGeometry` | boolean | No       | Include full route geometry as GeoJSON (default: `false`)       |

---

## Responses

### 200 — Route calculated successfully

**Response Headers:**

| Header                  | Type    | Description                              |
|-------------------------|---------|------------------------------------------|
| `X-RateLimit-Limit`     | integer | Total requests allowed per minute        |
| `X-RateLimit-Remaining` | integer | Remaining requests in the current window |
| `X-RateLimit-Reset`     | integer | Unix timestamp when the window resets    |

**Content-Type:** `application/json`

```json
{
  "distanceMeters": 5234.5,
  "distanceKm": 5.23,
  "durationSeconds": 720,
  "durationMinutes": 12,
  "durationFormatted": "12 min",
  "cached": false,
  "calculatedAt": "2025-12-09T14:30:00Z"
}
```

| Field               | Type    | Description                                      |
|---------------------|---------|--------------------------------------------------|
| `distanceMeters`    | number  | Total route distance in meters                   |
| `distanceKm`        | number  | Total route distance in kilometers               |
| `durationSeconds`   | number  | Estimated travel time in seconds                 |
| `durationMinutes`   | number  | Estimated travel time in minutes                 |
| `durationFormatted` | string  | Human-readable duration string (e.g. `"12 min"`) |
| `cached`            | boolean | Whether the result was served from cache         |
| `calculatedAt`      | string  | ISO 8601 timestamp of the calculation            |

> When `includeSteps=true`, the response also includes a `steps` array. When `includeGeometry=true`, it also includes a `geometry` GeoJSON object. See [GET /v1/routing/route](./GET-v1-routing-route.md) for the full field reference of those optional fields.

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

**Response Headers:**

| Header                  | Type    | Description                                    |
|-------------------------|---------|------------------------------------------------|
| `X-RateLimit-Remaining` | integer | Always `0` when rate limit is exceeded         |
| `X-RateLimit-Reset`     | integer | Unix timestamp when the window resets          |
| `X-RateLimit-Limit`     | integer | Total requests allowed per window              |
| `Retry-After`           | integer | Seconds until the client may retry             |

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "Limite de requisições excedido. Aguarde 45 segundos.",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

| Field           | Type   | Description                                     |
|-----------------|--------|-------------------------------------------------|
| `error.message` | string | Human-readable rate limit message               |
| `error.code`    | string | Always `RATE_LIMIT_EXCEEDED`                    |

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

### 503 — Routing Service Unavailable

The underlying routing service is temporarily unavailable.

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "Serviço de roteamento temporariamente indisponível. Tente novamente em alguns segundos.",
    "code": "ROUTING_UNAVAILABLE"
  }
}
```

| Field           | Type   | Description                                     |
|-----------------|--------|-------------------------------------------------|
| `error.message` | string | Human-readable unavailability message           |
| `error.code`    | string | Always `ROUTING_UNAVAILABLE`                    |

---

## Error Envelope Reference

| Field           | Type   | Description                                     |
|-----------------|--------|-------------------------------------------------|
| `error.message` | string | Human-readable error description                |
| `error.code`    | string | Machine-readable error code                     |
| `error.fields`  | object | Map of field names to validation error messages |

---

## Frontend Integration Notes

- Called by `routingFacade.calculateRoute(input)` via `useCalculateRoute` mutation
- On `429`, read the `Retry-After` header and display a countdown before allowing retry
- On `503`, display a service unavailable message and retry after a short delay
- On `401`, the facade layer triggers the token refresh flow automatically
