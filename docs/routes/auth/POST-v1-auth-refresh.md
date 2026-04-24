# POST /v1/auth/refresh

**Tag:** Authentication  
**Summary:** Renew access token  
**Description:** Renews the access token using a valid refresh token. The refresh token can be sent via header, cookie, or request body.

---

## Parameters

| Name              | Location | Type   | Required | Description                            |
|-------------------|----------|--------|----------|----------------------------------------|
| `X-Refresh-Token` | header   | string | No       | Refresh token sent as a request header |
| `refreshToken`    | cookie   | string | No       | Refresh token sent as an HTTP cookie   |

> At least one of the three delivery methods (header, cookie, or body) must be provided.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field          | Type   | Required | Description                    |
|----------------|--------|----------|--------------------------------|
| `refreshToken` | string | No       | Refresh token UUID (body form) |

---

## Responses

### 200 — OK

Token renewed successfully. Returns a new token pair.

```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field          | Type   | Description                      |
|----------------|--------|----------------------------------|
| `accessToken`  | string | New JWT access token             |
| `refreshToken` | string | New refresh token UUID (rotated) |

> **Token rotation:** The refresh token is rotated on every successful refresh. The old token is immediately invalidated. Always store the new `refreshToken` returned in the response.

---

### 400 — Bad Request

No refresh token provided or malformed request.

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "refreshToken": "string"
    }
  }
}
```

---

### 401 — Unauthorized

Refresh token is expired or has already been used.

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
      "refreshToken": "string"
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

| Code             | HTTP | Description                              |
|------------------|------|------------------------------------------|
| `USER_NOT_FOUND` | 404  | User associated with the token not found |

---

## Frontend Integration Notes

- This endpoint is called automatically by `authFacade.refreshAccessToken()`
- A mutex pattern prevents duplicate concurrent refresh calls
- On `401` from this endpoint, clear all tokens and redirect to `/login?reason=session_expired`
- See [Auth & Permissions Guide](../../implementation/auth-and-permissions.md) for the mutex implementation
