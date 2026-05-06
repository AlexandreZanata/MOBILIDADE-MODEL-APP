import * as Notifications from 'expo-notifications';

let configured = false;

export function configureNotificationHandler(): void {
  if (configured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  configured = true;
}
