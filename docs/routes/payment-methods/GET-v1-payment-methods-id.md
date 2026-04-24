# GET /v1/payment-methods/{id}

**Tag:** Payment Methods  
**Summary:** Get payment method by ID  
**Description:** Returns a specific payment method.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name | Location | Type   | Required | Description                  |
|------|----------|--------|----------|------------------------------|
| `id` | path     | string | Yes      | UUID of the payment method   |

**Example URL:**

```
GET /v1/payment-methods/018f1234-5678-9abc-def0-123456789abc
```

---

## Request Body

None.

---

## Responses

### 200 — Payment method found

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "name": "PIX",
  "slug": "pix",
  "description": "Pagamento via PIX",
  "enabled": true,
  "createdAt": "2025-12-01T08:00:00Z",
  "updatedAt": "2025-12-01T09:00:00Z"
}
```

| Field         | Type    | Description                                     |
|---------------|---------|-------------------------------------------------|
| `id`          | string  | Payment method UUID                             |
| `name`        | string  | Display name of the payment method              |
| `slug`        | string  | URL-safe identifier for the payment method      |
| `description` | string  | Human-readable description of the method        |
| `enabled`     | boolean | Whether the payment method is currently enabled |
| `createdAt`   | string  | ISO 8601 creation timestamp                     |
| `updatedAt`   | string  | ISO 8601 last update timestamp                  |

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

No payment method exists with the provided `id`.

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

- Called by `paymentMethodsFacade.getById(id)` via `usePaymentMethod(id)` query
- Cache with TanStack Query using `paymentMethodsKeys.detail(id)`
- On `401`, the facade layer triggers the token refresh flow automatically
