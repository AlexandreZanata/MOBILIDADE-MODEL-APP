import React, { createContext, ReactNode, useContext } from 'react';

import { useAuthProviderValue } from '@/context/auth/useAuthProvider';
import { AuthContextValue } from '@/context/auth/types';
export type { AuthContextValue, LoginResult } from '@/context/auth/types';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthProviderValue();
  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

/**
 * Backward-compatible hook export used across legacy screens/contexts.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
