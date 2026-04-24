# GET /v1/card-brands

**Tag:** Card Brands  
**Summary:** List enabled card brands  
**Description:** Returns all enabled card brands.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Card brand list

**Content-Type:** `application/json`

```json
[
  {
    "id": "018f1234-5678-9abc-def0-123456789abc",
    "name": "Visa",
    "slug": "visa",
    "enabled": true,
    "createdAt": "2025-12-01T08:00:00Z",
    "updatedAt": "2025-12-01T09:00:00Z"
  }
]
```

Returns a flat array of card brand objects. Only brands with `enabled: true` are included.

| Field       | Type    | Description                                  |
|-------------|---------|----------------------------------------------|
| `id`        | string  | Card brand UUID                              |
| `name`      | string  | Display name of the card brand               |
| `slug`      | string  | URL-safe identifier for the card brand       |
| `enabled`   | boolean | Whether the brand is currently enabled       |
| `createdAt` | string  | ISO 8601 creation timestamp                  |
| `updatedAt` | string  | ISO 8601 last update timestamp               |

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

- Called by `cardBrandsFacade.list()` via `useCardBrands` query
- Cache with TanStack Query using `cardBrandsKeys.list()`
- Response is a flat array — no pagination
- Use this list to populate card brand selectors in the payment flow
- On `401`, the facade layer triggers the token refresh flow automatically
