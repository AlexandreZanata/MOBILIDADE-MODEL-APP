# DELETE /api/v1/admin/billing/test/debt/{cycleId}

**Tag:** Billing Admin  
**Summary:** Delete test debt  
**Description:** Deletes a billing cycle and all associated payments. Useful for cleaning up test data.

> ⚠️ **Development / Staging only.** This endpoint must never be called in production. Gate it behind an environment check in the facade layer.

**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name      | Location | Type   | Required | Description                 |
|-----------|----------|--------|----------|-----------------------------|
| `cycleId` | path     | string | Yes      | UUID of the cycle to delete |

**Example URL:**

```
DELETE /api/v1/admin/billing/test/debt/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

---

## Request Body

None.

---

## Responses

### 204 — Debt deleted successfully

No response body.

---

### 404 — Cycle not found

No billing cycle exists with the provided `cycleId`. No response body.

---

## Frontend Integration Notes

- Only render the UI for this endpoint when `process.env.NEXT_PUBLIC_MOCK_MODE === "true"` or in a staging environment
- Called by `billingFacade.deleteTestDebt(cycleId)` via `useDeleteTestDebt` mutation
- On `onSuccess`, invalidate `billingKeys.driverCycles(driverId)` and `billingKeys.driverStatus(driverId)`
- Requires `BILLING_TEST_DELETE` permission — gate with `<Can perform={Permission.BILLING_TEST_DELETE}>`
- Always show a `ConfirmDialog` before calling this mutation
- On `401`, the facade layer triggers the token refresh flow automatically
