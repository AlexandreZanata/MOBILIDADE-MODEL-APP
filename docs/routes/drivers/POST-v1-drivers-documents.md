# POST /v1/drivers/documents

**Tag:** Drivers  
**Summary:** Upload document  
**Description:** Uploads a CNH or vehicle CRLV document.  
**Content-Type:** `multipart/form-data`  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

**Workflow requirements:**
- `CNH` upload requires driver status `AWAITING_CNH`
- `VEHICLE_DOC` upload requires driver status `AWAITING_VEHICLE`

---

## Parameters

| Name           | Location | Type   | Required | Description                                                    |
|----------------|----------|--------|----------|----------------------------------------------------------------|
| `documentType` | query    | string | Yes      | Type of document — `CNH` or `VEHICLE_DOC`                      |
| `vehicleId`    | query    | string | No       | UUID of the vehicle — required when `documentType=VEHICLE_DOC` |

**Example URL:**

```
POST /v1/drivers/documents?documentType=VEHICLE_DOC&vehicleId=018f1234-5678-9abc-def0-123456789abc
```

---

## Request Body

**Content-Type:** `multipart/form-data`

| Field  | Type   | Required | Description                          |
|--------|--------|----------|--------------------------------------|
| `file` | binary | Yes      | CNH or CRLV document file            |

---

## Responses

### 201 — Created

Returns a free-form map of additional properties.

**Content-Type:** `application/json`

```json
{
  "additionalProp1": "string",
  "additionalProp2": "string",
  "additionalProp3": "string"
}
```

> The response body is a free-form map. Treat this as an acknowledgement payload — do not rely on specific field names.

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

- Called by `driversFacade.uploadDocument(params, file)` via `useUploadDocument` mutation
- Use `FormData` to construct the multipart request — never send as JSON
- Pass `documentType` and `vehicleId` as query parameters, not in the form body
- On `onSuccess`, invalidate `driverValidationKeys.status()` to refresh the onboarding status
- On `401`, the facade layer triggers the token refresh flow automatically
