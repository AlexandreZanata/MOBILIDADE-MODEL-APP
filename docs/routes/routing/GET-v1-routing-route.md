# GET /v1/routing/route

**Tag:** Routing  
**Summary:** Calculate route (GET)  
**Description:** GET version of the route calculation endpoint. Useful for quick tests and debugging. Prefer `POST /v1/routing/route` in production.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

| Name              | Location | Type    | Required | Default | Description                                  |
|-------------------|----------|---------|----------|---------|----------------------------------------------|
| `originLat`       | query    | number  | Yes      | —       | Latitude of the origin point                 |
| `originLng`       | query    | number  | Yes      | —       | Longitude of the origin point                |
| `destinationLat`  | query    | number  | Yes      | —       | Latitude of the destination point            |
| `destinationLng`  | query    | number  | Yes      | —       | Longitude of the destination point           |
| `includeSteps`    | query    | boolean | No       | `false` | Include step-by-step navigation instructions |
| `includeGeometry` | query    | boolean | No       | `false` | Include full route geometry as GeoJSON       |

**Example URL:**

```
GET /v1/routing/route?originLat=-23.55052&originLng=-46.633308&destinationLat=-23.561414&destinationLng=-46.65607
```

---

## Request Body

None.

---

## Responses

### 200 — Route calculated successfully

**Content-Type:** `application/json`

```json
{
  "distanceMeters": 5234.5,
  "distanceKm": 5.23,
  "durationSeconds": 720,
  "durationMinutes": 12,
  "durationFormatted": "12",
  "steps": [
    {
      "distanceMeters": 150.5,
      "durationSeconds": 25,
      "instruction": "Vire à direita na Rua Augusta",
      "name": "Rua Augusta",
      "maneuver": "turn-right"
    }
  ],
  "geometry": {
    "type": "LineString",
    "coordinates": [[0.1]]
  },
  "cached": false,
  "calculatedAt": "2025-12-09T14:30:00Z"
}
```

| Field               | Type    | Description                                                           |
|---------------------|---------|-----------------------------------------------------------------------|
| `distanceMeters`    | number  | Total route distance in meters                                        |
| `distanceKm`        | number  | Total route distance in kilometers                                    |
| `durationSeconds`   | number  | Estimated travel time in seconds                                      |
| `durationMinutes`   | number  | Estimated travel time in minutes                                      |
| `durationFormatted` | string  | Human-readable duration string                                        |
| `steps`             | array   | Step-by-step navigation instructions (present if `includeSteps=true`) |
| `geometry`          | object  | GeoJSON LineString of the route (present if `includeGeometry=true`)   |
| `cached`            | boolean | Whether the result was served from cache                              |
| `calculatedAt`      | string  | ISO 8601 timestamp of the calculation                                 |

#### `steps[]` Item Fields

| Field             | Type   | Description                                   |
|-------------------|--------|-----------------------------------------------|
| `distanceMeters`  | number | Distance of this step in meters               |
| `durationSeconds` | number | Duration of this step in seconds              |
| `instruction`     | string | Human-readable navigation instruction         |
| `name`            | string | Name of the road or path for this step        |
| `maneuver`        | string | Maneuver type (e.g. `turn-right`, `straight`) |

#### `geometry` Object Fields

| Field         | Type       | Description                            |
|---------------|------------|----------------------------------------|
| `type`        | string     | Always `LineString`                    |
| `coordinates` | number[][] | Array of `[lng, lat]` coordinate pairs |

---

### 400 — Bad Request

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 401 — Unauthorized

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 403 — Forbidden

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 404 — Not Found

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 422 — Validation Error

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

### 500 — Internal Server Error

**Content-Type:** `application/json`

```json
{
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "fields": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  }
}
```

---

## Error Envelope Reference

| Field           | Type   | Description                                     |
|-----------------|--------|-------------------------------------------------|
| `error.message` | string | Human-readable error description                |
| `error.code`    | string | Machine-readable error code                     |
| `error.fields`  | object | Map of field names to validation error messages |

---

## Frontend Integration Notes

- Use `POST /v1/routing/route` in production — this GET version is for quick testing only
- On `401`, the facade layer triggers the token refresh flow automatically
