# Places and Geocoding API

## Overview

Protected backend API for place autocomplete and geocoding using Google Maps Platform.
The frontend never receives the Google API key directly.

## Main Features

- Secure server-side Google API integration
- Per-user rate limiting (burst/minute/hour)
- Daily budget quota protection
- Two-layer cache (Redis + PostgreSQL)
- Usage metrics and quota visibility

## Authentication

- Required header: `Authorization: Bearer <token>`

## Endpoints

- `POST /v1/places/autocomplete`
- `GET /v1/places/autocomplete`
- `POST /v1/places/details`
- `GET /v1/places/details/{placeId}`
- `POST /v1/places/geocode`
- `GET /v1/places/geocode`
- `POST /v1/places/reverse-geocode`
- `GET /v1/places/reverse-geocode`
- `GET /v1/places/rate-limit`
- `GET /v1/places/quota`

## Rate Limits

### Development

- Burst (1s): 5 requests
- Per minute: 30 requests
- Per hour: 200 requests

### Production

- Burst (1s): 3 requests
- Per minute: 20 requests
- Per hour: 150 requests

Headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Daily Quota Control

- Google free tier is protected by a configurable daily budget.
- Typical policy:
  - Warning at 80%
  - Hard block at 100% until day reset

Monitoring endpoint:
- `GET /v1/places/quota`

## Caching Strategy

```text
Request -> Redis -> PostgreSQL cache -> Google APIs
```

### Redis (fast cache)

- Autocomplete: 24h
- Place details: 60m
- Geocoding/reverse geocoding: 60m

### PostgreSQL (persistent cache)

- Autocomplete: 24-48h
- Place details: 90-180 days
- Geocoding/reverse geocoding: 90-180 days

## Autocomplete Behavior

- `strictBounds=false` (default): biases results to area, but allows out-of-area results.
- `strictBounds=true`: restricts results to the configured radius.
- Recommended city-scoped setup: `strictBounds=true` with `radius=30000`.

## Error Codes

- `INVALID_INPUT`
- `INPUT_TOO_SHORT`
- `INVALID_PLACE_ID`
- `INVALID_COORDINATES`
- `INVALID_ADDRESS`
- `SERVICE_UNAVAILABLE`
- `UNAUTHORIZED`
- `RATE_LIMIT_EXCEEDED`
- `DAILY_QUOTA_EXCEEDED`
- `AUTOCOMPLETE_ERROR`
- `GEOCODING_ERROR`

## Configuration

Key properties:

- `app.places.google.api-key`
- `app.places.ratelimit.*`
- `app.places.cache.*`
- `app.places.quota.*`

Environment variables:

- `GOOGLE_PLACES_API_KEY`
- `PLACES_RATELIMIT_PER_MINUTE`
- `PLACES_RATELIMIT_PER_HOUR`
- `PLACES_RATELIMIT_BURST`
- `PLACES_CACHE_REDIS_TTL_MINUTES`
- `PLACES_CACHE_POSTGRES_TTL_DAYS`
- `PLACES_CACHE_AUTOCOMPLETE_TTL_HOURS`
- `PLACES_QUOTA_ENABLED`
- `PLACES_QUOTA_DAILY_BUDGET`
- `PLACES_QUOTA_WARNING_THRESHOLD`

## Architecture Notes

- JWT auth and rate-limit checks run before external API calls.
- Quota checks prevent budget overrun before requesting Google APIs.
- Cache hits avoid unnecessary external calls and reduce latency.

## End of Document
