import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/services/api';
import { parsePendingVerifyEmailPayload } from '@/models/verifyEmail/schemas';
import { PendingVerifyEmailPayload, VerifyEmailUserType } from '@/models/verifyEmail/types';

const PENDING_EMAIL_KEY = '@vamu:pending_email_verification';

class VerifyEmailFacade {
  async loadPendingEmail(): Promise<PendingVerifyEmailPayload | null> {
    const raw = await AsyncStorage.getItem(PENDING_EMAIL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsePendingVerifyEmailPayload(parsed);
  }

  async clearPendingEmail(): Promise<void> {
    await AsyncStorage.removeItem(PENDING_EMAIL_KEY);
  }

  async verifyEmail(email: string, code: string, userType: VerifyEmailUserType): Promise<{ success: boolean; error?: string }> {
    if (userType === 'passenger') {
      const response = await apiService.verifyPassengerEmail(email, code);
      return { success: Boolean(response.success), error: response.error };
    }

    const response = await apiService.verifyDriverEmail(email, code);
    return { success: Boolean(response.success), error: response.error };
  }
}

export const verifyEmailFacade = new VerifyEmailFacade();
