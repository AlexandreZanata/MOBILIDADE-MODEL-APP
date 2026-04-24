# POST /v1/places/details

**Tag:** Places & Geocoding  
**Summary:** Place details  
**Description:** Returns complete details for a place by its `place_id`.  
**Usage:** Call after the user selects a suggestion from the autocomplete list.  
**Session Token:** Use the same `sessionToken` from the preceding autocomplete search to group requests and reduce costs.  
**Cache:** Details are cached for 90 days (addresses rarely change).  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "language": "pt-BR",
  "sessionToken": "sess_abc123",
  "fields": "formatted_address,geometry,name"
}
```

| Field          | Type   | Required | Description                                                              |
|----------------|--------|----------|--------------------------------------------------------------------------|
| `placeId`      | string | Yes      | Google Place ID (from autocomplete predictions)                          |
| `language`     | string | No       | Response language (IETF tag, default: `pt-BR`)                           |
| `sessionToken` | string | No       | Session token from the preceding autocomplete search (reduces API costs) |
| `fields`       | string | No       | Comma-separated list of fields to return                                 |

---

## Responses

### 200 — Place details

**Content-Type:** `application/json`

```json
{
  "placeId": "ChIJrTLr-GyuEmsRBfy61i59si0",
  "name": "Avenida Paulista",
  "formattedAddress": "Avenida Paulista, São Paulo - SP, Brasil",
  "lat": -23.561414,
  "lng": -46.65607,
  "addressComponents": [
    {
      "longName": "Avenida Paulista",
      "shortName": "Av. Paulista",
      "types": ["route"]
    }
  ],
  "types": ["route", "geocode"],
  "cached": false,
  "source": "GOOGLE_PLACES",
  "queriedAt": "2025-12-09T14:30:00Z"
}
```

| Field               | Type    | Description                                      |
|---------------------|---------|--------------------------------------------------|
| `placeId`           | string  | Google Place ID                                  |
| `name`              | string  | Place name                                       |
| `formattedAddress`  | string  | Full human-readable address                      |
| `lat`               | number  | Latitude of the place                            |
| `lng`               | number  | Longitude of the place                           |
| `addressComponents` | array   | Structured address components                    |
| `types`             | array   | Place type tags                                  |
| `cached`            | boolean | Whether the result was served from cache         |
| `source`            | string  | Data source (e.g. `GOOGLE_PLACES`)               |
| `queriedAt`         | string  | ISO 8601 timestamp of the query                  |

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

- Called by `placesFacade.getPlaceDetails(input)` via `usePlaceDetails` mutation
- Always pass the `sessionToken` from the preceding autocomplete call to reduce Google API costs
- On `401`, the facade layer triggers the token refresh flow automatically
