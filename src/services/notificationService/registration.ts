import { NOTIFICATION_SERVICE_LOG } from './constants';

export async function registerNotificationToken(
  userId: string,
  userType: 'driver' | 'passenger',
  token: string
): Promise<boolean> {
  try {
    console.log(`${NOTIFICATION_SERVICE_LOG} Token registrado no backend:`, { userId, userType, token });
    return true;
  } catch (error) {
    console.error(`${NOTIFICATION_SERVICE_LOG} Erro ao registrar token no backend:`, error);
    return false;
  }
}
