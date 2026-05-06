import * as Notifications from 'expo-notifications';
import { NOTIFICATION_SERVICE_LOG } from './constants';

export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener((notification) => {
    console.log(`${NOTIFICATION_SERVICE_LOG} Notificação recebida em foreground:`, notification);
    onNotificationReceived?.(notification);
  });
}

export function setupNotificationResponseListener(
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    console.log(`${NOTIFICATION_SERVICE_LOG} Usuário tocou na notificação:`, response);
    onNotificationTapped?.(response);
  });
}
