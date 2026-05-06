import * as Notifications from 'expo-notifications';
import { z } from 'zod';
import { NOTIFICATION_SERVICE_LOG } from './constants';

const notificationDataSchema = z.record(z.string(), z.unknown());

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const parsedData = data ? notificationDataSchema.parse(data) : undefined;
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: parsedData,
        sound: true,
      },
      trigger: null,
    });
  } catch (error) {
    console.error(`${NOTIFICATION_SERVICE_LOG} Erro ao enviar notificação local:`, error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log(`${NOTIFICATION_SERVICE_LOG} Todas as notificações canceladas`);
  } catch (error) {
    console.error(`${NOTIFICATION_SERVICE_LOG} Erro ao cancelar notificações:`, error);
  }
}
