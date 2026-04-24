# GET /v1/places/geocode

**Tag:** Places & Geocoding  
**Summary:** Geocoding (GET)  
**Description:** GET version for geocoding. Prefer `POST /v1/places/geocode` in production.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name       | Location | Type   | Required | Default | Description                                  |
|------------|----------|--------|----------|---------|----------------------------------------------|
| `address`  | query    | string | Yes      | —       | Address string to geocode                    |
| `country`  | query    | string | No       | `br`    | ISO 3166-1 alpha-2 country code              |
| `language` | query    | string | No       | `pt-BR` | Response language (IETF language tag)        |

**Example URL:**

```
GET /v1/places/geocode?address=Avenida+Paulista%2C+1000%2C+S%C3%A3o+Paulo&country=br&language=pt-BR
```

---

## Request Body

None.

---

## Responses

> This endpoint does not define a `200` response in the spec. Use `POST /v1/places/geocode` to receive a structured geocoding result.

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

- Use `POST /v1/places/geocode` in production — this GET version is for quick testing only
- On `401`, the facade layer triggers the token refresh flow automatically
