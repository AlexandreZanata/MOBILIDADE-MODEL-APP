# GET /api/v1/webhooks/mercadopago/payment

**Tag:** Webhooks  
**Summary:** Verify webhook endpoint  
**Description:** Health-check endpoint used by Mercado Pago to verify that the webhook receiver is available and reachable before registering or re-validating the notification URL.

---

## Parameters

None.

---

## Request Body

None.

---

## Responses

### 200 — Endpoint available

The webhook receiver is online and ready to accept notifications.

**Content-Type:** `text/plain` or `application/json`

```
"OK"
```

> Mercado Pago expects any `2xx` response to consider the endpoint valid. The exact response body is not significant.

---

## Frontend Integration Notes

- This endpoint is called by Mercado Pago, not by the frontend application
- No authentication is required — the URL itself acts as the shared secret
- If this endpoint returns a non-`2xx` status, Mercado Pago will disable webhook delivery
- Monitor availability via the admin dashboard or an uptime service
