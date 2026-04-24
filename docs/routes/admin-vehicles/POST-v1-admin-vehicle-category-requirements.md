# POST /v1/admin/vehicle-category-requirements

**Tag:** Admin - Vehicle Category Requirements  
**Summary:** Create or update vehicle category requirement  
**Description:** Creates or updates the minimum vehicle year requirement for a specific service category.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "serviceCategoryId": "018f1234-5678-9abc-def0-123456789abc",
  "minYear": 2015
}
```

| Field               | Type    | Required | Constraints        | Description                                        |
|---------------------|---------|----------|--------------------|----------------------------------------------------|
| `serviceCategoryId` | string  | Yes      | UUID format        | UUID of the service category to configure          |
| `minYear`           | integer | Yes      | min 1900, max 2100 | Minimum vehicle manufacture year for this category |

---

## Responses

### 201 — Created

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "serviceCategoryId": "018f1234-5678-9abc-def0-123456789def",
  "minYear": 2015,
  "createdAt": "2025-12-03T08:00:00Z",
  "updatedAt": "2025-12-03T08:00:00Z"
}
```

| Field               | Type   | Description                                                  |
|---------------------|--------|--------------------------------------------------------------|
| `id`                | string | Requirement UUID                                             |
| `serviceCategoryId` | string | UUID of the associated service category                      |
| `minYear`           | number | Minimum vehicle manufacture year for this category           |
| `createdAt`         | string | ISO 8601 creation timestamp                                  |
| `updatedAt`         | string | ISO 8601 last update timestamp                               |

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

- Called by `adminVehiclesFacade.upsertCategoryRequirement(input)` via `useUpsertVehicleCategoryRequirement` mutation
- This endpoint acts as an upsert — it creates the requirement if it doesn't exist, or updates it if it does
- On `onSuccess`, invalidate `vehicleCategoryRequirementsKeys.all` and `vehicleCategoryRequirementsKeys.byCategory(serviceCategoryId)`
- Requires `VEHICLE_ADMIN_UPDATE` permission — gate with `<Can perform={Permission.VEHICLE_ADMIN_UPDATE}>`
- On `401`, the facade layer triggers the token refresh flow automatically
