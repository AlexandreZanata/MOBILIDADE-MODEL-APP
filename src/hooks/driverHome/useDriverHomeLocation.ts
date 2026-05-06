import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driverWebSocket } from '@/services/websocket';
import { useFocusEffect } from '@react-navigation/native';
import { ActivePassengerMapItem, DriverHomeLocation, NearbyDriverMapItem } from '@/models/driverHome/types';
import { DRIVER_HOME_CACHE_KEYS, DRIVER_HOME_DEFAULT_CENTER, DRIVER_HOME_TIMERS, DRIVER_HOME_ZOOM_LEVELS } from '@/hooks/driverHome/constants';
import { fetchNearbyMapData } from '@/services/driverHome/driverHomeFacade';
import { tdh } from '@/i18n/driverHome';

interface UseDriverHomeLocationParams {
  isAvailable: boolean;
  isWebSocketConnected: boolean;
  userId?: string;
}

/**
 * Gerencia estado e atualizacao de localizacao/mapa na Home do motorista.
 */
export function useDriverHomeLocation({ isAvailable, isWebSocketConnected, userId }: UseDriverHomeLocationParams) {
  const [currentLocation, setCurrentLocation] = useState<DriverHomeLocation | null>(null);
  const [mapCenter, setMapCenter] = useState<DriverHomeLocation>(DRIVER_HOME_DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(16);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriverMapItem[]>([]);
  const [activePassengers, setActivePassengers] = useState<ActivePassengerMapItem[]>([]);

  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nearbyUpdateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRequestingLocationRef = useRef(false);
  const lastLocationRequestRef = useRef(0);
  const lastLocationUpdateRef = useRef(0);
  const lastCacheSaveRef = useRef(0);

  const isLocationStale = useCallback(
    () => (!lastLocationUpdateRef.current ? true : Date.now() - lastLocationUpdateRef.current > DRIVER_HOME_TIMERS.LOCATION_STALE_MS),
    []
  );

  const applyLocationUpdate = useCallback((location: { lat: number; lon: number; timestamp?: number }, centerMap = true) => {
    lastLocationUpdateRef.current = location.timestamp || Date.now();
    const normalized = { lat: location.lat, lon: location.lon };
    setCurrentLocation(normalized);
    if (centerMap) setMapCenter(normalized);
  }, []);

  const loadCachedLocation = useCallback(async (): Promise<DriverHomeLocation | null> => {
    const [cachedLocation, cachedTimestamp] = await Promise.all([
      AsyncStorage.getItem(DRIVER_HOME_CACHE_KEYS.DRIVER_LOCATION),
      AsyncStorage.getItem(DRIVER_HOME_CACHE_KEYS.DRIVER_LOCATION_TIMESTAMP),
    ]);
    if (!cachedLocation || !cachedTimestamp) return null;

    const timestamp = Number.parseInt(cachedTimestamp, 10);
    if (Number.isNaN(timestamp) || Date.now() - timestamp >= DRIVER_HOME_TIMERS.CACHE_VALIDITY_MS) return null;

    const parsed: unknown = JSON.parse(cachedLocation);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const lat = (parsed as { lat?: number }).lat;
    const lon = (parsed as { lon?: number }).lon;
    if (typeof lat !== 'number' || typeof lon !== 'number') return null;
    lastLocationUpdateRef.current = timestamp;
    return { lat, lon };
  }, []);

  const saveLocationToCache = useCallback(async (location: DriverHomeLocation) => {
    await Promise.all([
      AsyncStorage.setItem(DRIVER_HOME_CACHE_KEYS.DRIVER_LOCATION, JSON.stringify(location)),
      AsyncStorage.setItem(DRIVER_HOME_CACHE_KEYS.DRIVER_LOCATION_TIMESTAMP, String(Date.now())),
    ]);
  }, []);

  const requestLocationPermission = useCallback(
    async (forceRefresh = false, centerMap = true) => {
      const now = Date.now();
      if (!forceRefresh && now - lastLocationRequestRef.current < DRIVER_HOME_TIMERS.LOCATION_REQUEST_THROTTLE_MS) return;
      lastLocationRequestRef.current = now;

      if ((!currentLocation || isLocationStale()) && !forceRefresh) {
        const cached = await loadCachedLocation();
        if (cached) applyLocationUpdate({ ...cached, timestamp: lastLocationUpdateRef.current }, centerMap);
      }

      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        const requestPermission = await Location.requestForegroundPermissionsAsync();
        if (requestPermission.status !== 'granted') {
          Alert.alert(tdh('permissionTitle'), tdh('permissionDescription'), [{ text: 'OK' }]);
          return;
        }
      }

      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ]);
      if (!location) return;

      const nextLocation = { lat: location.coords.latitude, lon: location.coords.longitude, timestamp: location.timestamp };
      applyLocationUpdate(nextLocation, centerMap);
      await saveLocationToCache({ lat: nextLocation.lat, lon: nextLocation.lon });
    },
    [applyLocationUpdate, currentLocation, isLocationStale, loadCachedLocation, saveLocationToCache]
  );

  const startLocationUpdates = useCallback(() => {
    if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    locationIntervalRef.current = setInterval(async () => {
      if (!isAvailable) return;
      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const next = { lat: location.coords.latitude, lon: location.coords.longitude, timestamp: location.timestamp };
        applyLocationUpdate(next, !hasUserMovedMap);
        if (Date.now() - lastCacheSaveRef.current > DRIVER_HOME_TIMERS.CACHE_SAVE_THROTTLE_MS) {
          lastCacheSaveRef.current = Date.now();
          await saveLocationToCache({ lat: next.lat, lon: next.lon });
        }
        if (isRateLimited) setIsRateLimited(false);
        if (isWebSocketConnected && driverWebSocket.isConnected) {
          driverWebSocket.sendLocationUpdate({ lat: next.lat, lng: next.lon });
        }
      } catch {
        // no-op para manter loop resiliente
      }
    }, DRIVER_HOME_TIMERS.LOCATION_LOOP_MS);
  }, [applyLocationUpdate, hasUserMovedMap, isAvailable, isRateLimited, isWebSocketConnected, saveLocationToCache]);

  const stopLocationUpdates = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  const startNearbyUpdates = useCallback(() => {
    if (nearbyUpdateIntervalRef.current) clearInterval(nearbyUpdateIntervalRef.current);
    nearbyUpdateIntervalRef.current = setInterval(async () => {
      if (!currentLocation || !isAvailable) return;
      try {
        const data = await fetchNearbyMapData(currentLocation.lat, currentLocation.lon, userId);
        setNearbyDrivers(data.drivers);
        setActivePassengers(data.passengers);
      } catch {
        // no-op para manter loop resiliente
      }
    }, DRIVER_HOME_TIMERS.NEARBY_LOOP_MS);
  }, [currentLocation, isAvailable, userId]);

  const stopNearbyUpdates = useCallback(() => {
    if (nearbyUpdateIntervalRef.current) {
      clearInterval(nearbyUpdateIntervalRef.current);
      nearbyUpdateIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    void requestLocationPermission();
    return () => {
      stopLocationUpdates();
      stopNearbyUpdates();
    };
  }, [requestLocationPermission, stopLocationUpdates, stopNearbyUpdates]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        if (!currentLocation || isLocationStale()) {
          void requestLocationPermission(true, false);
        }
      }, DRIVER_HOME_TIMERS.LOCATION_REFRESH_ON_FOCUS_DELAY_MS);
      return () => clearTimeout(timer);
    }, [currentLocation, isLocationStale, requestLocationPermission])
  );

  useEffect(() => {
    if (isAvailable && currentLocation) {
      startLocationUpdates();
      startNearbyUpdates();
      return;
    }
    stopLocationUpdates();
    stopNearbyUpdates();
  }, [currentLocation, isAvailable, startLocationUpdates, startNearbyUpdates, stopLocationUpdates, stopNearbyUpdates]);

  const handleRecenterLocation = useCallback(async () => {
    if (isRequestingLocationRef.current) return;
    setLocationError(null);
    setApiError(null);
    isRequestingLocationRef.current = true;

    if (hasUserMovedMap && currentLocation) {
      setMapCenter(currentLocation);
      setHasUserMovedMap(false);
      isRequestingLocationRef.current = false;
      return;
    }

    await requestLocationPermission(false, true);
    isRequestingLocationRef.current = false;
  }, [currentLocation, hasUserMovedMap, requestLocationPermission]);

  const handleMapMove = useCallback(() => setHasUserMovedMap(true), []);
  const handleZoomIn = useCallback(() => {
    const nextZoom = DRIVER_HOME_ZOOM_LEVELS.find((level) => level > mapZoom);
    if (nextZoom) setMapZoom(nextZoom);
  }, [mapZoom]);
  const handleZoomOut = useCallback(() => {
    const previousZoom = [...DRIVER_HOME_ZOOM_LEVELS].reverse().find((level) => level < mapZoom);
    if (previousZoom) setMapZoom(previousZoom);
  }, [mapZoom]);

  return {
    currentLocation,
    mapCenter,
    mapZoom,
    locationError,
    apiError,
    hasUserMovedMap,
    isRateLimited,
    nearbyDrivers,
    activePassengers,
    setMapCenter,
    setApiError,
    setLocationError,
    handleMapMove,
    handleRecenterLocation,
    handleZoomIn,
    handleZoomOut,
    requestLocationPermission,
    applyLocationUpdate,
    saveLocationToCache,
  };
}
