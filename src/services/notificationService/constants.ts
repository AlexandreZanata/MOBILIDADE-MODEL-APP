import * as Notifications from 'expo-notifications';

export const NOTIFICATION_SERVICE_LOG = '[NotificationService]';
export const NOTIFICATION_TOKEN_KEY = '@vamu:notification_token';
export const EXPO_GO_FLAG_KEY = '@vamu:expo_go_detected';

export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

export const DEFAULT_NOTIFICATION_CHANNEL_CONFIG: Notifications.NotificationChannelInput = {
  name: 'VAMU Notificações',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#34C759',
};
