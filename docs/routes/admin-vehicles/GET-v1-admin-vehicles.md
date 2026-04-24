# GET /v1/admin/vehicles

**Tag:** Admin - Vehicles  
**Summary:** List all vehicles  
**Description:** Lists all vehicles registered in the system with cursor pagination, filters, text search, and sorting.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name     | Location | Type    | Required | Description                                                                 |
|----------|----------|---------|----------|-----------------------------------------------------------------------------|
| `cursor` | query    | string  | No       | Pagination cursor (UUID of the last item from the previous page)            |
| `limit`  | query    | integer | No       | Items per page — range 1–100, default `20`                                  |
| `sort`   | query    | string  | No       | Sort expression (e.g. `-createdAt,licensePlate`). Prefix `-` for descending |
| `q`      | query    | string  | No       | Full-text search on plate, brand, model, and color                          |

---

## Request Body

None.

---

## Responses

### 200 — Vehicle list

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "018f1234-5678-9abc-def0-123456789abc",
      "driverProfileId": "018f1234-5678-9abc-def0-123456789def",
      "serviceCategoryId": "018f1234-5678-9abc-def0-123456789ghi",
      "licensePlate": "ABC-1234",
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "color": "Branco",
      "status": "APPROVED",
      "createdAt": "2025-12-01T08:00:00Z",
      "updatedAt": "2025-12-01T08:00:00Z"
    }
  ],
  "nextCursor": "018f1234-5678-9abc-def0-123456789abc",
  "prevCursor": null,
  "hasMore": true,
  "totalCount": null
}
```

| Field        | Type    | Description                                                     |
|--------------|---------|-----------------------------------------------------------------|
| `items`      | array   | Array of vehicle objects for the current page                   |
| `nextCursor` | string  | Cursor for the next page (nullable)                             |
| `prevCursor` | string  | Cursor for the previous page (nullable)                         |
| `hasMore`    | boolean | Whether more pages exist after the current one                  |
| `totalCount` | number  | Total record count — `null` when not computed by the server     |

#### Item Object Fields

| Field               | Type   | Description                                                               |
|---------------------|--------|---------------------------------------------------------------------------|
| `id`                | string | Vehicle UUID                                                              |
| `driverProfileId`   | string | UUID of the driver profile that owns this vehicle                         |
| `serviceCategoryId` | string | UUID of the service category (nullable if not yet assigned)               |
| `licensePlate`      | string | Vehicle license plate                                                     |
| `brand`             | string | Vehicle brand name                                                        |
| `model`             | string | Vehicle model name                                                        |
| `year`              | number | Vehicle manufacture year                                                  |
| `color`             | string | Vehicle color                                                             |
| `status`            | string | Vehicle status — `PENDING_DOCS`, `PENDING_REVIEW`, `APPROVED`, `REJECTED` |
| `createdAt`         | string | ISO 8601 creation timestamp                                               |
| `updatedAt`         | string | ISO 8601 last update timestamp                                            |

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

- Called by `adminVehiclesFacade.list(params)` via `useAdminVehicles` query
- Cache with TanStack Query using `adminVehiclesKeys.list(params)`
- Pass `nextCursor` as the `cursor` param for the next page fetch
- `totalCount` may be `null` — do not rely on it for pagination UI
- Requires `VEHICLE_ADMIN_VIEW` permission — gate with `<Can perform={Permission.VEHICLE_ADMIN_VIEW}>`
- On `401`, the facade layer triggers the token refresh flow automatically
