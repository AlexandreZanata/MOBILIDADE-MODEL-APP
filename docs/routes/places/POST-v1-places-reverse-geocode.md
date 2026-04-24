# POST /v1/places/reverse-geocode

**Tag:** Places & Geocoding  
**Summary:** Reverse Geocoding (coordinates → address)  
**Description:** Converts geographic coordinates into a human-readable address.  
**Cache:** Results are cached for 90 days. Cache also applies to nearby coordinates (~100m radius).  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "lat": -23.561414,
  "lng": -46.65607,
  "language": "pt-BR",
  "resultTypes": "street_address"
}
```

| Field         | Type   | Required | Description                                                        |
|---------------|--------|----------|--------------------------------------------------------------------|
| `lat`         | number | Yes      | Latitude of the coordinate                                         |
| `lng`         | number | Yes      | Longitude of the coordinate                                        |
| `language`    | string | No       | Response language (IETF tag, e.g. `pt-BR`, `en`). Default: `pt-BR` |
| `resultTypes` | string | No       | Filter result types (e.g. `street_address`, `locality`)            |

---

## Responses

### 200 — Reverse geocoding successful

**Content-Type:** `application/json`

```json
{
  "results": [
    {
      "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "formattedAddress": "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP, Brasil",
      "lat": -23.561414,
      "lng": -46.65607,
      "addressComponents": [
        {
          "longName": "São Paulo",
          "shortName": "SP",
          "types": ["administrative_area_level_1", "political"]
        }
      ],
      "types": ["street_address", "geocode"],
      "locationType": "ROOFTOP",
      "viewport": {
        "northeast": { "lat": -23.561414, "lng": -46.65607 },
        "southwest": { "lat": -23.561414, "lng": -46.65607 }
      },
      "confidence": "EXACT"
    }
  ],
  "cached": false,
  "source": "GOOGLE_GEOCODING",
  "queriedAt": "2025-12-09T14:30:00Z"
}
```

| Field       | Type    | Description                                                  |
|-------------|---------|--------------------------------------------------------------|
| `results`   | array   | Array of geocoding result objects                            |
| `cached`    | boolean | Whether the result was served from cache                     |
| `source`    | string  | Data source (e.g. `GOOGLE_GEOCODING`)                        |
| `queriedAt` | string  | ISO 8601 timestamp of the query                              |

#### `results[]` Item Fields

| Field               | Type   | Description                                                  |
|---------------------|--------|--------------------------------------------------------------|
| `placeId`           | string | Google Place ID                                              |
| `formattedAddress`  | string | Full human-readable address                                  |
| `lat`               | number | Latitude of the result                                       |
| `lng`               | number | Longitude of the result                                      |
| `addressComponents` | array  | Structured address components                                |
| `types`             | array  | Place type tags (e.g. `street_address`, `geocode`)           |
| `locationType`      | string | Precision level (e.g. `ROOFTOP`, `RANGE_INTERPOLATED`)       |
| `viewport`          | object | Recommended map viewport with `northeast` and `southwest`    |
| `confidence`        | string | Match confidence — `EXACT`, `APPROXIMATE`, etc.              |

#### `addressComponents[]` Item Fields

| Field       | Type     | Description                               |
|-------------|----------|-------------------------------------------|
| `longName`  | string   | Full name of the address component        |
| `shortName` | string   | Abbreviated name of the address component |
| `types`     | string[] | Component type tags                       |

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

- Called by `placesFacade.reverseGeocode(input)` via `useReverseGeocode` mutation
- Results are cached server-side for 90 days — no client-side caching needed for the same coordinates
- On `401`, the facade layer triggers the token refresh flow automatically
