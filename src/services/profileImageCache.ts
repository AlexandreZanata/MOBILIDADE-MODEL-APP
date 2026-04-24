import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

const STORAGE_KEY = '@vamu:profile_image_cache_v1';
const CACHE_DIR = `${FileSystem.cacheDirectory}profile-photos/`;

// Cache em memória: userId -> { localUri, timestamp, apiUrl }
const memoryCache = new Map<string, { localUri: string; timestamp: number; apiUrl: string }>();
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

// Cache válido por 7 dias
const CACHE_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Garante que o diretório de cache existe
 */
async function ensureCacheDir(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.warn('[ProfileImageCache] Erro ao criar diretório de cache:', error);
  }
}

/**
 * Carrega o cache do AsyncStorage
 */
async function loadCache(): Promise<void> {
  if (isLoaded) return;
  
  try {
    await ensureCacheDir();
    
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, { localUri: string; timestamp: number; apiUrl: string }>;
      
      // Verifica quais arquivos ainda existem e são válidos
      const now = Date.now();
      for (const [userId, cacheData] of Object.entries(parsed)) {
        if (now - cacheData.timestamp < CACHE_VALIDITY_MS) {
          // Verifica se o arquivo ainda existe
          const fileInfo = await FileSystem.getInfoAsync(cacheData.localUri);
          if (fileInfo.exists) {
            memoryCache.set(userId, cacheData);
          }
        }
      }
      
      // Limpa entradas inválidas do AsyncStorage
      if (Object.keys(parsed).length !== memoryCache.size) {
        await saveCache();
      }
    }
  } catch (err) {
    console.warn('[ProfileImageCache] Erro ao carregar cache:', err);
  } finally {
    isLoaded = true;
  }
}

/**
 * Salva o cache no AsyncStorage
 */
async function saveCache(): Promise<void> {
  try {
    const serialized = JSON.stringify(Object.fromEntries(memoryCache));
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.warn('[ProfileImageCache] Erro ao salvar cache:', err);
  }
}

/**
 * Baixa a imagem da API e salva localmente
 */
async function downloadAndCacheImage(userId: string, apiUrl: string): Promise<string | null> {
  try {
    await ensureCacheDir();
    
    const localUri = `${CACHE_DIR}${userId}.jpg`;
    
    // Baixa a imagem da API
    const downloadResult = await FileSystem.downloadAsync(apiUrl, localUri);
    
    if (downloadResult.status === 200 && downloadResult.uri) {
      // Salva no cache em memória
      memoryCache.set(userId, {
        localUri: downloadResult.uri,
        timestamp: Date.now(),
        apiUrl,
      });
      
      // Salva no AsyncStorage (assíncrono, não bloqueia)
      saveCache().catch(() => {});
      
      if (__DEV__) {
        console.log('[ProfileImageCache] Imagem baixada e cacheada:', userId);
      }
      
      return downloadResult.uri;
    }
    
    return null;
  } catch (error) {
    console.warn('[ProfileImageCache] Erro ao baixar imagem:', error);
    return null;
  }
}

/**
 * Obtém a URL da imagem (local se disponível, senão da API)
 * Se não estiver em cache, baixa em background e retorna a URL da API
 */
export async function getProfileImageUrl(userId: string, apiUrl: string): Promise<string> {
  if (!userId) return apiUrl;
  
  // Inicializa carregamento do cache se necessário
  if (!isLoaded && !loadPromise) {
    loadPromise = loadCache();
  }
  
  // Aguarda o cache carregar
  if (loadPromise) {
    await loadPromise;
  }
  
  // Verifica se temos cache válido
  const cached = memoryCache.get(userId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp < CACHE_VALIDITY_MS)) {
    // Verifica se o arquivo ainda existe
    try {
      const fileInfo = await FileSystem.getInfoAsync(cached.localUri);
      if (fileInfo.exists) {
        // Se a URL da API mudou (cache buster), atualiza em background
        if (cached.apiUrl !== apiUrl) {
          downloadAndCacheImage(userId, apiUrl).catch(() => {});
        }
        
        if (__DEV__) {
          console.log('[ProfileImageCache] Usando cache local:', userId);
        }
        
        return cached.localUri;
      } else {
        // Arquivo não existe mais, remove do cache
        memoryCache.delete(userId);
        saveCache().catch(() => {});
      }
    } catch (error) {
      // Erro ao verificar arquivo, remove do cache
      memoryCache.delete(userId);
      saveCache().catch(() => {});
    }
  }
  
  // Não tem cache válido, baixa em background e retorna URL da API
  // Isso permite que a imagem seja exibida imediatamente enquanto baixa em background
  downloadAndCacheImage(userId, apiUrl).catch(() => {});
  
  if (__DEV__) {
    console.log('[ProfileImageCache] Baixando em background, usando URL da API:', userId);
  }
  
  return apiUrl;
}

/**
 * Limpa o cache de um usuário específico
 */
export async function clearProfileImageCache(userId: string): Promise<void> {
  try {
    const cached = memoryCache.get(userId);
    if (cached) {
      // Remove o arquivo
      try {
        const fileInfo = await FileSystem.getInfoAsync(cached.localUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(cached.localUri, { idempotent: true });
        }
      } catch (error) {
        console.warn('[ProfileImageCache] Erro ao deletar arquivo:', error);
      }
      
      // Remove do cache em memória
      memoryCache.delete(userId);
      await saveCache();
    }
  } catch (error) {
    console.warn('[ProfileImageCache] Erro ao limpar cache:', error);
  }
}

/**
 * Limpa todo o cache de imagens
 */
export async function clearAllProfileImageCache(): Promise<void> {
  try {
    // Remove todos os arquivos
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    }
    
    // Limpa cache em memória
    memoryCache.clear();
    await AsyncStorage.removeItem(STORAGE_KEY);
    
    // Recria o diretório
    await ensureCacheDir();
  } catch (error) {
    console.warn('[ProfileImageCache] Erro ao limpar todo o cache:', error);
  }
}

/**
 * Pré-carrega o cache
 */
export async function warmProfileImageCache(): Promise<void> {
  if (isLoaded) return;
  if (!loadPromise) {
    loadPromise = loadCache();
  }
  await loadPromise;
}

