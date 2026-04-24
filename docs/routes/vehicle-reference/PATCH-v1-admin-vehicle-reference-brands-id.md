# PATCH /v1/admin/vehicle-reference/brands/{id}

**Tag:** Admin - Vehicle Reference  
**Summary:** Update brand  
**Description:** Updates the data of a vehicle brand. Only provided fields are updated (partial update).  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name | Location | Type   | Required | Description               |
|------|----------|--------|----------|---------------------------|
| `id` | path     | string | Yes      | UUID of the vehicle brand |

**Example URL:**

```
PATCH /v1/admin/vehicle-reference/brands/018f1234-5678-9abc-def0-123456789abc
```

---

## Request Body

**Content-Type:** `application/json`

All fields are optional. Only include the fields you want to update.

```json
{
  "name": "Toyota",
  "slug": "toyota"
}
```

| Field  | Type   | Required | Constraints                  | Description                              |
|--------|--------|----------|------------------------------|------------------------------------------|
| `name` | string | No       | max 50 chars                 | Display name of the brand                |
| `slug` | string | No       | max 50 chars, `^[a-z0-9-]+$` | URL-safe unique identifier for the brand |

---

## Responses

### 200 — OK

Returns the full updated vehicle brand object.

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

See [GET /v1/admin/vehicle-reference/brands/{id}](./GET-v1-admin-vehicle-reference-brands-id.md) for the full field reference.

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

- Called by `vehicleReferenceFacade.updateBrand(id, input)` via `useUpdateVehicleBrand` mutation
- On `onSuccess`, invalidate `vehicleBrandsAdminKeys.detail(id)` and `vehicleBrandsAdminKeys.all`
- Requires `VEHICLE_REFERENCE_UPDATE` permission — gate with `<Can perform={Permission.VEHICLE_REFERENCE_UPDATE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
