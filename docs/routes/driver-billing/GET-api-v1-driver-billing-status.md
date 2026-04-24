# GET /api/v1/driver/billing/status

**Tag:** Driver Billing  
**Summary:** Billing status  
**Description:** Returns the complete billing status of the authenticated driver.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

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
  "blockedAt": "2026-04-24T16:40:39.848Z",
  "blockReason": "string",
  "totalDebt": 0,
  "totalPendingRides": 0,
  "pendingCyclesCount": 0,
  "nextDueDate": "2026-04-24T16:40:39.848Z",
  "pendingCycles": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "driverName": "string",
      "periodStart": "2026-04-24T16:40:39.848Z",
      "periodEnd": "2026-04-24T16:40:39.848Z",
      "rideCount": 0,
      "pricePerRide": 0,
      "totalAmount": 0,
      "paidAmount": 0,
      "remainingAmount": 0,
      "status": "PENDING",
      "pixGeneratedAt": "2026-04-24T16:40:39.848Z",
      "pixExpiresAt": "2026-04-24T16:40:39.848Z",
      "gracePeriodEndsAt": "2026-04-24T16:40:39.848Z",
      "paidAt": "2026-04-24T16:40:39.848Z",
      "blockedAt": "2026-04-24T16:40:39.848Z",
      "createdAt": "2026-04-24T16:40:39.848Z"
    }
  ],
  "currentPix": {
    "billingCycleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "paymentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 0,
    "qrCode": "string",
    "qrCodeBase64": "string",
    "copyPaste": "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000...",
    "expiresAt": "2026-04-24T16:40:39.848Z",
    "externalReference": "string",
    "generatedAt": "2026-04-24T16:40:39.848Z"
  },
  "updatedAt": "2026-04-24T16:40:39.848Z"
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
| `pendingCycles`      | array   | List of pending billing cycle objects                     |
| `currentPix`         | object  | Active PIX payment details (nullable)                     |
| `updatedAt`          | string  | ISO 8601 timestamp of the last status update              |

#### `pendingCycles[]` Item Fields

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

## Frontend Integration Notes

- Called by `driverBillingFacade.getStatus()` via `useDriverBillingStatus` query
- Cache with TanStack Query using `driverBillingKeys.status()`
- Invalidate after `POST /api/v1/driver/billing/debt/pix` and `POST /api/v1/driver/billing/cycles/{cycleId}/pix`
- On `401`, the facade layer triggers the token refresh flow automatically
