# POST /api/v1/webhooks/mercadopago/payment

**Tag:** Webhooks  
**Summary:** Receive payment notification  
**Description:** Receives webhook notifications from Mercado Pago about payment status changes. The server validates the request signature before processing the event payload.

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

Raw string payload sent by Mercado Pago. The exact schema depends on the event type. The server is responsible for parsing and validating the body.

```
"string"
```

> Mercado Pago sends the notification body as a raw JSON string. Do not attempt to parse it in the frontend — this endpoint is consumed exclusively by the backend.

---

## Responses

### 200 — Notification received successfully

The server acknowledged the notification. No response body.

> Mercado Pago requires a `200` response within a few seconds. If the server takes too long or returns a non-`2xx` status, Mercado Pago will retry the delivery.

---

### 400 — Invalid payload

The request body could not be parsed or is missing required fields.

---

### 401 — Invalid signature

The `x-signature` header does not match the expected HMAC signature computed from the secret key and the request body.

---

## Security Notes

- Signature validation is mandatory — reject any request that fails the HMAC check
- The webhook secret must be stored in an environment variable, never hardcoded
- Log all incoming events for audit purposes before processing
- Idempotency: the same event may be delivered more than once; use the event ID to deduplicate

## Frontend Integration Notes

- This endpoint is called by Mercado Pago, not by the frontend application
- The frontend does not interact with this endpoint directly
- Payment status updates reach the UI via polling or WebSocket after the backend processes the webhook
