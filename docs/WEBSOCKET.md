# GovMobile — WebSocket Architecture

> Reference for all real-time WebSocket connections in the GovMobile application.
> All WebSocket clients live in `src/services/websocket/` and are consumed exclusively
> through facades — screens and hooks never instantiate WebSocket connections directly.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Connection Endpoints](#2-connection-endpoints)
3. [Authentication](#3-authentication)
4. [Driver WebSocket](#4-driver-websocket)
5. [Passenger WebSocket](#5-passenger-websocket)
6. [Chat WebSocket](#6-chat-websocket)
7. [Heartbeat Protocol](#7-heartbeat-protocol)
8. [Reconnection Strategy](#8-reconnection-strategy)
9. [Rate Limiting](#9-rate-limiting)
10. [Message Contracts](#10-message-contracts)
11. [Layer Rules](#11-layer-rules)

---

## 1. Overview

GovMobile uses three independent WebSocket connections, each scoped to a specific domain:

| Connection   | Endpoint                                    | Role              | Purpose                                         |
|--------------|---------------------------------------------|-------------------|-------------------------------------------------|
| Driver WS    | `/ws/drivers`                               | DRIVER            | Location streaming, ride offers, status updates |
| Passenger WS | `/ws/passengers`                            | PASSENGER / ADMIN | Ride status updates, driver location            |
| Chat WS      | `/ws/drivers/chat` or `/ws/passengers/chat` | ALL               | Real-time chat messages                         |

All connections use **WSS** (WebSocket Secure) over `wss://vamu.joaoflavio.com`.

---

## 2. Connection Endpoints

```
Driver:    wss://vamu.joaoflavio.com/ws/drivers?token=<JWT>
Passenger: wss://vamu.joaoflavio.com/ws/passengers?token=<JWT>
Chat (D):  wss://vamu.joaoflavio.com/ws/drivers/chat?token=<JWT>
Chat (P):  wss://vamu.joaoflavio.com/ws/passengers/chat?token=<JWT>
```

The JWT is passed as a query parameter. The token is URL-encoded before appending.

---

## 3. Authentication

- The JWT access token is injected at connection time via the query string.
- When the token is refreshed (via `httpClient.refresh()`), the WebSocket must reconnect
  to pick up the new token. Call `updateAuthToken()` on the relevant service.
- Token refresh is handled by `httpClient` — WebSocket services must not call the auth
  API directly.

---

## 4. Driver WebSocket

**File:** `src/services/websocket/DriverWebSocket.ts`

**Heartbeat interval:** 10 seconds
**Location update:** sent externally via `sendLocationUpdate()` (every 3s recommended)

### Client → Server messages

| Type              | Payload                                    | Description                |
|-------------------|--------------------------------------------|----------------------------|
| `location_update` | `{ lat, lng, heading?, speed? }`           | GPS position update        |
| `heartbeat`       | —                                          | Keep-alive ping            |
| `status_update`   | `{ status: OperationalStatus }`            | Driver availability change |
| `ride_response`   | `{ rideId, action: 'accept' \| 'reject' }` | Respond to a ride offer    |

### Server → Client messages

| Type                 | Description                             |
|----------------------|-----------------------------------------|
| `connected`          | Connection established                  |
| `location_update`    | Location acknowledged                   |
| `pong`               | Heartbeat response                      |
| `status_updated`     | Status change confirmed                 |
| `passenger_location` | Passenger GPS position                  |
| `ride_offer`         | New ride offer with fare, distance, ETA |
| `ride_accepted`      | Ride acceptance confirmed               |
| `ride_rejected`      | Ride rejection confirmed                |
| `active_ride`        | Active ride state sent on reconnection  |
| `error`              | Server-side error                       |

### `ride_offer` payload

```typescript
{
  type: 'ride_offer';
  trip_id: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  estimated_fare: number;
  distance_km: number;
  duration_seconds: number;
  eta_to_pickup_minutes: number;
  assignment_expires_at: string; // ISO timestamp
  passenger: { id: string; name: string; photoUrl?: string; rating: number };
  payment_method: string | null;
  payment_brand: string | null;
}
```

---

## 5. Passenger WebSocket

**File:** `src/services/websocket/PassengerWebSocket.ts`

**Heartbeat interval:** 10 seconds

### Client → Server messages

| Type              | Payload                          | Description            |
|-------------------|----------------------------------|------------------------|
| `location_update` | `{ lat, lng, heading?, speed? }` | Passenger GPS position |
| `heartbeat`       | —                                | Keep-alive ping        |

### Server → Client messages

| Type                     | Description                  |
|--------------------------|------------------------------|
| `connected`              | Connection established       |
| `location_updated`       | Location acknowledged        |
| `pong`                   | Heartbeat response           |
| `ride_driver_accepted`   | Driver accepted the ride     |
| `ride_driver_on_the_way` | Driver is en route to pickup |
| `ride_driver_nearby`     | Driver is nearby             |
| `ride_driver_arrived`    | Driver has arrived at pickup |
| `ride_status_update`     | Generic status change        |
| `ride_cancelled`         | Ride was cancelled           |
| `error`                  | Server-side error            |

---

## 6. Chat WebSocket

**File:** `src/services/websocket/ChatWebSocket.ts`

**Heartbeat interval:** 30 seconds (mandatory per server contract)

### Client → Server messages

| Type           | Payload                              | Description                 |
|----------------|--------------------------------------|-----------------------------|
| `chat_message` | `{ data: { rideId, content } }`      | Send a chat message         |
| `mark_read`    | `{ data: { rideId, messageIds[] } }` | Mark messages as read       |
| `heartbeat`    | —                                    | Keep-alive ping (every 30s) |

### Server → Client messages

| Type                 | Description                      |
|----------------------|----------------------------------|
| `chat_message`       | New message received             |
| `delivery_confirmed` | Message delivered (2 grey ticks) |
| `read_confirmed`     | Message read (2 blue ticks)      |
| `unread_count`       | Badge count update               |
| `user_online_status` | Other user's online status       |
| `pong`               | Heartbeat response               |
| `error`              | Server-side error                |

### Rate limits (client-side enforcement)

- Max **10 messages/second** (burst)
- Max **30 messages/minute**
- Heartbeat messages bypass rate limiting

---

## 7. Heartbeat Protocol

All WebSocket connections must send periodic heartbeats to keep the connection alive
and detect silent disconnections.

| Connection   | Interval | Message                 |
|--------------|----------|-------------------------|
| Driver WS    | 10s      | `{ type: 'heartbeat' }` |
| Passenger WS | 10s      | `{ type: 'heartbeat' }` |
| Chat WS      | 30s      | `{ type: 'heartbeat' }` |

The server responds with `{ type: 'pong' }`. If no pong is received within 2× the
heartbeat interval, the client should treat the connection as dropped and reconnect.

---

## 8. Reconnection Strategy

All WebSocket services implement **exponential backoff** reconnection:

```
Attempt 1: 1s delay
Attempt 2: 2s delay
Attempt 3: 4s delay
Attempt 4: 8s delay
...
Max delay: 30s (Driver/Passenger) | 60s (Chat)
```

**Intentional disconnection** (code `1000`) does not trigger reconnection.

**On reconnection:**
1. A new JWT is fetched from `httpClient.getAccessToken()`.
2. The WebSocket URL is rebuilt with the fresh token.
3. The server sends an `active_ride` message if a ride is in progress.

**App foreground restore:**
When the app returns from background, the connection state is checked and reconnection
is triggered if the socket is closed.

---

## 9. Rate Limiting

The HTTP client enforces a global rate limit of **60 requests/minute** across all
REST API calls. WebSocket messages have their own per-connection limits (see Chat WS).

Endpoints exempt from rate limiting:
- `POST /auth/login`
- `POST /auth/refresh`

---

## 10. Message Contracts

All message types are defined as TypeScript discriminated unions in:

```
src/services/websocket/
├── DriverWebSocket.ts      # ServerMessage, ClientMessage unions
├── PassengerWebSocket.ts   # PassengerServerMessage, PassengerClientMessage unions
└── ChatWebSocket.ts        # ChatServerMessage, ChatClientMessage unions
```

**Rule:** Never use `any` for message payloads. Always narrow the type using the
`type` discriminant before accessing payload fields.

```typescript
// Correct
if (message.type === 'ride_offer') {
  const fare = message.estimated_fare; // typed
}

// Wrong
const msg = message as any; // never
```

---

## 11. Layer Rules

```
Screen / Hook
    │
    ▼  (reads state only)
Redux Store / Context
    │
    ▼  (subscribes to events)
Facade (RealtimeFacade, ChatFacade)
    │
    ▼  (owns the connection)
WebSocket Client (DriverWebSocket, PassengerWebSocket, ChatWebSocket)
    │
    ▼
WSS Server
```

- **Screens and hooks** must never import WebSocket clients directly.
- **Facades** are the only layer that calls `connect()`, `disconnect()`, and `send*()`.
- **Hooks** subscribe to facade events and write to Redux slices or context.
- **Screens** read from Redux / context — they never touch the WebSocket layer.
