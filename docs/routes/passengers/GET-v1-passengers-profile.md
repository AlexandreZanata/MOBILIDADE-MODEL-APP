# GET /v1/passengers/profile

**Tag:** Passengers  
**Summary:** Get passenger profile  
**Description:** Returns the complete profile of the authenticated passenger.  
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
  "userId": "018f1234-5678-9abc-def0-123456789abc",
  "name": "Maria Santos",
  "email": "maria.santos@example.com",
  "cpf": "123.456.789-01",
  "phone": "(11) 98765-4321",
  "birthDate": "1990-05-15",
  "emailVerified": true,
  "emailVerifiedAt": "2025-12-01T08:00:00Z",
  "createdAt": "2025-12-01T08:00:00Z",
  "updatedAt": "2025-12-01T09:00:00Z",
  "photoUrl": "uploads/profile-photos/018f1234-5678-9abc-def0-123456789abc/profile018f1234-5678-9abc-def0-123456789def.jpg"
}
```

| Field             | Type    | Description                                          |
|-------------------|---------|------------------------------------------------------|
| `userId`          | string  | UUID of the passenger's user account                 |
| `name`            | string  | Full name of the passenger                           |
| `email`           | string  | Email address                                        |
| `cpf`             | string  | Brazilian CPF (formatted)                            |
| `phone`           | string  | Phone number (formatted)                             |
| `birthDate`       | string  | Date of birth in `YYYY-MM-DD` format                 |
| `emailVerified`   | boolean | Whether the email has been verified                  |
| `emailVerifiedAt` | string  | ISO 8601 timestamp of email verification (nullable)  |
| `createdAt`       | string  | ISO 8601 creation timestamp                          |
| `updatedAt`       | string  | ISO 8601 last update timestamp                       |
| `photoUrl`        | string  | Relative path to the profile photo (nullable)        |

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

- Called by `passengersFacade.getProfile()` via `usePassengerProfile` query
- Cache with TanStack Query using `passengerProfileKeys.me()`
- Invalidate after `POST /v1/passengers/profile-photo` and `DELETE /v1/passengers/profile-photo`
- On `401`, the facade layer triggers the token refresh flow automatically
