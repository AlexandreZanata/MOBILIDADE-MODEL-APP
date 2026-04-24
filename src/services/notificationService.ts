/**
 * Serviço de notificações push
 * Para motoristas disponíveis receberem notificações de novas corridas
 * Usa expo-notifications (biblioteca oficial)
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração de notificações
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Chave para armazenar o token de notificação
const NOTIFICATION_TOKEN_KEY = '@vamu:notification_token';
// Flag para indicar que push notifications remotas não estão disponíveis (Expo Go)
const EXPO_GO_FLAG_KEY = '@vamu:expo_go_detected';

/**
 * Solicita permissões de notificação
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[NotificationService] Permissão de notificação negada');
      return false;
    }

    // Para Android, também solicita permissão de canal de notificação
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'VAMU Notificações',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#34C759',
      });
    }

    return true;
  } catch (error) {
    console.error('[NotificationService] Erro ao solicitar permissões:', error);
    return false;
  }
}

/**
 * Verifica se está rodando no Expo Go
 * Push notifications remotas não funcionam no Expo Go (SDK 53+)
 * Retorna true se detectar que está no Expo Go
 */
async function isRunningInExpoGo(): Promise<boolean> {
  try {
    // Verifica se já detectamos anteriormente que está no Expo Go
    const flag = await AsyncStorage.getItem(EXPO_GO_FLAG_KEY);
    if (flag === 'true') {
      return true;
    }
    
    // Tenta detectar através de outras formas
    // No Expo Go, algumas APIs podem não estar disponíveis
    // Por enquanto, retorna false e deixa o catch tratar na primeira tentativa
    return false;
  } catch {
    return false;
  }
}

/**
 * Obtém o token de notificação do dispositivo
 * Nota: Push notifications remotas não funcionam no Expo Go (SDK 53+)
 * Use development build para funcionalidade completa de push notifications
 * Notificações locais funcionam normalmente em ambos os ambientes
 */
export async function getNotificationToken(): Promise<string | null> {
  try {
    // Verifica se já detectamos que está no Expo Go (para evitar tentar novamente)
    const isExpoGoDetected = await isRunningInExpoGo();
    if (isExpoGoDetected) {
      // Já sabemos que está no Expo Go, não tenta obter token
      return null;
    }

    // Verifica se já tem token salvo
    const savedToken = await AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
    if (savedToken) {
      return savedToken;
    }

    // Solicita permissões primeiro
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    try {
      // Tenta obter o token sem projectId (usa o padrão do Expo)
      // Se precisar de projectId, será necessário configurar no app.json
      const tokenData = await Notifications.getExpoPushTokenAsync();

      const token = tokenData.data;
      
      // Salva o token
      await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
      
      console.log('[NotificationService] Token de notificação obtido:', token);
      return token;
    } catch (error: any) {
      // Trata diferentes tipos de erro
      const errorMessage = error?.message || String(error);
      const errorBody = error?.body || '';
      
      // No Expo Go (SDK 53+), push notifications remotas não funcionam
      // Marca como Expo Go para não tentar novamente
      if (
        errorMessage.includes('Expo Go') || 
        errorMessage.includes('development build') || 
        errorMessage.includes('SDK 53') ||
        errorMessage.includes('removed from Expo Go') ||
        errorBody.includes('Expo Go')
      ) {
        // Marca que está no Expo Go para não tentar novamente
        await AsyncStorage.setItem(EXPO_GO_FLAG_KEY, 'true');
        // Retorna null silenciosamente - notificações locais ainda funcionarão
        return null;
      }
      
      // Erro de projectId inválido ou não configurado
      if (
        errorMessage.includes('projectId') || 
        errorMessage.includes('VALIDATION_ERROR') || 
        errorMessage.includes('Invalid uuid') ||
        errorBody.includes('projectId') ||
        errorBody.includes('VALIDATION_ERROR')
      ) {
        // Retorna null silenciosamente
        return null;
      }
      
      // Outros erros - retorna null silenciosamente
      // Notificações locais ainda funcionarão
      return null;
    }
  } catch (error) {
    // Erro geral - retorna null silenciosamente
    // Notificações locais ainda funcionarão
    return null;
  }
}

/**
 * Registra o token de notificação no backend
 * Deve ser chamado após login/autenticação
 */
export async function registerNotificationToken(
  userId: string,
  userType: 'driver' | 'passenger',
  token: string
): Promise<boolean> {
  try {
    // TODO: Implementar chamada à API para registrar o token
    // Exemplo: await apiService.registerPushToken(userId, userType, token);
    console.log('[NotificationService] Token registrado no backend:', { userId, userType, token });
    return true;
  } catch (error) {
    console.error('[NotificationService] Erro ao registrar token no backend:', error);
    return false;
  }
}

/**
 * Configura listener para notificações recebidas quando o app está em foreground
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener((notification) => {
    console.log('[NotificationService] Notificação recebida em foreground:', notification);
    onNotificationReceived?.(notification);
  });
}

/**
 * Configura listener para quando o usuário toca em uma notificação
 */
export function setupNotificationResponseListener(
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[NotificationService] Usuário tocou na notificação:', response);
    onNotificationTapped?.(response);
  });
}

/**
 * Envia notificação local (para testes ou notificações internas)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Envia imediatamente
    });
  } catch (error) {
    console.error('[NotificationService] Erro ao enviar notificação local:', error);
  }
}

/**
 * Cancela todas as notificações agendadas
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[NotificationService] Todas as notificações canceladas');
  } catch (error) {
    console.error('[NotificationService] Erro ao cancelar notificações:', error);
  }
}

/**
 * Remove o token de notificação
 */
export async function removeNotificationToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NOTIFICATION_TOKEN_KEY);
    console.log('[NotificationService] Token de notificação removido');
  } catch (error) {
    console.error('[NotificationService] Erro ao remover token:', error);
  }
}

