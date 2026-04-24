/**
 * Contexto de Autenticação
 * Gerencia o estado de autenticação do usuário seguindo normas LGPD
 * - Armazena tokens de forma segura
 * - Gerencia refresh tokens automaticamente
 * - Não expõe dados sensíveis
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, AuthResponse } from '@/services/api';

// Chaves para armazenamento seguro (LGPD compliant)
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@vamu:access_token',
  REFRESH_TOKEN: '@vamu:refresh_token',
  USER_DATA: '@vamu:user_data',
};

interface User {
  userId: string; // ID do usuário (vem do perfil)
  email: string;
  name: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  type?: string;
  roles?: string[];
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresEmailVerification?: boolean; email?: string; userType?: 'passenger' | 'driver' }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  refreshUserData: (force?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  /**
   * Carrega tokens salvos e valida autenticação ao iniciar
   */
  useEffect(() => {
    loadStoredAuth();
    
    // Configura callback para atualizar tokens no storage quando refresh automático acontecer
    apiService.setTokenUpdateCallback(async (accessToken, refreshToken) => {
      try {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
          AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        ]);
        console.log('[Auth] Tokens atualizados no storage após refresh automático');
      } catch (error) {
        console.error('[Auth] Erro ao salvar tokens atualizados:', error);
      }
    });
    
    // Cleanup
    return () => {
      apiService.setTokenUpdateCallback(null);
    };
  }, []);

  /**
   * Remove campos desnecessários do perfil antes de salvar
   * Remove: id (se existir), createdAt, updatedAt
   * Preserva: userId e todos os outros campos
   */
  const sanitizeUserData = (userData: any): User => {
    const { id, createdAt, updatedAt, ...sanitized } = userData;
    // Garante que userId seja preservado (vem da API como userId)
    return sanitized as User;
  };

  /**
   * Define qual rota de perfil priorizar com base nos roles
   */
  const getPreferredProfileType = (roles?: string[]): 'passenger' | 'driver' | undefined => {
    if (!roles || roles.length === 0) return undefined;
    if (roles.includes('driver')) return 'driver';
    if (roles.includes('passenger')) return 'passenger';
    return undefined;
  };

  /**
   * Verifica se já temos algum caminho de foto no cache
   */
  const hasProfilePhotoField = (userData?: User | null): boolean => {
    if (!userData) return false;
    const fields = [
      'photoUrl',
      'profilePhotoUrl',
      'profile_photo_url',
      'photo',
      'photo_url',
      'avatar',
      'avatarUrl',
      'avatar_url',
      'picture',
      'picture_url',
    ];
    return fields.some((field) => {
      const value = (userData as any)?.[field];
      return typeof value === 'string' && value.trim().length > 0;
    });
  };

  /**
   * Carrega autenticação armazenada
   * Usa cache para evitar requisições desnecessárias
   */
  const loadStoredAuth = async () => {
    try {
      setIsLoading(true);
      
      const [accessToken, refreshToken, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);
      let cachedUserParsed: User | null = null;

      if (accessToken && refreshToken) {
        // Restaura tokens no serviço de API
        apiService.setTokens(accessToken, refreshToken);

        // Se tem dados do usuário em cache, usa temporariamente
        if (userData) {
          try {
            cachedUserParsed = JSON.parse(userData);
            setUser(cachedUserParsed);
            setIsAuthenticated(true);
            // Continua carregando em background para validar token
          } catch (e) {
            console.warn('[Auth] Erro ao parsear userData:', e);
          }
        }

        // Valida token fazendo uma requisição leve (só se necessário)
        // Se o cache é recente (< 5 minutos), não busca novamente
        const cacheTimestamp = await AsyncStorage.getItem('@vamu:user_data_timestamp');
        const now = Date.now();
        const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp, 10) : Infinity;
        const CACHE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutos

        const cacheHasPhoto = hasProfilePhotoField(cachedUserParsed);
        if (cacheAge < CACHE_VALIDITY_MS && userData && cacheHasPhoto) {
          // Cache ainda válido e já possui foto, não precisa buscar novamente
          console.log('[Auth] Usando dados do cache (válido por mais', Math.round((CACHE_VALIDITY_MS - cacheAge) / 1000), 'segundos)');
          setIsLoading(false);
          return;
        }

        // Cache expirado ou não existe, busca dados atualizados
        const preferredType = getPreferredProfileType(cachedUserParsed?.roles);
        const meResponse = await apiService.getMe(preferredType);
        
        if (meResponse.success && meResponse.data) {
          // Remove campos desnecessários
          const sanitizedData = sanitizeUserData(meResponse.data);
          
          // Preserva roles dos dados salvos se não vierem do getMe
          const completeUserData: User = {
            ...sanitizedData,
            roles: sanitizedData.roles || cachedUserParsed?.roles || [],
          };
          setUser(completeUserData);
          setIsAuthenticated(true);
          
          // Salva com timestamp
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(completeUserData)),
            AsyncStorage.setItem('@vamu:user_data_timestamp', now.toString()),
          ]);
        } else {
          // Token inválido, tenta refresh
          await refreshAuth();
        }
      } else if (userData) {
        // Tem dados do usuário mas não tokens válidos
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.warn('[Auth] Erro ao parsear userData:', e);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar autenticação:', error);
      // Em caso de erro, limpa dados inválidos
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza tokens usando refresh token
   */
  const refreshAuth = async () => {
    try {
      const response = await apiService.refreshAccessToken();
      
      if (response.success && response.data) {
        await saveTokens(response.data);
        setIsAuthenticated(true);
        
        // Preserva roles do usuário atual antes de atualizar
        const currentRoles = user?.roles || [];
        
        // Verifica se precisa atualizar dados do usuário (cache expirado)
        const cacheTimestamp = await AsyncStorage.getItem('@vamu:user_data_timestamp');
        const now = Date.now();
        const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp, 10) : Infinity;
        const CACHE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutos
        
        if (cacheAge < CACHE_VALIDITY_MS && user) {
          // Cache ainda válido, não precisa buscar novamente
          console.log('[Auth] Refresh token OK, cache ainda válido');
          return;
        }
        
        // Cache expirado, atualiza dados do usuário
        const preferredType = getPreferredProfileType(currentRoles);
        const meResponse = await apiService.getMe(preferredType);
        if (meResponse.success && meResponse.data) {
          // Remove campos desnecessários
          const sanitizedData = sanitizeUserData(meResponse.data);
          
          // Preserva roles se não vierem do getMe
          const updatedUser: User = {
            ...sanitizedData,
            roles: sanitizedData.roles || currentRoles,
          };
          setUser(updatedUser);
          
          // Salva com timestamp
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser)),
            AsyncStorage.setItem('@vamu:user_data_timestamp', now.toString()),
          ]);
        } else {
          // Se não conseguir obter dados, preserva usuário atual com roles
          if (user) {
            const preservedUser: User = {
              ...user,
              roles: user.roles || currentRoles,
            };
            setUser(preservedUser);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(preservedUser));
          }
        }
      } else {
        // Refresh token inválido, faz logout
        await clearAuth();
      }
    } catch (error) {
      console.error('Erro ao atualizar autenticação:', error);
      await clearAuth();
    }
  };

  /**
   * Salva tokens de forma segura
   */
  const saveTokens = async (authData: AuthResponse) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken),
      ]);
      
      apiService.setTokens(authData.accessToken, authData.refreshToken);
    } catch (error) {
      console.error('Erro ao salvar tokens:', error);
      throw error;
    }
  };

  /**
   * Limpa todos os dados de autenticação (LGPD compliant)
   */
  const clearAuth = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.removeItem('@vamu:user_data_timestamp'),
      ]);
      
      apiService.clearTokens();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Erro ao limpar autenticação:', error);
    }
  };

  /**
   * Realiza login do usuário
   */
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('[Auth] Iniciando login para:', email);
      
      const response = await apiService.login({ email, password });
      console.log('[Auth] Resposta do login:', response.success ? 'Sucesso' : 'Erro', response);
      
      if (response.success && response.data) {
        // Verifica primeiro se o email está verificado na resposta do login
        // A rota /auth/login retorna emailVerified: true/false na resposta
        // Isso permite verificar o status sem precisar fazer requisições adicionais
        const emailVerified = response.data.emailVerified === true;
        
        if (!emailVerified) {
          // Email não verificado - limpa tokens e salva email pendente
          // A rota de login permite autenticação mesmo sem email verificado
          // para que possamos verificar o status de verificação
          console.log('[Auth] Email não verificado na resposta do login - redirecionando para verificação');
          
          // Limpa tokens antes de salvar email pendente
          await clearAuth();
          
          // Determina o tipo de usuário baseado nos roles
          const userType: 'passenger' | 'driver' = getPreferredProfileType(response.data.roles) || 'passenger';
          
          // Salva email pendente para redirecionamento
          try {
            await AsyncStorage.setItem('@vamu:pending_email_verification', JSON.stringify({
              email: response.data.email,
              userType: userType,
            }));
          } catch (error) {
            console.error('[Auth] Erro ao salvar email pendente:', error);
          }
          
          const returnValue = {
            success: false,
            requiresEmailVerification: true,
            email: response.data.email,
            userType: userType as 'passenger' | 'driver',
            error: 'Por favor, verifique seu email antes de continuar.',
          };
          
          console.log('[Auth] Retornando resultado de email não verificado:', {
            success: returnValue.success,
            requiresEmailVerification: returnValue.requiresEmailVerification,
            email: returnValue.email,
            userType: returnValue.userType,
          });
          
          return returnValue;
        }
        
        // Email está verificado - continua com o processo de login
        // Salva tokens
        await saveTokens(response.data);
        console.log('[Auth] Tokens salvos com sucesso');
        
        // Obtém dados completos do usuário (perfil) da rota /v1/passengers/profile
        const preferredType = getPreferredProfileType(response.data.roles);
        const meResponse = await apiService.getMe(preferredType);
        console.log('[Auth] Resposta getMe:', meResponse.success ? 'Sucesso' : 'Erro');
        
        if (meResponse.success && meResponse.data) {
          // Remove campos desnecessários (id, createdAt, updatedAt)
          const sanitizedData = sanitizeUserData(meResponse.data);
          
          // Mescla dados do perfil com dados do login (mantém roles do login)
          const completeUserData: User = {
            ...sanitizedData,
            roles: response.data.roles || sanitizedData.roles || [],
          };
          
          setUser(completeUserData);
          setIsAuthenticated(true);
          
          // Salva dados completos com timestamp
          const now = Date.now();
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(completeUserData)),
            AsyncStorage.setItem('@vamu:user_data_timestamp', now.toString()),
          ]);
          
          // Remove email pendente de verificação após login bem-sucedido
          try {
            await AsyncStorage.removeItem('@vamu:pending_email_verification');
            console.log('[Auth] Email pendente removido após login bem-sucedido');
          } catch (error) {
            console.error('[Auth] Erro ao remover email pendente:', error);
          }
          
          console.log('[Auth] Login completo com sucesso. Dados do perfil carregados.');
          
          return { success: true };
        } else {
          // Login OK mas não conseguiu obter dados do perfil
          // Cria objeto básico com dados do login
          const basicUserData: User = {
            userId: response.data.id,
            email: response.data.email,
            name: response.data.email.split('@')[0], // Fallback temporário
            roles: response.data.roles || [],
            emailVerified: response.data.emailVerified,
            emailVerifiedAt: response.data.emailVerifiedAt,
          };
          
          setUser(basicUserData);
          setIsAuthenticated(true);
          
          // Salva dados básicos com timestamp
          const now = Date.now();
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(basicUserData)),
            AsyncStorage.setItem('@vamu:user_data_timestamp', now.toString()),
          ]);
          
          // Remove email pendente de verificação após login bem-sucedido
          try {
            await AsyncStorage.removeItem('@vamu:pending_email_verification');
            console.log('[Auth] Email pendente removido após login bem-sucedido');
          } catch (error) {
            console.error('[Auth] Erro ao remover email pendente:', error);
          }
          
          console.log('[Auth] Login OK mas não conseguiu obter dados do perfil. Usando dados básicos.');
          return { success: true };
        }
      } else {
        const errorMsg = response.error || response.message || 'Credenciais inválidas';
        console.error('[Auth] Erro no login:', errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      console.error('[Auth] Exceção no login:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao conectar com o servidor. Tente novamente.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualiza os dados do usuário da API
   * Implementa cache inteligente para evitar requisições desnecessárias
   */
  const refreshUserData = async (force?: boolean) => {
    const shouldForce = force ?? false;
    try {
      // Verifica cache antes de fazer requisição
      if (!shouldForce) {
        const cacheTimestamp = await AsyncStorage.getItem('@vamu:user_data_timestamp');
        const now = Date.now();
        const cacheAge = cacheTimestamp ? now - parseInt(cacheTimestamp, 10) : Infinity;
        const CACHE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutos
        
        if (cacheAge < CACHE_VALIDITY_MS) {
          console.log('[Auth] Cache ainda válido, não é necessário atualizar dados');
          return;
        }
      }
      
      console.log('[Auth] Atualizando dados do usuário...');
      const preferredType = getPreferredProfileType(user?.roles);
      const meResponse = await apiService.getMe(preferredType);
      
      if (meResponse.success && meResponse.data) {
        // Remove campos desnecessários
        const sanitizedData = sanitizeUserData(meResponse.data);
        
        // Preserva roles do usuário atual
        const currentRoles = user?.roles || [];
        const updatedUser: User = {
          ...sanitizedData,
          roles: sanitizedData.roles || currentRoles,
        };
        setUser(updatedUser);
        
        // Salva com timestamp
        const now = Date.now();
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser)),
          AsyncStorage.setItem('@vamu:user_data_timestamp', now.toString()),
        ]);
        console.log('[Auth] Dados do usuário atualizados com sucesso');
      } else {
        console.warn('[Auth] Não foi possível atualizar dados do usuário:', meResponse.error);
      }
    } catch (error) {
      console.error('[Auth] Erro ao atualizar dados do usuário:', error);
    }
  };

  /**
   * Realiza logout do usuário
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Tenta fazer logout no servidor (não bloqueia se falhar)
      try {
        await apiService.logout();
      } catch (error) {
        console.error('Erro ao fazer logout no servidor:', error);
      }
      
      // Sempre limpa dados locais
      await clearAuth();
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, limpa dados locais
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        refreshAuth,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

