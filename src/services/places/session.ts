let currentSessionToken: string | null = null;

function generateSessionToken(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getSessionToken(): string {
  if (!currentSessionToken) {
    currentSessionToken = generateSessionToken();
  }
  return currentSessionToken;
}

export function getCurrentSessionToken(): string | null {
  return currentSessionToken;
}

export function resetSessionToken(): void {
  currentSessionToken = null;
}
