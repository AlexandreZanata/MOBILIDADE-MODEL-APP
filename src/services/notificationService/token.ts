import * as Notifications from 'expo-notifications';
import { NOTIFICATION_SERVICE_LOG } from './constants';
import { requestNotificationPermissions } from './permissions';
import {
  clearNotificationToken,
  getExpoGoDetectedFlag,
  getSavedNotificationToken,
  saveNotificationToken,
  setExpoGoDetectedFlag,
} from './storage';

type ExpoPushTokenError = {
  message?: string;
  body?: string;
};

function includesAny(text: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

function shouldMarkExpoGo(error: ExpoPushTokenError): boolean {
  const message = error.message ?? '';
  const body = error.body ?? '';
  return includesAny(message, ['Expo Go', 'development build', 'SDK 53', 'removed from Expo Go']) || includesAny(body, ['Expo Go']);
}

function isProjectIdValidationError(error: ExpoPushTokenError): boolean {
  const message = error.message ?? '';
  const body = error.body ?? '';
  return (
    includesAny(message, ['projectId', 'VALIDATION_ERROR', 'Invalid uuid']) ||
    includesAny(body, ['projectId', 'VALIDATION_ERROR'])
  );
}

function toTokenError(error: unknown): ExpoPushTokenError {
  if (typeof error === 'object' && error !== null) {
    const maybe = error as { message?: unknown; body?: unknown };
    return {
      message: typeof maybe.message === 'string' ? maybe.message : undefined,
      body: typeof maybe.body === 'string' ? maybe.body : undefined,
    };
  }
  return { message: String(error) };
}

export async function getNotificationToken(): Promise<string | null> {
  if (await getExpoGoDetectedFlag()) {
    return null;
  }

  const savedToken = await getSavedNotificationToken();
  if (savedToken) {
    return savedToken;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await saveNotificationToken(token);
    console.log(`${NOTIFICATION_SERVICE_LOG} Token de notificação obtido:`, token);
    return token;
  } catch (error) {
    const parsedError = toTokenError(error);
    if (shouldMarkExpoGo(parsedError)) {
      await setExpoGoDetectedFlag();
      return null;
    }

    if (isProjectIdValidationError(parsedError)) {
      return null;
    }

    return null;
  }
}

export async function removeNotificationToken(): Promise<void> {
  try {
    await clearNotificationToken();
    console.log(`${NOTIFICATION_SERVICE_LOG} Token de notificação removido`);
  } catch (error) {
    console.error(`${NOTIFICATION_SERVICE_LOG} Erro ao remover token:`, error);
  }
}
