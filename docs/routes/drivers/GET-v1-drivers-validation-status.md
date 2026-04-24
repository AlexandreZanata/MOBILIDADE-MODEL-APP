# GET /v1/drivers/validation-status

**Tag:** Drivers  
**Summary:** Get validation status  
**Description:** Returns the driver's complete validation status, including email, documents, and vehicles.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Driver validation status

**Content-Type:** `application/json`

```json
{
  "workflowStatus": "CNH_REVIEW",
  "email": {
    "verified": true,
    "verifiedAt": "2025-12-01T08:00:00Z"
  },
  "cnh": {
    "status": "PENDING",
    "reviewedAt": null,
    "rejectionReason": null
  },
  "vehicles": [],
  "nextStepMessage": "CNH em análise. Aguarde a aprovação para continuar"
}
```

| Field             | Type   | Description                                                              |
|-------------------|--------|--------------------------------------------------------------------------|
| `workflowStatus`  | string | Current onboarding workflow step (e.g. `CNH_REVIEW`, `AWAITING_VEHICLE`) |
| `email`           | object | Email verification details                                               |
| `cnh`             | object | CNH document review details                                              |
| `vehicles`        | array  | List of vehicle validation objects (empty if no vehicles submitted yet)  |
| `nextStepMessage` | string | Human-readable message describing the next required action               |

#### `email` Object Fields

| Field        | Type    | Description                                          |
|--------------|---------|------------------------------------------------------|
| `verified`   | boolean | Whether the email has been verified                  |
| `verifiedAt` | string  | ISO 8601 timestamp of verification (nullable)        |

#### `cnh` Object Fields

| Field             | Type   | Description                                             |
|-------------------|--------|---------------------------------------------------------|
| `status`          | string | CNH review status — `PENDING`, `APPROVED`, `REJECTED`   |
| `reviewedAt`      | string | ISO 8601 timestamp of review (nullable)                 |
| `rejectionReason` | string | Reason for rejection if status is `REJECTED` (nullable) |

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

- Called by `driversFacade.getValidationStatus()` via `useDriverValidationStatus` query
- Cache with TanStack Query using `driverValidationKeys.status()`
- Invalidate after `POST /v1/drivers/documents` to reflect the new document submission
- Use `workflowStatus` to drive the onboarding step UI
- On `401`, the facade layer triggers the token refresh flow automatically
