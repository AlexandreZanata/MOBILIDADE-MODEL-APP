# POST /v1/admin/service-categories

**Tag:** Admin - Service Categories  
**Summary:** Create service category  
**Description:** Creates a new service category with a base fare, per-km rate, and minimum fare.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "name": "Econômico",
  "slug": "economico",
  "baseFare": 5,
  "perKmRate": 2.5,
  "minFare": 10
}
```

| Field       | Type   | Required | Description                                      |
|-------------|--------|----------|--------------------------------------------------|
| `name`      | string | Yes      | Display name of the category                     |
| `slug`      | string | Yes      | URL-safe unique identifier for the category      |
| `baseFare`  | number | Yes      | Base fare charged at the start of a ride (BRL)   |
| `perKmRate` | number | Yes      | Rate charged per kilometer (BRL)                 |
| `minFare`   | number | Yes      | Minimum fare for any ride in this category (BRL) |

---

## Responses

### 201 — Category created successfully

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "name": "Econômico",
  "slug": "economico",
  "baseFare": "5.00",
  "perKmRate": "2.50",
  "minFare": "10.00",
  "createdAt": "2025-12-01T08:00:00Z",
  "updatedAt": "2025-12-01T08:00:00Z"
}
```

> Note: `baseFare`, `perKmRate`, and `minFare` are returned as decimal strings (`"5.00"`) in the `201` response, unlike the numeric values in list/detail responses.

| Field       | Type   | Description                                   |
|-------------|--------|-----------------------------------------------|
| `id`        | string | UUID of the newly created service category    |
| `name`      | string | Display name of the category                  |
| `slug`      | string | URL-safe identifier for the category          |
| `baseFare`  | string | Base fare as a decimal string (BRL)           |
| `perKmRate` | string | Per-km rate as a decimal string (BRL)         |
| `minFare`   | string | Minimum fare as a decimal string (BRL)        |
| `createdAt` | string | ISO 8601 creation timestamp                   |
| `updatedAt` | string | ISO 8601 last update timestamp                |

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

Missing or invalid Bearer token.

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

Authenticated user does not have the required role or permission.

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

All error responses share the same envelope shape:

| Field           | Type   | Description                                     |
|-----------------|--------|-------------------------------------------------|
| `error.message` | string | Human-readable error description                |
| `error.code`    | string | Machine-readable error code                     |
| `error.fields`  | object | Map of field names to validation error messages |

---

## Frontend Integration Notes

- Called by `serviceCategoriesFacade.create(input)` via `useCreateServiceCategory` mutation
- On `onSuccess`, invalidate `serviceCategoriesKeys.all` to refresh all list queries
- Requires `SERVICE_CATEGORY_CREATE` permission — gate with `<Can perform={Permission.SERVICE_CATEGORY_CREATE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
- On `403`, render an `<AccessDenied />` fallback via `<Can>`
- `baseFare`, `perKmRate`, and `minFare` are returned as decimal strings in the `201` response — parse with `parseFloat()` if numeric comparison is needed
