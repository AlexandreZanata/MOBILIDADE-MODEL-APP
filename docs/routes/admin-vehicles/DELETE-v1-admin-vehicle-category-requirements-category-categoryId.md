# DELETE /v1/admin/vehicle-category-requirements/category/{categoryId}

**Tag:** Admin - Vehicle Category Requirements  
**Summary:** Remove category requirement  
**Description:** Removes the vehicle year requirement for a specific service category. After deletion, the global minimum year from `GET /v1/admin/vehicle-reference/min-year` applies.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name         | Location | Type   | Required | Description                    |
|--------------|----------|--------|----------|--------------------------------|
| `categoryId` | path     | string | Yes      | UUID of the service category   |

**Example URL:**

```
DELETE /v1/admin/vehicle-category-requirements/category/018f1234-5678-9abc-def0-123456789abc
```

---

## Request Body

None.

---

## Responses

### 200 — OK

Returns a free-form map of additional properties.

**Content-Type:** `application/json`

```json
{
  "additionalProp1": "string",
  "additionalProp2": "string",
  "additionalProp3": "string"
}
```

> The response body is a free-form map. Treat this as an acknowledgement payload — do not rely on specific field names.

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

No requirement exists for the provided `categoryId`.

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

- Called by `adminVehiclesFacade.deleteCategoryRequirement(categoryId)` via `useDeleteVehicleCategoryRequirement` mutation
- On `onSuccess`, invalidate `vehicleCategoryRequirementsKeys.all` and `vehicleCategoryRequirementsKeys.byCategory(categoryId)`
- Always show a `ConfirmDialog` before calling this mutation — deletion reverts to the global min year rule
- Requires `VEHICLE_ADMIN_DELETE` permission — gate with `<Can perform={Permission.VEHICLE_ADMIN_DELETE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
