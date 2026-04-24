# GET /api/v1/admin/billing/jobs/history

**Tag:** Billing Admin  
**Summary:** Job execution history  
**Description:** Returns the recent execution history of all billing jobs.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — History returned successfully

Returns an array of job execution records, ordered by the most recent first.

**Content-Type:** `application/json`

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "jobType": "string",
    "periodStart": "2026-04-24T16:19:23.917Z",
    "periodEnd": "2026-04-24T16:19:23.917Z",
    "driversProcessed": 0,
    "cyclesGenerated": 0,
    "cyclesExpired": 0,
    "driversBlocked": 0,
    "status": "string",
    "errorMessage": "string",
    "startedAt": "2026-04-24T16:19:23.917Z",
    "completedAt": "2026-04-24T16:19:23.917Z",
    "durationMs": 0
  }
]
```

| Field              | Type   | Description                                         |
|--------------------|--------|-----------------------------------------------------|
| `id`               | string | Job execution UUID                                  |
| `jobType`          | string | Type identifier for this job                        |
| `periodStart`      | string | ISO 8601 start of the period evaluated              |
| `periodEnd`        | string | ISO 8601 end of the period evaluated                |
| `driversProcessed` | number | Total number of drivers evaluated                   |
| `cyclesGenerated`  | number | Number of new billing cycles generated              |
| `cyclesExpired`    | number | Number of cycles marked as expired                  |
| `driversBlocked`   | number | Number of drivers blocked during this run           |
| `status`           | string | Job completion status (`COMPLETED`, `FAILED`, etc.) |
| `errorMessage`     | string | Error details if the job failed (nullable)          |
| `startedAt`        | string | ISO 8601 timestamp when the job started             |
| `completedAt`      | string | ISO 8601 timestamp when the job completed           |
| `durationMs`       | number | Total execution time in milliseconds                |

---

## Frontend Integration Notes

- Called by `billingFacade.getJobHistory()` via `useJobHistory` query
- Cache with TanStack Query using `billingKeys.jobHistory()`
- Requires `BILLING_JOBS_VIEW` permission — gate with `<Can perform={Permission.BILLING_JOBS_VIEW}>`
- Refresh after any manual job trigger (`useRunBillingCycleJob`, `useRunExpirationCheck`)
- On `401`, the facade layer triggers the token refresh flow automatically
