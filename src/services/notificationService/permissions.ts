import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  DEFAULT_NOTIFICATION_CHANNEL_CONFIG,
  DEFAULT_NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_SERVICE_LOG,
} from './constants';

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    const finalStatus =
      existingStatus === 'granted'
        ? existingStatus
        : (await Notifications.requestPermissionsAsync()).status;

    if (finalStatus !== 'granted') {
      console.warn(`${NOTIFICATION_SERVICE_LOG} Permissão de notificação negada`);
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(
        DEFAULT_NOTIFICATION_CHANNEL_ID,
        DEFAULT_NOTIFICATION_CHANNEL_CONFIG
      );
    }

    return true;
  } catch (error) {
    console.error(`${NOTIFICATION_SERVICE_LOG} Erro ao solicitar permissões:`, error);
    return false;
  }
}
