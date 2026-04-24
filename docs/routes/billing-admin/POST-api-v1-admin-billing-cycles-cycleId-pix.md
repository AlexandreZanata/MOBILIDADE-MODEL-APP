# POST /api/v1/admin/billing/cycles/{cycleId}/pix

**Tag:** Billing Admin  
**Summary:** Generate PIX for a billing cycle (admin)  
**Description:** Generates a PIX QR code for payment of a specific billing cycle. Administrative endpoint — does not require the caller to be the driver associated with the cycle.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name              | Location | Type   | Required | Description                                               |
|-------------------|----------|--------|----------|-----------------------------------------------------------|
| `cycleId`         | path     | string | Yes      | UUID of the billing cycle                                 |
| `Idempotency-Key` | header   | string | No       | Client-generated UUID to prevent duplicate PIX generation |

**Example URL:**

```
POST /api/v1/admin/billing/cycles/3fa85f64-5717-4562-b3fc-2c963f66afa6/pix
```

---

## Request Body

None.

---

## Responses

### 200 — PIX generated successfully

**Content-Type:** `application/json`

```json
{
  "billingCycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "paymentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 0,
  "qrCode": "string",
  "qrCodeBase64": "string",
  "copyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000...",
  "expiresAt": "2026-04-24T16:12:41.302Z",
  "externalReference": "string",
  "generatedAt": "2026-04-24T16:12:41.302Z"
}
```

| Field               | Type   | Description                                  |
|---------------------|--------|----------------------------------------------|
| `billingCycleId`    | string | UUID of the associated billing cycle         |
| `paymentId`         | string | UUID of the payment record                   |
| `amount`            | number | Payment amount (BRL)                         |
| `qrCode`            | string | PIX QR code string                           |
| `qrCodeBase64`      | string | PIX QR code as a Base64-encoded image        |
| `copyPaste`         | string | PIX copy-and-paste code                      |
| `expiresAt`         | string | ISO 8601 expiration timestamp                |
| `externalReference` | string | External reference ID (Mercado Pago)         |
| `generatedAt`       | string | ISO 8601 generation timestamp                |

---

### 400 — Cycle already paid or invalid

The cycle has already been paid, or its current status does not allow PIX generation.

**Content-Type:** `application/json`

```json
{
  "billingCycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "paymentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 0,
  "qrCode": "string",
  "qrCodeBase64": "string",
  "copyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000...",
  "expiresAt": "2026-04-24T16:12:41.303Z",
  "externalReference": "string",
  "generatedAt": "2026-04-24T16:12:41.303Z"
}
```

---

### 401 — Unauthorized

Missing or invalid Bearer token.

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "string",
    "code": "string",
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

Authenticated user does not have the required role or permission.

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "string",
    "code": "string",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 404 — Cycle not found

No billing cycle exists with the provided `cycleId`.

**Content-Type:** `application/json`

```json
{
  "billingCycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "paymentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 0,
  "qrCode": "string",
  "qrCodeBase64": "string",
  "copyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000...",
  "expiresAt": "2026-04-24T16:12:41.303Z",
  "externalReference": "string",
  "generatedAt": "2026-04-24T16:12:41.303Z"
}
```

---

### 422 — Validation Error

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "string",
    "code": "string",
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
    "message": "string",
    "code": "string",
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

All standard error responses share the same envelope shape:

| Field           | Type   | Description                                     |
|-----------------|--------|-------------------------------------------------|
| `error.message` | string | Human-readable error description                |
| `error.code`    | string | Machine-readable error code                     |
| `error.fields`  | object | Map of field names to validation error messages |

> Note: `400` and `404` on this endpoint return the PIX response shape (not the error envelope) — this matches the original API spec exactly.

---

## Frontend Integration Notes

- Called by `billingFacade.generatePix(cycleId)` via `useGeneratePix` mutation
- Always send an `Idempotency-Key` header to prevent duplicate charges on network retry
- On `onSuccess`, invalidate `billingKeys.cycleDetail(cycleId)` and `billingKeys.driverStatus(driverId)`
- Requires `BILLING_PIX_GENERATE` permission — gate with `<Can perform={Permission.BILLING_PIX_GENERATE}>`
- Render `qrCodeBase64` as an `<img>` and `copyPaste` as a copy-to-clipboard button
- On `401`, the facade layer triggers the token refresh flow automatically
