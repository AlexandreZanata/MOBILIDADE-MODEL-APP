import { ensureLocationTasksDefined } from './backgroundLocationService/taskHandlers';
import { startBackgroundLocation, stopBackgroundLocation } from './backgroundLocationService/tracking';

ensureLocationTasksDefined();

export async function startDriverBackgroundLocation(): Promise<boolean> {
  return startBackgroundLocation('driver');
}

export async function stopDriverBackgroundLocation(): Promise<void> {
  await stopBackgroundLocation('driver');
}

export async function startPassengerBackgroundLocation(): Promise<boolean> {
  return startBackgroundLocation('passenger');
}

export async function stopPassengerBackgroundLocation(): Promise<void> {
  await stopBackgroundLocation('passenger');
}
