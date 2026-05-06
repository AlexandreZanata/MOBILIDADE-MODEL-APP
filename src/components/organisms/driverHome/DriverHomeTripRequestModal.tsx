import React, { memo } from 'react';
import { PendingTripData } from '@/models/driverHome/types';
import { DriverTripRequestScreen } from '@/screens/DriverTripRequestScreen';

interface DriverHomeTripRequestModalProps {
  visible: boolean;
  tripData: PendingTripData | null;
  onAccept: () => void;
  onReject: () => void;
  onTimeout: () => void;
}

export const DriverHomeTripRequestModal = memo((props: DriverHomeTripRequestModalProps) => (
  <DriverTripRequestScreen
    visible={props.visible}
    tripData={props.tripData}
    onAccept={props.onAccept}
    onReject={props.onReject}
    onTimeout={props.onTimeout}
  />
));
