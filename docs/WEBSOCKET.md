# WebSocket Documentation - Real-Time Tracking and Notification System

## Overview

The WebSocket system enables real-time bidirectional communication between:
- **Drivers**: Send location updates, receive ride offers, and respond to offers
- **Passengers**: Receive ride status notifications in real time

The system uses Redis GEO to store positions, H3 for spatial indexing, and WebSocket for realtime communication.

## Endpoints

### Drivers

```
ws://host:port/ws/drivers?token=<JWT_TOKEN>
```

**Authentication:**
- **Method**: Query parameter
- **Parameter**: `token`
- **Type**: JWT access token
- **Requirement**: Valid token with role `driver`

**Example:**
```javascript
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...";
const ws = new WebSocket(`ws://localhost:8080/ws/drivers?token=${token}`);
```

### Passengers

```
ws://host:port/ws/passengers?token=<JWT_TOKEN>
```

**Authentication:**
- **Method**: Query parameter
- **Parameter**: `token`
- **Type**: JWT access token
- **Requirement**: Valid token with role `passenger`

**Example:**
```javascript
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...";
const ws = new WebSocket(`ws://localhost:8080/ws/passengers?token=${token}`);
```

## Client-to-Server Messages

### 1. Location Update

Sends the driver's current position. It should be sent every 2-5 seconds.

**Format:**
```json
{
  "type": "location_update",
  "lat": -23.5505,
  "lng": -46.6333,
  "heading": 90.0,
  "speed": 45.5
}
```

**Fields:**
- `type` (string, required): Always `"location_update"`
- `lat` (number, required): Latitude in decimal degrees (-90 to 90)
- `lng` (number, required): Longitude in decimal degrees (-180 to 180)
- `heading` (number, optional): Direction in degrees (0-360)
- `speed` (number, optional): Speed in km/h

**Success Response:**
```json
{
  "type": "location_update",
  "message": "Location updated successfully"
}
```

**Behavior:**
- Updates the position in Redis GEO
- Adds the driver to the corresponding H3 cell
- Automatically refreshes heartbeat (10-second TTL)
- Automatically removes stale H3 cell membership on expiration

### 2. Heartbeat

Keeps the connection alive. It should be sent periodically when location updates are not being sent.

**Format:**
```json
{
  "type": "heartbeat"
}
```

**Response:**
```json
{
  "type": "pong",
  "message": "Heartbeat received"
}
```

**Behavior:**
- Renews TTL for connection and status keys
- If no heartbeat is received for 15 seconds, the driver is automatically marked offline

### 3. Operational Status Update

Updates the driver's operational status.

**Format:**
```json
{
  "type": "status_update",
  "status": "AVAILABLE"
}
```

**Valid Values:**
- `AVAILABLE`: Driver is available and accepting rides
- `BUSY`: Driver is busy with an active ride
- `PAUSED`: Driver is temporarily unavailable
- `OFFLINE`: Driver manually set to offline

**Success Response:**
```json
{
  "type": "status_updated",
  "message": "Status updated successfully"
}
```

**Error Response:**
```json
{
  "type": "error",
  "message": "Invalid status: INVALID_STATUS"
}
```

### 4. Ride Offer Response

The driver accepts or rejects a ride offer.

**Format (Accept):**
```json
{
  "type": "ride_response",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "action": "accept"
}
```

**Format (Reject):**
```json
{
  "type": "ride_response",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "action": "reject"
}
```

**Fields:**
- `type` (string, required): Always `"ride_response"`
- `rideId` (UUID, required): Offered ride ID
- `action` (string, required): `"accept"` or `"reject"`

**Success Response (Accept):**
```json
{
  "type": "ride_accepted",
  "message": "Ride accepted successfully"
}
```

**Success Response (Reject):**
```json
{
  "type": "ride_rejected",
  "message": "Ride rejected"
}
```

**Error Response:**
```json
{
  "type": "error",
  "message": "Could not accept the ride. It may already have been accepted by another driver or expired."
}
```

**Behavior:**
- Acceptance is processed atomically with Redis locks
- Prevents multiple drivers from accepting the same ride
- On acceptance, the driver is automatically marked as `BUSY`
- On rejection, the system tries the next driver in the candidate list

## Server-to-Client Messages (Drivers)

### Connection Established

Sent automatically when the connection is established successfully.

```json
{
  "type": "connected",
  "message": "Connection established successfully"
}
```

### Active Ride (Reconnection)

Sent automatically when the driver reconnects and has an active ride.
It allows the app to restore the ride UI state without an extra REST request.

**Format:**
```json
{
  "type": "active_ride",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "passengerId": "018f1234-5678-9abc-def0-123456789def",
  "status": "MOTORISTA_ACEITOU",
  "estimatedPrice": 23.9,
  "finalPrice": null,
  "distanceKm": 6.4,
  "durationMinutes": 18.0,
  "surge": 1.2,
  "requestedAt": "2025-12-01T08:00:00Z",
  "passenger": {
    "id": "018f1234-5678-9abc-def0-123456789def",
    "name": "Maria Santos",
    "rating": 9.75
  },
  "passengerLocation": {
    "lat": -23.5505,
    "lng": -46.6333
  }
}
```

**Fields:**
- `type` (string): Always `"active_ride"`
- `rideId` (UUID): Active ride ID
- `passengerId` (UUID): Passenger ID
- `status` (string): Current ride status
- `estimatedPrice` (number): Estimated ride price
- `finalPrice` (number|null): Final price (`null` if not completed yet)
- `distanceKm` (number): Distance in kilometers
- `durationMinutes` (number): Estimated duration in minutes
- `surge` (number): Applied surge multiplier
- `requestedAt` (ISO 8601): Request timestamp
- `passenger` (object): Passenger info
- `passengerLocation` (object|null): Passenger location if available

**Behavior:**
- Sent automatically after `connected` when an active ride exists
- Not sent when no active ride exists
- Can be used to restore active ride UI state
- Includes passenger location if available in Redis
- REST fallback if WebSocket fails: `GET /v1/drivers/active-ride`

### Ride Offer

Sent when a ride is available for the driver.

**Format:**
```json
{
  "type": "ride_offer",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "pickup": {
    "lat": -23.5505,
    "lng": -46.6333
  },
  "destination": {
    "lat": -23.5510,
    "lng": -46.6340
  },
  "estimatedPrice": 26.1,
  "distanceKm": 6.4,
  "durationMinutes": 18.0,
  "etaToPickupMinutes": 5,
  "expiresInSeconds": 15
}
```

**Fields:**
- `type` (string): Always `"ride_offer"`
- `rideId` (UUID): Ride ID
- `pickup` (object): Pickup coordinates
- `destination` (object): Destination coordinates
- `estimatedPrice` (number): Estimated fare
- `distanceKm` (number): Distance in kilometers
- `durationMinutes` (number): Estimated duration in minutes
- `etaToPickupMinutes` (number): ETA to pickup
- `expiresInSeconds` (number): Time left to respond (typically 15s)

**Behavior:**
- Expires after 15 seconds if no response is received
- If expired, the system tries the next driver
- Driver must answer with `ride_response` (`accept` or `reject`)

### Generic Success Responses

Every valid client message receives a confirmation response:

```json
{
  "type": "<action_type>",
  "message": "Confirmation message"
}
```

### Error Responses

When an error occurs, the server returns:

```json
{
  "type": "error",
  "message": "Error description"
}
```

## Server-to-Client Messages (Passengers)

### Connection Established

Sent automatically when the connection is established successfully.

```json
{
  "type": "connected",
  "message": "Connection established successfully"
}
```

### Ride Notifications

Passengers receive realtime ride status notifications.

#### Driver Accepted

Sent when a driver accepts the ride. It may include complete driver details (name, rating, vehicle).

**Format:**
```json
{
  "type": "ride_driver_accepted",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "message": "Driver accepted your ride",
  "data": {
    "driverId": "018f1234-5678-9abc-def0-123456789def",
    "status": "MOTORISTA_ACEITOU",
    "driver": {
      "id": "018f1234-5678-9abc-def0-123456789def",
      "name": "Joao Silva",
      "rating": 9.5,
      "vehicle": {
        "licensePlate": "ABC-1234",
        "brand": "Toyota",
        "model": "Corolla",
        "color": "White"
      }
    }
  }
}
```

**Fields:**
- `type` (string): Always `"ride_driver_accepted"`
- `rideId` (UUID): Ride ID
- `message` (string): Human-readable message
- `data` (object): Notification payload
  - `driverId` (UUID): Driver ID
  - `status` (string): Current ride status
  - `driver` (object, optional): Full driver details if available

**Behavior:**
- Sent immediately after ride acceptance
- Includes complete driver details for immediate UI display when available
- If full details cannot be loaded, payload contains only `driverId` and `status`
- REST fallback if WebSocket fails: `GET /v1/passengers/active-ride`

#### Driver On The Way

```json
{
  "type": "ride_driver_on_the_way",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "message": "Driver is on the way to the pickup point",
  "data": {
    "driverId": "018f1234-5678-9abc-def0-123456789def",
    "status": "MOTORISTA_A_CAMINHO"
  }
}
```

#### Driver Nearby

```json
{
  "type": "ride_driver_nearby",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "message": "Driver is near the pickup point",
  "data": {
    "driverId": "018f1234-5678-9abc-def0-123456789def",
    "status": "MOTORISTA_PROXIMO"
  }
}
```

#### Driver Arrived

```json
{
  "type": "ride_driver_arrived",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "message": "Driver arrived at the pickup point",
  "data": {
    "driverId": "018f1234-5678-9abc-def0-123456789def",
    "status": "MOTORISTA_CHEGOU"
  }
}
```

#### Status Update

```json
{
  "type": "ride_status_update",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "message": "On the way to destination.",
  "data": {
    "status": "EM_ROTA",
    "driverId": "018f1234-5678-9abc-def0-123456789def"
  }
}
```

**Notification Types:**
- `ride_driver_accepted`: Driver accepted the ride
- `ride_driver_on_the_way`: Driver is heading to pickup
- `ride_driver_nearby`: Driver is near pickup (max 500m)
- `ride_driver_arrived`: Driver arrived (max 100m)
- `ride_status_update`: Generic ride status update

**Behavior:**
- Notifications are sent automatically when the driver updates ride status
- Passenger socket is receive-only for ride notifications
- Connection remains open to receive subsequent events

## Driver States

The system tracks two independent state dimensions.

### 1. Connection State (System-managed)

- **Online**: Driver is connected via WebSocket with recent heartbeat (< 15s)
- **Offline**: Driver is disconnected or heartbeat is stale (> 15s)

**Rules:**
- Connection established -> `online = true`
- No messages for 15s -> `online = false` (automatic)
- Socket closed -> `online = false` (automatic)

### 2. Operational State (Driver-managed)

- **AVAILABLE**: Driver can receive rides
- **BUSY**: Driver has an active ride
- **PAUSED**: Driver is temporarily unavailable
- **OFFLINE**: Driver manually offline

**Rules:**
- Updated via WebSocket (`status_update`) or REST API
- Persisted in Redis with 24-hour TTL
- Defaults to `OFFLINE` when undefined

### Ride Eligibility

A driver receives ride offers only if:
- `online = true`
- `operationalStatus = AVAILABLE`

## Redis Structure

### Keys

```
drivers_live (GEO)
  -> Stores driver positions via Redis GEO
  -> Key: "drivers_live"
  -> Value: GeoLocation with driverId as member

drivers_status:{driverId}
  -> Connection status (online/offline)
  -> Value: "online"
  -> TTL: 10 seconds

drivers_connection:{driverId}
  -> Active WebSocket connection marker
  -> Value: "connected"
  -> TTL: 20 seconds (refreshed on heartbeat)

drivers_operational_status:{driverId}
  -> Driver operational state
  -> Value: "AVAILABLE" | "BUSY" | "PAUSED" | "OFFLINE"
  -> TTL: 24 hours

h3:cell:{h3Index}
  -> Set of drivers in a specific H3 cell
  -> Type: Set
  -> Members: driverId (String)
  -> TTL: 12 seconds
```

### H3 Spatial Indexing

- **Resolution**: 9 (cells around ~0.5km)
- **Use case**: Fast lookup of nearby drivers
- **Update trigger**: Every `location_update`
- **Expiration**: Automatic after 12 seconds without updates

## Related REST Endpoints

### GET `/v1/drivers/operational-status`

Returns operational and connection status for the authenticated driver.

**Response:**
```json
{
  "operationalStatus": "AVAILABLE",
  "isOnline": true,
  "canReceiveRides": true
}
```

### PATCH `/v1/drivers/operational-status`

Updates the driver's operational status.

**Request:**
```json
{
  "status": "AVAILABLE"
}
```

**Response:**
```json
{
  "operationalStatus": "AVAILABLE",
  "isOnline": true,
  "canReceiveRides": true
}
```

## Runtime Flow

### 1. Initial Connection

```
Client -> ws://host/ws/drivers?token=<JWT>
  -> JWT interceptor validates token and role "driver"
  -> Handler marks driver online
  -> Redis keys are created (status, connection)
  -> "connected" message is sent
```

### 2. Location Update

```
Client -> {"type": "location_update", "lat": ..., "lng": ...}
  -> Handler processes message
  -> Redis GEO is updated (drivers_live)
  -> H3 cell is computed
  -> Driver is added to H3 cell set
  -> Heartbeat TTL is refreshed
  -> Confirmation is returned
```

### 3. Heartbeat

```
Client -> {"type": "heartbeat"}
  -> Handler processes message
  -> TTL is renewed (status, connection)
  -> "pong" response is returned
```

### 4. Disconnection

```
Client closes connection or times out
  -> Handler detects disconnect
  -> Driver removed from Redis GEO
  -> H3 membership naturally expires
  -> Driver marked offline
```

## Security

### Authentication

- **JWT required**: Token must be valid and not expired
- **Role validation**: Only users with role `driver` can connect to the drivers endpoint
- **Token-derived identity**: Driver ID is extracted from token claims (never trusted from client payload)

### Validation

- Token must be present in query string
- Token must pass signature and claim validation (expiration, issuer, audience)
- User must have role `driver` or `passenger` for the selected endpoint
- Driver/passenger account must exist and not be deleted

### Attack Surface Protection

- **Single active session per driver**: Existing connection is closed on a new connection
- **Automatic TTL expiration**: Prevents stale orphan state in Redis
- **Coordinate validation**: Latitude/longitude are validated before processing

## Example Client Implementation (JavaScript)

```javascript
class DriverWebSocketClient {
  constructor(token, baseUrl = "ws://localhost:8080") {
    this.token = token;
    this.baseUrl = baseUrl;
    this.ws = null;
    this.heartbeatInterval = null;
    this.locationUpdateInterval = null;
  }

  connect() {
    const url = `${this.baseUrl}/ws/drivers?token=${this.token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.startHeartbeat();
      this.startLocationUpdates();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this.stopHeartbeat();
      this.stopLocationUpdates();
    };
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: "heartbeat" });
    }, 10000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  startLocationUpdates() {
    this.locationUpdateInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((position) => {
        this.send({
          type: "location_update",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading || null,
          speed: position.coords.speed ? position.coords.speed * 3.6 : null
        });
      });
    }, 3000);
  }

  stopLocationUpdates() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
    }
  }

  updateStatus(status) {
    this.send({
      type: "status_update",
      status
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case "connected":
        console.log("Connected:", message.message);
        break;
      case "location_update":
        console.log("Location updated");
        break;
      case "pong":
        console.log("Heartbeat confirmed");
        break;
      case "status_updated":
        console.log("Status updated");
        break;
      case "error":
        console.error("Error:", message.message);
        break;
    }
  }

  disconnect() {
    this.stopHeartbeat();
    this.stopLocationUpdates();
    if (this.ws) this.ws.close();
  }
}

const client = new DriverWebSocketClient("your-jwt-token");
client.connect();
client.updateStatus("AVAILABLE");
```

## Troubleshooting

### Problem: Connection Rejected

**Possible causes:**
- Invalid or expired token
- Token without required role
- Driver/passenger account does not exist or was deleted

**How to fix:**
- Validate JWT token and expiration
- Validate user role
- Validate account status

### Problem: Driver Becomes Offline While Connected

**Possible causes:**
- Heartbeat not being sent
- Heartbeat interval too long (> 15s)
- Intermittent network issues

**How to fix:**
- Ensure heartbeat is sent every 10 seconds
- Review network stability
- Check server logs and Redis key TTL behavior

### Problem: Location Not Updating

**Possible causes:**
- Invalid message payload format
- Invalid latitude/longitude values
- Driver record not found

**How to fix:**
- Validate JSON payload format
- Validate coordinate ranges (`lat`: -90..90, `lng`: -180..180)
- Check backend logs for validation errors

## Limits and Operational Notes

### Performance

- **Heartbeat**: Recommended every 10 seconds
- **Location updates**: Recommended every 2-5 seconds
- **Timeout behavior**: Driver is considered offline after ~15 seconds without heartbeat/message

### Scalability

- Supports many simultaneous connections
- Redis GEO is optimized for geospatial lookups
- H3 indexing allows efficient regional candidate filtering

### Monitoring

- Connection/disconnection logs
- Heartbeat metrics
- Online/offline driver state metrics

## Ride Matching and Dispatch

### Ride Offer Flow

1. **Passenger requests ride** -> Ride is created with `AGUARDANDO_MOTORISTA`
2. **System finds candidate drivers** -> Uses H3 + Redis GEO
3. **System sends offer** -> Sends to closest candidate via WebSocket
4. **Driver responds** -> Accepts or rejects via WebSocket
5. **If accepted** -> Ride moves to `MOTORISTA_ACEITOU`, passenger is notified
6. **If rejected/timeout** -> System tries next candidate

### Dispatch Strategy

- **Sequential unicast**: One driver at a time
- **Offer timeout**: 15 seconds per offer
- **Max attempts**: 20 drivers (configurable)
- **Redis locks**: Prevent concurrent acceptance races

### Redis Structures for Dispatch

```
ride_dispatch:{rideId}
  -> Dispatch state for one ride
  -> Contains candidate list and current index
  -> TTL: 10 minutes

ride_offer:{rideId}:{driverId}
  -> Individual offer state per driver
  -> Status: pending | accepted | rejected | expired
  -> TTL: 25 seconds (15s timeout + 10s buffer)

lock:ride:{rideId}
  -> Lock for ride acceptance processing
  -> TTL: 5 seconds

lock:driver:{driverId}
  -> Lock for driver acceptance processing
  -> TTL: 5 seconds
```

## REST Endpoints for Driver Ride Progress

### PATCH `/v1/drivers/rides/{rideId}/on-the-way`

Driver indicates they are on the way to pickup.

**Request:** no body

**Response:** `204 No Content`

### PATCH `/v1/drivers/rides/{rideId}/nearby`

Driver indicates they are near pickup (max 500m).

**Request:**
```json
{
  "lat": -23.5505,
  "lng": -46.6333
}
```

**Response:** `204 No Content`

**Validation:** distance to pickup must be <= 500m

### PATCH `/v1/drivers/rides/{rideId}/arrived`

Driver indicates they arrived at pickup (max 100m).

**Request:**
```json
{
  "lat": -23.5505,
  "lng": -46.6333
}
```

**Response:** `204 No Content`

**Validation:** distance to pickup must be <= 100m

### PATCH `/v1/drivers/rides/{rideId}/boarded`

Driver indicates passenger boarded.

**Request:** no body

**Response:** `204 No Content`

### PATCH `/v1/drivers/rides/{rideId}/in-route`

Driver indicates ride is in route to destination.

**Request:** no body

**Response:** `204 No Content`

### PATCH `/v1/drivers/rides/{rideId}/near-destination`

Driver indicates they are near destination (max 500m).

**Request:**
```json
{
  "lat": -23.5510,
  "lng": -46.6340
}
```

**Response:** `204 No Content`

**Validation:** distance to destination must be <= 500m

### PATCH `/v1/drivers/rides/{rideId}/complete`

Driver completes the ride and sends final fare.

**Request:**
```json
{
  "finalPrice": 28.5
}
```

**Response:** `204 No Content`

## Ride State Machine

```
AGUARDANDO_MOTORISTA
  -> (system finds drivers)
MOTORISTA_ENCONTRADO
  -> (driver accepts)
MOTORISTA_ACEITOU
  -> (driver updates)
MOTORISTA_A_CAMINHO
  -> (driver nearby, 500m validation)
MOTORISTA_PROXIMO
  -> (driver arrived, 100m validation)
MOTORISTA_CHEGOU
  -> (driver updates)
PASSAGEIRO_EMBARCADO
  -> (driver updates)
EM_ROTA
  -> (near destination, 500m validation)
PROXIMO_DESTINO
  -> (driver completes)
CORRIDA_FINALIZADA
  -> (await rating)
AGUARDANDO_AVALIACAO
  ->
CONCLUIDA
```

**Cancellation States:**
- `CANCELADA_PASSAGEIRO`: Canceled by passenger
- `CANCELADA_MOTORISTA`: Canceled by driver
- `CANCELADA_NO_SHOW`: Passenger did not show up
- `EXPIRADA`: No driver accepted within timeout

## Distance Validation

Distance checks use the Haversine formula:

- **Near pickup**: maximum 500m
- **Arrived at pickup**: maximum 100m
- **Near destination**: maximum 500m

Validations run automatically when the driver attempts status changes that require proximity.

## Changelog

### v1.0.0 (2025-12-01)
- Initial WebSocket implementation
- Real-time location support
- Heartbeat mechanism
- Operational status management
- Redis GEO + H3 integration

### v2.0.0 (2025-12-03)
- Ride matching and dispatch system
- Ride offers to drivers via WebSocket
- Accept/reject responses via WebSocket
- Redis locks for atomic operations
- Timeout worker for expired offers
- Passenger WebSocket notifications
- REST endpoints for driver ride status updates
- Geographic distance validation (Haversine)
- Automatic passenger notifications on each status transition

### v2.1.0 (2025-12-03)
- **Progressive search radius expansion**: Automatically expands driver search radius up to 50km
- **Passenger live location sharing**: Passenger location can be sent via WebSocket and streamed to driver during active rides
- **Passenger location broadcast worker**: Periodic worker pushes passenger location to the driver every 5 seconds
- **Expired ride notification**: Passenger is notified when no drivers are found after search expansion

## Passenger Location Sharing

### Overview

During active rides, the driver can view the passenger location in real time.
Passenger location is sent via WebSocket, stored in Redis GEO, and broadcast to the assigned driver.

### Flow

1. **Passenger sends location** via WebSocket (`location_update`)
2. **System stores location** in Redis GEO key `passengers_live` with 30-second TTL
3. **Periodic worker runs** every 5 seconds
4. **Driver receives** `passenger_location` messages with current coordinates

### Passenger Messages

#### Location Update

**Format:**
```json
{
  "type": "location_update",
  "lat": -23.5505,
  "lng": -46.6333,
  "heading": 90.0,
  "speed": 45.5
}
```

**Fields:**
- `type` (string, required): Always `"location_update"`
- `lat` (number, required): Latitude in decimal degrees (-90 to 90)
- `lng` (number, required): Longitude in decimal degrees (-180 to 180)
- `heading` (number, optional): Direction in degrees (0-360)
- `speed` (number, optional): Speed in km/h

**Success Response:**
```json
{
  "type": "location_update",
  "message": "Location updated successfully"
}
```

**Behavior:**
- Stored in Redis GEO (`passengers_live`)
- 30-second TTL (auto-expires without refresh)
- Worker broadcasts to the assigned driver every 5 seconds during active rides

### Driver Messages

#### Passenger Location

Sent automatically during active rides while the passenger is sharing location.

**Format:**
```json
{
  "type": "passenger_location",
  "rideId": "018f1234-5678-9abc-def0-123456789abc",
  "passengerId": "018f1234-5678-9abc-def0-123456789def",
  "lat": -23.5505,
  "lng": -46.6333
}
```

**Fields:**
- `type` (string): Always `"passenger_location"`
- `rideId` (UUID): Active ride ID
- `passengerId` (UUID): Passenger ID
- `lat` (number): Passenger latitude
- `lng` (number): Passenger longitude

**Behavior:**
- Sent every 5 seconds during active rides
- Applies to ride states: `MOTORISTA_ACEITOU`, `MOTORISTA_A_CAMINHO`, `MOTORISTA_PROXIMO`, `MOTORISTA_CHEGOU`, `PASSAGEIRO_EMBARCADO`, `EM_ROTA`, `PROXIMO_DESTINO`
- If passenger is not sharing location, no message is sent

### Redis Structure for Passenger Tracking

```
passengers_live (GEO)
  -> Stores passenger positions via Redis GEO
  -> Key: "passengers_live"
  -> Value: GeoLocation with passengerId as member
  -> TTL: 30 seconds (refreshed on update)
```

## Progressive Search Radius Expansion

### Overview

If no nearby drivers are found initially, the system progressively expands the search radius until drivers are found or the maximum limit is reached.

### Search Strategy

1. **Attempt 1: H3 initial ring (`ring=2`)**
   - Fast lookup in nearby H3 cells
   - Best for high-density areas

2. **Attempt 2: Progressive H3 ring expansion (`ring=3` to `ring=10`)**
   - Expands H3 coverage gradually
   - Keeps search efficient before broader fallback

3. **Attempt 3: Redis GEO expanding radius (`5km` to `50km`)**
   - Wider geospatial lookup fallback
   - Radius increases by `5km` per attempt
   - Max radius: `50km`

### Configuration

```java
H3_RING_SIZE_INITIAL = 2
H3_RING_SIZE_MAX = 10
GEO_RADIUS_INITIAL_KM = 5.0
GEO_RADIUS_MAX_KM = 50.0
GEO_RADIUS_INCREMENT_KM = 5.0
```

### Logs

The system logs the strategy that found candidates:

```
Found 3 candidate drivers with H3 (ring=2) for origin (-23.5505, -46.6333)
Found 5 candidate drivers with Redis GEO (radius=15km) for origin (-23.5505, -46.6333)
```

