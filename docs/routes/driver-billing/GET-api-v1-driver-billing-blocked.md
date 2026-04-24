# GET /api/v1/driver/billing/blocked

**Tag:** Driver Billing  
**Summary:** Check if blocked  
**Description:** Checks whether the driver is blocked due to outstanding debt.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Block status returned

**Content-Type:** `application/json`

```json
{
  "blocked": true,
  "reason": "string",
  "blockedAt": "2026-04-24T16:40:39.864Z",
  "totalPending": 0,
  "totalPendingRides": 0
}
```

| Field               | Type    | Description                                               |
|---------------------|---------|-----------------------------------------------------------|
| `blocked`           | boolean | Whether the driver is currently blocked                   |
| `reason`            | string  | Human-readable reason for the block (nullable)            |
| `blockedAt`         | string  | ISO 8601 timestamp when the driver was blocked (nullable) |
| `totalPending`      | number  | Total outstanding debt in BRL                             |
| `totalPendingRides` | number  | Total rides across all pending cycles                     |

---

## Frontend Integration Notes

- Called by `driverBillingFacade.getBlockedStatus()` via `useDriverBlockedStatus` query
- Cache with TanStack Query using `driverBillingKeys.blocked()`
- Use this lightweight endpoint for quick block checks (e.g., before allowing a ride request)
- For full billing details, use `GET /api/v1/driver/billing/status`
- On `401`, the facade layer triggers the token refresh flow automatically
