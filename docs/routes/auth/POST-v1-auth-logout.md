# POST /v1/auth/logout

**Tag:** Authentication  
**Summary:** Logout  
**Description:** Revokes the refresh token and invalidates the current session. The access token will expire naturally (it cannot be revoked server-side).

---

## Parameters

| Name              | Location | Type   | Required | Description                                    |
|-------------------|----------|--------|----------|------------------------------------------------|
| `Authorization`   | header   | string | No       | Bearer access token (`Bearer <accessToken>`)   |
| `X-Refresh-Token` | header   | string | No       | Refresh token sent as a request header         |
| `refreshToken`    | cookie   | string | No       | Refresh token sent as an HTTP cookie           |

> At least one refresh token delivery method (header or cookie) should be provided to ensure the server-side session is fully invalidated.

---

## Request Body

None.

---

## Responses

### 204 — No Content

Logout successfully. No response body.

---

### 400 — Bad Request

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

### 401 — Unauthorized

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
    "fields": {}
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

- Called by `authFacade.logout()` — never call directly from a component
- After a successful `204`, the facade must:
  1. Clear `accessToken` from module memory
  2. Clear `refreshToken` from `sessionStorage`
  3. Call `authStore.clear()`
  4. Redirect to `/login`
- Even on network error, the client-side session must be cleared
- See [Auth & Permissions Guide](../../implementation/auth-and-permissions.md) for the full logout flow
