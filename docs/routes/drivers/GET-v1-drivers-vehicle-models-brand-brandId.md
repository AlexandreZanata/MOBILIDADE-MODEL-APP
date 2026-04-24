# GET /v1/drivers/vehicle-models/brand/{brandId}

**Tag:** Drivers  
**Summary:** List models by brand  
**Description:** Returns models for a specific brand. Supports cursor pagination, filters, text search, and sorting.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name      | Location | Type    | Required | Description                                                              |
|-----------|----------|---------|----------|--------------------------------------------------------------------------|
| `brandId` | path     | string  | Yes      | UUID of the vehicle brand                                                |
| `cursor`  | query    | string  | No       | Pagination cursor (UUID of the last item from the previous page)         |
| `limit`   | query    | integer | No       | Items per page — range 1–100, default `20`                               |
| `sort`    | query    | string  | No       | Sort expression (e.g. `name`). Prefix `-` for descending order           |
| `q`       | query    | string  | No       | Full-text search query                                                   |

**Supported filter parameters:**

| Parameter | Operators        | Example                  |
|-----------|------------------|--------------------------|
| `name`    | `eq`, `contains` | `name[contains]=corolla` |

**Example URL:**

```
GET /v1/drivers/vehicle-models/brand/018f1234-5678-9abc-def0-123456789abc?limit=20&sort=name
```

---

## Request Body

None.

---

## Responses

### 200 — Brand model list

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

See [GET /v1/drivers/vehicle-models](./GET-v1-drivers-vehicle-models.md) for the full field reference — the response shape is identical.

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

- Called by `driversFacade.listModelsByBrand(brandId, params)` via `useVehicleModelsByBrand(brandId)` query
- Cache with TanStack Query using `vehicleModelsKeys.byBrand(brandId)`
- Prefer this endpoint over the generic models list when the driver has already selected a brand
- On `401`, the facade layer triggers the token refresh flow automatically
