import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@vamu:profile_photo_cache_v1';

const memoryCache = new Map<string, string>();
let isLoaded = false;
let loadPromise: Promise<void> | null = null;
let persistTimeout: ReturnType<typeof setTimeout> | null = null;

async function loadCache(): Promise<void> {
  if (isLoaded) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>;
      Object.entries(parsed).forEach(([key, value]) => {
        if (typeof key === 'string' && typeof value === 'string') {
          memoryCache.set(key, value);
        }
      });
    }
  } catch (err) {
    console.warn('[ProfilePhotoCache] Erro ao carregar cache de fotos:', err);
  } finally {
    isLoaded = true;
  }
}

function schedulePersist() {
  if (persistTimeout) clearTimeout(persistTimeout);
  persistTimeout = setTimeout(async () => {
    try {
      const serialized = JSON.stringify(Object.fromEntries(memoryCache));
      await AsyncStorage.setItem(STORAGE_KEY, serialized);
    } catch (err) {
      console.warn('[ProfilePhotoCache] Erro ao persistir cache de fotos:', err);
    }
  }, 500);
}

/**
 * Retorna a URL cacheada ou cria via builder, persistindo em memória e AsyncStorage.
 * Mantém API síncrona para não alterar a lógica dos consumidores.
 */
export function getOrCreateProfilePhotoUrl(userId: string, builder: () => string): string {
  if (!userId) return builder();

  // Inicializa carregamento assíncrono do cache (fire-and-forget)
  if (!isLoaded && !loadPromise) {
    loadPromise = loadCache();
  }

  const cached = memoryCache.get(userId);
  if (cached) return cached;

  const url = builder();
  memoryCache.set(userId, url);
  schedulePersist();
  return url;
}

/**
 * Opcional: permite pré-carregar o cache em fluxos de inicialização.
 */
export async function warmProfilePhotoCache(): Promise<void> {
  if (isLoaded) return;
  if (!loadPromise) {
    loadPromise = loadCache();
  }
  await loadPromise;
}


