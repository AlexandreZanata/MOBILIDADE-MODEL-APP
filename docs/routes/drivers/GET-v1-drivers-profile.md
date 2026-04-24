# GET /v1/drivers/profile

**Tag:** Drivers  
**Summary:** Get driver profile  
**Description:** Returns the complete profile of the authenticated driver.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Driver profile

**Content-Type:** `application/json`

```json
{
  "userId": "018f1234-5678-9abc-def0-123456789abc",
  "cnhNumber": "12345678901",
  "status": "AWAITING_CNH",
  "createdAt": "2025-12-01T08:00:00Z",
  "updatedAt": "2025-12-01T09:00:00Z"
}
```

| Field       | Type   | Description                                                                                            |
|-------------|--------|--------------------------------------------------------------------------------------------------------|
| `userId`    | string | UUID of the driver's user account                                                                      |
| `cnhNumber` | string | Brazilian driver's license number (CNH)                                                                |
| `status`    | string | Driver onboarding/operational status (e.g. `ONBOARDING`, `AWAITING_CNH`, `AWAITING_VEHICLE`, `ACTIVE`) |
| `createdAt` | string | ISO 8601 creation timestamp                                                                            |
| `updatedAt` | string | ISO 8601 last update timestamp                                                                         |

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

- Called by `driversFacade.getProfile()` via `useDriverProfile` query
- Cache with TanStack Query using `driverProfileKeys.me()`
- Invalidate after `POST /v1/drivers/profile-photo` and `DELETE /v1/drivers/profile-photo`
- On `401`, the facade layer triggers the token refresh flow automatically
