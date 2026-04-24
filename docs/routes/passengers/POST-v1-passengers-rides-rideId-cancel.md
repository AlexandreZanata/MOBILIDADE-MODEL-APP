# POST /v1/passengers/rides/{rideId}/cancel

**Tag:** Passengers  
**Summary:** Cancel ride  
**Description:** Cancels a ride requested by the passenger. Cancellation fees may apply depending on the ride status and elapsed time. See the cancellation documentation for details on penalties.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name     | Location | Type   | Required | Description      |
|----------|----------|--------|----------|------------------|
| `rideId` | path     | string | Yes      | UUID of the ride |

**Example URL:**

```
POST /v1/passengers/rides/018f1234-5678-9abc-def0-123456789abc/cancel
```

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "reason": "Mudança de planos"
}
```

| Field    | Type   | Required | Description                          |
|----------|--------|----------|--------------------------------------|
| `reason` | string | No       | Optional reason for the cancellation |

---

## Responses

### 200 — Ride cancelled successfully

**Content-Type:** `application/json`

```json
{
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "status": "CANCELADA_PASSAGEIRO",
  "cancellationReason": "Mudança de planos",
  "cancelledBy": "018f1234-5678-9abc-def0-123456789def",
  "cancelledAt": "2025-12-01T08:01:00Z",
  "cancellationFee": 0,
  "penaltyApplied": false,
  "message": "Cancelamento realizado dentro do prazo de 2 minutos. Nenhuma taxa aplicada."
}
```

| Field                | Type    | Description                                                          |
|----------------------|---------|----------------------------------------------------------------------|
| `rideId`             | string  | UUID of the cancelled ride                                           |
| `status`             | string  | Always `CANCELADA_PASSAGEIRO` for passenger-initiated cancellations  |
| `cancellationReason` | string  | Reason provided by the passenger (nullable)                          |
| `cancelledBy`        | string  | UUID of the user who cancelled the ride                              |
| `cancelledAt`        | string  | ISO 8601 timestamp of the cancellation                               |
| `cancellationFee`    | number  | Fee charged for the cancellation (BRL) — `0` if within grace period  |
| `penaltyApplied`     | boolean | Whether a penalty was applied                                        |
| `message`            | string  | Human-readable message describing the cancellation outcome           |

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

- Called by `passengersFacade.cancelRide(rideId, input)` via `useCancelRide` mutation
- Always show a `ConfirmDialog` before calling this mutation — a fee may be applied
- Display `cancellationFee` and `penaltyApplied` in the confirmation dialog if available from a pre-check
- On `onSuccess`, invalidate `passengerRidesKeys.active()` and `passengerRidesKeys.list()`
- On `401`, the facade layer triggers the token refresh flow automatically
