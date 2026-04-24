# GET /v1/admin/vehicle-reference/min-year

**Tag:** Admin - Vehicle Reference  
**Summary:** Get minimum year configuration  
**Description:** Returns the global minimum vehicle manufacture year configuration.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

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
  "minYear": 2000,
  "createdAt": "2025-12-01T08:00:00Z",
  "updatedAt": "2025-12-01T09:00:00Z"
}
```

| Field       | Type   | Description                                                   |
|-------------|--------|---------------------------------------------------------------|
| `id`        | string | Configuration UUID                                            |
| `minYear`   | number | Minimum manufacture year allowed for all vehicles (1900–2100) |
| `createdAt` | string | ISO 8601 creation timestamp                                   |
| `updatedAt` | string | ISO 8601 last update timestamp                                |

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

- Called by `vehicleReferenceFacade.getMinYear()` via `useAdminVehicleMinYear` query
- Cache with TanStack Query using `vehicleReferenceKeys.minYear()`
- Invalidate after `PATCH /v1/admin/vehicle-reference/min-year`
- Requires `VEHICLE_REFERENCE_VIEW` permission — gate with `<Can perform={Permission.VEHICLE_REFERENCE_VIEW}>`
- On `401`, the facade layer triggers the token refresh flow automatically
