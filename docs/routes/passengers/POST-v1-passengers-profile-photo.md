# POST /v1/passengers/profile-photo

**Tag:** Passengers  
**Summary:** Upload profile photo  
**Description:** Uploads the passenger's profile photo.  
**Content-Type:** `multipart/form-data`  
**Accepted formats:** JPEG, PNG, GIF, WebP  
**Recommended max size:** 5 MB  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `multipart/form-data`

| Field  | Type   | Required | Description                      |
|--------|--------|----------|----------------------------------|
| `file` | binary | Yes      | Image file for the profile photo |

---

## Responses

### 200 — Profile photo updated successfully

**Content-Type:** `application/json`

```json
{
  "message": "Foto de perfil atualizada com sucesso",
  "photoUrl": "uploads/profile-photos/018f1234-5678-9abc-def0-123456789abc/profile018f1234-5678-9abc-def0-123456789def.jpg"
}
```

| Field      | Type   | Description                                 |
|------------|--------|---------------------------------------------|
| `message`  | string | Human-readable success message              |
| `photoUrl` | string | Relative path to the uploaded profile photo |

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

- Called by `passengersFacade.uploadProfilePhoto(file)` via `useUploadPassengerProfilePhoto` mutation
- Use `FormData` to construct the multipart request — never send as JSON
- On `onSuccess`, invalidate `passengerProfileKeys.me()` to refresh the cached profile
- On `401`, the facade layer triggers the token refresh flow automatically
