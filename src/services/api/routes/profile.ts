import { apiCoreClient } from '../core/client';
import type { ApiResponse } from '../types/common';

export const profileRoutes = {
  getDriverRating(): Promise<ApiResponse<{ userId: string; currentRating: string; totalRatings: number }>> {
    return apiCoreClient.request('/drivers/ratings/me', { method: 'GET' });
  },
  getPassengerRating(): Promise<ApiResponse<{ userId: string; currentRating: string; totalRatings: number }>> {
    return apiCoreClient.request('/passengers/ratings/me', { method: 'GET' });
  },
  uploadDriverDocument(documentType: 'CNH' | 'VEHICLE_DOC', fileUri: string, vehicleId?: string): Promise<ApiResponse<unknown>> {
    const accessToken = apiCoreClient.getAccessToken();
    if (!accessToken) {
      return Promise.resolve({ success: false, error: 'Não autenticado', message: 'Token de acesso não disponível. Faça login novamente.' });
    }
    const formData = new FormData();
    const fileExtension = fileUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = fileExtension === 'pdf' ? 'application/pdf' : `image/${fileExtension}`;
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: `document.${fileExtension}`,
    } as unknown as Blob);
    const url = `https://vamu.joaoflavio.com/v1/drivers/documents?documentType=${documentType}${vehicleId ? `&vehicleId=${vehicleId}` : ''}`;
    return fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
      body: formData,
    })
      .then(async (response) => {
        const text = await response.text();
        const data: unknown = text ? JSON.parse(text) : {};
        if (!response.ok) {
          const record = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
          const message = String(record.message ?? record.error ?? 'Erro desconhecido');
          return { success: false, error: message, message, status: response.status };
        }
        const record = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
        return { success: true, data: (record.data as unknown) ?? record, message: String(record.message ?? 'Documento enviado com sucesso') };
      })
      .catch((error: unknown) => ({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', message: 'Falha no upload.' }));
  },
  uploadProfilePhoto(fileUri: string, userType: 'driver' | 'passenger'): Promise<ApiResponse<unknown>> {
    const endpoint = userType === 'driver' ? '/drivers/profile-photo' : '/passengers/profile-photo';
    const accessToken = apiCoreClient.getAccessToken();
    if (!accessToken) {
      return Promise.resolve({ success: false, error: 'Não autenticado', message: 'Token de acesso não disponível. Faça login novamente.' });
    }
    const fileExtension = fileUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = fileExtension === 'png' ? 'image/png' : fileExtension === 'webp' ? 'image/webp' : 'image/jpeg';
    const formData = new FormData();
    formData.append('file', { uri: fileUri, type: mimeType, name: `profile.${fileExtension}` } as unknown as Blob);
    return fetch(`https://vamu.joaoflavio.com/v1${endpoint}`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
      body: formData,
    })
      .then(async (response) => {
        const text = await response.text();
        const data: unknown = text ? JSON.parse(text) : {};
        if (!response.ok) {
          const record = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
          const message = String(record.message ?? record.error ?? 'Erro desconhecido');
          return { success: false, error: message, message, status: response.status };
        }
        return { success: true, data: data as unknown };
      })
      .catch((error: unknown) => ({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', message: 'Falha no upload.' }));
  },
  deleteProfilePhoto(userType: 'driver' | 'passenger'): Promise<ApiResponse<unknown>> {
    const endpoint = userType === 'driver' ? '/drivers/profile-photo' : '/passengers/profile-photo';
    return apiCoreClient.request(endpoint, { method: 'DELETE' });
  },
  getProfilePhoto(userId: string): Promise<ApiResponse<{ photoUrl: string }>> {
    return Promise.resolve({ success: true, data: { photoUrl: apiCoreClient.getProfilePhotoUrl(userId) } });
  },
  getProfilePhotoUrl(userId: string): string {
    return apiCoreClient.getProfilePhotoUrl(userId);
  },
};
