# POST /v1/admin/vehicle-reference/models

**Tag:** Admin - Vehicle Reference  
**Summary:** Create vehicle model  
**Description:** Creates a new vehicle model associated with a brand.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "brandId": "018f1234-5678-9abc-def0-123456789abc",
  "name": "Corolla",
  "slug": "corolla"
}
```

| Field     | Type   | Required | Constraints                  | Description                                 |
|-----------|--------|----------|------------------------------|---------------------------------------------|
| `brandId` | string | Yes      | UUID format                  | UUID of the parent vehicle brand            |
| `name`    | string | Yes      | max 50 chars                 | Display name of the model                   |
| `slug`    | string | Yes      | max 50 chars, `^[a-z0-9-]+$` | URL-safe unique identifier within the brand |

---

## Responses

### 201 — Created

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "brandId": "018f1234-5678-9abc-def0-123456789abc",
  "name": "Corolla",
  "slug": "corolla",
  "createdAt": "2025-12-01T08:00:00Z",
  "updatedAt": "2025-12-01T09:00:00Z"
}
```

| Field       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| `id`        | string | UUID of the newly created model      |
| `brandId`   | string | UUID of the associated vehicle brand |
| `name`      | string | Model name                           |
| `slug`      | string | URL-safe identifier for the model    |
| `createdAt` | string | ISO 8601 creation timestamp          |
| `updatedAt` | string | ISO 8601 last update timestamp       |

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

- Called by `vehicleReferenceFacade.createModel(input)` via `useCreateVehicleModel` mutation
- On `onSuccess`, invalidate `vehicleModelsAdminKeys.all` to refresh all list queries
- Requires `VEHICLE_REFERENCE_CREATE` permission — gate with `<Can perform={Permission.VEHICLE_REFERENCE_CREATE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
