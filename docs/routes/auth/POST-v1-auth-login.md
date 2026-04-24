# POST /v1/auth/login

**Tag:** Authentication  
**Summary:** User login  
**Description:** Authenticates a user and returns an access token and a refresh token.

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "email": "admin@vamu.local",
  "password": "Admin123!"
}
```

| Field      | Type   | Required | Description        |
|------------|--------|----------|--------------------|
| `email`    | string | Yes      | User email address |
| `password` | string | Yes      | User password      |

---

## Responses

### 200 — OK

Authentication is successful. Returns tokens and user data.

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "email": "admin@vamu.local",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
  "roles": ["admin"],
  "emailVerified": true,
  "emailVerifiedAt": "2025-11-28T16:00:00Z",
  "createdAt": "2025-11-28T16:00:00Z"
}
```

| Field             | Type     | Description                              |
|-------------------|----------|------------------------------------------|
| `id`              | string   | User UUID                                |
| `email`           | string   | User email address                       |
| `accessToken`     | string   | JWT access token (short-lived)           |
| `refreshToken`    | string   | Refresh token UUID (long-lived)          |
| `roles`           | string[] | List of roles assigned to the user       |
| `emailVerified`   | boolean  | Whether the email has been verified      |
| `emailVerifiedAt` | string   | ISO 8601 timestamp of email verification |
| `createdAt`       | string   | ISO 8601 timestamp of account creation   |

---

### 400 — Bad Request

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "email": "string",
      "password": "string"
    }
  }
}
```

---

### 401 — Unauthorized

Invalid credentials.

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {}
  }
}
```

---

### 403 — Forbidden

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {}
  }
}
```

---

### 404 — Not Found

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {}
  }
}
```

---

### 422 — Validation Error

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "email": "string",
      "password": "string"
    }
  }
}
```

---

### 500 — Internal Server Error

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {}
  }
}
```

---

## Error Code Reference

| Code             | HTTP | Description                        |
|------------------|------|------------------------------------|
| `USER_NOT_FOUND` | 404  | No user found with the given email |

---

## Frontend Integration Notes

- Store `accessToken` in module-level memory (never in `localStorage`)
- Store `refreshToken` in `sessionStorage`
- On `401` response, trigger the refresh flow via `authFacade`
- See [Auth & Permissions Guide](../../implementation/auth-and-permissions.md) for the full token lifecycle
