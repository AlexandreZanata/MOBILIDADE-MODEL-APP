# POST /v1/admin/vehicle-reference/brands

**Tag:** Admin - Vehicle Reference  
**Summary:** Create vehicle brand  
**Description:** Creates a new vehicle brand.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "name": "Toyota",
  "slug": "toyota"
}
```

| Field  | Type   | Required | Constraints                  | Description                              |
|--------|--------|----------|------------------------------|------------------------------------------|
| `name` | string | Yes      | max 50 chars                 | Display name of the brand                |
| `slug` | string | Yes      | max 50 chars, `^[a-z0-9-]+$` | URL-safe unique identifier for the brand |

---

## Responses

### 201 — Created

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "name": "Toyota",
  "slug": "toyota",
  "createdAt": "2025-12-01T08:00:00Z",
  "updatedAt": "2025-12-01T09:00:00Z"
}
```

| Field       | Type   | Description                       |
|-------------|--------|-----------------------------------|
| `id`        | string | UUID of the newly created brand   |
| `name`      | string | Brand name                        |
| `slug`      | string | URL-safe identifier for the brand |
| `createdAt` | string | ISO 8601 creation timestamp       |
| `updatedAt` | string | ISO 8601 last update timestamp    |

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

- Called by `vehicleReferenceFacade.createBrand(input)` via `useCreateVehicleBrand` mutation
- On `onSuccess`, invalidate `vehicleBrandsAdminKeys.all` to refresh all list queries
- Requires `VEHICLE_REFERENCE_CREATE` permission — gate with `<Can perform={Permission.VEHICLE_REFERENCE_CREATE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
