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

type WaitingForDriverNavigationParams = {
  WaitingForDriver: {
    tripId?: string;
    estimatedFare?: number;
    tripData?: { id?: string; estimated_fare?: number; final_fare?: number };
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
    };
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const WaitingForDriverScreen: React.FC<WaitingForDriverScreenProps> = ({
  navigation,
  route,
}) => {
  const state = useWaitingForDriverScreen({
    initialTripId: route?.params?.tripId ?? route?.params?.tripData?.id,
    initialEstimatedFare:
      route?.params?.estimatedFare ??
      route?.params?.tripData?.estimated_fare ??
      route?.params?.tripData?.final_fare,
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
