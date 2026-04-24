# GET /v1/admin/vehicle-category-requirements

**Tag:** Admin - Vehicle Category Requirements  
**Summary:** List all requirements  
**Description:** Returns all vehicle category requirements configured in the system.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Requirements list

**Content-Type:** `application/json`

Returns an array of vehicle category requirement objects.

```json
[
  {
    "id": "018f1234-5678-9abc-def0-123456789abc",
    "serviceCategoryId": "018f1234-5678-9abc-def0-123456789abc",
    "minYear": 2015,
    "createdAt": "2025-12-03T08:00:00Z",
    "updatedAt": "2025-12-03T08:00:00Z"
  }
]
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

- Called by `adminVehiclesFacade.listCategoryRequirements()` via `useAdminVehicleCategoryRequirements` query
- Cache with TanStack Query using `vehicleCategoryRequirementsKeys.all`
- Response is a flat array — no pagination
- Requires `VEHICLE_ADMIN_VIEW` permission — gate with `<Can perform={Permission.VEHICLE_ADMIN_VIEW}>`
- On `401`, the facade layer triggers the token refresh flow automatically
