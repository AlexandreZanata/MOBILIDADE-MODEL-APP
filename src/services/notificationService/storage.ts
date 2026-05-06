import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_GO_FLAG_KEY, NOTIFICATION_TOKEN_KEY } from './constants';

export async function getSavedNotificationToken(): Promise<string | null> {
  return AsyncStorage.getItem(NOTIFICATION_TOKEN_KEY);
}

export async function saveNotificationToken(token: string): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_TOKEN_KEY, token);
}

export async function clearNotificationToken(): Promise<void> {
  await AsyncStorage.removeItem(NOTIFICATION_TOKEN_KEY);
}

export async function getExpoGoDetectedFlag(): Promise<boolean> {
  const value = await AsyncStorage.getItem(EXPO_GO_FLAG_KEY);
  return value === 'true';
}

export async function setExpoGoDetectedFlag(): Promise<void> {
  await AsyncStorage.setItem(EXPO_GO_FLAG_KEY, 'true');
}
