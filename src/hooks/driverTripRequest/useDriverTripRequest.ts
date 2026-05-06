import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { driverTripRequestFacade } from '@/services/driverTripRequest/driverTripRequestFacade';
import { DriverTripRequestData, DriverTripRequestPassenger } from '@/models/driverTripRequest/types';

interface DriverTripRequestRouteParams {
  visible?: boolean;
  tripData?: unknown;
  onAccept?: () => void;
  onReject?: () => void;
  onTimeout?: () => void;
}

interface DriverTripRequestInput {
  visible?: boolean;
  tripData?: unknown;
  onAccept?: () => void;
  onReject?: () => void;
  onTimeout?: () => void;
  navigation?: { goBack: () => void };
  route?: { params?: DriverTripRequestRouteParams };
}

function formatDistance(km?: number): string {
  if (!km) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

export function useDriverTripRequest(input: DriverTripRequestInput) {
  const rawTripData = input.tripData ?? input.route?.params?.tripData;
  const visible = input.visible ?? input.route?.params?.visible ?? Boolean(rawTripData);
  const onAccept = input.onAccept ?? input.route?.params?.onAccept ?? (() => input.navigation?.goBack());
  const onReject = input.onReject ?? input.route?.params?.onReject ?? (() => input.navigation?.goBack());
  const onTimeout = input.onTimeout ?? input.route?.params?.onTimeout ?? (() => {});

  const tripData = useMemo<DriverTripRequestData | null>(() => {
    if (!rawTripData) return null;
    try {
      return driverTripRequestFacade.parseTripRequest(rawTripData);
    } catch {
      return null;
    }
  }, [rawTripData]);

  const passenger = useMemo<DriverTripRequestPassenger | null>(() => {
    if (!tripData) return null;
    return driverTripRequestFacade.resolvePassenger(tripData);
  }, [tripData]);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTripIdRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!visible || !tripData) {
      clearTimer();
      setTimeLeft(null);
      return;
    }

    if (currentTripIdRef.current !== tripData.tripId) {
      currentTripIdRef.current = tripData.tripId;
      setOriginAddress('');
      setDestinationAddress('');
      void driverTripRequestFacade.resolveAddress(tripData.origin.lat, tripData.origin.lng).then(setOriginAddress);
      void driverTripRequestFacade.resolveAddress(tripData.destination.lat, tripData.destination.lng).then(setDestinationAddress);
    }

    clearTimer();
    const expiresAtMs = new Date(tripData.assignmentExpiresAt).getTime() || Date.now() + 15000;
    const computeSecondsLeft = () => Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));

    setTimeLeft(computeSecondsLeft());
    intervalRef.current = setInterval(() => {
      const secondsLeft = computeSecondsLeft();
      setTimeLeft(secondsLeft);
      if (secondsLeft > 0) return;
      clearTimer();
      currentTripIdRef.current = null;
      onTimeout();
    }, 1000);

    return clearTimer;
  }, [clearTimer, onTimeout, tripData, visible]);

  useEffect(() => {
    if (visible) return;
    const timeout = setTimeout(() => {
      currentTripIdRef.current = null;
      setOriginAddress('');
      setDestinationAddress('');
      setTimeLeft(null);
    }, 300);
    return () => clearTimeout(timeout);
  }, [visible]);

  return {
    visible,
    tripData,
    passenger,
    timeLeft,
    originAddress,
    destinationAddress,
    onAccept,
    onReject,
    formatDistance,
    formatDuration,
  };
}
