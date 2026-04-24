/**
 * @file useAuth.ts
 * @description Hook that exposes the AuthContext to components.
 * Components must never import AuthContext directly — always use this hook.
 */

import { useContext } from 'react';
import { AuthContext, AuthContextValue } from '@/context/AuthContext';

/**
 * Returns the current authentication context.
 * Must be used inside an `<AuthProvider>`.
 *
 * @throws If called outside of `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return ctx;
}
