# GET /v1/profile-photos/{userId}

**Tag:** Profile Photos  
**Summary:** Get profile photo  
**Description:** Returns the profile photo of a user. This endpoint is public and does not require authentication.  
**Authentication:** None required.

---

## Parameters

| Name     | Location | Type   | Required | Description        |
|----------|----------|--------|----------|--------------------|
| `userId` | path     | string | Yes      | UUID of the user   |

**Example URL:**

```
GET /v1/profile-photos/018f1234-5678-9abc-def0-123456789abc
```

---

## Request Body

None.

---

## Responses

### 200 — Profile photo found

Returns the raw image file as a binary stream.

**Content-Type:** `image/*` (JPEG, PNG, GIF, or WebP depending on the uploaded file)

```
<binary image data>
```

> The response body is the raw image binary, not a JSON object. Use this URL directly as the `src` of an `<img>` element.

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

No profile photo exists for the provided `userId`.

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

- This endpoint is public — no Bearer token required
- Use the URL directly as the `src` attribute of an `<img>` element
- On `404`, render a fallback avatar (initials or placeholder icon)
- The `photoUrl` returned by `POST /v1/drivers/profile-photo` and `POST /v1/passengers/profile-photo` is a relative path — construct the full URL by prepending the API base URL
