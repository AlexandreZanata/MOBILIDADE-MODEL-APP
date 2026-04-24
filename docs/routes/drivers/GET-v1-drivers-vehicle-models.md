# GET /v1/drivers/vehicle-models

**Tag:** Drivers  
**Summary:** List vehicle models  
**Description:** Returns available vehicle models for the driver to choose when registering a vehicle. Supports cursor pagination, filters, text search, and sorting.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name      | Location | Type    | Required | Description                                                              |
|-----------|----------|---------|----------|--------------------------------------------------------------------------|
| `cursor`  | query    | string  | No       | Pagination cursor (UUID of the last item from the previous page)         |
| `limit`   | query    | integer | No       | Items per page — range 1–100, default `20`                               |
| `sort`    | query    | string  | No       | Sort expression (e.g. `name`). Prefix `-` for descending order           |
| `q`       | query    | string  | No       | Full-text search query                                                   |

**Supported filter parameters:**

| Parameter | Operators        | Example                    |
|-----------|------------------|----------------------------|
| `brandId` | `eq`             | `brandId[eq]=018f1234-...` |
| `name`    | `eq`, `contains` | `name[contains]=corolla`   |

---

## Request Body

None.

---

## Responses

### 200 — Vehicle model list

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "018f1234-5678-9abc-def0-123456789abc",
      "brandId": "018f1234-5678-9abc-def0-123456789def",
      "name": "Corolla",
      "slug": "corolla",
      "createdAt": "2025-12-01T08:00:00Z",
      "updatedAt": "2025-12-01T08:00:00Z"
    }
  ],
  "nextCursor": null,
  "prevCursor": null,
  "hasMore": false
}
```

| Field        | Type    | Description                                     |
|--------------|---------|-------------------------------------------------|
| `items`      | array   | Array of vehicle model objects                  |
| `nextCursor` | string  | Cursor for the next page (nullable)             |
| `prevCursor` | string  | Cursor for the previous page (nullable)         |
| `hasMore`    | boolean | Whether more pages exist after the current one  |

#### Item Object Fields

| Field       | Type   | Description                           |
|-------------|--------|---------------------------------------|
| `id`        | string | Vehicle model UUID                    |
| `brandId`   | string | UUID of the associated vehicle brand  |
| `name`      | string | Model name                            |
| `slug`      | string | URL-safe identifier for the model     |
| `createdAt` | string | ISO 8601 creation timestamp           |
| `updatedAt` | string | ISO 8601 last update timestamp        |

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

- Called by `driversFacade.listVehicleModels(params)` via `useVehicleModels` query
- Cache with TanStack Query using `vehicleModelsKeys.list(params)`
- Use `brandId[eq]` filter to load models after the driver selects a brand
- See also: [GET /v1/drivers/vehicle-models/brand/{brandId}](./GET-v1-drivers-vehicle-models-brand-brandId.md) for a brand-scoped shortcut
- On `401`, the facade layer triggers the token refresh flow automatically
