/**
 * Serviço de API para comunicação com o backend
 * Implementa segurança LGPD: tokens armazenados de forma segura
 */

import { getOrCreateProfilePhotoUrl } from './profilePhotoCache';

export const API_BASE_URL = 'https://vamu.joaoflavio.com/v1';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  roles: string[];
  createdAt: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number; // Status HTTP para verificação de erros específicos
}

export interface PaymentMethodResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardBrandResponse {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

type TokenUpdateCallback = (accessToken: string, refreshToken: string) => void;

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<ApiResponse<AuthResponse>> | null = null;
  private tokenUpdateCallback: TokenUpdateCallback | null = null;
  private lastActivityTime: number = Date.now();
  private inactivityCheckInterval: ReturnType<typeof setInterval> | null = null;
  private readonly INACTIVITY_THRESHOLD_MS = 2.5 * 60 * 1000; // 2 minutos e 30 segundos
  
  // Rate limiting: máximo de 60 requisições por minuto
  private requestTimestamps: number[] = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 60;
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto

  /**
   * Normaliza URLs de arquivos que podem vir relativos da API
   * Para fotos de perfil, usa a rota pública /v1/profile-photos/{userId}
   */
  private normalizeFileUrl(pathOrUrl?: string | null, userId?: string): string | undefined {
    if (!pathOrUrl) return undefined;
    if (pathOrUrl.startsWith('http')) return pathOrUrl;

    // Se é um caminho interno do servidor (/app/uploads/...), usa a rota pública
    if (pathOrUrl.includes('/app/uploads/') || pathOrUrl.includes('uploads/profile-photos/')) {
      if (userId) {
        // Usa a rota pública para servir a foto
        return `${API_BASE_URL}/profile-photos/${userId}`;
      }
      // Se não tem userId, tenta extrair do path
      const match = pathOrUrl.match(/profile-photos\/([a-f0-9-]+)\//i);
      if (match && match[1]) {
        return `${API_BASE_URL}/profile-photos/${match[1]}`;
      }
    }

    // Para outros caminhos, normaliza com a base URL
    const baseUrl = API_BASE_URL.replace(/\/v1$/, '');
    return `${baseUrl}/${pathOrUrl.replace(/^\/+/, '')}`;
  }

  /**
   * Normaliza campos de foto em respostas de perfil (passageiro/motorista)
   * Usa a rota pública /v1/profile-photos/{userId} para URLs de foto
   */
  private normalizeProfileData<T extends Record<string, any>>(data: T | undefined): T | undefined {
    if (!data) return data;

    // Extrai o userId dos dados do perfil
    const userId = data.userId || data.id || data.user_id;

    const photoCandidates = [
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

    let normalized: string | undefined;
    let hasPhoto = false;
    
    for (const key of photoCandidates) {
      const value = (data as any)[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        hasPhoto = true;
        normalized = this.normalizeFileUrl(value, userId);
        break;
      }
    }

    // Se tem foto, usa a URL normalizada
    // Se não tem foto mas tem userId, ainda retorna os dados (sem forçar URL de foto)
    if (!hasPhoto) {
      return data;
    }

    const cloned: Record<string, any> = { ...data };
    // Grava em campos comuns para facilitar consumo tipado ou dinâmico
    cloned.photoUrl = normalized;
    cloned.profilePhotoUrl = normalized;
    cloned.avatar = normalized;
    
    if (__DEV__) {
      console.log('[API] normalizeProfileData - userId:', userId, '| photoUrl normalizada:', normalized);
    }
    
    return cloned as T;
  }

  /**
   * Define um callback para ser chamado quando os tokens forem atualizados
   */
  setTokenUpdateCallback(callback: TokenUpdateCallback | null) {
    this.tokenUpdateCallback = callback;
  }

  /**
   * Define os tokens de autenticação
   */
  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.updateLastActivity();
    this.startInactivityCheck();
  }

  /**
   * Limpa os tokens (logout)
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.stopInactivityCheck();
  }

  /**
   * Atualiza o timestamp da última atividade do usuário
   */
  updateLastActivity() {
    this.lastActivityTime = Date.now();
  }

  /**
   * Verifica se o token precisa ser renovado devido à inatividade
   */
  private async checkAndRefreshIfNeeded(): Promise<void> {
    if (!this.refreshToken || !this.accessToken) {
      return;
    }

    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    
    if (timeSinceLastActivity >= this.INACTIVITY_THRESHOLD_MS) {
      if (__DEV__) {
        console.log(`[API] Inatividade detectada (${Math.round(timeSinceLastActivity / 1000)}s), renovando token...`);
      }
      
      try {
        await this.refreshAccessToken();
        this.updateLastActivity();
      } catch (error) {
        console.error('[API] Erro ao renovar token por inatividade:', error);
      }
    }
  }

  /**
   * Inicia o monitoramento de inatividade
   */
  private startInactivityCheck() {
    this.stopInactivityCheck();
    
    // Verifica a cada 30 segundos se precisa renovar
    this.inactivityCheckInterval = setInterval(() => {
      this.checkAndRefreshIfNeeded();
    }, 30 * 1000); // 30 segundos
  }

  /**
   * Para o monitoramento de inatividade
   */
  private stopInactivityCheck() {
    if (this.inactivityCheckInterval) {
      clearInterval(this.inactivityCheckInterval);
      this.inactivityCheckInterval = null;
    }
  }

  /**
   * Renova o token antes de uma ação do usuário (se necessário)
   * Deve ser chamado antes de ações importantes
   */
  async ensureValidToken(): Promise<boolean> {
    if (!this.refreshToken || !this.accessToken) {
      return false;
    }

    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    
    // Se passou mais de 2 minutos desde a última atividade, renova preventivamente
    if (timeSinceLastActivity >= 2 * 60 * 1000) {
      if (__DEV__) {
        console.log('[API] Renovando token preventivamente antes de ação do usuário...');
      }
      
      try {
        const response = await this.refreshAccessToken();
        if (response.success) {
          this.updateLastActivity();
          return true;
        }
      } catch (error) {
        console.error('[API] Erro ao renovar token preventivamente:', error);
      }
    }
    
    return true;
  }

  /**
   * Obtém o access token atual
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }
    /**
     * Verifica e aplica rate limiting (máximo 12 requisições por minuto)
   * Retorna true se pode fazer a requisição, false se está limitado
   */
  private checkRateLimit(): { allowed: boolean; waitTime?: number } {
    const now = Date.now();
    
    // Remove timestamps antigos (mais de 1 minuto)
    const beforeFilter = this.requestTimestamps.length;
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.RATE_LIMIT_WINDOW_MS
    );
    
    if (__DEV__ && beforeFilter !== this.requestTimestamps.length) {
      console.log(`[API] Rate limit: removidos ${beforeFilter - this.requestTimestamps.length} timestamps antigos`);
    }
    
    // Verifica se excedeu o limite
    if (this.requestTimestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
      // Calcula quanto tempo falta para a requisição mais antiga sair da janela
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = this.RATE_LIMIT_WINDOW_MS - (now - oldestRequest);
      
      if (__DEV__) {
        console.warn(
          `[API] Rate limit BLOQUEADO: ${this.requestTimestamps.length}/${this.MAX_REQUESTS_PER_MINUTE} requisições no último minuto. Aguarde ${Math.ceil(waitTime / 1000)}s`
        );
      }
      
      return { allowed: false, waitTime };
    }
    
    // Adiciona timestamp da requisição atual ANTES de fazer a requisição
    this.requestTimestamps.push(now);
    
    if (__DEV__) {
      console.log(`[API] Rate limit: ${this.requestTimestamps.length}/${this.MAX_REQUESTS_PER_MINUTE} requisições no último minuto`);
    }
    
    return { allowed: true };
  }

  /**
   * Faz uma requisição HTTP genérica com retry automático em caso de token expirado
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      // Verifica rate limiting (exceto para refresh token e login que são críticos)
      // Também não aplica em retry (quando retryCount > 0)
      if (!endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login') && retryCount === 0) {
        const rateLimitCheck = this.checkRateLimit();
        
        if (!rateLimitCheck.allowed) {
          const waitSeconds = rateLimitCheck.waitTime ? Math.ceil(rateLimitCheck.waitTime / 1000) : 5;
          
          if (__DEV__) {
            console.warn(
              `[API] Rate limit bloqueado: ${this.requestTimestamps.length}/${this.MAX_REQUESTS_PER_MINUTE} requisições. Endpoint: ${endpoint}`
            );
          }
          
          return {
            success: false,
            error: 'Limite de requisições excedido',
            message: `Muitas requisições. Por favor, aguarde ${waitSeconds} segundos antes de tentar novamente.`,
            status: 429,
          };
        }
      }
      
      // Atualiza última atividade para requisições autenticadas
      if (this.accessToken && !endpoint.includes('/auth/')) {
        this.updateLastActivity();
      }
      // Bloqueia explicitamente requisições à rota /drivers/location que foi removida
      if (endpoint === '/drivers/location') {
        if (__DEV__) {
          console.warn('[API] Tentativa de usar rota removida /drivers/location. Esta rota não existe mais.');
        }
        return {
          success: false,
          error: 'Rota removida',
          message: 'A rota /drivers/location foi removida. A localização é gerenciada automaticamente pelo backend.',
        };
      }

      // Para endpoints que começam com /api/, usa a URL base sem /v1
      // pois esses endpoints já incluem /api/v1/ no caminho
      const baseUrl = endpoint.startsWith('/api/') 
        ? API_BASE_URL.replace('/v1', '') 
        : API_BASE_URL;
      const url = `${baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };
      
      // Só adiciona Content-Type se houver body
      if (options.body) {
        headers['Content-Type'] = 'application/json';
      }

      // Adiciona o token de autenticação se disponível
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      if (__DEV__) {
        console.log(`[API] ${options.method || 'GET'} ${url}`);
        if (options.body) {
          console.log('[API] Request body:', options.body);
        }
        if (Object.keys(headers).length > 0) {
          console.log('[API] Request headers:', headers);
        }
      }

      // Cria um AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Verifica o tipo de conteúdo antes de fazer parse
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('[API] Erro ao fazer parse do JSON:', parseError);
          return {
            success: false,
            error: 'Resposta inválida do servidor',
            message: 'O servidor retornou uma resposta inválida',
          };
        }
      } else {
        const text = await response.text();
        console.warn('[API] Resposta não é JSON:', text);
        data = { message: text || 'Erro desconhecido' };
      }

      // Se recebeu 401 (Unauthorized) e não é uma requisição de refresh/login
      if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login') && !endpoint.includes('/passengers/register') && !endpoint.includes('/drivers/register') && retryCount === 0) {
        console.log('[API] Token expirado, tentando refresh...');
        
        // Tenta fazer refresh do token
        const refreshResponse = await this.refreshAccessToken();
        
        if (refreshResponse.success && refreshResponse.data) {
          console.log('[API] Token atualizado com sucesso, repetindo requisição...');
          // Repete a requisição original com o novo token
          return this.request<T>(endpoint, options, retryCount + 1);
        } else {
          console.error('[API] Falha ao atualizar token:', refreshResponse.error);
          // Se o refresh falhou, retorna o erro original
          return {
            success: false,
            error: refreshResponse.error || 'Sessão expirada. Faça login novamente.',
            message: refreshResponse.message || 'Sessão expirada. Faça login novamente.',
          };
        }
      }

      // Trata erro 429 (Too Many Requests) com retry com backoff exponencial
      if (response.status === 429) {
        const maxRetries = 3;
        const baseDelay = 1000; // 1 segundo
        
        if (retryCount < maxRetries) {
          // Calcula delay exponencial: 1s, 2s, 4s
          const delay = baseDelay * Math.pow(2, retryCount);
          
          if (__DEV__) {
            console.warn(`[API] Rate limit atingido (429). Tentando novamente em ${delay}ms (tentativa ${retryCount + 1}/${maxRetries})...`);
          }
          
          // Aguarda antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Tenta novamente
          return this.request<T>(endpoint, options, retryCount + 1);
        } else {
          // Limite de retries atingido
          if (__DEV__) {
            console.error('[API] Limite de tentativas atingido para erro 429');
          }
          return {
            success: false,
            error: 'Muitas requisições',
            message: 'Muitas requisições foram feitas. Aguarde alguns instantes antes de tentar novamente.',
          };
        }
      }

      if (!response.ok) {
        // Trata erros da API
        let errorMessage = data.error?.message || data.message || data.error || data.detail;
        const errorCode = data.error?.code || `Erro ${response.status}`;
        
        // Log detalhado para debug (exceto 401 que já é tratado)
        if (response.status !== 401 && __DEV__) {
          console.log('[API] 📊 Detalhes do erro:', {
            method: options.method || 'GET',
            url: url,
            status: response.status,
            errorCode: errorCode,
            errorMessage: errorMessage,
          });
        }
        
        // Trata erros específicos do backend (ex: problemas de banco de dados)
        if (response.status === 500) {
          // Verifica se é erro do TripPricingService ANTES de logar como erro
          const isTripPricingError = 
            (errorMessage && typeof errorMessage === 'string' && 
             (errorMessage.includes('TripPricingService') || 
              (errorMessage.includes('Class') && errorMessage.includes('TripPricingService')))) ||
            (data.message && typeof data.message === 'string' && data.message.includes('TripPricingService'));
          
          if (isTripPricingError) {
            // Erro específico do TripPricingService - não loga como erro, apenas como aviso
            if (__DEV__) {
              console.warn('[API] TripPricingService temporariamente indisponível - permitindo continuar para testes');
            }
            // Em ambiente de testes, retorna erro controlado mas permite que o frontend decida
            return {
              success: false,
              error: 'TripPricingService indisponível',
              message: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.',
            };
          }
          
          // Se não for erro do TripPricingService, loga como erro
          console.error('[API] ❌ Erro 500 na rota:', options.method || 'GET', url);
          console.error('[API] Erro na resposta:', response.status, data);
          
          // Logs detalhados para debug de avaliações
          if (endpoint.includes('/ratings')) {
            console.error('[API] 🔍 DEBUG - Erro 500 em avaliação:');
            console.error('[API] 🔍 Endpoint:', endpoint);
            console.error('[API] 🔍 Method:', options.method || 'GET');
            console.error('[API] 🔍 Request body:', options.body);
            console.error('[API] 🔍 Response status:', response.status);
            console.error('[API] 🔍 Response data:', JSON.stringify(data, null, 2));
            console.error('[API] 🔍 Headers enviados:', JSON.stringify(headers, null, 2));
          }
          
          // Se for erro de banco de dados (como deleted_at não existe), mostra mensagem amigável
          if (errorMessage && typeof errorMessage === 'string') {
            if (errorMessage.includes('deleted_at') || errorMessage.includes('column') || errorMessage.includes('SQLSTATE')) {
              errorMessage = 'Erro no servidor. Por favor, tente novamente em alguns instantes.';
            } else if (errorMessage.includes('SQLSTATE') || errorMessage.includes('database')) {
              errorMessage = 'Erro de conexão com o banco de dados. Tente novamente.';
            } else if (errorMessage.includes('Class') && errorMessage.includes('not found')) {
              // Trata erros de classe não encontrada (outros serviços)
              errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.';
            }
          }
          
          // Se não conseguiu identificar o erro específico, usa mensagem genérica
          if (!errorMessage || errorMessage === data.error?.code || errorMessage === `Erro ${response.status}`) {
            errorMessage = 'Erro no servidor. Por favor, tente novamente em alguns instantes.';
          }
        }
        
        return {
          success: false,
          error: errorMessage || errorCode,
          message: errorMessage || `Erro ${response.status}: ${response.statusText}`,
          status: response.status, // Inclui status HTTP
        };
      }

      // A API retorna { success: true, message: "...", data: {...} }
      // Exemplo: {"success":true,"message":"Login realizado com sucesso","data":{"access_token":"...","token_type":"Bearer",...}}
      if (data.success !== undefined) {
        // Se success é true e tem data, retorna os dados
        if (data.success && data.data) {
          return {
            success: true,
            data: data.data,
            message: data.message,
          };
        }
        // Se success é false
        return {
          success: false,
          error: data.message || data.error || 'Erro na requisição',
          message: data.message || data.error || 'Erro na requisição',
        };
      }

      // Se não tem success, assume que os dados são a resposta direta (fallback)
      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Verifica se é erro de timeout
      if (error instanceof Error && error.name === 'AbortError') {
        if (__DEV__) {
          console.warn('[API] Timeout na requisição');
        }
        return {
          success: false,
          error: 'Timeout',
          message: 'A requisição demorou muito para responder. Tente novamente.',
        };
      }
      
      // Verifica se é erro de rede
      if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        // Log apenas em desenvolvimento
        if (__DEV__) {
          console.warn('[API] Erro de conexão - Servidor não acessível');
        }
        return {
          success: false,
          error: 'Erro de conexão',
          message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
        };
      }

      // Log apenas em desenvolvimento para outros erros
      if (__DEV__) {
        console.error('[API] Erro:', errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
        message: 'Ocorreu um erro inesperado. Tente novamente.',
      };
    }
  }

  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  /**
   * Atualiza o access token usando o refresh token
   * POST /v1/auth/refresh
   * Conforme documentação da API: envia refreshToken no header X-Refresh-Token e no body
   */
  async refreshAccessToken(): Promise<ApiResponse<AuthResponse>> {
    if (!this.refreshToken) {
      console.error('[API] Refresh token não disponível');
      return {
        success: false,
        error: 'Refresh token não disponível',
      };
    }

    // Se já está fazendo refresh, retorna a promise existente
    if (this.isRefreshing && this.refreshPromise) {
      console.log('[API] Refresh já em andamento, aguardando...');
      return this.refreshPromise;
    }

    // Marca como refreshing e cria a promise
    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        console.log('[API] Iniciando refresh do token...');
        
        // Usa o método request para manter consistência e tratamento de erros
        // Mas precisa fazer manualmente porque não queremos adicionar Authorization header
        const url = `${API_BASE_URL}/auth/refresh`;
        
        // Garante que refreshToken não seja null antes de usar
        if (!this.refreshToken) {
          throw new Error('Refresh token não disponível');
        }
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Refresh-Token': this.refreshToken, // Header conforme documentação
        };

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            refreshToken: this.refreshToken, // Body conforme documentação
          }),
        });

        const contentType = response.headers.get('content-type');
        let data: any;

        if (contentType && contentType.includes('application/json')) {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } else {
          const text = await response.text();
          data = { message: text || 'Erro desconhecido' };
        }

        if (!response.ok) {
          console.error('[API] Erro ao fazer refresh:', response.status, data);
          const errorMessage = data.error?.message || data.message || data.error || 'Erro ao atualizar token';
          return {
            success: false,
            error: errorMessage,
            message: errorMessage,
          };
        }

        // A API retorna diretamente: { accessToken, refreshToken }
        // Conforme documentação: { "accessToken": "...", "refreshToken": "..." }
        if (data.accessToken && data.refreshToken) {
          // Atualiza os tokens (rotação automática)
          this.setTokens(data.accessToken, data.refreshToken);
          console.log('[API] Token atualizado com sucesso (rotação automática)');
          
          // Notifica o callback para atualizar no storage
          if (this.tokenUpdateCallback) {
            this.tokenUpdateCallback(data.accessToken, data.refreshToken);
          }
          
          // Mapeia para o formato AuthResponse esperado
          const authResponse: AuthResponse = {
            id: '', // Não vem na resposta de refresh
            email: '', // Não vem na resposta de refresh
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            roles: [], // Não vem na resposta de refresh
            createdAt: '', // Não vem na resposta de refresh
          };
          
          return {
            success: true,
            data: authResponse,
          };
        }

        return {
          success: false,
          error: 'Resposta inválida do servidor',
          message: 'O servidor retornou uma resposta inválida',
        };
      } catch (error) {
        console.error('[API] Erro ao fazer refresh:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao atualizar token',
          message: 'Erro ao atualizar token. Tente fazer login novamente.',
        };
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Realiza logout do usuário
   */
  async logout(): Promise<ApiResponse<void>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Adiciona o token de autenticação se disponível
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Adiciona refresh token no header ou body conforme a API
    if (this.refreshToken) {
      headers['X-Refresh-Token'] = this.refreshToken;
    }

    const response = await this.request<void>('/auth/logout', {
      method: 'POST',
      headers,
      body: this.refreshToken ? JSON.stringify({ refreshToken: this.refreshToken }) : undefined,
    });

    this.clearTokens();
    return response;
  }
  /**
   * Obtém informações do usuário autenticado
   * Permite priorizar rota de passageiro ou motorista para evitar chamadas erradas
   */
  async getMe(preferredType?: 'passenger' | 'driver'): Promise<ApiResponse<any>> {
    // Se já sabemos o tipo (ex.: pelo role), vamos direto na rota certa
    if (preferredType === 'driver') {
      const response = await this.request<any>('/drivers/profile', {
        method: 'GET',
      });
      return {
        ...response,
        data: this.normalizeProfileData(response.data),
      };
    }

    if (preferredType === 'passenger') {
      const response = await this.request<any>('/passengers/profile', {
        method: 'GET',
      });
      return {
        ...response,
        data: this.normalizeProfileData(response.data),
      };
    }

    // Caso não saiba o tipo, tenta passageiro primeiro e depois motorista
    const passengerResponse = await this.request<any>('/passengers/profile', {
      method: 'GET',
    });

    if (passengerResponse.success) {
      return {
        ...passengerResponse,
        data: this.normalizeProfileData(passengerResponse.data),
      };
    }

    const driverResponse = await this.request<any>('/drivers/profile', {
      method: 'GET',
    });

    return {
      ...driverResponse,
      data: this.normalizeProfileData(driverResponse.data),
    };
  }

  /**
   * Obtém perfil completo do motorista autenticado
   * GET /v1/drivers/profile
   */
  async getDriverProfile(): Promise<ApiResponse<any>> {
    const response = await this.request<any>('/drivers/profile', {
      method: 'GET',
    });

    return {
      ...response,
      data: this.normalizeProfileData(response.data),
    };
  }

  /**
   * Obtém o rating do motorista autenticado
   * GET /v1/drivers/ratings/me
   * Retorna a nota média do motorista (escala de 0 a 10)
   */
  async getDriverRating(): Promise<ApiResponse<{ userId: string; currentRating: string; totalRatings: number }>> {
    return this.request<{ userId: string; currentRating: string; totalRatings: number }>('/drivers/ratings/me', {
      method: 'GET',
    });
  }

  /**
   * Obtém o rating do passageiro autenticado
   * GET /v1/passengers/ratings/me
   * Retorna a nota média do passageiro (escala de 0 a 10)
   */
  async getPassengerRating(): Promise<ApiResponse<{ userId: string; currentRating: string; totalRatings: number }>> {
    return this.request<{ userId: string; currentRating: string; totalRatings: number }>('/passengers/ratings/me', {
      method: 'GET',
    });
  }

  /**
   * Faz upload da foto de perfil do motorista
   * POST /v1/drivers/profile-photo
   * Aceita formatos JPEG, PNG, GIF, WebP e tamanho máximo recomendado de 5MB
   */
  async uploadDriverProfilePhoto(fileUri: string): Promise<ApiResponse<{ message?: string; photoUrl?: string }>> {
    try {
      if (!this.accessToken) {
        return {
          success: false,
          error: 'Não autenticado',
          message: 'Token de acesso não disponível. Faça login novamente.',
        };
      }

      const formData = new FormData();
      const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
      const supportedImageTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
      };
      const mimeType = supportedImageTypes[fileExtension] || 'image/jpeg';

      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: `profile.${fileExtension}`,
      } as any);

      const url = `${API_BASE_URL}/drivers/profile-photo`;
      const headers: Record<string, string> = {
        Accept: 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      };

      if (__DEV__) {
        console.log(`[API] POST ${url}`);
        console.log(`[API] Uploading profile photo: profile.${fileExtension}, type: ${mimeType}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos para upload

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data: any;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        data = { message: responseText || 'Foto de perfil atualizada com sucesso' };
      }

      if (!response.ok) {
        const errorMessage = data.error?.message || data.message || data.error || data.detail || 'Erro desconhecido';

        if (__DEV__) {
          console.error('[API] Erro no upload de foto de perfil:', {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
            message: errorMessage,
            fullResponse: data,
          });
        }

        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
          status: response.status,
        };
      }

      const normalizedPhotoUrl = this.normalizeFileUrl(data.photoUrl || data.url);

      return {
        success: true,
        data: {
          ...data,
          photoUrl: normalizedPhotoUrl || data.photoUrl || data.url,
        },
        message: data.message || 'Foto de perfil atualizada com sucesso',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Timeout',
          message: 'A requisição demorou muito para responder. Tente novamente.',
        };
      }

      if (__DEV__) {
        console.error('[API] Erro ao enviar foto de perfil:', errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
        message: 'Ocorreu um erro ao enviar a foto de perfil. Tente novamente.',
      };
    }
  }

  /**
   * Remove a foto de perfil do motorista
   * DELETE /v1/drivers/profile-photo
   */
  async deleteDriverProfilePhoto(): Promise<ApiResponse<any>> {
    const response = await this.request<any>('/drivers/profile-photo', {
      method: 'DELETE',
    });

    if (response.success && response.data) {
      const normalizedPhotoUrl = this.normalizeFileUrl(response.data.photoUrl || response.data.url);
      return {
        ...response,
        data: {
          ...response.data,
          photoUrl: normalizedPhotoUrl || response.data.photoUrl || response.data.url,
        },
        message: response.message || response.data?.message,
      };
    }

    return response;
  }

  /**
   * Faz upload da foto de perfil do passageiro
   * POST /v1/passengers/profile-photo
   * Aceita formatos JPEG, PNG, GIF, WebP e tamanho máximo recomendado de 5MB
   */
  async uploadPassengerProfilePhoto(fileUri: string): Promise<ApiResponse<{ message?: string; photoUrl?: string }>> {
    try {
      if (!this.accessToken) {
        return {
          success: false,
          error: 'Não autenticado',
          message: 'Token de acesso não disponível. Faça login novamente.',
        };
      }

      const formData = new FormData();
      const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
      const supportedImageTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
      };
      const mimeType = supportedImageTypes[fileExtension] || 'image/jpeg';

      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: `profile.${fileExtension}`,
      } as any);

      const url = `${API_BASE_URL}/passengers/profile-photo`;
      const headers: Record<string, string> = {
        Accept: 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      };

      if (__DEV__) {
        console.log(`[API] POST ${url}`);
        console.log(`[API] Uploading passenger profile photo: profile.${fileExtension}, type: ${mimeType}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos para upload

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data: any;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        data = { message: responseText || 'Foto de perfil atualizada com sucesso' };
      }

      if (!response.ok) {
        const errorMessage = data.error?.message || data.message || data.error || data.detail || 'Erro desconhecido';

        if (__DEV__) {
          console.error('[API] Erro no upload de foto de perfil (passageiro):', {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
            message: errorMessage,
            fullResponse: data,
          });
        }

        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
          status: response.status,
        };
      }

      const normalizedPhotoUrl = this.normalizeFileUrl(data.photoUrl || data.url);

      return {
        success: true,
        data: {
          ...data,
          photoUrl: normalizedPhotoUrl || data.photoUrl || data.url,
        },
        message: data.message || 'Foto de perfil atualizada com sucesso',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Timeout',
          message: 'A requisição demorou muito para responder. Tente novamente.',
        };
      }

      if (__DEV__) {
        console.error('[API] Erro ao enviar foto de perfil (passageiro):', errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
        message: 'Ocorreu um erro ao enviar a foto de perfil. Tente novamente.',
      };
    }
  }

  /**
   * Remove a foto de perfil do passageiro
   * DELETE /v1/passengers/profile-photo
   */
  async deletePassengerProfilePhoto(): Promise<ApiResponse<any>> {
    const response = await this.request<any>('/passengers/profile-photo', {
      method: 'DELETE',
    });

    if (response.success && response.data) {
      const normalizedPhotoUrl = this.normalizeFileUrl(response.data.photoUrl || response.data.url);
      return {
        ...response,
        data: {
          ...response.data,
          photoUrl: normalizedPhotoUrl || response.data.photoUrl || response.data.url,
        },
        message: response.message || response.data?.message,
      };
    }

    return response;
  }

  /**
   * Faz upload de documento do motorista (CNH ou CRLV)
   * POST /v1/drivers/documents
   * @param documentType - Tipo do documento: 'CNH' ou 'VEHICLE_DOC'
   * @param fileUri - URI do arquivo (ex: file:///path/to/file.pdf ou content://...)
   * @param vehicleId - ID do veículo (obrigatório se documentType = 'VEHICLE_DOC')
   */
  async uploadDriverDocument(
    documentType: 'CNH' | 'VEHICLE_DOC',
    fileUri: string,
    vehicleId?: string
  ): Promise<ApiResponse<any>> {
    try {
      // Verifica se tem token de autenticação
      if (!this.accessToken) {
        return {
          success: false,
          error: 'Não autenticado',
          message: 'Token de acesso não disponível. Faça login novamente.',
        };
      }

      // Cria FormData para multipart/form-data
      const formData = new FormData();
      
      // Determina o tipo do arquivo pela extensão
      const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = fileExtension === 'pdf' ? 'application/pdf' : `image/${fileExtension}`;
      
      // Adiciona o arquivo ao FormData
      // No React Native, o formato correto é: { uri, type, name }
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: `document.${fileExtension}`,
      } as any);

      // Monta a URL com os parâmetros de query
      const url = `${API_BASE_URL}/drivers/documents?documentType=${documentType}${vehicleId ? `&vehicleId=${vehicleId}` : ''}`;
      
      // Headers - NÃO define Content-Type, deixa o fetch definir automaticamente com boundary para multipart/form-data
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
      };

      if (__DEV__) {
        console.log(`[API] POST ${url}`);
        console.log(`[API] Uploading file: document.${fileExtension}, type: ${mimeType}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos para upload

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Lê a resposta como texto primeiro
      const responseText = await response.text();
      
      // Tenta fazer parse do JSON
      let data: any;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        // Se não for JSON, trata como texto simples
        data = { message: responseText || 'Upload realizado com sucesso' };
      }

      if (!response.ok) {
        // Extrai mensagem de erro da resposta
        let errorMessage = data.error?.message || data.message || data.error || data.detail || 'Erro desconhecido';
          if (__DEV__) {
              console.error('[API] Erro no upload:', {
            status: response.status,
            statusText: response.statusText,
            error: data.error,
            message: errorMessage,
            fullResponse: data,
          });
        }
        
        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
          status: response.status,
        };
      }

      if (__DEV__) {
        console.log('[API] Upload realizado com sucesso:', data);
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message || 'Documento enviado com sucesso',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Verifica se é erro de timeout
      if (error instanceof Error && error.name === 'AbortError') {
        if (__DEV__) {
          console.warn('[API] Timeout no upload');
        }
        return {
          success: false,
          error: 'Timeout',
          message: 'O upload demorou muito para responder. Tente novamente.',
        };
      }
      
      // Verifica se é erro de rede
      if (errorMessage.includes('Network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        if (__DEV__) {
          console.warn('[API] Erro de conexão - Servidor não acessível');
        }
        return {
          success: false,
          error: 'Erro de conexão',
          message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
        };
      }

      if (__DEV__) {
        console.error('[API] Erro no upload:', errorMessage, error);
      }

      return {
        success: false,
        error: errorMessage,
        message: 'Ocorreu um erro inesperado ao enviar o documento. Tente novamente.',
      };
    }
  }

  /**
   * Cadastra um novo passageiro
   */
  async registerPassenger(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    cpf: string;
    birthDate: string; // formato: YYYY-MM-DD
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/passengers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Verifica email do passageiro com código
   */
  async verifyPassengerEmail(email: string, code: string): Promise<ApiResponse<any>> {
    return this.request<any>('/passengers/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  /**
   * Cadastra um novo motorista
   */
  async registerDriver(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    cpf: string;
    cnhNumber: string;
    cnhExpirationDate: string; // formato: YYYY-MM-DD
    cnhCategory: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>('/drivers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Verifica email do motorista com código
   */
  async verifyDriverEmail(email: string, code: string): Promise<ApiResponse<any>> {
    return this.request<any>('/drivers/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  /**
   * Estima o preço de uma corrida (NOVA API)
   * POST /v1/passengers/fare-estimate
   */
  async fareEstimate(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<ApiResponse<any>> {
    return this.request('/passengers/fare-estimate', {
      method: 'POST',
      body: JSON.stringify({
        originLat: origin.lat,
        originLng: origin.lng,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
      }),
    });
  }

  /**
   * Cria uma nova corrida (NOVA API)
   * POST /v1/passengers/rides
   */
  async createRide(
    estimateId: string,
    serviceCategoryId: string,
    paymentMethodId: string,
    cardBrandId?: string
  ): Promise<ApiResponse<any>> {
    const body: any = {
      estimateId,
      serviceCategoryId,
      paymentMethodId,
    };

    // Só adiciona cardBrandId se for fornecido e não vazio
    if (cardBrandId && cardBrandId.trim() !== '') {
      body.cardBrandId = cardBrandId;
    }

    return this.request('/passengers/rides', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
    /**
     * Cria uma nova corrida (LEGADO - mantido para compatibilidade)
   * @deprecated Use createRide ao invés deste método
   */
  async createTrip(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    tripCategoryId: string,
    paymentMethodId: string,
    paymentBrandId?: string
  ): Promise<ApiResponse<any>> {
    const response = await this.request('/trips', {
      method: 'POST',
      body: JSON.stringify({
        origin,
        destination,
        trip_category_id: tripCategoryId,
        payment_method_id: paymentMethodId,
        payment_brand_id: paymentBrandId || null,
      }),
    });

    // Se o TripPricingService retornou erro, retorna erro controlado
    // Não cria trip temporária para evitar erros ao buscar status
    if (!response.success && response.error?.includes('TripPricingService')) {
      return {
        success: false,
        error: 'TripPricingService indisponível',
        message: 'O serviço de cálculo de preços está temporariamente indisponível. Por favor, tente novamente em alguns instantes.',
      };
    }

    return response;
  }


  /**
   * Cancela uma corrida
   * @deprecated Esta rota está retornando erro 500. Verifique se a rota existe ou se o cancelamento deve ser feito de outra forma.
   * Para passageiros, considere usar a rota correta conforme documentação da API.
   */
  async cancelTrip(tripId: string, reason?: string): Promise<ApiResponse<any>> {
    console.warn('[API] cancelTrip() - Esta rota pode não existir ou estar com problemas. Verifique a documentação da API.');
    // Mantém a implementação mas avisa que pode não funcionar
    return this.request(`/trips/${tripId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        reason: reason || null,
      }),
    });
  }
    /**
     * Lista formas de pagamento habilitadas
   * Endpoint: GET /v1/payment-methods
   * Retorna todas as formas de pagamento habilitadas
   */
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethodResponse[]>> {
    return this.request<PaymentMethodResponse[]>('/payment-methods', {
      method: 'GET',
    });
  }
    /**
     * Lista bandeiras de cartão habilitadas
   * Endpoint: GET /v1/card-brands
   * Retorna todas as bandeiras de cartão habilitadas
   */
  async getCardBrands(): Promise<ApiResponse<CardBrandResponse[]>> {
    return this.request<CardBrandResponse[]>('/card-brands', {
      method: 'GET',
    });
  }
// ========== MÉTODOS DO MOTORISTA ==========

  // NOTA: As rotas GET e PUT /v1/drivers/location foram removidas da API
  // A localização do motorista é gerenciada automaticamente pelo backend
  // Use updateDriverOperationalStatus() para atualizar disponibilidade

  /**
   * Obtém status operacional e de conexão do motorista
   * GET /v1/drivers/operational-status
   */
  async getDriverOperationalStatus(): Promise<ApiResponse<any>> {
    return this.request('/drivers/operational-status', {
      method: 'GET',
    });
  }

  /**
   * Atualiza status operacional do motorista
   * PATCH /v1/drivers/operational-status
   * @param status - Status operacional: 'AVAILABLE', 'BUSY', 'PAUSED', 'OFFLINE'
   */
  async updateDriverOperationalStatus(status: 'AVAILABLE' | 'BUSY' | 'PAUSED' | 'OFFLINE'): Promise<ApiResponse<any>> {
    if (__DEV__) {
      console.log('[API] Atualizando status operacional:', status);
    }
    
    const response = await this.request('/drivers/operational-status', {
      method: 'PATCH',
      body: JSON.stringify({
        status,
      }),
    });
    
    if (__DEV__) {
      console.log('[API] Resposta do status operacional:', response);
    }
    
    return response;
  }

  /**
   * Obtém status de validação do motorista
   * GET /v1/drivers/validation-status
   * Retorna o status completo de validação, incluindo email, documentos e veículos
   */
  async getDriverValidationStatus(): Promise<ApiResponse<any>> {
    return this.request('/drivers/validation-status', {
      method: 'GET',
    });
  }

  /**
   * Lista categorias de serviço disponíveis para o motorista
   * GET /v1/drivers/service-categories
   */
  async getDriverServiceCategories(): Promise<ApiResponse<any>> {
    return this.request('/drivers/service-categories', {
      method: 'GET',
    });
  }

  /**
   * Consulta corrida ativa do passageiro
   * GET /v1/passengers/active-ride
   */
  async getPassengerActiveRide(): Promise<ApiResponse<any>> {
    return this.request('/passengers/active-ride', {
      method: 'GET',
    });
  }

  /**
   * Lista veículos do motorista autenticado
   * GET /v1/drivers/vehicles
   * @param params - Parâmetros opcionais: cursor, limit, sort, q, status, year, serviceCategoryId
   */
  async getDriverVehicles(params?: {
    cursor?: string;
    limit?: number;
    sort?: string;
    q?: string;
    status?: string;
    year?: number;
    serviceCategoryId?: string;
  }): Promise<ApiResponse<{
    items: Array<{
      id: string;
      driverProfileId: string;
      serviceCategoryId: string | null;
      licensePlate: string;
      brand: string;
      model: string;
      year: number;
      color: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    }>;
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) queryParams.append('status[eq]', params.status);
    if (params?.year) queryParams.append('year[gte]', params.year.toString());
    if (params?.serviceCategoryId) queryParams.append('serviceCategoryId[eq]', params.serviceCategoryId);

    const queryString = queryParams.toString();
    const url = `/drivers/vehicles${queryString ? `?${queryString}` : ''}`;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  /**
   * Cadastra um novo veículo para o motorista
   * POST /v1/drivers/vehicles
   * @param vehicleData - Dados do veículo (licensePlate, brand, model, year, color, serviceCategoryId)
   */
  async createDriverVehicle(vehicleData: {
    licensePlate: string;
    brandId: string;
    modelId: string;
    year: number;
    color: string;
    serviceCategoryId: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/drivers/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  }

  /**
   * Aceita uma corrida
   * @deprecated Esta rota não existe mais. Use WebSocket para aceitar corridas via respondToRideOffer()
   * A aceitação de corridas agora é feita via WebSocket conforme documentação WebSocket_cliente.txt
   */
  async acceptTrip(tripId: string): Promise<ApiResponse<any>> {
    console.warn('[API] acceptTrip() está deprecado. Use WebSocket para aceitar corridas.');
    return {
      success: false,
      error: 'Rota removida',
      message: 'A rota /drivers/me/trips/{id}/accept foi removida. Use WebSocket para aceitar corridas.',
    };
  }

  /**
   * Atualiza status da corrida
   * @deprecated Esta rota não existe mais. Use os endpoints específicos para motorista:
   * - updateDriverRideStatus() para atualizações de status
   * - Os status são atualizados via endpoints REST específicos conforme WebSocket_cliente.txt
   */
  async updateTripStatus(tripId: string, status: string, reason?: string): Promise<ApiResponse<any>> {
    console.warn('[API] updateTripStatus() está deprecado. Use os endpoints específicos para motorista.');
    return {
      success: false,
      error: 'Rota removida',
      message: 'A rota /trips/{id}/status foi removida. Use os endpoints específicos para motorista conforme documentação.',
    };
  }

  /**
   * Motorista indica que está a caminho do ponto de embarque
   * PATCH /v1/drivers/rides/{rideId}/on-the-way
   */
  async driverRideOnTheWay(rideId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/drivers/rides/${rideId}/on-the-way`, {
      method: 'PATCH',
    });
  }

  /**
   * Motorista indica que está próximo do ponto de embarque (máximo 500m)
   * PATCH /v1/drivers/rides/{rideId}/nearby
   */
  async driverRideNearby(rideId: string, lat: number, lng: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/drivers/rides/${rideId}/nearby`, {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }),
    });
  }

  /**
   * Motorista indica que chegou no ponto de embarque (máximo 100m)
   * PATCH /v1/drivers/rides/{rideId}/arrived
   */
  async driverRideArrived(rideId: string, lat: number, lng: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/drivers/rides/${rideId}/arrived`, {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }),
    });
  }

  /**
   * Motorista indica que passageiro embarcou
   * PATCH /v1/drivers/rides/{rideId}/boarded
   */
  async driverRideBoarded(rideId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/drivers/rides/${rideId}/boarded`, {
      method: 'PATCH',
    });
  }

  /**
   * Motorista indica que está em rota para o destino
   * PATCH /v1/drivers/rides/{rideId}/in-route
   */
  async driverRideInRoute(rideId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/drivers/rides/${rideId}/in-route`, {
      method: 'PATCH',
    });
  }

  /**
   * Motorista indica que está próximo do destino (máximo 500m)
   * PATCH /v1/drivers/rides/{rideId}/near-destination
   */
  async driverRideNearDestination(rideId: string, lat: number, lng: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/drivers/rides/${rideId}/near-destination`, {
      method: 'PATCH',
      body: JSON.stringify({ lat, lng }),
    });
  }

  /**
   * Motorista finaliza a corrida e informa o preço final
   * PATCH /v1/drivers/rides/{rideId}/complete
   */
  async driverRideComplete(rideId: string, finalPrice: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/drivers/rides/${rideId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ finalPrice }),
    });
  }

  /**
   * Motorista avalia o passageiro ao final da corrida
   * POST /v1/drivers/rides/{rideId}/ratings
   */
  async driverRideRate(rideId: string, rating: number, comment?: string): Promise<ApiResponse<void>> {
    console.log('[API] 📝 driverRideRate - Iniciando avaliação do passageiro');
    console.log('[API] 📝 Parâmetros recebidos:', {
      rideId,
      rating,
      comment: comment || '(sem comentário)',
      ratingType: typeof rating,
      commentType: typeof comment,
    });

    // Validação dos parâmetros
    if (!rideId || rideId.trim().length === 0) {
      console.error('[API] ❌ driverRideRate - rideId inválido:', rideId);
      return {
        success: false,
        error: 'RideId inválido',
        message: 'O ID da corrida é obrigatório',
      };
    }

    if (!rating || rating < 1 || rating > 5) {
      console.error('[API] ❌ driverRideRate - rating inválido:', rating);
      return {
        success: false,
        error: 'Rating inválido',
        message: 'A nota deve ser um número entre 1 e 5',
      };
    }

    const requestBody = {
      rating: Number(rating),
      comment: comment && comment.trim().length > 0 ? comment.trim() : undefined,
    };

    console.log('[API] 📝 Request body que será enviado:', JSON.stringify(requestBody, null, 2));
    console.log('[API] 📝 URL completa:', `${API_BASE_URL}/drivers/rides/${rideId}/ratings`);

    try {
      const response = await this.request<void>(`/drivers/rides/${rideId}/ratings`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      console.log('[API] 📝 driverRideRate - Resposta recebida:', {
        success: response.success,
        status: response.status,
        message: response.message,
        error: response.error,
      });

      return response;
    } catch (error: any) {
      console.error('[API] ❌ driverRideRate - Erro na requisição:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      throw error;
    }
  }

  /**
   * Passageiro avalia o motorista ao final da corrida
   * POST /v1/passengers/rides/{rideId}/ratings
   */
  async passengerRideRate(rideId: string, rating: number, comment?: string): Promise<ApiResponse<void>> {
    console.log('[API] 📝 passengerRideRate - Iniciando avaliação do motorista');
    console.log('[API] 📝 Parâmetros recebidos:', {
      rideId,
      rating,
      comment: comment || '(sem comentário)',
      ratingType: typeof rating,
      commentType: typeof comment,
    });

    // Validação dos parâmetros
    if (!rideId || rideId.trim().length === 0) {
      console.error('[API] ❌ passengerRideRate - rideId inválido:', rideId);
      return {
        success: false,
        error: 'RideId inválido',
        message: 'O ID da corrida é obrigatório',
      };
    }

    if (!rating || rating < 1 || rating > 5) {
      console.error('[API] ❌ passengerRideRate - rating inválido:', rating);
      return {
        success: false,
        error: 'Rating inválido',
        message: 'A nota deve ser um número entre 1 e 5',
      };
    }

    const requestBody = {
      rating: Number(rating),
      comment: comment && comment.trim().length > 0 ? comment.trim() : undefined,
    };

    console.log('[API] 📝 Request body que será enviado:', JSON.stringify(requestBody, null, 2));
    console.log('[API] 📝 URL completa:', `${API_BASE_URL}/passengers/rides/${rideId}/ratings`);

    try {
      const response = await this.request<void>(`/passengers/rides/${rideId}/ratings`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      console.log('[API] 📝 passengerRideRate - Resposta recebida:', {
        success: response.success,
        status: response.status,
        message: response.message,
        error: response.error,
      });

      return response;
    } catch (error: any) {
      console.error('[API] ❌ passengerRideRate - Erro na requisição:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      throw error;
    }
  }

  /**
   * Detalhes de uma corrida específica do motorista
   * GET /v1/drivers/rides/{rideId}
   */
  async getDriverRideDetails(rideId: string): Promise<ApiResponse<any>> {
    return this.request(`/drivers/rides/${rideId}`, {
      method: 'GET',
    });
  }

  /**
   * Motorista cancela uma corrida
   * POST /v1/drivers/rides/{rideId}/cancel
   */
  async driverRideCancel(rideId: string, reason?: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/drivers/rides/${rideId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({
        reason: reason || 'Cancelado pelo motorista',
      }),
    });
  }

  /**
   * Consulta corrida ativa do motorista (para reconexão)
   * GET /v1/drivers/active-ride
   */
  async getDriverActiveRide(): Promise<ApiResponse<any>> {
    return this.request('/drivers/active-ride', {
      method: 'GET',
    });
  }

  /**
   * Lista histórico de corridas do motorista
   * GET /v1/drivers/rides
   * @param params - Parâmetros opcionais: cursor, limit, sort, q, status[eq/in]
   */
  async getDriverRides(params?: {
    cursor?: string;
    limit?: number;
    sort?: string;
    q?: string;
    status?: string | string[];
  }): Promise<ApiResponse<{
    items: any[];
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) {
      if (Array.isArray(params.status)) {
        params.status.forEach(s => queryParams.append('status[in]', s));
      } else {
        queryParams.append('status[eq]', params.status);
      }
    }

    const queryString = queryParams.toString();
    const url = `/drivers/rides${queryString ? `?${queryString}` : ''}`;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  /**
   * Lista histórico de corridas do passageiro
   * GET /v1/passengers/rides
   * @param params - Parâmetros opcionais: cursor, limit, sort, q, status[eq/in]
   */
  async getPassengerRides(params?: {
    cursor?: string;
    limit?: number;
    sort?: string;
    q?: string;
    status?: string | string[];
  }): Promise<ApiResponse<{
    items: any[];
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
  }>> {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.q) queryParams.append('q', params.q);
    if (params?.status) {
      if (Array.isArray(params.status)) {
        params.status.forEach(s => queryParams.append('status[in]', s));
      } else {
        queryParams.append('status[eq]', params.status);
      }
    }

    const queryString = queryParams.toString();
    const url = `/passengers/rides${queryString ? `?${queryString}` : ''}`;
    
    return this.request(url, {
      method: 'GET',
    });
  }

  /**
   * Busca motoristas disponíveis próximos (para visualização no mapa)
   * Nota: Este endpoint pode não existir na API. Se não existir, será necessário
   * implementar uma solução alternativa ou usar WebSocket para receber atualizações.
   */
  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    radius?: number
  ): Promise<ApiResponse<any>> {
    // Tenta endpoint de busca de motoristas próximos
    // Se não existir, retorna array vazio
    return this.request('/drivers/nearby', {
      method: 'GET',
      // Adiciona parâmetros de query se a API suportar
    }).catch(() => {
      // Se o endpoint não existir, retorna sucesso com array vazio
      return {
        success: true,
        data: [],
      };
    });
  }

  /**
   * Busca passageiros com corridas ativas (para visualização no mapa)
   * Nota: Este endpoint pode não existir na API. Se não existir, será necessário
   * implementar uma solução alternativa ou usar WebSocket para receber atualizações.
   */
  async getActivePassengers(
    latitude: number,
    longitude: number,
    radius?: number
  ): Promise<ApiResponse<any>> {
    // Tenta endpoint de busca de passageiros ativos
    // Se não existir, retorna array vazio
    const queryParams = radius ? `?latitude=${latitude}&longitude=${longitude}&radius=${radius}` : '';
    return this.request(`/passengers/active${queryParams}`, {
      method: 'GET',
      // Adiciona parâmetros de query se a API suportar
    }).catch(() => {
      // Se o endpoint não existir, retorna sucesso com array vazio
      return {
        success: true,
        data: [],
      };
    });
  }

  /**
   * Busca corridas disponíveis para o motorista (baseado em raio)
   * Nota: Este endpoint pode não existir na API. Se não existir, será necessário
   * usar WebSocket para receber notificações de corridas disponíveis.
   */
  async getAvailableTrips(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<ApiResponse<any>> {
    // Tenta endpoint de busca de corridas disponíveis
    // Se não existir, retorna array vazio
    return this.request(`/drivers/available-trips?latitude=${latitude}&longitude=${longitude}&radius=${radiusKm}`, {
      method: 'GET',
    }).catch(() => {
      // Se o endpoint não existir, retorna sucesso com array vazio
      // O sistema funcionará via WebSocket (TripAssigned)
      return {
        success: true,
        data: [],
      };
    });
  }

  // ========== FOTOS DE PERFIL ==========

  /**
   * Obtém a URL da foto de perfil de um usuário (rota pública)
   * GET /v1/profile-photos/{userId}
   * Esta rota é pública e pode ser usada para exibir a foto do motorista/passageiro
   * @param userId - ID do usuário (motorista ou passageiro)
   * @returns URL da foto de perfil
   */
  getProfilePhotoUrl(userId: string): string {
    const url = getOrCreateProfilePhotoUrl(userId, () => `${API_BASE_URL}/profile-photos/${userId}`);
    if (__DEV__) {
      console.log('[API] getProfilePhotoUrl (cache-aware):', url);
    }
    return url;
  }

  /**
   * Obtém a foto de perfil de um usuário (rota pública)
   * GET /v1/profile-photos/{userId}
   * @param userId - ID do usuário
   */
  async getProfilePhoto(userId: string): Promise<ApiResponse<{ photoUrl: string }>> {
    try {
      const url = `${API_BASE_URL}/profile-photos/${userId}`;
      
      if (__DEV__) {
        console.log(`[API] GET ${url}`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Se a resposta for uma imagem, retorna a URL diretamente
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        return {
          success: true,
          data: {
            photoUrl: url,
          },
        };
      }

      // Se for JSON, faz parse
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok) {
          return {
            success: false,
            error: data.message || data.error || 'Foto não encontrada',
            status: response.status,
          };
        }

        const normalizedPhotoUrl = this.normalizeFileUrl(data.photoUrl || data.url);
        return {
          success: true,
          data: {
            photoUrl: normalizedPhotoUrl || url,
          },
        };
      }

      // Resposta ok sem tipo específico, assume que é a imagem
      if (response.ok) {
        return {
          success: true,
          data: {
            photoUrl: url,
          },
        };
      }

      return {
        success: false,
        error: 'Foto não encontrada',
        status: response.status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Timeout',
          message: 'A requisição demorou muito para responder.',
        };
      }

      if (__DEV__) {
        console.warn('[API] Erro ao buscar foto de perfil:', errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível carregar a foto de perfil.',
      };
    }
  }

  /**
   * Faz upload da foto de perfil (genérico para motorista ou passageiro)
   * Se já existir uma foto, ela será automaticamente substituída pelo backend
   * @param fileUri - URI do arquivo de imagem
   * @param userType - Tipo de usuário: 'driver' ou 'passenger'
   */
  async uploadProfilePhoto(
    fileUri: string,
    userType: 'driver' | 'passenger'
  ): Promise<ApiResponse<{ message?: string; photoUrl?: string }>> {
    if (userType === 'driver') {
      return this.uploadDriverProfilePhoto(fileUri);
    }
    return this.uploadPassengerProfilePhoto(fileUri);
  }

  /**
   * Remove a foto de perfil (genérico para motorista ou passageiro)
   * @param userType - Tipo de usuário: 'driver' ou 'passenger'
   */
  async deleteProfilePhoto(userType: 'driver' | 'passenger'): Promise<ApiResponse<any>> {
    if (userType === 'driver') {
      return this.deleteDriverProfilePhoto();
    }
    return this.deletePassengerProfilePhoto();
  }

  // ============================================
  // CHAT ENDPOINTS
  // ============================================

  /**
   * Retorna headers de autenticação para requisições manuais
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  /**
   * Lista mensagens do chat de uma corrida
   * GET /v1/chat/messages?rideId={rideId}
   * @param rideId - ID da corrida
   * @param cursor - Cursor para paginação (opcional)
   * @param limit - Limite de mensagens (opcional, padrão 50)
   */
  async getChatMessages(
    rideId: string,
    cursor?: string,
    limit: number = 50
  ): Promise<ApiResponse<ChatMessagesResponse>> {
    try {
      let endpoint = `/chat/messages?rideId=${encodeURIComponent(rideId)}&limit=${limit}`;
      if (cursor) {
        endpoint += `&cursor=${encodeURIComponent(cursor)}`;
      }

      return await this.request<ChatMessagesResponse>(endpoint, { method: 'GET' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[API] Erro ao buscar mensagens do chat:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível carregar as mensagens.',
      };
    }
  }

  /**
   * Envia uma mensagem no chat
   * POST /v1/chat/messages
   * @param rideId - ID da corrida
   * @param content - Conteúdo da mensagem
   */
  async sendChatMessage(
    rideId: string,
    content: string
  ): Promise<ApiResponse<ChatMessageData>> {
    try {
      const response = await this.request<ChatMessageData>('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ rideId, content }),
      });
      
      if (!response.success) {
        console.error('[API] Falha ao enviar mensagem de chat:', {
          rideId,
          error: response.error,
          message: response.message,
          status: response.status
        });
      }
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[API] Erro ao enviar mensagem:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível enviar a mensagem.',
      };
    }
  }

  /**
   * Marca mensagens como lidas
   * POST /v1/chat/messages/read
   * @param rideId - ID da corrida
   * @param messageIds - Array de IDs das mensagens a marcar como lidas
   */
  async markChatMessagesAsRead(
    rideId: string,
    messageIds: string[]
  ): Promise<ApiResponse<void>> {
    try {
      // Validação rigorosa
      if (!rideId || rideId.trim() === '') {
        const errorMsg = 'rideId é obrigatório para marcar mensagens como lidas';
        console.error('[API] ❌', errorMsg, { rideId, rideIdType: typeof rideId });
        return {
          success: false,
          error: errorMsg,
          message: 'ID da corrida é obrigatório.',
        };
      }

      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        const errorMsg = 'messageIds é obrigatório e deve ser um array não vazio';
        console.error('[API] ❌', errorMsg, { messageIds });
        return {
          success: false,
          error: errorMsg,
          message: 'IDs das mensagens são obrigatórios.',
        };
      }

      const trimmedRideId = rideId.trim();
      const requestBody = { rideId: trimmedRideId, messageIds };

      console.log('[API] 📖 Marcando mensagens como lidas via REST:', {
        rideId: trimmedRideId,
        messageCount: messageIds.length,
        body: requestBody,
      });

      return await this.request<void>('/chat/messages/read', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[API] Erro ao marcar mensagens como lidas:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível marcar as mensagens como lidas.',
      };
    }
  }

  /**
   * Obtém o status online de um usuário
   * GET /v1/chat/users/{userId}/online-status
   * @param userId - ID do usuário
   */
  async getUserOnlineStatus(
    userId: string
  ): Promise<ApiResponse<UserOnlineStatus>> {
    try {
      return await this.request<UserOnlineStatus>(
        `/chat/users/${encodeURIComponent(userId)}/online-status`,
        { method: 'GET' }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[API] Erro ao buscar status online:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível verificar o status online.',
      };
    }
  }

  /**
   * Obtém o contador de mensagens não lidas
   * GET /v1/chat/messages/unread?rideId={rideId}
   * @param rideId - ID da corrida (opcional, se não informado retorna total geral)
   */
  async getUnreadMessagesCount(
    rideId?: string
  ): Promise<ApiResponse<UnreadCountResponse>> {
    try {
      let endpoint = '/chat/messages/unread';
      if (rideId) {
        endpoint += `?rideId=${encodeURIComponent(rideId)}`;
      }

      return await this.request<UnreadCountResponse>(endpoint, { method: 'GET' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[API] Erro ao buscar contador de não lidas:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível verificar mensagens não lidas.',
      };
    }
  }

  /**
   * Long polling para novas mensagens (fallback quando WebSocket não disponível)
   * GET /v1/chat/messages/poll?rideId={rideId}&timeout={timeout}&cursor={cursor}
   * @param rideId - ID da corrida
   * @param timeout - Timeout em segundos (padrão 30)
   * @param cursor - ID da última mensagem recebida (para paginação)
   */
  async pollChatMessages(
    rideId: string,
    timeout: number = 30,
    cursor?: string
  ): Promise<ApiResponse<ChatPollResponse>> {
    try {
      let url = `${API_BASE_URL}/chat/messages/poll?rideId=${encodeURIComponent(rideId)}&timeout=${timeout}`;
      if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }

      if (__DEV__) {
        console.log(`[API] GET ${url} (long polling)`);
      }

      // Long polling precisa de timeout maior
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), (timeout + 5) * 1000);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Erro ao buscar novas mensagens',
          status: response.status,
        };
      }

      return {
        success: true,
        data: data as ChatPollResponse,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Timeout não é erro, apenas significa que não há novas mensagens
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: true,
          data: {
            items: [],
            hasMore: false,
          },
        };
      }

      console.error('[API] Erro no long polling:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Erro na conexão com o servidor.',
      };
    }
  }

  // ========== BILLING API - Motorista ==========

  /**
   * Obtém o status de cobrança do motorista autenticado
   * GET /api/v1/driver/billing/status
   */
  async getDriverBillingStatus(): Promise<ApiResponse<DriverBillingStatusResponse>> {
    try {
      return await this.request<DriverBillingStatusResponse>('/api/v1/driver/billing/status', { method: 'GET' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[API] Erro ao buscar status de cobrança:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível carregar o status de cobrança.',
      };
    }
  }

  /**
   * Lista ciclos de cobrança do motorista autenticado
   * GET /api/v1/driver/billing/cycles?status={status}&cursor={cursor}&limit={limit}
   */
  async getDriverBillingCycles(params?: {
    status?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ApiResponse<DriverBillingCyclesResponse>> {
    try {
      let endpoint = '/api/v1/driver/billing/cycles';
      const queryParams: string[] = [];
      
      if (params?.status) {
        queryParams.push(`status=${encodeURIComponent(params.status)}`);
      }
      if (params?.cursor) {
        queryParams.push(`cursor=${encodeURIComponent(params.cursor)}`);
      }
      if (params?.limit) {
        queryParams.push(`limit=${params.limit}`);
      }
      
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }

      return await this.request<DriverBillingCyclesResponse>(endpoint, { method: 'GET' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[API] Erro ao buscar ciclos de cobrança:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível carregar os ciclos de cobrança.',
      };
    }
  }

  /**
   * Obtém detalhes de um ciclo específico
   * GET /api/v1/driver/billing/cycles/{cycleId}
   */
  async getDriverBillingCycle(cycleId: string): Promise<ApiResponse<BillingCycleResponse>> {
    try {
      return await this.request<BillingCycleResponse>(`/api/v1/driver/billing/cycles/${cycleId}`, { method: 'GET' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[API] Erro ao buscar ciclo de cobrança:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível carregar o ciclo de cobrança.',
      };
    }
  }

  /**
   * Gera QR Code PIX para pagamento de um ciclo específico
   * POST /api/v1/driver/billing/cycles/{cycleId}/pix
   * @param cycleId - ID do ciclo de cobrança
   * @param idempotencyKey - Chave de idempotência (opcional, será gerada se não fornecida)
   */
  async generateCyclePix(
    cycleId: string,
    idempotencyKey?: string
  ): Promise<ApiResponse<PixQrCodeResponse>> {
    try {
      // Gera chave de idempotência se não fornecida
      const key = idempotencyKey || `cycle-${cycleId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const headers: Record<string, string> = {
        'X-Idempotency-Key': key,
      };

      if (__DEV__) {
        console.log('[API] Gerando PIX para ciclo:', cycleId, '| Idempotency Key:', key);
      }

      return await this.request<PixQrCodeResponse>(
        `/api/v1/driver/billing/cycles/${cycleId}/pix`,
        {
          method: 'POST',
          headers,
          // Não envia body - algumas APIs não aceitam body vazio em POST
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[API] Erro ao gerar PIX do ciclo:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível gerar o QR Code PIX.',
      };
    }
  }

  /**
   * Gera QR Code PIX para quitar todo o débito pendente
   * POST /api/v1/driver/billing/debt/pix
   * @param idempotencyKey - Chave de idempotência (opcional, será gerada se não fornecida)
   */
  async generateDebtPix(idempotencyKey?: string): Promise<ApiResponse<PixQrCodeResponse>> {
    try {
      // Gera chave de idempotência se não fornecida
      const key = idempotencyKey || `debt-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const headers: Record<string, string> = {
        'X-Idempotency-Key': key,
      };

      if (__DEV__) {
        console.log('[API] Gerando PIX para débito total | Idempotency Key:', key);
      }

      return await this.request<PixQrCodeResponse>(
        '/api/v1/driver/billing/debt/pix',
        {
          method: 'POST',
          headers,
          // Não envia body - algumas APIs não aceitam body vazio em POST
        }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[API] Erro ao gerar PIX do débito:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível gerar o QR Code PIX.',
      };
    }
  }

  /**
   * Verifica se o motorista está bloqueado
   * GET /api/v1/driver/billing/blocked
   */
  async checkDriverBlocked(): Promise<ApiResponse<DriverBlockedResponse>> {
    try {
      return await this.request<DriverBlockedResponse>('/api/v1/driver/billing/blocked', { method: 'GET' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('[API] Erro ao verificar bloqueio:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        message: 'Não foi possível verificar o status de bloqueio.',
      };
    }
  }
}

// Tipos para Chat API
export interface ChatMessageData {
  id: string;
  rideId: string;
  senderId: string;
  recipientId: string;
  content: string;
  deliveryStatus: 'SENDING' | 'DELIVERED' | 'READ' | 'FAILED';
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface ChatMessagesResponse {
  items: ChatMessageData[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ChatPollResponse {
  items: ChatMessageData[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface UserOnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface UnreadCountResponse {
  rideId?: string;
  unreadCount: number;
}

// ========== Billing API Types ==========

export type BillingCycleStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'GRACE_PERIOD'
  | 'BLOCKED'
  | 'CANCELLED';

export interface BillingCycleResponse {
  id: string;
  driverId: string;
  driverName: string;
  periodStart: string;
  periodEnd: string;
  rideCount: number;
  pricePerRide: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: BillingCycleStatus;
  pixGeneratedAt: string | null;
  pixExpiresAt: string | null;
  gracePeriodEndsAt: string | null;
  paidAt: string | null;
  blockedAt: string | null;
  createdAt: string;
}

export interface PixQrCodeResponse {
  billingCycleId: string;
  paymentId: string;
  amount: number;
  qrCode: string; // Texto copia e cola
  qrCodeBase64: string; // Imagem base64
  copyPaste: string;
  expiresAt: string; // Vencimento ISO 8601
  externalReference: string;
  generatedAt: string;
}

export interface DriverBillingStatusResponse {
  driverId: string;
  driverName: string;
  totalPending: number;
  totalPendingRides: number;
  currentCycle: BillingCycleResponse | null;
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
}

// A API pode retornar um array direto ou um objeto com items (paginação)
export type DriverBillingCyclesResponse = 
  | BillingCycleResponse[] // Array direto
  | {
      items: BillingCycleResponse[];
      nextCursor?: string;
      hasMore: boolean;
    };

export interface DriverBlockedResponse {
  blocked: boolean;
  reason?: string;
  blockedAt?: string;
  totalPending?: number;
  totalPendingRides?: number;
}

export { ApiService };
export const apiService = new ApiService();

