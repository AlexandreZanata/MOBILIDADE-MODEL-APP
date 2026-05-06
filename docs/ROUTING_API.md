# Routing API

## Overview

Protected route-calculation API backed by OSRM (Open Source Routing Machine).
Supports synchronous route calculation and async queue-based processing.

## Capabilities

- JWT authentication
- Multi-level rate limiting (burst/minute/hour)
- Redis route caching
- Circuit breaker for resilience
- Retry with exponential backoff
- Structured logging and metrics hooks

## Endpoints

- `POST /v1/routing/route`
- `GET /v1/routing/route`
- `POST /v1/routing/route/async`
- `GET /v1/routing/rate-limit`

## Authentication

- Header: `Authorization: Bearer <token>`
- User must be authenticated and verified.

## Request Model (`POST /v1/routing/route`)

- `originLat` (required)
- `originLng` (required)
- `destinationLat` (required)
- `destinationLng` (required)
- `includeSteps` (optional, default `false`)
- `includeGeometry` (optional, default `false`)

## Response Model

Base fields:

- `distanceMeters`
- `distanceKm`
- `durationSeconds`
- `durationMinutes`
- `durationFormatted`
- `cached`
- `calculatedAt`

Optional:

- `steps` (when `includeSteps=true`)
- `geometry` (when `includeGeometry=true`)

## Rate Limits

### Development

- Burst (1s): 10 requests
- Per minute: 60 requests
- Per hour: 500 requests

### Production

- Burst (1s): 5 requests
- Per minute: 30 requests
- Per hour: 300 requests

Headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` (429 only)

## Error Codes

- `INVALID_COORDINATES`
- `POINTS_TOO_CLOSE`
- `DISTANCE_TOO_LARGE`
- `OSRM_ROUTE_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `RATE_LIMIT_EXCEEDED`
- `ROUTE_CALCULATION_FAILED`
- `ROUTING_UNAVAILABLE`

## Configuration

Key properties:

- `app.routing.osrm.base-url`
- `app.routing.timeout-seconds`
- `app.routing.max-retries`
- `app.routing.ratelimit.*`
- `app.routing.cache.*`
- `app.routing.circuit-breaker.*`

## Architecture

```text
Client
  -> JWT auth filter
  -> Rate limiter (Redis)
  -> Circuit breaker
  -> Cache check (Redis)
  -> OSRM request (with retry)
  -> Cache store
  -> Response
```

## Redis Keys (Reference)

- `routing:ratelimit:{userId}:burst`
- `routing:ratelimit:{userId}:minute`
- `routing:ratelimit:{userId}:hour`
- `routing:cache:{coords}:{options}`
- `routing:circuit:state`
- `routing:circuit:failures`
- `routing:circuit:last_failure`

## End of Document
