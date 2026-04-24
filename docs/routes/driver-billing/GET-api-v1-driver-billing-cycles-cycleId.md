# GET /api/v1/driver/billing/cycles/{cycleId}

**Tag:** Driver Billing  
**Summary:** Cycle details  
**Description:** Returns the details of a specific billing cycle belonging to the authenticated driver.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name      | Location | Type   | Required | Description               |
|-----------|----------|--------|----------|---------------------------|
| `cycleId` | path     | string | Yes      | UUID of the billing cycle |

**Example URL:**

```
GET /api/v1/driver/billing/cycles/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

---

## Request Body

None.

---

## Responses

### 200 — Cycle returned successfully

**Content-Type:** `application/json`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "driverName": "string",
  "periodStart": "2026-04-24T16:40:39.856Z",
  "periodEnd": "2026-04-24T16:40:39.856Z",
  "rideCount": 0,
  "pricePerRide": 0,
  "totalAmount": 0,
  "paidAmount": 0,
  "remainingAmount": 0,
  "status": "PENDING",
  "pixGeneratedAt": "2026-04-24T16:40:39.856Z",
  "pixExpiresAt": "2026-04-24T16:40:39.856Z",
  "gracePeriodEndsAt": "2026-04-24T16:40:39.856Z",
  "paidAt": "2026-04-24T16:40:39.856Z",
  "blockedAt": "2026-04-24T16:40:39.856Z",
  "createdAt": "2026-04-24T16:40:39.856Z"
}
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

### 403 — Cycle does not belong to the driver

The cycle exists but belongs to a different driver. Returns the same shape as `200`.

**Content-Type:** `application/json`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "driverName": "string",
  "periodStart": "2026-04-24T16:40:39.859Z",
  "periodEnd": "2026-04-24T16:40:39.859Z",
  "rideCount": 0,
  "pricePerRide": 0,
  "totalAmount": 0,
  "paidAmount": 0,
  "remainingAmount": 0,
  "status": "PENDING",
  "pixGeneratedAt": "2026-04-24T16:40:39.859Z",
  "pixExpiresAt": "2026-04-24T16:40:39.859Z",
  "gracePeriodEndsAt": "2026-04-24T16:40:39.859Z",
  "paidAt": "2026-04-24T16:40:39.859Z",
  "blockedAt": "2026-04-24T16:40:39.859Z",
  "createdAt": "2026-04-24T16:40:39.859Z"
}
```

---

### 404 — Cycle not found

No billing cycle exists with the provided `cycleId`. Returns the same shape as `200`.

**Content-Type:** `application/json`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "driverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "driverName": "string",
  "periodStart": "2026-04-24T16:40:39.861Z",
  "periodEnd": "2026-04-24T16:40:39.861Z",
  "rideCount": 0,
  "pricePerRide": 0,
  "totalAmount": 0,
  "paidAmount": 0,
  "remainingAmount": 0,
  "status": "PENDING",
  "pixGeneratedAt": "2026-04-24T16:40:39.861Z",
  "pixExpiresAt": "2026-04-24T16:40:39.861Z",
  "gracePeriodEndsAt": "2026-04-24T16:40:39.861Z",
  "paidAt": "2026-04-24T16:40:39.861Z",
  "blockedAt": "2026-04-24T16:40:39.861Z",
  "createdAt": "2026-04-24T16:40:39.861Z"
}
```

---

## Frontend Integration Notes

- Called by `driverBillingFacade.getCycleDetail(cycleId)` via `useDriverBillingCycleDetail(cycleId)` query
- Cache with TanStack Query using `driverBillingKeys.cycleDetail(cycleId)`
- Invalidate after `POST /api/v1/driver/billing/cycles/{cycleId}/pix`
- On `403`, the driver is attempting to access a cycle that does not belong to them — show an access denied state
- On `401`, the facade layer triggers the token refresh flow automatically
