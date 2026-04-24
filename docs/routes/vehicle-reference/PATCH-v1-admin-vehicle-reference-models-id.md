# PATCH /v1/admin/vehicle-reference/models/{id}

**Tag:** Admin - Vehicle Reference  
**Summary:** Update model  
**Description:** Updates the data of a vehicle model. Only provided fields are updated (partial update).  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name | Location | Type   | Required | Description               |
|------|----------|--------|----------|---------------------------|
| `id` | path     | string | Yes      | UUID of the vehicle model |

**Example URL:**

```
PATCH /v1/admin/vehicle-reference/models/018f1234-5678-9abc-def0-123456789abc
```

---

## Request Body

**Content-Type:** `application/json`

All fields are optional. Only include the fields you want to update.

```json
{
  "brandId": "018f1234-5678-9abc-def0-123456789abc",
  "name": "Corolla",
  "slug": "corolla"
}
```

| Field     | Type   | Required | Constraints                  | Description                                 |
|-----------|--------|----------|------------------------------|---------------------------------------------|
| `brandId` | string | No       | UUID format                  | UUID of the parent vehicle brand            |
| `name`    | string | No       | max 50 chars                 | Display name of the model                   |
| `slug`    | string | No       | max 50 chars, `^[a-z0-9-]+$` | URL-safe unique identifier within the brand |

---

## Responses

### 200 — OK

Returns the full updated vehicle model object.

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

See [GET /v1/admin/vehicle-reference/models/{id}](./GET-v1-admin-vehicle-reference-models-id.md) for the full field reference.

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

- Called by `vehicleReferenceFacade.updateModel(id, input)` via `useUpdateVehicleModel` mutation
- On `onSuccess`, invalidate `vehicleModelsAdminKeys.detail(id)` and `vehicleModelsAdminKeys.all`
- Requires `VEHICLE_REFERENCE_UPDATE` permission — gate with `<Can perform={Permission.VEHICLE_REFERENCE_UPDATE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
