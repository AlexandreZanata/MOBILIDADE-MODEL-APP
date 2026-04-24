# POST /api/v1/driver/billing/cycles/{cycleId}/pix

**Tag:** Driver Billing  
**Summary:** Generate PIX for cycle  
**Description:** Generates a PIX QR code for payment of a specific billing cycle.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name                | Location | Type   | Required | Description                                               |
|---------------------|----------|--------|----------|-----------------------------------------------------------|
| `cycleId`           | path     | string | Yes      | UUID of the billing cycle                                 |
| `X-Idempotency-Key` | header   | string | No       | Client-generated UUID to prevent duplicate PIX generation |

**Example URL:**

```
POST /api/v1/driver/billing/cycles/3fa85f64-5717-4562-b3fc-2c963f66afa6/pix
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
  "expiresAt": "2026-04-24T16:40:39.837Z",
  "externalReference": "string",
  "generatedAt": "2026-04-24T16:40:39.837Z"
}
```

| Field               | Type   | Description                           |
|---------------------|--------|---------------------------------------|
| `billingCycleId`    | string | UUID of the associated billing cycle  |
| `paymentId`         | string | UUID of the payment record            |
| `amount`            | number | Payment amount (BRL)                  |
| `qrCode`            | string | PIX QR code string                    |
| `qrCodeBase64`      | string | PIX QR code as a Base64-encoded image |
| `copyPaste`         | string | PIX copy-and-paste code               |
| `expiresAt`         | string | ISO 8601 expiration timestamp         |
| `externalReference` | string | External reference ID (Mercado Pago)  |
| `generatedAt`       | string | ISO 8601 generation timestamp         |

---

### 400 — Cycle already paid or invalid

The cycle has already been paid, or its current status does not allow PIX generation. Returns the same shape as `200`.

**Content-Type:** `application/json`

```json
{
  "billingCycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "paymentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 0,
  "qrCode": "string",
  "qrCodeBase64": "string",
  "copyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000...",
  "expiresAt": "2026-04-24T16:40:39.840Z",
  "externalReference": "string",
  "generatedAt": "2026-04-24T16:40:39.840Z"
}
```

---

### 404 — Cycle not found

No billing cycle exists with the provided `cycleId`. Returns the same shape as `200`.

**Content-Type:** `application/json`

```json
{
  "billingCycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "paymentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "amount": 0,
  "qrCode": "string",
  "qrCodeBase64": "string",
  "copyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000...",
  "expiresAt": "2026-04-24T16:40:39.842Z",
  "externalReference": "string",
  "generatedAt": "2026-04-24T16:40:39.842Z"
}
```

---

## Frontend Integration Notes

- Called by `driverBillingFacade.generateCyclePix(cycleId)` via `useGenerateCyclePix` mutation
- Always send an `X-Idempotency-Key` header to prevent duplicate charges on network retry
- On `onSuccess`, invalidate `driverBillingKeys.cycleDetail(cycleId)` and `driverBillingKeys.status()`
- Render `qrCodeBase64` as an `<img>` and `copyPaste` as a copy-to-clipboard button
- On `401`, the facade layer triggers the token refresh flow automatically
