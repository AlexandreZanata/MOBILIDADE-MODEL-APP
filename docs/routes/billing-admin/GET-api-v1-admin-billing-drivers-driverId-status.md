# GET /api/v1/admin/billing/drivers/{driverId}/status

**Tag:** Billing Admin  
**Summary:** Driver billing status  
**Description:** Returns the complete billing status for a specific driver, including block state, total debt, pending cycles, and the current active PIX payment.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name       | Location | Type   | Required | Description        |
|------------|----------|--------|----------|--------------------|
| `driverId` | path     | string | Yes      | UUID of the driver |

**Example URL:**

```
GET /api/v1/admin/billing/drivers/3fa85f64-5717-4562-b3fc-2c963f66afa6/status
```

---

## Request Body

None.

---

## Responses

### 200 — Status returned successfully

**Content-Type:** `application/json`

```json
{
  "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "isBlocked": true,
  "blockedAt": "2026-04-24T16:19:23.918Z",
  "blockReason": "string",
  "totalDebt": 0,
  "totalPendingRides": 0,
  "pendingCyclesCount": 0,
  "nextDueDate": "2026-04-24T16:19:23.918Z",
  "pendingCycles": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "driverName": "string",
      "periodStart": "2026-04-24T16:19:23.918Z",
      "periodEnd": "2026-04-24T16:19:23.918Z",
      "rideCount": 0,
      "pricePerRide": 0,
      "totalAmount": 0,
      "paidAmount": 0,
      "remainingAmount": 0,
      "status": "PENDING",
      "pixGeneratedAt": "2026-04-24T16:19:23.918Z",
      "pixExpiresAt": "2026-04-24T16:19:23.918Z",
      "gracePeriodEndsAt": "2026-04-24T16:19:23.918Z",
      "paidAt": "2026-04-24T16:19:23.918Z",
      "blockedAt": "2026-04-24T16:19:23.918Z",
      "createdAt": "2026-04-24T16:19:23.918Z"
    }
  ],
  "currentPix": {
    "billingCycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 0,
    "qrCode": "string",
    "qrCodeBase64": "string",
    "copyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000...",
    "expiresAt": "2026-04-24T16:19:23.918Z",
    "externalReference": "string",
    "generatedAt": "2026-04-24T16:19:23.918Z"
  },
  "updatedAt": "2026-04-24T16:19:23.918Z"
}
```

| Field                | Type    | Description                                               |
|----------------------|---------|-----------------------------------------------------------|
| `driverId`           | string  | UUID of the driver                                        |
| `isBlocked`          | boolean | Whether the driver is currently blocked                   |
| `blockedAt`          | string  | ISO 8601 timestamp when the driver was blocked (nullable) |
| `blockReason`        | string  | Human-readable reason for the block (nullable)            |
| `totalDebt`          | number  | Total outstanding debt in BRL                             |
| `totalPendingRides`  | number  | Total rides across all pending cycles                     |
| `pendingCyclesCount` | number  | Number of unpaid billing cycles                           |
| `nextDueDate`        | string  | ISO 8601 date of the next payment due (nullable)          |
| `pendingCycles`      | array   | List of pending billing cycle objects (see cycle fields)  |
| `currentPix`         | object  | Active PIX payment details (nullable, see PIX fields)     |
| `updatedAt`          | string  | ISO 8601 timestamp of the last status update              |

#### Cycle Object Fields (`pendingCycles[]`)

| Field               | Type   | Description                                               |
|---------------------|--------|-----------------------------------------------------------|
| `id`                | string | Billing cycle UUID                                        |
| `driverId`          | string | UUID of the driver                                        |
| `driverName`        | string | Full name of the driver                                   |
| `periodStart`       | string | ISO 8601 start of the billing period                      |
| `periodEnd`         | string | ISO 8601 end of the billing period                        |
| `rideCount`         | number | Number of rides in this cycle                             |
| `pricePerRide`      | number | Price per ride at the time of cycle creation (BRL)        |
| `totalAmount`       | number | Total amount due for this cycle (BRL)                     |
| `paidAmount`        | number | Amount already paid (BRL)                                 |
| `remainingAmount`   | number | Remaining balance due (BRL)                               |
| `status`            | string | Cycle status — `PENDING`, `PAID`, `EXPIRED`, `BLOCKED`    |
| `pixGeneratedAt`    | string | ISO 8601 timestamp when PIX was generated (nullable)      |
| `pixExpiresAt`      | string | ISO 8601 timestamp when PIX expires (nullable)            |
| `gracePeriodEndsAt` | string | ISO 8601 end of the grace period (nullable)               |
| `paidAt`            | string | ISO 8601 timestamp when the cycle was paid (nullable)     |
| `blockedAt`         | string | ISO 8601 timestamp when the driver was blocked (nullable) |
| `createdAt`         | string | ISO 8601 creation timestamp                               |

#### `currentPix` Object Fields

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

### 404 — Driver not found

No driver exists with the provided `driverId`. Returns the same shape as `200`.

**Content-Type:** `application/json`

```json
{
  "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "isBlocked": true,
  "blockedAt": "2026-04-24T16:19:23.922Z",
  "blockReason": "string",
  "totalDebt": 0,
  "totalPendingRides": 0,
  "pendingCyclesCount": 0,
  "nextDueDate": "2026-04-24T16:19:23.922Z",
  "pendingCycles": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "driverName": "string",
      "periodStart": "2026-04-24T16:19:23.922Z",
      "periodEnd": "2026-04-24T16:19:23.922Z",
      "rideCount": 0,
      "pricePerRide": 0,
      "totalAmount": 0,
      "paidAmount": 0,
      "remainingAmount": 0,
      "status": "PENDING",
      "pixGeneratedAt": "2026-04-24T16:19:23.922Z",
      "pixExpiresAt": "2026-04-24T16:19:23.922Z",
      "gracePeriodEndsAt": "2026-04-24T16:19:23.922Z",
      "paidAt": "2026-04-24T16:19:23.922Z",
      "blockedAt": "2026-04-24T16:19:23.922Z",
      "createdAt": "2026-04-24T16:19:23.922Z"
    }
  ],
  "currentPix": {
    "billingCycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 0,
    "qrCode": "string",
    "qrCodeBase64": "string",
    "copyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000...",
    "expiresAt": "2026-04-24T16:19:23.922Z",
    "externalReference": "string",
    "generatedAt": "2026-04-24T16:19:23.922Z"
  },
  "updatedAt": "2026-04-24T16:19:23.922Z"
}
```

---

## Frontend Integration Notes

- Called by `billingFacade.getDriverStatus(driverId)` via `useDriverBillingStatus` query
- Cache with TanStack Query using `billingKeys.driverStatus(driverId)`
- Requires `BILLING_DRIVER_VIEW` permission — gate with `<Can perform={Permission.BILLING_DRIVER_VIEW}>`
- Invalidate after `useUnblockDriver`, `useGeneratePix`, or any mutation that affects driver state
- On `401`, the facade layer triggers the token refresh flow automatically
