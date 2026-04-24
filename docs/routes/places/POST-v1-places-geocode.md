# POST /v1/places/geocode

**Tag:** Places & Geocoding  
**Summary:** Geocoding (address → coordinates)  
**Description:** Converts an address string into geographic coordinates.  
**Cache:** Results are cached for 90 days.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "address": "Avenida Paulista, 1000, São Paulo",
  "country": "br",
  "language": "pt-BR",
  "boundsLat": -23.55052,
  "boundsLng": -46.633308,
  "boundsRadius": 50000
}
```

| Field          | Type   | Required | Description                                                        |
|----------------|--------|----------|--------------------------------------------------------------------|
| `address`      | string | Yes      | Address string to geocode                                          |
| `country`      | string | No       | ISO 3166-1 alpha-2 country code (default: `br`)                    |
| `language`     | string | No       | Response language (IETF tag, default: `pt-BR`)                     |
| `boundsLat`    | number | No       | Latitude of the bias center for result ranking                     |
| `boundsLng`    | number | No       | Longitude of the bias center for result ranking                    |
| `boundsRadius` | number | No       | Radius in meters around the bias center (default: `50000`)         |

---

## Responses

### 200 — Geocoding successful

**Content-Type:** `application/json`

```json
{
  "results": [
    {
      "placeId": "ChIJrTLr-GyuEmsRBfy61i59si0",
      "formattedAddress": "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP, Brasil",
      "lat": -23.561414,
      "lng": -46.65607,
      "locationType": "ROOFTOP",
      "confidence": "EXACT"
    }
  ],
  "cached": false,
  "source": "GOOGLE_GEOCODING",
  "queriedAt": "2025-12-09T14:30:00Z"
}
```

| Field       | Type    | Description                                      |
|-------------|---------|--------------------------------------------------|
| `results`   | array   | Array of geocoding result objects                |
| `cached`    | boolean | Whether the result was served from cache         |
| `source`    | string  | Data source (e.g. `GOOGLE_GEOCODING`)            |
| `queriedAt` | string  | ISO 8601 timestamp of the query                  |

#### `results[]` Item Fields

| Field              | Type   | Description                                                  |
|--------------------|--------|--------------------------------------------------------------|
| `placeId`          | string | Google Place ID                                              |
| `formattedAddress` | string | Full human-readable address                                  |
| `lat`              | number | Latitude of the result                                       |
| `lng`              | number | Longitude of the result                                      |
| `locationType`     | string | Precision level (e.g. `ROOFTOP`, `RANGE_INTERPOLATED`)       |
| `confidence`       | string | Match confidence — `EXACT`, `APPROXIMATE`, etc.              |

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

- Called by `placesFacade.geocode(input)` via `useGeocode` mutation
- Results are cached server-side for 90 days
- On `401`, the facade layer triggers the token refresh flow automatically
