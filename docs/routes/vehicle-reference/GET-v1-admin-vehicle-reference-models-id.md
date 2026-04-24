# GET /v1/admin/vehicle-reference/models/{id}

**Tag:** Admin - Vehicle Reference  
**Summary:** Get model by ID  
**Description:** Returns the details of a specific vehicle model.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name | Location | Type   | Required | Description               |
|------|----------|--------|----------|---------------------------|
| `id` | path     | string | Yes      | UUID of the vehicle model |

**Example URL:**

```
GET /v1/admin/vehicle-reference/models/018f1234-5678-9abc-def0-123456789abc
```

---

## Request Body

None.

---

## Responses

### 200 — OK

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
| `id`        | string | Vehicle model UUID                   |
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

- Called by `vehicleReferenceFacade.getModelById(id)` via `useAdminVehicleModel(id)` query
- Cache with TanStack Query using `vehicleModelsAdminKeys.detail(id)`
- Requires `VEHICLE_REFERENCE_VIEW` permission — gate with `<Can perform={Permission.VEHICLE_REFERENCE_VIEW}>`
- On `401`, the facade layer triggers the token refresh flow automatically
