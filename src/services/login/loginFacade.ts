import { ZodError } from 'zod';
import { LoginResult } from '@/context/AuthContext';
import { parseLoginCredentials } from '@/models/login/schemas';
import { LoginFormData, LoginValidationErrors } from '@/models/login/types';

export type LoginAttemptOutcome =
  | { kind: 'success' }
  | { kind: 'emailVerification'; email: string; userType: 'passenger' | 'driver' }
  | { kind: 'credentialError'; message: string }
  | { kind: 'errorAlert'; message: string };

class LoginFacade {
  validateCredentials(formData: LoginFormData): LoginValidationErrors {
    try {
      parseLoginCredentials(formData);
      return {};
    } catch (error) {
      if (!(error instanceof ZodError)) {
        return {};
      }

      const errors: LoginValidationErrors = {};
      error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === 'email' && typeof issue.message === 'string') {
          errors.email = issue.message;
        }
        if (field === 'password' && typeof issue.message === 'string') {
          errors.password = issue.message;
        }
      });
      return errors;
    }
  }

  async login(
    formData: LoginFormData,
    authLogin: (email: string, password: string) => Promise<LoginResult>
  ): Promise<LoginAttemptOutcome> {
    const result = await authLogin(formData.email.trim(), formData.password);
    return this.resolveLoginResult(result);
  }

  private resolveLoginResult(result: LoginResult): LoginAttemptOutcome {
    if (result.requiresEmailVerification && result.email && result.userType) {
      return {
        kind: 'emailVerification',
        email: result.email,
        userType: result.userType,
      };
    }

    if (result.success) {
      return { kind: 'success' };
    }

    const message = result.error ?? '';
    if (this.isCredentialError(message)) {
      return { kind: 'credentialError', message };
    }

    return { kind: 'errorAlert', message };
  }

  private isCredentialError(message: string): boolean {
    const normalized = message.toLowerCase();
    return (
      normalized.includes('credencial') ||
      normalized.includes('inválid') ||
      normalized.includes('invalid') ||
      normalized.includes('401')
    );
  }
}

export const loginFacade = new LoginFacade();
