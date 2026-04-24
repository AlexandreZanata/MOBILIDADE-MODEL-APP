# POST /api/v1/admin/billing/jobs/billing-cycle/run

**Tag:** Billing Admin  
**Summary:** Run billing cycle job manually  
**Description:** Forces immediate execution of the billing cycle generation job. Normally runs on a schedule defined in the billing configuration; this endpoint triggers it on demand.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Job executed successfully

**Content-Type:** `application/json`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "jobType": "string",
  "periodStart": "2026-04-24T16:19:23.911Z",
  "periodEnd": "2026-04-24T16:19:23.911Z",
  "driversProcessed": 0,
  "cyclesGenerated": 0,
  "cyclesExpired": 0,
  "driversBlocked": 0,
  "status": "string",
  "errorMessage": "string",
  "startedAt": "2026-04-24T16:19:23.911Z",
  "completedAt": "2026-04-24T16:19:23.911Z",
  "durationMs": 0
}
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

### 409 — Job already running

Another instance of this job is currently executing. Returns the full `JobExecutionResult` shape of the running job.

**Content-Type:** `application/json`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "jobType": "string",
  "periodStart": "2026-04-24T16:19:23.913Z",
  "periodEnd": "2026-04-24T16:19:23.913Z",
  "driversProcessed": 0,
  "cyclesGenerated": 0,
  "cyclesExpired": 0,
  "driversBlocked": 0,
  "status": "string",
  "errorMessage": "string",
  "startedAt": "2026-04-24T16:19:23.913Z",
  "completedAt": "2026-04-24T16:19:23.913Z",
  "durationMs": 0
}
```

---

## Frontend Integration Notes

- Called by `billingFacade.runBillingCycleJob()` via `useRunBillingCycleJob` mutation
- On `onSuccess`, invalidate `billingKeys.jobHistory()` to refresh the job history list
- On `409`, display a warning toast — the job is already running, do not retry automatically
- Requires `BILLING_JOBS_RUN` permission — gate with `<Can perform={Permission.BILLING_JOBS_RUN}>`
- On `401`, the facade layer triggers the token refresh flow automatically
