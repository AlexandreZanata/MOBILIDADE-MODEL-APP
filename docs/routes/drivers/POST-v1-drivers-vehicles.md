# POST /v1/drivers/vehicles

**Tag:** Drivers  
**Summary:** Register vehicle  
**Description:** Registers a new vehicle for the authenticated driver. The vehicle is created with status `PENDING_DOCS` and the driver must upload the CRLV document for approval. Use the brand and model listing endpoints to obtain valid `brandId` and `modelId` values.  
**Authentication:** Bearer token required (`Authorization: Bearer <accessToken>`).

---

## Parameters

None.

---

## Request Body

**Content-Type:** `application/json`

```json
{
  "licensePlate": "ABC-1234",
  "brandId": "018f1234-5678-9abc-def0-123456789abc",
  "modelId": "018f1234-5678-9abc-def0-123456789def",
  "year": 2020,
  "color": "Branco",
  "serviceCategoryId": "018f1234-5678-9abc-def0-123456789ghi"
}
```

| Field               | Type   | Required | Description                                                   |
|---------------------|--------|----------|---------------------------------------------------------------|
| `licensePlate`      | string | Yes      | Vehicle license plate                                         |
| `brandId`           | string | Yes      | UUID of the vehicle brand (from `/v1/drivers/vehicle-brands`) |
| `modelId`           | string | Yes      | UUID of the vehicle model (from `/v1/drivers/vehicle-models`) |
| `year`              | number | Yes      | Vehicle manufacture year                                      |
| `color`             | string | Yes      | Vehicle color                                                 |
| `serviceCategoryId` | string | Yes      | UUID of the desired service category                          |

---

## Responses

### 201 — Vehicle registered successfully

**Content-Type:** `application/json`

```json
{
  "id": "018f1234-5678-9abc-def0-123456789abc",
  "driverProfileId": "018f1234-5678-9abc-def0-123456789def",
  "serviceCategoryId": null,
  "licensePlate": "ABC-1234",
  "brand": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "color": "Branco",
  "status": "PENDING_DOCS",
  "createdAt": "2025-12-03T08:00:00Z",
  "updatedAt": "2025-12-03T08:00:00Z"
}
```

| Field               | Type   | Description                                                                |
|---------------------|--------|----------------------------------------------------------------------------|
| `id`                | string | UUID of the newly created vehicle                                          |
| `driverProfileId`   | string | UUID of the driver profile that owns this vehicle                          |
| `serviceCategoryId` | string | UUID of the service category — `null` until approved                       |
| `licensePlate`      | string | Vehicle license plate                                                      |
| `brand`             | string | Resolved brand name (not the `brandId`)                                    |
| `model`             | string | Resolved model name (not the `modelId`)                                    |
| `year`              | number | Vehicle manufacture year                                                   |
| `color`             | string | Vehicle color                                                              |
| `status`            | string | Always `PENDING_DOCS` on creation                                          |
| `createdAt`         | string | ISO 8601 creation timestamp                                                |
| `updatedAt`         | string | ISO 8601 last update timestamp                                             |

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

- Called by `driversFacade.registerVehicle(input)` via `useRegisterVehicle` mutation
- On `onSuccess`, invalidate `driverVehiclesKeys.all` and redirect to the CRLV upload step
- After creation, the driver must upload the CRLV via `POST /v1/drivers/documents`
- On `401`, the facade layer triggers the token refresh flow automatically
