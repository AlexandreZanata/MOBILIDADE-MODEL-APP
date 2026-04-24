# GET /v1/places/details/{placeId}

**Tag:** Places & Geocoding  
**Summary:** Place details (GET)  
**Description:** GET version for fetching place details by `place_id`. Prefer `POST /v1/places/details` in production.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name           | Location | Type   | Required | Default | Description                                                              |
|----------------|----------|--------|----------|---------|--------------------------------------------------------------------------|
| `placeId`      | path     | string | Yes      | —       | Google Place ID                                                          |
| `language`     | query    | string | No       | `pt-BR` | Response language (IETF language tag)                                    |
| `sessionToken` | query    | string | No       | —       | Session token from the preceding autocomplete search (reduces API costs) |

**Example URL:**

```
GET /v1/places/details/ChIJrTLr-GyuEmsRBfy61i59si0?language=pt-BR&sessionToken=sess_abc123
```

---

## Request Body

None.

---

## Responses

> This endpoint does not define a `200` response in the spec. Use `POST /v1/places/details` to receive a structured place details result.

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

- Use `POST /v1/places/details` in production — this GET version is for quick testing only
- On `401`, the facade layer triggers the token refresh flow automatically
