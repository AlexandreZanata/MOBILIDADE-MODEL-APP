/**
 * @file WaitingForDriverScreen.tsx
 * @description Entry-point screen for the "Waiting for Driver" flow.
 *
 * Responsibilities:
 *  - Receives navigation params and delegates all logic to the hook
 *  - Renders the pure-presentational organism
 *  - Bottom navigation is intentionally hidden on this screen
 */
import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { WaitingForDriverScreenContent } from '@/components/organisms/waitingForDriver/WaitingForDriverScreenContent';
import { useWaitingForDriverScreen } from '@/hooks/waitingForDriver/useWaitingForDriverScreen';

// ─── Navigation types ─────────────────────────────────────────────────────────

/** Coordinates passed from the home screen at ride creation time. */
interface NavLatLng {
  lat: number;
  lng: number;
}

type WaitingForDriverNavigationParams = {
  WaitingForDriver: {
    tripId?: string;
    estimatedFare?: number;
    tripData?: { id?: string; estimated_fare?: number; final_fare?: number };
    /** Origin coordinates — set by useHome at requestTrip time. */
    userLocation?: NavLatLng;
    /** Destination coordinates — set by useHome at requestTrip time. */
    destination?: NavLatLng;
    /** Destination display name — set by useHome at requestTrip time. */
    destinationName?: string;
  };
  Main: undefined;
};

interface WaitingForDriverScreenProps {
  navigation: NavigationProp<WaitingForDriverNavigationParams, 'WaitingForDriver'>;
  route?: {
    params?: {
      tripId?: string;
      estimatedFare?: number;
      tripData?: { id?: string; estimated_fare?: number; final_fare?: number };
      userLocation?: NavLatLng;
      destination?: NavLatLng;
      destinationName?: string;
    };
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const WaitingForDriverScreen: React.FC<WaitingForDriverScreenProps> = ({
  navigation,
  route,
}) => {
  const params = route?.params;

  // Origin: from nav params (set by useHome at ride creation)
  const navOrigin = params?.userLocation
    ? { lat: params.userLocation.lat, lon: params.userLocation.lng }
    : undefined;

  // Destination: from nav params (set by useHome at ride creation)
  const navDestination = params?.destination
    ? { lat: params.destination.lat, lon: params.destination.lng }
    : undefined;

  const state = useWaitingForDriverScreen({
    initialTripId: params?.tripId ?? params?.tripData?.id,
    initialEstimatedFare:
      params?.estimatedFare ??
      params?.tripData?.estimated_fare ??
      params?.tripData?.final_fare,
    /** Origin coords from navigation — used immediately before API polling resolves. */
    navOrigin,
    /** Destination coords from navigation — used immediately before API polling resolves. */
    navDestination,
    /** Destination name from navigation — shown while reverse geocoding runs. */
    navDestinationName: params?.destinationName,
    onNavigateMain: () => navigation.navigate('Main'),
  });

  return (
    <WaitingForDriverScreenContent
      colors={state.colors}
      insetsTop={state.insets.top}
      insetsBottom={state.insets.bottom}
      rideId={state.rideId}
      userLocation={state.userLocation}
      tripOrigin={state.tripOrigin}
      tripDestination={state.tripDestination}
      routePoints={state.routePoints}
      driver={state.driver}
      tripStatus={state.tripStatus}
      estimatedFare={state.estimatedFare}
      isSearching={state.isSearching}
      chatOpenForRide={state.chatOpenForRide}
      ratingModalVisible={state.ratingModalVisible}
      ratingValue={state.ratingValue}
      ratingComment={state.ratingComment}
      isSubmittingRating={state.isSubmittingRating}
      originAddress={state.originAddress}
      destinationAddress={state.destinationAddress}
      categoryName={state.categoryName}
      onToggleChat={state.onToggleChat}
      onCancelRide={state.onCancelRide}
      onSetRatingValue={state.setRatingValue}
      onSetRatingComment={state.setRatingComment}
      onSetRatingModalVisible={state.setRatingModalVisible}
      onSubmitRating={state.onSubmitRating}
      onSkipRating={state.onSkipRating}
    />
  );
};
