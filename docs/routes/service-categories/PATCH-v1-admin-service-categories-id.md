# PATCH /v1/admin/service-categories/{id}

**Tag:** Admin - Service Categories  
**Summary:** Update category  
**Description:** Updates the data of a service category. Only provided fields are updated (partial update).  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name | Location | Type   | Required | Description                  |
|------|----------|--------|----------|------------------------------|
| `id` | path     | string | Yes      | UUID of the service category |

**Example URL:**

```
PATCH /v1/admin/service-categories/018f1234-5678-9abc-def0-123456789abc
```

---

## Request Body

**Content-Type:** `application/json`

All fields are optional. Only include the fields you want to update.

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
| `name`      | string | No       | Display name of the category                     |
| `slug`      | string | No       | URL-safe unique identifier for the category      |
| `baseFare`  | number | No       | Base fare charged at the start of a ride (BRL)   |
| `perKmRate` | number | No       | Rate charged per kilometer (BRL)                 |
| `minFare`   | number | No       | Minimum fare for any ride in this category (BRL) |

---

## Responses

### 200 — OK

Returns the full updated service category object.

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "name": "Econômico",
  "slug": "economico",
  "baseFare": 5,
  "perKmRate": 2.5,
  "minFare": 10,
  "createdAt": "2025-12-01T08:00:00Z",
  "updatedAt": "2025-12-01T09:00:00Z"
}
```

| Field       | Type   | Description                                      |
|-------------|--------|--------------------------------------------------|
| `id`        | string | Service category UUID                            |
| `name`      | string | Display name of the category                     |
| `slug`      | string | URL-safe identifier for the category             |
| `baseFare`  | number | Base fare charged at the start of a ride (BRL)   |
| `perKmRate` | number | Rate charged per kilometer (BRL)                 |
| `minFare`   | number | Minimum fare for any ride in this category (BRL) |
| `createdAt` | string | ISO 8601 creation timestamp                      |
| `updatedAt` | string | ISO 8601 last update timestamp                   |

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

No service category exists with the provided `id`.

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

- Called by `serviceCategoriesFacade.update(id, input)` via `useUpdateServiceCategory` mutation
- On `onSuccess`, invalidate `serviceCategoriesKeys.detail(id)` and `serviceCategoriesKeys.all`
- Requires `SERVICE_CATEGORY_UPDATE` permission — gate with `<Can perform={Permission.SERVICE_CATEGORY_UPDATE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
- On `403`, render an `<AccessDenied />` fallback via `<Can>`
