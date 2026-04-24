# POST /v1/drivers/register

**Tag:** Drivers  
**Summary:** Register new driver  
**Description:** Creates a new driver account and sends a verification code by email.  
**Authentication:** None required.

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "phone": "(11) 98765-4321",
  "cpf": "12345678901",
  "password": "Senha123!",
  "cnhNumber": "12345678901",
  "cnhExpirationDate": "2025-12-31",
  "cnhCategory": "B"
}
```

| Field               | Type   | Required | Description                                     |
|---------------------|--------|----------|-------------------------------------------------|
| `name`              | string | Yes      | Full name of the driver                         |
| `email`             | string | Yes      | Email address (used for login and verification) |
| `phone`             | string | Yes      | Phone number                                    |
| `cpf`               | string | Yes      | Brazilian CPF (11 digits, no formatting)        |
| `password`          | string | Yes      | Account password                                |
| `cnhNumber`         | string | Yes      | Brazilian driver's license number (CNH)         |
| `cnhExpirationDate` | string | Yes      | CNH expiration date in `YYYY-MM-DD` format      |
| `cnhCategory`       | string | Yes      | CNH category (e.g. `B`, `C`, `D`)               |

---

## Responses

### 201 — Driver registered successfully

**Content-Type:** `application/json`

```json
{
  "userId": "018f1234-5678-9abc-def0-123456789abc",
  "email": "driver@example.com",
  "status": "ONBOARDING",
  "verificationCodeSent": true,
  "createdAt": "2025-12-01T08:00:00Z"
}
```

| Field                  | Type    | Description                                          |
|------------------------|---------|------------------------------------------------------|
| `userId`               | string  | UUID of the newly created user account               |
| `email`                | string  | Email address of the registered driver               |
| `status`               | string  | Initial driver status — always `ONBOARDING`          |
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

- Called by `driversFacade.register(input)` — no authentication required
- After `201`, redirect to the email verification step (`POST /v1/drivers/verify-email`)
- Driver status starts as `ONBOARDING` and progresses through the onboarding workflow
