import { configureNotificationHandler } from './notificationService/config';

configureNotificationHandler();

export { requestNotificationPermissions } from './notificationService/permissions';
export { getNotificationToken, removeNotificationToken } from './notificationService/token';
export { registerNotificationToken } from './notificationService/registration';
export {
  setupNotificationListeners,
  setupNotificationResponseListener,
} from './notificationService/listeners';
export { sendLocalNotification, cancelAllNotifications } from './notificationService/localNotifications';

