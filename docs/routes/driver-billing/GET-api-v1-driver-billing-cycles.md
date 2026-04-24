# GET /api/v1/driver/billing/cycles

**Tag:** Driver Billing  
**Summary:** My billing cycles  
**Description:** Lists all billing cycles of the authenticated driver.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Cycles returned successfully

Returns a flat array of billing cycle objects.

**Content-Type:** `application/json`

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "driverName": "string",
    "periodStart": "2026-04-24T16:40:39.852Z",
    "periodEnd": "2026-04-24T16:40:39.852Z",
    "rideCount": 0,
    "pricePerRide": 0,
    "totalAmount": 0,
    "paidAmount": 0,
    "remainingAmount": 0,
    "status": "PENDING",
    "pixGeneratedAt": "2026-04-24T16:40:39.852Z",
    "pixExpiresAt": "2026-04-24T16:40:39.852Z",
    "gracePeriodEndsAt": "2026-04-24T16:40:39.852Z",
    "paidAt": "2026-04-24T16:40:39.852Z",
    "blockedAt": "2026-04-24T16:40:39.852Z",
    "createdAt": "2026-04-24T16:40:39.852Z"
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

- Called by `driverBillingFacade.listCycles()` via `useDriverBillingCycles` query
- Cache with TanStack Query using `driverBillingKeys.cycles()`
- Response is a flat array — no pagination
- Invalidate after any PIX generation or payment event
- On `401`, the facade layer triggers the token refresh flow automatically
