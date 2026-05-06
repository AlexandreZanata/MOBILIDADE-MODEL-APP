# Ratings System

## Overview

The ratings system allows drivers and passengers to rate each other after a ride.
All users start with a score of `10.00`, and score decreases according to received ratings.

## Endpoints

### Passenger rates driver

- `POST /v1/passengers/rides/{rideId}/ratings`
- Auth: JWT with role `passenger`

### Driver rates passenger

- `POST /v1/drivers/rides/{rideId}/ratings`
- Auth: JWT with role `driver`

### Get my rating (passenger)

- `GET /v1/passengers/ratings/me`

### Get my rating (driver)

- `GET /v1/drivers/ratings/me`

## Request Fields

- `rating` (required, integer): 1 to 5
- `comment` (optional, string): max 500 chars

## Validation Rules

- Ride must be in a completed/rateable status.
- Only the ride passenger can rate the assigned driver.
- Only the assigned driver can rate the ride passenger.
- One rating per user per ride.

## Score Model

| Received rating | Score reduction |
|---|---|
| 5 | 0.00 |
| 4 | 0.25 |
| 3 | 0.50 |
| 2 | 0.75 |
| 1 | 1.00 |

Formula:

```text
New Score = Current Score - Reduction Factor
```

- Minimum score floor: `0.00`
- Default for unrated users: `10.00`

## Processing Flow

1. Validate ride status and authorization.
2. Ensure no duplicate rating exists for the same rater + ride.
3. Persist rating record.
4. Create/update aggregate score in `user_ratings`.
5. Update ride progression if both sides have submitted ratings.

## Error Codes

- `RIDE_NOT_FOUND`
- `RIDE_NOT_FINALIZED`
- `RATING_ALREADY_EXISTS`
- `UNAUTHORIZED_RATING`
- `INVALID_RATING`

## Operational Notes

- Rating records are auditable and timestamped.
- Aggregates support fast reads from `GET .../ratings/me`.
- Low scores can be used later for ranking/restriction policies.

## End of Document
