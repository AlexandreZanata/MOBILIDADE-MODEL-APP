# GET /v1/drivers/service-categories

**Tag:** Drivers  
**Summary:** List service categories  
**Description:** Returns all available service categories for the driver to choose when registering a vehicle. Supports cursor pagination, sorting, and ordering.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name     | Location | Type    | Required | Description                                                              |
|----------|----------|---------|----------|--------------------------------------------------------------------------|
| `cursor` | query    | string  | No       | Pagination cursor (UUID of the last item from the previous page)         |
| `limit`  | query    | integer | No       | Items per page — range 1–100, default `20`                               |
| `sort`   | query    | string  | No       | Sort expression (e.g. `name`). Prefix `-` for descending order           |

---

## Request Body

None.

---

## Responses

### 200 — Service category list

**Content-Type:** `application/json`

```json
{
  "items": [
    {
      "id": "018f1234-5678-9abc-def0-123456789abc",
      "name": "Econômico",
      "slug": "economico",
      "baseFare": "5.00",
      "perKmRate": "2.50",
      "minFare": "10.00",
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
| `items`      | array   | Array of service category objects               |
| `nextCursor` | string  | Cursor for the next page (nullable)             |
| `prevCursor` | string  | Cursor for the previous page (nullable)         |
| `hasMore`    | boolean | Whether more pages exist after the current one  |

#### Item Object Fields

| Field       | Type   | Description                                   |
|-------------|--------|-----------------------------------------------|
| `id`        | string | Service category UUID                         |
| `name`      | string | Display name of the category                  |
| `slug`      | string | URL-safe identifier for the category          |
| `baseFare`  | string | Base fare as a decimal string (BRL)           |
| `perKmRate` | string | Per-km rate as a decimal string (BRL)         |
| `minFare`   | string | Minimum fare as a decimal string (BRL)        |
| `createdAt` | string | ISO 8601 creation timestamp                   |
| `updatedAt` | string | ISO 8601 last update timestamp                |

> Note: `baseFare`, `perKmRate`, and `minFare` are returned as decimal strings (e.g. `"5.00"`) in this endpoint.

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

- Called by `driversFacade.listServiceCategories(params)` via `useDriverServiceCategories` query
- Cache with TanStack Query using `driverServiceCategoriesKeys.list(params)`
- Fare fields are decimal strings — parse with `parseFloat()` if numeric display is needed
- On `401`, the facade layer triggers the token refresh flow automatically
