# POST /api/v1/admin/billing/test/create-debt

**Tag:** Billing Admin  
**Summary:** Create test debt  
**Description:** Creates a billing debt instantly for a driver, bypassing the automatic billing cycle. If `generatePixImmediately` is `true` (default), also generates the PIX QR code automatically.

> ⚠️ **Development / Staging only.** This endpoint must never be called in production. Gate it behind an environment check in the facade layer.

**Useful for:**
- Testing the PIX QR Code generation flow
- Testing the payment flow via webhook
- Testing driver blocking/unblocking
- Validating the Mercado Pago integration

**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "rideCount": 10,
  "pricePerRide": 2,
  "generatePixImmediately": true
}
```

| Field                    | Type    | Required | Description                                        |
|--------------------------|---------|----------|----------------------------------------------------|
| `driverId`               | string  | Yes      | UUID of the driver to create the debt for          |
| `rideCount`              | number  | Yes      | Number of rides to simulate in this billing cycle  |
| `pricePerRide`           | number  | Yes      | Price per ride in BRL                              |
| `generatePixImmediately` | boolean | No       | Generate PIX QR code immediately (default: `true`) |

---

## Responses

### 200 — Debt created successfully

**Content-Type:** `application/json`

```json
{
  "cycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "rideCount": 0,
  "pricePerRide": 0,
  "totalAmount": 0,
  "status": "PENDING",
  "periodStart": "2026-04-24T16:19:23.906Z",
  "periodEnd": "2026-04-24T16:19:23.906Z",
  "createdAt": "2026-04-24T16:19:23.906Z",
  "pix": {
    "billingCycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 0,
    "qrCode": "string",
    "qrCodeBase64": "string",
    "copyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000...",
    "expiresAt": "2026-04-24T16:19:23.906Z",
    "externalReference": "string",
    "generatedAt": "2026-04-24T16:19:23.906Z"
  },
  "message": "string"
}
```

| Field          | Type   | Description                                        |
|----------------|--------|----------------------------------------------------|
| `cycleId`      | string | UUID of the created billing cycle                  |
| `driverId`     | string | UUID of the driver                                 |
| `rideCount`    | number | Number of rides in the cycle                       |
| `pricePerRide` | number | Price per ride (BRL)                               |
| `totalAmount`  | number | Total amount due (BRL)                             |
| `status`       | string | Cycle status — `PENDING`, `PAID`, `EXPIRED`        |
| `periodStart`  | string | ISO 8601 start of the billing period               |
| `periodEnd`    | string | ISO 8601 end of the billing period                 |
| `createdAt`    | string | ISO 8601 creation timestamp                        |
| `pix`          | object | PIX payment details (present if PIX was generated) |
| `message`      | string | Human-readable result message                      |

#### `pix` Object

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

### 400 — Invalid data

The request body is malformed or contains invalid field values. Returns the same shape as `200`.

**Content-Type:** `application/json`

```json
{
  "cycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "rideCount": 0,
  "pricePerRide": 0,
  "totalAmount": 0,
  "status": "PENDING",
  "periodStart": "2026-04-24T16:19:23.908Z",
  "periodEnd": "2026-04-24T16:19:23.908Z",
  "createdAt": "2026-04-24T16:19:23.908Z",
  "pix": {
    "billingCycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 0,
    "qrCode": "string",
    "qrCodeBase64": "string",
    "copyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000...",
    "expiresAt": "2026-04-24T16:19:23.908Z",
    "externalReference": "string",
    "generatedAt": "2026-04-24T16:19:23.908Z"
  },
  "message": "string"
}
```

---

### 404 — Driver not found

No driver exists with the provided `driverId`. Returns the same shape as `200`.

**Content-Type:** `application/json`

```json
{
  "cycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "rideCount": 0,
  "pricePerRide": 0,
  "totalAmount": 0,
  "status": "PENDING",
  "periodStart": "2026-04-24T16:19:23.909Z",
  "periodEnd": "2026-04-24T16:19:23.909Z",
  "createdAt": "2026-04-24T16:19:23.909Z",
  "pix": {
    "billingCycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 0,
    "qrCode": "string",
    "qrCodeBase64": "string",
    "copyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000...",
    "expiresAt": "2026-04-24T16:19:23.909Z",
    "externalReference": "string",
    "generatedAt": "2026-04-24T16:19:23.909Z"
  },
  "message": "string"
}
```

---

## Frontend Integration Notes

- Only render the UI for this endpoint when `process.env.NEXT_PUBLIC_MOCK_MODE === "true"` or in a staging environment
- Called by `billingFacade.createTestDebt()` — never call directly from a component
- Requires `BILLING_TEST_CREATE` permission — gate with `<Can perform={Permission.BILLING_TEST_CREATE}>`
- After success, invalidate `billingKeys.driverStatus(driverId)` and `billingKeys.driverCycles(driverId)`
- On `401`, the facade layer triggers the token refresh flow automatically
