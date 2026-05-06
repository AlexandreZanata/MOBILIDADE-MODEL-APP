import React from 'react';
import { DriverTripRequestModalContent } from '@/components/organisms/driverTripRequest/DriverTripRequestModalContent';
import { useDriverTripRequest } from '@/hooks/driverTripRequest/useDriverTripRequest';

interface DriverTripRequestScreenProps {
  visible?: boolean;
  tripData?: unknown;
  onAccept?: () => void;
  onReject?: () => void;
  onTimeout?: () => void;
  navigation?: { goBack: () => void };
  route?: {
    params?: {
      visible?: boolean;
      tripData?: unknown;
      onAccept?: () => void;
      onReject?: () => void;
      onTimeout?: () => void;
    };
  };
}

export const DriverTripRequestScreen: React.FC<DriverTripRequestScreenProps> = (props) => {
  const state = useDriverTripRequest(props);

  if (!state.tripData) return null;

  return (
    <DriverTripRequestModalContent
      visible={state.visible}
      tripData={state.tripData}
      passenger={state.passenger}
      originAddress={state.originAddress}
      destinationAddress={state.destinationAddress}
      timeLeft={state.timeLeft}
      distanceLabel={state.formatDistance(state.tripData.distanceKm)}
      durationLabel={state.formatDuration(state.tripData.durationSeconds)}
      onAccept={state.onAccept}
      onReject={state.onReject}
    />
  );
};
