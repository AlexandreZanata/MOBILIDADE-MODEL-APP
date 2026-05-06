import * as TaskManager from 'expo-task-manager';
import { driverWebSocket, passengerWebSocket } from '@/services/websocket';
import {
  BACKGROUND_LOCATION_LOG,
  DRIVER_LOCATION_TASK,
  PASSENGER_LOCATION_TASK,
} from './constants';
import { parseLocationTaskPayload } from './schemas';
import {
  shouldSendLocationUpdate,
  toOptionalHeading,
  toOptionalSpeedKmH,
} from './helpers';
import { BackgroundActor, LastLocationRegistry } from './types';

const lastLocations: LastLocationRegistry = {
  driver: null,
  passenger: null,
};

function getTaskName(actor: BackgroundActor): string {
  return actor === 'driver' ? DRIVER_LOCATION_TASK : PASSENGER_LOCATION_TASK;
}

function getSocket(actor: BackgroundActor) {
  return actor === 'driver' ? driverWebSocket : passengerWebSocket;
}

function resetActorLastLocation(actor: BackgroundActor): void {
  lastLocations[actor] = null;
}

function defineLocationTask(actor: BackgroundActor): void {
  const taskName = getTaskName(actor);
  if (TaskManager.isTaskDefined(taskName)) {
    return;
  }

  TaskManager.defineTask(taskName, async ({ data, error }) => {
    if (error) {
      console.error(`${BACKGROUND_LOCATION_LOG} Erro na tarefa de localização (${actor}):`, error);
      return;
    }

    const parsed = parseLocationTaskPayload(data);
    if (!parsed) {
      return;
    }

    const location = parsed.locations[0];
    const nextLocation = {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      timestamp: location.timestamp,
    };

    if (!shouldSendLocationUpdate(lastLocations[actor], nextLocation)) {
      return;
    }

    const socket = getSocket(actor);
    if (!socket.isConnected) {
      return;
    }

    try {
      socket.sendLocationUpdate({
        lat: nextLocation.lat,
        lng: nextLocation.lng,
        heading: toOptionalHeading(location.coords.heading),
        speed: toOptionalSpeedKmH(location.coords.speed),
      });

      lastLocations[actor] = nextLocation;
      console.log(`${BACKGROUND_LOCATION_LOG} Localização enviada (${actor}) em background:`, {
        lat: nextLocation.lat,
        lng: nextLocation.lng,
      });
    } catch (sendError) {
      console.error(`${BACKGROUND_LOCATION_LOG} Erro ao enviar localização (${actor}):`, sendError);
    }
  });
}

export function ensureLocationTasksDefined(): void {
  defineLocationTask('driver');
  defineLocationTask('passenger');
}

export function clearLastLocation(actor: BackgroundActor): void {
  resetActorLastLocation(actor);
}
