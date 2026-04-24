# GET /api/v1/admin/billing/drivers/{driverId}/cycles

**Tag:** Billing Admin  
**Summary:** Driver billing cycles  
**Description:** Lists all billing cycles for a specific driver.  
**Authentication:** Bearer token required.

---

## Parameters

| Name       | Location | Type   | Required | Description        |
|------------|----------|--------|----------|--------------------|
| `driverId` | path     | string | Yes      | UUID of the driver |

**Example URL:**

```
GET /api/v1/admin/billing/drivers/3fa85f64-5717-4562-b3fc-2c963f66afa6/cycles
```

---

## Request Body

None.

---

## Responses

### 200 — Cycles returned successfully

Returns an array of billing cycle objects for the driver.

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "driverName": "string",
    "periodStart": "2026-04-24T16:12:41.311Z",
    "periodEnd": "2026-04-24T16:12:41.311Z",
    "rideCount": 0,
    "pricePerRide": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "remainingAmount": 0,
    "status": "PENDING",
    "pixGeneratedAt": "2026-04-24T16:12:41.311Z",
    "pixExpiresAt": "2026-04-24T16:12:41.311Z",
    "gracePeriodEndsAt": "2026-04-24T16:12:41.311Z",
    "paidAt": "2026-04-24T16:12:41.311Z",
    "blockedAt": "2026-04-24T16:12:41.311Z",
    "createdAt": "2026-04-24T16:12:41.311Z"
  }
]
```

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

---

## Frontend Integration Notes

- Called by `billingFacade.getDriverCycles(driverId)` via `useDriverCycles` query
- Cache with TanStack Query using `billingKeys.driverCycles(driverId)`
- Requires `BILLING_DRIVER_VIEW` permission — gate with `<Can perform={Permission.BILLING_DRIVER_VIEW}>`
- Invalidate after `useGeneratePix` or any mutation that modifies cycle state
