# POST /v1/admin/rides/{rideId}/cancel

**Tag:** Admin - Rides  
**Summary:** Cancel ride (administrative)  
**Description:** Cancels a ride as an administrator. Clears all related data in Redis (estimates, dispatch, offers, locks) and updates the status in the database. Also updates the driver's operational status if a driver is assigned.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name     | Location | Type   | Required | Description      |
|----------|----------|--------|----------|------------------|
| `rideId` | path     | string | Yes      | UUID of the ride |

**Example URL:**

```
POST /v1/admin/rides/018f1234-5678-9abc-def0-123456789abc/cancel
```

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "reason": "Mudança de planos"
}
```

| Field    | Type   | Required | Description                                    |
|----------|--------|----------|------------------------------------------------|
| `reason` | string | No       | Optional reason for the administrative cancel  |

---

## Responses

### 200 — Ride cancelled successfully

**Content-Type:** `application/json`

```json
{
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "status": "CANCELADA_MOTORISTA",
  "cancellationReason": "Cancelamento administrativo",
  "cancelledBy": "018f1234-5678-9abc-def0-123456789def",
  "cancelledAt": "2025-12-01T08:15:00Z",
  "cancellationFee": 0,
  "penaltyApplied": false,
  "message": "Corrida cancelada pelo administrador com sucesso."
}
```

| Field                | Type    | Description                                                          |
|----------------------|---------|----------------------------------------------------------------------|
| `rideId`             | string  | UUID of the cancelled ride                                           |
| `status`             | string  | Final ride status after cancellation                                 |
| `cancellationReason` | string  | Reason for the cancellation (nullable)                               |
| `cancelledBy`        | string  | UUID of the admin user who cancelled the ride                        |
| `cancelledAt`        | string  | ISO 8601 timestamp of the cancellation                               |
| `cancellationFee`    | number  | Fee charged — always `0` for administrative cancellations            |
| `penaltyApplied`     | boolean | Whether a penalty was applied — always `false` for admin cancels     |
| `message`            | string  | Human-readable confirmation message                                  |

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

- Called by `adminRidesFacade.cancelRide(rideId, input)` via `useAdminCancelRide` mutation
- Always show a `ConfirmDialog` before calling this mutation
- On `onSuccess`, invalidate `adminRidesKeys.all` to refresh the list
- Requires `RIDE_ADMIN_CANCEL` permission — gate with `<Can perform={Permission.RIDE_ADMIN_CANCEL}>`
- On `401`, the facade layer triggers the token refresh flow automatically
