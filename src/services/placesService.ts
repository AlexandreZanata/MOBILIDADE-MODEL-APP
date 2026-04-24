/**
 * Serviço para integração com Places & Geocoding API
 * Todas as operações de busca de lugares e geocoding são feitas através da API backend
 * 
 * Configurações conforme documentação oficial:
 * - Base URL: /v1/places/*
 * - Autenticação: Bearer Token JWT
 * - Rate Limiting: 30 req/min (dev), 20 req/min (prod)
 * - Cache em duas camadas: Redis (1-24h) + PostgreSQL (90-180 dias)
 * - Quota diária: $5.00 (protege free tier de $200/mês do Google)
 * 
 * Funcionalidades:
 * - Autocomplete com strictBounds (restringe à cidade, raio padrão 30km)
 * - Place Details (com session token para reduzir custo)
 * - Geocoding (endereço → coordenadas)
 * - Reverse Geocoding (coordenadas → endereço)
 * - Session Token (agrupa requisições para reduzir custo)
 * 
 * IMPORTANTE: Sempre chamar resetSessionToken() após o usuário selecionar um lugar
 */

import { apiService, API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============== CACHE DE REVERSE GEOCODING ==============
// Cache em memória para evitar requisições duplicadas e erros 429
interface GeocodeCache {
  address: string;
  timestamp: number;
}

// Cache em memória (mais rápido que AsyncStorage)
const reverseGeocodeMemoryCache: Map<string, GeocodeCache> = new Map();

// Tempo de expiração do cache: 24 horas (em ms)
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

// Chave para cache no AsyncStorage (persistente)
const REVERSE_GEOCODE_CACHE_KEY = '@vamu:reverse_geocode_cache';

// Gera uma chave única para coordenadas (arredondadas para 4 casas decimais)
function getCoordinatesCacheKey(lat: number, lng: number): string {
  // Arredonda para 4 casas decimais (~11 metros de precisão)
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  return `${roundedLat},${roundedLng}`;
}

// Carrega o cache do AsyncStorage para memória
async function loadCacheFromStorage(): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(REVERSE_GEOCODE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as Record<string, GeocodeCache>;
      const now = Date.now();
      
      // Carrega apenas itens não expirados
      Object.entries(parsed).forEach(([key, value]) => {
        if (now - value.timestamp < CACHE_EXPIRATION_MS) {
          reverseGeocodeMemoryCache.set(key, value);
        }
      });
      
      console.log(`[Places] Cache carregado do storage: ${reverseGeocodeMemoryCache.size} itens`);
    }
  } catch (error) {
    console.error('[Places] Erro ao carregar cache do storage:', error);
  }
}

// Salva o cache no AsyncStorage (debounced)
let saveCacheTimeout: ReturnType<typeof setTimeout> | null = null;

async function saveCacheToStorage(): Promise<void> {
  // Debounce: espera 2 segundos antes de salvar para evitar múltiplas escritas
  if (saveCacheTimeout) {
    clearTimeout(saveCacheTimeout);
  }
  
  saveCacheTimeout = setTimeout(async () => {
    try {
      const cacheObject: Record<string, GeocodeCache> = {};
      reverseGeocodeMemoryCache.forEach((value, key) => {
        cacheObject[key] = value;
      });
      
      await AsyncStorage.setItem(REVERSE_GEOCODE_CACHE_KEY, JSON.stringify(cacheObject));
      console.log(`[Places] Cache salvo no storage: ${reverseGeocodeMemoryCache.size} itens`);
    } catch (error) {
      console.error('[Places] Erro ao salvar cache no storage:', error);
    }
  }, 2000);
}

// Inicializa o cache ao carregar o módulo
loadCacheFromStorage();

// ============== FIM CACHE ==============

// Tipos de resposta da API
export interface PlaceAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
  matchedSubstrings?: Array<{
    offset: number;
    length: number;
  }>;
}

export interface PlaceAutocompleteResponse {
  predictions: PlaceAutocompleteResult[];
  cached: boolean;
  source: string;
  queriedAt: string;
}

export interface LocationBias {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
}

export interface GeocodingResult {
  placeId: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  locationType?: string;
  confidence?: string;
}

export interface GeocodingResponse {
  results: GeocodingResult[];
  cached: boolean;
  source: string;
  queriedAt: string;
}

export interface PlaceDetailsResponse {
  placeId: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  addressComponents?: Array<{
    longName: string;
    shortName: string;
    types: string[];
  }>;
  types: string[];
  cached: boolean;
  source: string;
  queriedAt: string;
}

// Tipos compatíveis com o código existente
export interface PlacesSearchResult {
  place_id: string | number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  formatted_address?: string;
}

export interface PlacesReverseResult {
  place_id: string;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  formatted_address?: string;
}

// Gera um session token único para agrupar requisições de autocomplete
let currentSessionToken: string | null = null;

/**
 * Gera um novo session token
 */
function generateSessionToken(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtém ou cria um session token para a sessão atual
 */
function getSessionToken(): string {
  if (!currentSessionToken) {
    currentSessionToken = generateSessionToken();
  }
  return currentSessionToken;
}

/**
 * Reseta o session token (chamar quando o usuário selecionar um lugar)
 */
export function resetSessionToken(): void {
  currentSessionToken = null;
}

/**
 * Autocomplete de lugares
 * Retorna sugestões de lugares com base no texto digitado
 * 
 * @param input - Texto de busca (mínimo 2 caracteres)
 * @param location - Localização atual do usuário (opcional, para bias/restrição)
 * @param radius - Raio em metros (default: 30000 = 30km para limitar à cidade)
 * @param strictBounds - Se true, RESTRINGE resultados ao raio (default: true)
 * @param country - Código do país (default: 'br')
 * @param language - Idioma (default: 'pt-BR')
 */
export const autocompletePlaces = async (
  input: string,
  location?: LocationBias,
  radius: number = 30000,
  strictBounds: boolean = true,
  country: string = 'br',
  language: string = 'pt-BR'
): Promise<PlacesSearchResult[]> => {
  try {
    if (!input || input.trim().length < 2) {
      return [];
    }

    const sessionToken = getSessionToken();

    const requestBody: any = {
      input: input.trim(),
      radius,
      strictBounds,
      country,
      language,
      sessionToken,
    };

    // Adiciona localização conforme documentação
    if (location) {
      requestBody.location = {
        lat: location.lat,
        lng: location.lng,
      };
      
      if (location.city) {
        requestBody.location.city = location.city;
      }
      
      if (location.state) {
        requestBody.location.state = location.state;
      }
    }

    const response = await apiService.request<PlaceAutocompleteResponse>(
      '/places/autocomplete',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.success || !response.data) {
      console.error('[Places] Erro no autocomplete:', response.error);
      return [];
    }

    // Converte a resposta da API para o formato esperado pelo código existente
    return response.data.predictions.map((prediction) => ({
      place_id: prediction.placeId,
      name: prediction.mainText,
      display_name: prediction.description,
      lat: '', // Será preenchido quando buscar detalhes
      lon: '', // Será preenchido quando buscar detalhes
      type: prediction.types?.[0] || 'place',
    }));
  } catch (error) {
    console.error('[Places] Erro ao buscar autocomplete:', error);
    return [];
  }
};

/**
 * Geocoding (endereço → coordenadas)
 * Converte um endereço em coordenadas geográficas
 * 
 * @param address - Endereço a ser geocodificado
 * @param country - Código do país (default: 'br')
 * @param language - Idioma (default: 'pt-BR')
 */
export const geocode = async (
  address: string,
  country: string = 'br',
  language: string = 'pt-BR'
): Promise<PlacesSearchResult[]> => {
  try {
    if (!address || address.trim().length === 0) {
      return [];
    }

    const requestBody = {
      address: address.trim(),
      country,
      language,
    };

    const response = await apiService.request<GeocodingResponse>(
      '/places/geocode',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.success || !response.data) {
      console.error('[Places] Erro no geocoding:', response.error);
      return [];
    }

    // Converte a resposta da API para o formato esperado pelo código existente
    return response.data.results.map((result) => ({
      place_id: result.placeId,
      name: result.formattedAddress.split(',')[0] || result.formattedAddress,
      display_name: result.formattedAddress,
      lat: result.lat.toString(),
      lon: result.lng.toString(),
      type: result.locationType || 'geocode',
      formatted_address: result.formattedAddress,
    }));
  } catch (error) {
    console.error('[Places] Erro ao fazer geocoding:', error);
    return [];
  }
};

/**
 * Reverse Geocoding (coordenadas → endereço) COM CACHE
 * Converte coordenadas geográficas em endereço
 * Usa cache em memória e AsyncStorage para evitar requisições duplicadas e erros 429
 * 
 * @param lat - Latitude
 * @param lon - Longitude
 * @param language - Idioma (default: 'pt-BR')
 */
export const reverseGeocode = async (
  lat: number,
  lon: number,
  language: string = 'pt-BR'
): Promise<PlacesReverseResult | null> => {
  try {
    const cacheKey = getCoordinatesCacheKey(lat, lon);
    
    // 1. Verifica cache em memória primeiro (mais rápido)
    const cachedResult = reverseGeocodeMemoryCache.get(cacheKey);
    if (cachedResult) {
      const now = Date.now();
      if (now - cachedResult.timestamp < CACHE_EXPIRATION_MS) {
        console.log('[Places] Reverse geocoding do cache:', cacheKey);
        return {
          place_id: cacheKey,
          name: cachedResult.address.split(',')[0]?.trim() || 'Localização',
          display_name: cachedResult.address,
          lat: lat.toString(),
          lon: lon.toString(),
          type: 'geocode',
          formatted_address: cachedResult.address,
        };
      } else {
        // Cache expirado, remove
        reverseGeocodeMemoryCache.delete(cacheKey);
      }
    }
    
    // 2. Faz a requisição à API
    const requestBody = {
      lat,
      lng: lon,
      language,
    };

    const response = await apiService.request<GeocodingResponse>(
      '/places/reverse-geocode',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.success || !response.data || !response.data.results || response.data.results.length === 0) {
      console.error('[Places] Erro no reverse geocoding:', response.error);
      return null;
    }

    const result = response.data.results[0];

    // 3. Salva no cache
    reverseGeocodeMemoryCache.set(cacheKey, {
      address: result.formattedAddress,
      timestamp: Date.now(),
    });
    
    // Salva no storage de forma assíncrona (não bloqueia)
    saveCacheToStorage();

    // Extrai o nome do endereço (primeira parte antes da vírgula)
    const name = result.formattedAddress.split(',')[0] || 'Minha Localização';

    return {
      place_id: result.placeId,
      name: name.trim(),
      display_name: result.formattedAddress,
      lat: result.lat.toString(),
      lon: result.lng.toString(),
      type: result.locationType || 'geocode',
      formatted_address: result.formattedAddress,
    };
  } catch (error) {
    console.error('[Places] Erro ao fazer reverse geocoding:', error);
    return null;
  }
};

/**
 * Obtém endereço do cache sem fazer requisição
 * Útil para verificar se já existe cache antes de fazer requisição
 */
export const getCachedAddress = (lat: number, lon: number): string | null => {
  const cacheKey = getCoordinatesCacheKey(lat, lon);
  const cachedResult = reverseGeocodeMemoryCache.get(cacheKey);
  
  if (cachedResult) {
    const now = Date.now();
    if (now - cachedResult.timestamp < CACHE_EXPIRATION_MS) {
      return cachedResult.address;
    }
    // Cache expirado
    reverseGeocodeMemoryCache.delete(cacheKey);
  }
  
  return null;
};

/**
 * Limpa o cache de reverse geocoding
 */
export const clearReverseGeocodeCache = async (): Promise<void> => {
  reverseGeocodeMemoryCache.clear();
  await AsyncStorage.removeItem(REVERSE_GEOCODE_CACHE_KEY);
  console.log('[Places] Cache de reverse geocoding limpo');
};

/**
 * Detalhes de lugar
 * Retorna detalhes completos de um lugar pelo place_id
 * 
 * @param placeId - ID do lugar
 * @param language - Idioma (default: 'pt-BR')
 * @param sessionToken - Session token da busca anterior (opcional, para reduzir custo)
 */
export const getPlaceDetails = async (
  placeId: string,
  language: string = 'pt-BR',
  sessionToken?: string
): Promise<PlaceDetailsResponse | null> => {
  try {
    if (!placeId) {
      return null;
    }

    const requestBody: any = {
      placeId,
      language,
    };

    // Usa session token se fornecido ou usa o atual (reduz custo quando usado na mesma sessão)
    if (sessionToken) {
      requestBody.sessionToken = sessionToken;
    } else if (currentSessionToken) {
      requestBody.sessionToken = currentSessionToken;
    }

    const response = await apiService.request<PlaceDetailsResponse>(
      '/places/details',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.success || !response.data) {
      console.error('[Places] Erro ao buscar detalhes:', response.error);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('[Places] Erro ao buscar detalhes do lugar:', error);
    return null;
  }
};

/**
 * Busca lugares usando autocomplete
 * Função de conveniência que usa autocompletePlaces internamente
 * 
 * @param query - Texto de busca
 * @param location - Localização atual do usuário (opcional)
 * @param radius - Raio em metros (default: 30000 = 30km)
 * @param strictBounds - Se true, restringe ao raio (default: true)
 */
export const searchPlaces = async (
  query: string,
  location?: LocationBias,
  radius: number = 30000,
  strictBounds: boolean = true
): Promise<PlacesSearchResult[]> => {
  // Usa autocomplete com configurações recomendadas pela documentação
  return autocompletePlaces(query, location, radius, strictBounds, 'br', 'pt-BR');
};

/**
 * Consulta estatísticas de quota
 * GET /v1/places/quota
 */
export const getQuotaStats = async (): Promise<any | null> => {
  try {
    const response = await apiService.request<any>('/places/quota', {
      method: 'GET',
    });

    if (!response.success || !response.data) {
      console.error('[Places] Erro ao buscar quota:', response.error);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('[Places] Erro ao buscar quota:', error);
    return null;
  }
};

/**
 * Consulta rate limit
 * GET /v1/places/rate-limit
 */
export const getRateLimit = async (): Promise<any | null> => {
  try {
    const response = await apiService.request<any>('/places/rate-limit', {
      method: 'GET',
    });

    if (!response.success || !response.data) {
      console.error('[Places] Erro ao buscar rate limit:', response.error);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error('[Places] Erro ao buscar rate limit:', error);
    return null;
  }
};

