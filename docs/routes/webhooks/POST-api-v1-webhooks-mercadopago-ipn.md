# POST /api/v1/webhooks/mercadopago/ipn

**Tag:** Webhooks  
**Summary:** Receive IPN notification  
**Description:** Alternative endpoint for receiving IPN (Instant Payment Notification) events from Mercado Pago. IPN is the legacy notification mechanism; prefer the standard webhook endpoint for new integrations.

---

## Parameters

| Name    | Location | Type   | Required | Description                                                        |
|---------|----------|--------|----------|--------------------------------------------------------------------|
| `topic` | query    | string | No       | Event topic (e.g. `payment`, `merchant_order`, `chargebacks`)      |
| `id`    | query    | string | No       | Resource ID associated with the notification (e.g. payment ID)     |

**Example URL:**

```
POST /api/v1/webhooks/mercadopago/ipn?topic=payment&id=1234567890
```

---

## Request Body

**Content-Type:** `application/json`

Raw string payload sent by Mercado Pago. May be empty for IPN — the actual data is fetched by the server using the `topic` and `id` query parameters.

```
"string"
```

> For IPN, Mercado Pago typically sends only the `topic` and `id` query parameters. The server must call the Mercado Pago API to retrieve the full resource details using those values.

---

## Responses

### 200 — OK

The server acknowledged the IPN notification. No response body.

> Mercado Pago requires a `200` response to stop retrying. If the server returns any other status, delivery will be retried up to the platform's retry limit.

---

## IPN vs Webhook

| Feature              | IPN (`/ipn`)                        | Webhook (`/payment`)              |
|----------------------|-------------------------------------|-----------------------------------|
| Payload              | Query params only (`topic` + `id`)  | Full JSON body                    |
| Data retrieval       | Server must fetch from MP API       | Data included in the notification |
| Signature validation | Not supported                       | Supported via `x-signature`       |
| Recommendation       | Legacy — use for backward compat    | Preferred for new integrations    |

---

## Frontend Integration Notes

- This endpoint is called by Mercado Pago, not by the frontend application
- The frontend does not interact with this endpoint directly
- Prefer the standard webhook endpoint (`POST /api/v1/webhooks/mercadopago/payment`) for new integrations
- Payment status updates reach the UI via polling or WebSocket after the backend processes the IPN
