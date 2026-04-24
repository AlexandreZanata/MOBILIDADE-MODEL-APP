# POST /v1/passengers/fare-estimate

**Tag:** Passengers  
**Summary:** Estimate ride fare  
**Description:** Calculates the estimated price of a ride for all service categories, considering distance, duration, and demand (surge).  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "originLat": -12.54278,
  "originLng": -55.72111,
  "destinationLat": -12.54441,
  "destinationLng": -55.72751
}
```

| Field            | Type   | Required | Description                              |
|------------------|--------|----------|------------------------------------------|
| `originLat`      | number | Yes      | Latitude of the pickup location          |
| `originLng`      | number | Yes      | Longitude of the pickup location         |
| `destinationLat` | number | Yes      | Latitude of the drop-off location        |
| `destinationLng` | number | Yes      | Longitude of the drop-off location       |

---

## Responses

### 200 — Fare estimate calculated successfully

**Content-Type:** `application/json`

```json
{
  "estimateId": "018f1234-5678-9abc-def0-123456789abc",
  "categories": [
    {
      "categoryId": "018f1234-5678-9abc-def0-123456789def",
      "categorySlug": "economico",
      "categoryName": "Econômico",
      "estimatedPrice": 23.9,
      "surge": 1.3,
      "distanceKm": 6.4,
      "durationMinutes": 18
    }
  ]
}
```

| Field        | Type   | Description                                                                  |
|--------------|--------|------------------------------------------------------------------------------|
| `estimateId` | string | UUID of the estimate — pass to `POST /v1/passengers/rides` to request a ride |
| `categories` | array  | Array of per-category fare estimates                                         |

#### `categories[]` Item Fields

| Field             | Type   | Description                                          |
|-------------------|--------|------------------------------------------------------|
| `categoryId`      | string | UUID of the service category                         |
| `categorySlug`    | string | URL-safe identifier of the service category          |
| `categoryName`    | string | Display name of the service category                 |
| `estimatedPrice`  | number | Estimated fare for this category (BRL)               |
| `surge`           | number | Surge multiplier applied (1.0 = no surge)            |
| `distanceKm`      | number | Estimated ride distance in kilometers                |
| `durationMinutes` | number | Estimated ride duration in minutes                   |

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

- Called by `passengersFacade.estimateFare(input)` via `useEstimateFare` mutation
- Store the returned `estimateId` in local state — it is required to call `POST /v1/passengers/rides`
- Estimates expire after a server-defined TTL — re-fetch if the passenger takes too long to confirm
- On `401`, the facade layer triggers the token refresh flow automatically
