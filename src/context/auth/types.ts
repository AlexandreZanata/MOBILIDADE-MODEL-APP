import { User } from '@/models/User';

export interface LoginResult {
  success: boolean;
  error?: string;
  requiresEmailVerification?: boolean;
  email?: string;
  userType?: 'passenger' | 'driver';
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login(email: string, password: string): Promise<LoginResult>;
  logout(): Promise<void>;
  refreshAuth(): Promise<void>;
  refreshUserData(force?: boolean): Promise<void>;
}
