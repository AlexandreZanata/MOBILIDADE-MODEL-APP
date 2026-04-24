# GET /v1/drivers/vehicle-requirements

**Tag:** Drivers  
**Summary:** Get vehicle requirements  
**Description:** Returns vehicle requirements (minimum year) for all service categories. Includes the global requirement and category-specific requirements.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Vehicle requirements

**Content-Type:** `application/json`

```json
{
  "globalMinYear": 2000,
  "categoryRequirements": [
    {
      "categoryId": "018f1234-5678-9abc-def0-123456789abc",
      "categoryName": "Econômico",
      "categorySlug": "economico",
      "minYear": null
    },
    {
      "categoryId": "018f1234-5678-9abc-def0-123456789def",
      "categoryName": "Confort",
      "categorySlug": "confort",
      "minYear": 2015
    }
  ]
}
```

| Field                  | Type   | Description                                                              |
|------------------------|--------|--------------------------------------------------------------------------|
| `globalMinYear`        | number | Minimum manufacture year applied to all categories unless overridden     |
| `categoryRequirements` | array  | Per-category requirement overrides                                       |

#### `categoryRequirements[]` Item Fields

| Field          | Type   | Description                                                                   |
|----------------|--------|-------------------------------------------------------------------------------|
| `categoryId`   | string | UUID of the service category                                                  |
| `categoryName` | string | Display name of the service category                                          |
| `categorySlug` | string | URL-safe identifier of the service category                                   |
| `minYear`      | number | Minimum manufacture year for this category — `null` means global rule applies |

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

- Called by `driversFacade.getVehicleRequirements()` via `useVehicleRequirements` query
- Cache with TanStack Query using `driverVehiclesKeys.requirements()`
- Use `minYear` (or `globalMinYear` when `minYear` is `null`) to validate the vehicle year field before submission
- On `401`, the facade layer triggers the token refresh flow automatically
