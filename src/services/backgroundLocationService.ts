/**
 * Serviço de localização em background
 * Mantém a mesma lógica de envio de localização via WebSocket, mas funciona em segundo plano
 * Usa expo-task-manager e expo-location para tarefas em background
 */

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { websocketService } from './websocketService';
import { passengerWebSocketService } from './passengerWebSocketService';

// Nome da tarefa de background para motoristas
const DRIVER_LOCATION_TASK = 'driver-location-update';

// Nome da tarefa de background para passageiros
const PASSENGER_LOCATION_TASK = 'passenger-location-update';

// Intervalo de atualização (3 segundos, conforme lógica existente)
const LOCATION_UPDATE_INTERVAL = 3000;

// Última localização enviada (para evitar envios duplicados)
let lastDriverLocation: { lat: number; lng: number; timestamp: number } | null = null;
let lastPassengerLocation: { lat: number; lng: number; timestamp: number } | null = null;

// Threshold de distância mínima para enviar atualização (em metros)
const MIN_DISTANCE_THRESHOLD = 10; // 10 metros

/**
 * Calcula a distância entre duas coordenadas usando fórmula de Haversine
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
}

/**
 * Tarefa de background para atualização de localização do motorista
 * Mantém a mesma lógica que já existe no código
 */
TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocation] Erro na tarefa de localização do motorista:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    
    if (locations && locations.length > 0) {
      const location = locations[0];
      const newLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        timestamp: location.timestamp,
      };

      // Verifica se deve enviar (distância mínima ou tempo mínimo)
      const shouldSend =
        !lastDriverLocation ||
        calculateDistance(
          lastDriverLocation.lat,
          lastDriverLocation.lng,
          newLocation.lat,
          newLocation.lng
        ) >= MIN_DISTANCE_THRESHOLD ||
        Date.now() - lastDriverLocation.timestamp >= LOCATION_UPDATE_INTERVAL;

      if (shouldSend && websocketService.getIsConnected()) {
        try {
          const heading =
            location.coords.heading !== null && location.coords.heading !== undefined
              ? location.coords.heading
              : undefined;
          const speed =
            location.coords.speed !== null && location.coords.speed !== undefined
              ? location.coords.speed * 3.6 // Converte m/s para km/h
              : undefined;

          // Envia via WebSocket (mesma lógica que já existe)
          websocketService.sendLocationUpdate({
            type: 'location_update',
            lat: newLocation.lat,
            lng: newLocation.lng,
            heading,
            speed,
          });

          lastDriverLocation = newLocation;
          console.log('[BackgroundLocation] Localização do motorista enviada em background:', {
            lat: newLocation.lat,
            lng: newLocation.lng,
          });
        } catch (error) {
          console.error('[BackgroundLocation] Erro ao enviar localização do motorista:', error);
        }
      }
    }
  }
});

/**
 * Tarefa de background para atualização de localização do passageiro
 * Mantém a mesma lógica que já existe no código
 */
TaskManager.defineTask(PASSENGER_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocation] Erro na tarefa de localização do passageiro:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    
    if (locations && locations.length > 0) {
      const location = locations[0];
      const newLocation = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        timestamp: location.timestamp,
      };

      // Verifica se deve enviar (distância mínima ou tempo mínimo)
      const shouldSend =
        !lastPassengerLocation ||
        calculateDistance(
          lastPassengerLocation.lat,
          lastPassengerLocation.lng,
          newLocation.lat,
          newLocation.lng
        ) >= MIN_DISTANCE_THRESHOLD ||
        Date.now() - lastPassengerLocation.timestamp >= LOCATION_UPDATE_INTERVAL;

      if (shouldSend && passengerWebSocketService.getIsConnected()) {
        try {
          const heading =
            location.coords.heading !== null && location.coords.heading !== undefined
              ? location.coords.heading
              : undefined;
          const speed =
            location.coords.speed !== null && location.coords.speed !== undefined
              ? location.coords.speed * 3.6 // Converte m/s para km/h
              : undefined;

          // Envia via WebSocket (mesma lógica que já existe)
          passengerWebSocketService.sendLocationUpdate({
            type: 'location_update',
            lat: newLocation.lat,
            lng: newLocation.lng,
            heading,
            speed,
          });

          lastPassengerLocation = newLocation;
          console.log('[BackgroundLocation] Localização do passageiro enviada em background:', {
            lat: newLocation.lat,
            lng: newLocation.lng,
          });
        } catch (error) {
          console.error('[BackgroundLocation] Erro ao enviar localização do passageiro:', error);
        }
      }
    }
  }
});

/**
 * Inicia rastreamento de localização em background para motorista
 * Mantém a mesma lógica de envio via WebSocket
 */
export async function startDriverBackgroundLocation(): Promise<boolean> {
  try {
    // Verifica permissões
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.warn('[BackgroundLocation] Permissão de foreground negada');
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('[BackgroundLocation] Permissão de background negada');
      // Continua mesmo sem permissão de background (funciona em foreground)
    }

    // Verifica se a tarefa já está registrada
    const isTaskDefined = TaskManager.isTaskDefined(DRIVER_LOCATION_TASK);
    if (!isTaskDefined) {
      console.error('[BackgroundLocation] Tarefa de motorista não está definida');
      return false;
    }

    // Verifica se já está rodando
    const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    if (isTaskRunning) {
      console.log('[BackgroundLocation] Tarefa de motorista já está rodando');
      return true;
    }

    // Inicia rastreamento em background
    await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: LOCATION_UPDATE_INTERVAL,
      distanceInterval: MIN_DISTANCE_THRESHOLD,
      foregroundService: {
        notificationTitle: 'VAMU - Rastreamento Ativo',
        notificationBody: 'Sua localização está sendo compartilhada',
        notificationColor: '#34C759',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });

    console.log('[BackgroundLocation] Rastreamento de localização do motorista iniciado em background');
    return true;
  } catch (error) {
    console.error('[BackgroundLocation] Erro ao iniciar rastreamento do motorista:', error);
    return false;
  }
}

/**
 * Para rastreamento de localização em background para motorista
 */
export async function stopDriverBackgroundLocation(): Promise<void> {
  try {
    const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    if (isTaskRunning) {
      await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
      console.log('[BackgroundLocation] Rastreamento de localização do motorista parado');
      lastDriverLocation = null;
    }
  } catch (error) {
    console.error('[BackgroundLocation] Erro ao parar rastreamento do motorista:', error);
  }
}

/**
 * Inicia rastreamento de localização em background para passageiro
 * Mantém a mesma lógica de envio via WebSocket
 */
export async function startPassengerBackgroundLocation(): Promise<boolean> {
  try {
    // Verifica permissões
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.warn('[BackgroundLocation] Permissão de foreground negada');
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('[BackgroundLocation] Permissão de background negada');
      // Continua mesmo sem permissão de background (funciona em foreground)
    }

    // Verifica se a tarefa já está registrada
    const isTaskDefined = TaskManager.isTaskDefined(PASSENGER_LOCATION_TASK);
    if (!isTaskDefined) {
      console.error('[BackgroundLocation] Tarefa de passageiro não está definida');
      return false;
    }

    // Verifica se já está rodando
    const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(PASSENGER_LOCATION_TASK);
    if (isTaskRunning) {
      console.log('[BackgroundLocation] Tarefa de passageiro já está rodando');
      return true;
    }

    // Inicia rastreamento em background
    await Location.startLocationUpdatesAsync(PASSENGER_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: LOCATION_UPDATE_INTERVAL,
      distanceInterval: MIN_DISTANCE_THRESHOLD,
      foregroundService: {
        notificationTitle: 'VAMU - Rastreamento Ativo',
        notificationBody: 'Sua localização está sendo compartilhada',
        notificationColor: '#34C759',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });

    console.log('[BackgroundLocation] Rastreamento de localização do passageiro iniciado em background');
    return true;
  } catch (error) {
    console.error('[BackgroundLocation] Erro ao iniciar rastreamento do passageiro:', error);
    return false;
  }
}

/**
 * Para rastreamento de localização em background para passageiro
 */
export async function stopPassengerBackgroundLocation(): Promise<void> {
  try {
    const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(PASSENGER_LOCATION_TASK);
    if (isTaskRunning) {
      await Location.stopLocationUpdatesAsync(PASSENGER_LOCATION_TASK);
      console.log('[BackgroundLocation] Rastreamento de localização do passageiro parado');
      lastPassengerLocation = null;
    }
  } catch (error) {
    console.error('[BackgroundLocation] Erro ao parar rastreamento do passageiro:', error);
  }
}
