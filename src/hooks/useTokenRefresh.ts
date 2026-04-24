/**
 * Hook para garantir token válido antes de ações do usuário
 * Renova o token automaticamente se necessário
 */

import { useCallback } from 'react';
import { apiService } from '@/services/api';

/**
 * Hook que retorna uma função para garantir token válido antes de ações
 * Use antes de ações importantes do usuário
 * 
 * @example
 * const ensureToken = useTokenRefresh();
 * 
 * const handleAction = async () => {
 *   await ensureToken();
 *   // Sua ação aqui
 * };
 */
export const useTokenRefresh = () => {
  const ensureToken = useCallback(async (): Promise<boolean> => {
    try {
      return await apiService.ensureValidToken();
    } catch (error) {
      console.error('[useTokenRefresh] Erro ao garantir token válido:', error);
      return false;
    }
  }, []);

  return ensureToken;
};

