# Real-Time Chat System

## Overview

This module provides real-time chat between driver and passenger during an active ride.
Chat is enabled when a driver accepts a ride and remains available until completion or cancellation.

## Core Capabilities

- Bidirectional communication via WebSocket
- Delivery and read confirmations
- Unread badge count per ride
- Online presence tracking
- Redis-backed caching for recent messages
- Rate limiting and anti-spam controls
- Retry + DLQ for failed deliveries
- Graceful degradation via long polling fallback
- Lazy loading for historical messages

## Architecture

```text
Client (Web/Mobile)
   -> WebSocket (primary) / Long Polling (fallback)
API Gateway / Load Balancer
   -> Chat Service (Spring Boot)
      -> PostgreSQL (message persistence)
      -> RabbitMQ (delivery pipeline)
      -> Redis (cache, presence, rate limit, unread counters)
```

## Authentication and Access Rules

- JWT is required for both WebSocket and REST endpoints.
- Only ride participants (assigned driver + passenger) can exchange messages.
- Messages for completed/cancelled rides are rejected.

## Connection Endpoints

- Drivers: `/ws/drivers/chat?token={JWT}`
- Passengers: `/ws/passengers/chat?token={JWT}`

## Client -> Server Events

- `chat_message`: send message
- `mark_read`: mark messages as read
- `heartbeat`: keep connection alive

## Server -> Client Events

- `chat_message`: new incoming message
- `delivery_confirmed`: message delivered
- `read_confirmed`: message read
- `unread_count`: unread badge update
- `user_online_status`: presence update
- `error`: validation/rate-limit/runtime error

## Delivery Guarantees

1. Message is persisted in PostgreSQL before dispatch.
2. Message is published to RabbitMQ.
3. If recipient is online, it is pushed via WebSocket.
4. Delivery/read state is updated and synced.
5. If offline, message is delivered after reconnection.

## RabbitMQ Topology

- Exchange: `chat.exchange` (direct)
- Main queue: `chat.messages`
- Retry queue: `chat.messages.retry` (TTL: 60s)
- Dead-letter queue: `chat.messages.dlq`
- Delivery notifications exchange: `chat.delivery.exchange` (topic)

## Redis Keys

- Recent messages: `chat:messages:{rideId}:recent` (TTL: 1h)
- Online status: `chat:online:{userId}` (TTL: 5m)
- Rate limit: `chat:ratelimit:{userId}` (TTL: 1m)
- Unread count: `chat:unread:{userId}:{rideId}` (TTL: 24h)

## Rate Limiting

- 30 messages/minute/user
- Burst: up to 10 messages in 1 second
- Exceeded limit returns `RATE_LIMIT_EXCEEDED`

## Fallback and Pagination

- Long polling fallback:
  - `GET /v1/chat/messages/poll?rideId={rideId}&timeout=30&cursor={cursor}`
- History pagination:
  - `GET /v1/chat/messages?rideId={rideId}&limit=50&cursor={cursor}`

## REST Fallback Endpoints

- `POST /v1/chat/messages`
- `GET /v1/chat/messages`
- `POST /v1/chat/messages/read`
- `GET /v1/chat/messages/unread`
- `GET /v1/chat/users/{userId}/online-status`

## Troubleshooting

- WebSocket connection failures:
  - Validate JWT and expiration
  - Validate CORS/proxy/firewall configuration
- Messages not delivered:
  - Check recipient online state
  - Check RabbitMQ and DLQ logs
- Incorrect unread count:
  - Re-sync Redis and PostgreSQL counters

## Changelog

### v1.0.0 (2025-12-04)

- Initial chat architecture and real-time message flow
- RabbitMQ-based delivery pipeline with retry/DLQ
- Redis cache, unread badges, and online status tracking
- Long polling fallback and lazy-loading history support
