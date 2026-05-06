# Ride Cancellation System

## Overview

Drivers and passengers can cancel rides depending on current ride state.
Cancellation fees and penalties are returned by cancellation APIs, while reputation impact is handled by the ratings system.

## Endpoints

### Passenger cancellation

- `POST /v1/passengers/rides/{rideId}/cancel`
- Auth: JWT with role `passenger`
- Body: `{ "reason": "..." }` (required, max 500 chars)

### Driver cancellation

- `POST /v1/drivers/rides/{rideId}/cancel`
- Auth: JWT with role `driver`
- Body: `{ "reason": "..." }` (required, max 500 chars)

## Cancellable Ride States

- `AGUARDANDO_MOTORISTA`
- `MOTORISTA_ENCONTRADO`
- `MOTORISTA_ACEITOU`
- `MOTORISTA_A_CAMINHO`
- `MOTORISTA_PROXIMO`
- `MOTORISTA_CHEGOU`
- `PASSAGEIRO_EMBARCADO`
- `EM_ROTA`
- `PROXIMO_DESTINO`

## Non-cancellable Ride States

- `CANCELADA_PASSAGEIRO`
- `CANCELADA_MOTORISTA`
- `CANCELADA_NO_SHOW`
- `EXPIRADA`
- `CONCLUIDA`
- `CORRIDA_FINALIZADA`
- `AGUARDANDO_AVALIACAO`

## Authorization Rules

- Passenger endpoint: only requesting passenger can cancel.
- Driver endpoint: only assigned driver can cancel.

## System Behavior

When cancellation is accepted:

1. Ride status is changed to passenger/driver cancellation status.
2. Audit fields are stored (`cancelledAt`, `cancelledBy`, `cancellationReason`).
3. Assigned driver operational status returns to `AVAILABLE`.
4. Counterparty is notified in real time via WebSocket event `ride_cancelled`.
5. Calculated cancellation fee and penalty flags are returned in response.

## Real-Time Notification Event

```json
{
  "type": "ride_cancelled",
  "rideId": "<ride-id>",
  "message": "Ride cancelled by passenger or driver",
  "data": {
    "status": "CANCELADA_PASSAGEIRO",
    "cancelledBy": "<user-id>",
    "cancellationReason": "..."
  }
}
```

## Error Codes

- `RIDE_NOT_FOUND`
- `RIDE_NOT_CANCELLABLE`
- `UNAUTHORIZED_CANCELLATION`
- `INVALID_CANCELLATION_REASON`

## Implementation Notes

- Effective fee charging should be processed by the payments subsystem.
- Keep cancellation transactions auditable and linked to ride IDs.
- Add anti-abuse controls (rate limits, cancellation windows, repeated-cancel heuristics).

## End of Document
