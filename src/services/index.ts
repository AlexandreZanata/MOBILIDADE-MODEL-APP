/**
 * Exporta todos os serviços da aplicação
 */

// API principal
export { apiService, type ApiResponse, type AuthResponse, type LoginRequest } from './api';

// WebSocket clients (new modular structure)
export {
  driverWebSocket,
  passengerWebSocket,
  chatWebSocket,
} from './websocket';
export type {
  DriverServerMessage,
  DriverRideOfferMessage,
  DriverActiveRideMessage,
  PassengerServerMessage,
  ChatServerMessage,
} from './websocket';

// Gerenciamento de veículos
export { 
  vehiclesService,
  type VehicleBrand,
  type VehicleModel,
  type Vehicle,
  type CreateVehicleData,
} from './vehiclesService';

// Serviço completo de trips
export {
  tripsService,
  type TripCategory,
  type TripEstimate,
  type Trip,
  type CreateTripRequest,
  type CategoryEstimate,
} from './tripsService';

// Serviço de pricing
export {
  pricingService,
  type TripPricingSettings,
  type TripPricingResponse,
} from './pricingService';

// Serviço de roteamento
export {
  routingService,
  type RouteResponse,
  type RouteStep,
  type RouteGeometry,
  type RouteRequest,
  type RateLimitResponse,
} from './routingService';

// Serviço de Places & Geocoding
export {
  autocompletePlaces,
  geocode,
  reverseGeocode,
  getPlaceDetails,
  searchPlaces,
  getQuotaStats,
  getRateLimit,
  resetSessionToken,
  type PlaceAutocompleteResult,
  type PlaceAutocompleteResponse,
  type GeocodingResult,
  type GeocodingResponse,
  type PlaceDetailsResponse,
  type PlacesSearchResult,
  type PlacesReverseResult,
} from './placesService';

