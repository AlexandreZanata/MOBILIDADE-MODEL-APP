# POST /v1/passengers/register

**Tag:** Passengers  
**Summary:** Register new passenger  
**Description:** Creates a new passenger account and sends a verification code by email.  
**Authentication:** None required.

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "name": "Maria Santos",
  "email": "maria.santos@example.com",
  "phone": "11987654321",
  "cpf": "12345678901",
  "birthDate": "1990-05-15",
  "password": "Senha123!"
}
```

| Field       | Type   | Required | Description                                     |
|-------------|--------|----------|-------------------------------------------------|
| `name`      | string | Yes      | Full name of the passenger                      |
| `email`     | string | Yes      | Email address (used for login and verification) |
| `phone`     | string | Yes      | Phone number (digits only)                      |
| `cpf`       | string | Yes      | Brazilian CPF (11 digits, no formatting)        |
| `birthDate` | string | Yes      | Date of birth in `YYYY-MM-DD` format            |
| `password`  | string | Yes      | Account password                                |

---

## Responses

### 201 — Created

**Content-Type:** `application/json`

```json
{
  "userId": "018f1234-5678-9abc-def0-123456789abc",
  "email": "maria.santos@example.com",
  "verificationCodeSent": true,
  "createdAt": "2025-12-01T08:00:00Z"
}
```

| Field                  | Type    | Description                                          |
|------------------------|---------|------------------------------------------------------|
| `userId`               | string  | UUID of the newly created user account               |
| `email`                | string  | Email address of the registered passenger            |
| `verificationCodeSent` | boolean | Whether the email verification code was sent         |
| `createdAt`            | string  | ISO 8601 creation timestamp                          |

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

- Called by `passengersFacade.register(input)` — no authentication required
- After `201`, redirect to the email verification step (`POST /v1/passengers/verify-email`)
