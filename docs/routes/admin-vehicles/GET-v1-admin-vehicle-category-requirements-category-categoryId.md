# GET /v1/admin/vehicle-category-requirements/category/{categoryId}

**Tag:** Admin - Vehicle Category Requirements  
**Summary:** Get requirement by category  
**Description:** Returns the vehicle year requirement for a specific service category.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name         | Location | Type   | Required | Description                    |
|--------------|----------|--------|----------|--------------------------------|
| `categoryId` | path     | string | Yes      | UUID of the service category   |

**Example URL:**

```
GET /v1/admin/vehicle-category-requirements/category/018f1234-5678-9abc-def0-123456789abc
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
  "serviceCategoryId": "018f1234-5678-9abc-def0-123456789abc",
  "minYear": 2015,
  "createdAt": "2025-12-03T08:00:00Z",
  "updatedAt": "2025-12-03T08:00:00Z"
}
```

| Field               | Type   | Description                                                    |
|---------------------|--------|----------------------------------------------------------------|
| `id`                | string | Requirement UUID                                               |
| `serviceCategoryId` | string | UUID of the associated service category                        |
| `minYear`           | number | Minimum vehicle manufacture year for this category (1900–2100) |
| `createdAt`         | string | ISO 8601 creation timestamp                                    |
| `updatedAt`         | string | ISO 8601 last update timestamp                                 |

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

- Called by `adminVehiclesFacade.getCategoryRequirement(categoryId)` via `useAdminVehicleCategoryRequirement(categoryId)` query
- Cache with TanStack Query using `vehicleCategoryRequirementsKeys.byCategory(categoryId)`
- Requires `VEHICLE_ADMIN_VIEW` permission — gate with `<Can perform={Permission.VEHICLE_ADMIN_VIEW}>`
- On `401`, the facade layer triggers the token refresh flow automatically
