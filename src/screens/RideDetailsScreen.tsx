import React from 'react';
import { useRideDetails } from '@/hooks/rideDetails/useRideDetails';
import { RideDetailsContent } from '@/components/organisms/rideDetails/RideDetailsContent';

interface RideDetailsScreenProps {
  route?: {
    params?: unknown;
  };
  navigation: {
    goBack: () => void;
  };
}

export const RideDetailsScreen: React.FC<RideDetailsScreenProps> = ({ route, navigation }) => {
  const rideDetails = useRideDetails({ route, navigation });

  return (
    <RideDetailsContent
      ride={rideDetails.ride}
      isDriver={rideDetails.isDriver}
      statusLabel={rideDetails.statusLabel}
      statusTone={rideDetails.statusTone}
      peer={rideDetails.peer ?? null}
      peerPhoto={rideDetails.peerPhoto}
      formatDate={rideDetails.formatDate}
      formatPrice={rideDetails.formatPrice}
      formatDistance={rideDetails.formatDistance}
      formatDuration={rideDetails.formatDuration}
      onBack={rideDetails.onBack}
    />
  );
};

