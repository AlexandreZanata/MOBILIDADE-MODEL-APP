const memoryCache = new Map<string, string>();
let isLoaded = false;
let loadPromise: Promise<void> | null = null;
let persistTimeout: ReturnType<typeof setTimeout> | null = null;

export function getMemoryCache(): Map<string, string> {
  return memoryCache;
}

export function getIsLoaded(): boolean {
  return isLoaded;
}

export function setIsLoaded(value: boolean): void {
  isLoaded = value;
}

export function getLoadPromise(): Promise<void> | null {
  return loadPromise;
}

export function setLoadPromise(promise: Promise<void> | null): void {
  loadPromise = promise;
}

export function getPersistTimeout(): ReturnType<typeof setTimeout> | null {
  return persistTimeout;
}

export function setPersistTimeout(timeout: ReturnType<typeof setTimeout> | null): void {
  persistTimeout = timeout;
}
