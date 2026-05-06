import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import {
  BACKGROUND_LOCATION_LOG,
  DRIVER_LOCATION_TASK,
  LOCATION_UPDATE_INTERVAL,
  MIN_DISTANCE_THRESHOLD,
  PASSENGER_LOCATION_TASK,
} from './constants';
import { BackgroundActor } from './types';
import { clearLastLocation } from './taskHandlers';

function getTaskName(actor: BackgroundActor): string {
  return actor === 'driver' ? DRIVER_LOCATION_TASK : PASSENGER_LOCATION_TASK;
}

async function ensureForegroundPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

async function requestBackgroundPermission(): Promise<void> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn(`${BACKGROUND_LOCATION_LOG} Permissão de background negada`);
  }
}

function getStartOptions(): Location.LocationTaskOptions {
  return {
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
  };
}

export async function startBackgroundLocation(actor: BackgroundActor): Promise<boolean> {
  try {
    const hasForeground = await ensureForegroundPermission();
    if (!hasForeground) {
      console.warn(`${BACKGROUND_LOCATION_LOG} Permissão de foreground negada`);
      return false;
    }

    await requestBackgroundPermission();

    const taskName = getTaskName(actor);
    if (!TaskManager.isTaskDefined(taskName)) {
      console.error(`${BACKGROUND_LOCATION_LOG} Tarefa não definida (${actor})`);
      return false;
    }

    const running = await Location.hasStartedLocationUpdatesAsync(taskName);
    if (running) {
      console.log(`${BACKGROUND_LOCATION_LOG} Tarefa já está rodando (${actor})`);
      return true;
    }

    await Location.startLocationUpdatesAsync(taskName, getStartOptions());
    console.log(`${BACKGROUND_LOCATION_LOG} Rastreamento iniciado em background (${actor})`);
    return true;
  } catch (error) {
    console.error(`${BACKGROUND_LOCATION_LOG} Erro ao iniciar rastreamento (${actor}):`, error);
    return false;
  }
}

export async function stopBackgroundLocation(actor: BackgroundActor): Promise<void> {
  try {
    const taskName = getTaskName(actor);
    const running = await Location.hasStartedLocationUpdatesAsync(taskName);
    if (!running) {
      return;
    }

    await Location.stopLocationUpdatesAsync(taskName);
    clearLastLocation(actor);
    console.log(`${BACKGROUND_LOCATION_LOG} Rastreamento parado (${actor})`);
  } catch (error) {
    console.error(`${BACKGROUND_LOCATION_LOG} Erro ao parar rastreamento (${actor}):`, error);
  }
}
