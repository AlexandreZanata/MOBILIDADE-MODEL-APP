# POST /v1/routing/route/async

**Tag:** Routing  
**Summary:** Calculate route (async)  
**Description:** Queues a route calculation request for asynchronous processing. The result will be available via webhook or can be queried later.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

**Useful for:**
- Batch operations
- When an immediate response is not required
- Pre-calculating routes

---

## Parameters

| Name               | Location | Type   | Required | Description                                    |
|--------------------|----------|--------|----------|------------------------------------------------|
| `X-Correlation-Id` | header   | string | No       | Custom correlation ID for tracking the request |

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

### 202 — Request accepted for processing

**Content-Type:** `application/json`

```json
{
  "correlationId": "corr_123e4567-e89b-12d3-a456-426614174000",
  "status": "QUEUED",
  "message": "Requisição enfileirada para processamento"
}
```

| Field           | Type   | Description                                                          |
|-----------------|--------|----------------------------------------------------------------------|
| `correlationId` | string | Unique ID to track this async request (use to poll or match webhook) |
| `status`        | string | Always `QUEUED` on acceptance                                        |
| `message`       | string | Human-readable confirmation message                                  |

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

- Called by `routingFacade.calculateRouteAsync(input)` via `useCalculateRouteAsync` mutation
- Store the returned `correlationId` to match the result when it arrives via webhook
- Optionally pass a custom `X-Correlation-Id` header to use your own tracking ID
- On `401`, the facade layer triggers the token refresh flow automatically
