# GET /v1/admin/service-categories

**Tag:** Admin - Service Categories  
**Summary:** List service categories  
**Description:** Returns service categories with cursor pagination, filters, text search, and sorting.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name         | Location | Type    | Required | Description                                                                 |
|--------------|----------|---------|----------|-----------------------------------------------------------------------------|
| `cursor`     | query    | string  | No       | Pagination cursor (UUID of the last item from the previous page)            |
| `limit`      | query    | integer | No       | Items per page — range 1–100, default `20`                                  |
| `sort`       | query    | string  | No       | Sort expression (e.g. `-createdAt,name`). Prefix `-` for descending order   |
| `q`          | query    | string  | No       | Full-text search query                                                      |

**Supported filter parameters (not listed above):**

| Parameter   | Operators        | Example                    |
|-------------|------------------|----------------------------|
| `name`      | `eq`, `contains` | `name[contains]=econômico` |
| `slug`      | `eq`, `contains` | `slug[eq]=economico`       |
| `baseFare`  | `gte`, `lte`     | `baseFare[gte]=5`          |
| `perKmRate` | `gte`, `lte`     | `perKmRate[lte]=3`         |
| `minFare`   | `gte`, `lte`     | `minFare[gte]=10`          |

**Example URL:**

```
GET /v1/admin/service-categories?limit=20&sort=-createdAt,name&q=econômico
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
  "items": [
    {
      "id": "018f1234-5678-9abc-def0-123456789abc",
      "name": "Econômico",
      "slug": "economico",
      "baseFare": 5,
      "perKmRate": 2.5,
      "minFare": 10,
      "createdAt": "2025-12-01T08:00:00Z",
      "updatedAt": "2025-12-01T09:00:00Z"
    }
  ],
  "nextCursor": "018f1234-5678-9abc-def0-123456789abc",
  "prevCursor": "018f1234-5678-9abc-def0-123456789abc",
  "hasMore": true,
  "totalCount": 1523
}
```

| Field        | Type    | Description                                                      |
|--------------|---------|------------------------------------------------------------------|
| `items`      | array   | Array of service category objects for the current page           |
| `nextCursor` | string  | Cursor to pass as `cursor` to fetch the next page (nullable)     |
| `prevCursor` | string  | Cursor to pass as `cursor` to fetch the previous page (nullable) |
| `hasMore`    | boolean | Whether more pages exist after the current one                   |
| `totalCount` | number  | Total number of records matching the current filters             |

#### Item Object Fields

| Field       | Type   | Description                                      |
|-------------|--------|--------------------------------------------------|
| `id`        | string | Service category UUID                            |
| `name`      | string | Display name of the category                     |
| `slug`      | string | URL-safe identifier for the category             |
| `baseFare`  | number | Base fare charged at the start of a ride (BRL)   |
| `perKmRate` | number | Rate charged per kilometer (BRL)                 |
| `minFare`   | number | Minimum fare for any ride in this category (BRL) |
| `createdAt` | string | ISO 8601 creation timestamp                      |
| `updatedAt` | string | ISO 8601 last update timestamp                   |

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

Missing or invalid Bearer token.

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

Authenticated user does not have the required role or permission.

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

All error responses share the same envelope shape:

| Field           | Type   | Description                                     |
|-----------------|--------|-------------------------------------------------|
| `error.message` | string | Human-readable error description                |
| `error.code`    | string | Machine-readable error code                     |
| `error.fields`  | object | Map of field names to validation error messages |

---

## Frontend Integration Notes

- Called by `serviceCategoriesFacade.list(params)` via `useServiceCategories` query
- Cache with TanStack Query using `serviceCategoriesKeys.list(params)`
- Pass `nextCursor` as the `cursor` param for the next page fetch
- Requires `SERVICE_CATEGORY_VIEW` permission — gate with `<Can perform={Permission.SERVICE_CATEGORY_VIEW}>`
- On `401`, the facade layer triggers the token refresh flow automatically
- On `403`, render an `<AccessDenied />` fallback via `<Can>`
