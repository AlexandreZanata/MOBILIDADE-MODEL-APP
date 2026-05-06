import { apiCoreClient } from './api/core/client';
import { authRoutes } from './api/routes/auth';
import { billingRoutes } from './api/routes/billing';
import { chatRoutes } from './api/routes/chat';
import { driverRoutes } from './api/routes/driver';
import { profileRoutes } from './api/routes/profile';
import { tripRoutes } from './api/routes/trips';

export { API_BASE_URL } from './api/types/common';
export type { ApiResponse, AuthResponse, LoginRequest, PaymentMethodResponse, CardBrandResponse } from './api/types/common';
export type { ChatMessageData, ChatMessagesResponse, ChatPollResponse, UserOnlineStatus, UnreadCountResponse } from './api/types/chat';
export type {
  BillingCycleStatus,
  BillingCycleResponse,
  PixQrCodeResponse,
  DriverBillingStatusResponse,
  DriverBillingCyclesResponse,
  DriverBlockedResponse,
} from './api/types/billing';

export const apiService = {
  request: apiCoreClient.request,
  ensureValidToken: apiCoreClient.ensureValidToken,
  setTokenUpdateCallback: apiCoreClient.setTokenUpdateCallback.bind(apiCoreClient),
  setTokens: apiCoreClient.setTokens.bind(apiCoreClient),
  clearTokens: apiCoreClient.clearTokens.bind(apiCoreClient),
  getAccessToken: apiCoreClient.getAccessToken,
  refreshAccessToken: apiCoreClient.refreshAccessToken.bind(apiCoreClient),
  ...authRoutes,
  ...tripRoutes,
  ...driverRoutes,
  ...profileRoutes,
  ...chatRoutes,
  ...billingRoutes,
  getMe(preferredType?: 'passenger' | 'driver') {
    if (preferredType === 'driver') return apiService.request('/drivers/profile', { method: 'GET' });
    if (preferredType === 'passenger') return apiService.request('/passengers/profile', { method: 'GET' });
    return apiService.request('/passengers/profile', { method: 'GET' });
  },
  getDriverProfile() {
    return apiService.request('/drivers/profile', { method: 'GET' });
  },
  acceptTrip(_tripId: string) {
    return Promise.resolve({
      success: false,
      error: 'Rota removida',
      message: 'A rota /drivers/me/trips/{id}/accept foi removida. Use WebSocket para aceitar corridas.',
    });
  },
};
