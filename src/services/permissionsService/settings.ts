import { Linking, Platform } from 'react-native';
import { PERMISSIONS_SERVICE_LOG } from './constants';

export async function openAppSettings(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Linking.openSettings();
      return;
    }

    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    }
  } catch (error) {
    console.error(`${PERMISSIONS_SERVICE_LOG} Erro ao abrir configurações:`, error);
  }
}
