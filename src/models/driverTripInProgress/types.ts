import { RoutePoint } from '@/components/molecules/TileMap';

export interface DriverTripCoordinate {
  lat: number;
  lon: number;
}

export interface DriverTripPassengerInfo {
  id?: string;
  name: string;
  phone?: string;
  photoUrl?: string;
}

export interface DriverTripData {
  id: string;
  status: string;
  estimatedFare?: number;
  finalFare?: number;
  passenger?: DriverTripPassengerInfo;
  passengerId?: string;
  passengerName?: string;
  origin?: DriverTripCoordinate;
  destination?: DriverTripCoordinate;
}

export interface DriverTripRatingForm {
  ratingValue: number;
  ratingComment: string;
  hasUserClickedStar: boolean;
}

export interface DriverTripCancelForm {
  reason: string;
}

export type DriverTripStatusAction =
  | 'DRIVER_ON_THE_WAY'
  | 'DRIVER_NEARBY'
  | 'DRIVER_ARRIVED'
  | 'PASSENGER_BOARDED'
  | 'IN_ROUTE'
  | 'NEAR_DESTINATION'
  | 'COMPLETED';

export interface DriverTripStatusButton {
  title: string;
  status: DriverTripStatusAction;
  variant: 'primary' | 'secondary';
}

export interface DriverTripViewData {
  rideId: string | null;
  tripData: DriverTripData | null;
  currentStatus: string;
  mapCenter: DriverTripCoordinate;
  mapZoom: number;
  routePoints: RoutePoint[];
  driverLocation: DriverTripCoordinate | null;
  passengerLocation: DriverTripCoordinate | null;
  destinationLocation: DriverTripCoordinate | null;
  originAddress: string;
  destinationAddress: string;
  passengerInfo: DriverTripPassengerInfo | null;
  isLoading: boolean;
  isUpdating: boolean;
  isMinimized: boolean;
  canCancelRide: boolean;
  statusButton: DriverTripStatusButton | null;
  ratingModalVisible: boolean;
  cancelModalVisible: boolean;
  isSubmittingRating: boolean;
  ratingForm: DriverTripRatingForm;
  cancelForm: DriverTripCancelForm;
}
