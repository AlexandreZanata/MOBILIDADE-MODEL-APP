import { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { tl } from '@/i18n/login';
import { LoginFormData, LoginValidationErrors } from '@/models/login/types';
import { loginFacade } from '@/services/login/loginFacade';

const { height } = Dimensions.get('window');

function toRgba(hex: string, alpha: number): string {
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function useLoginScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gradientColors = useMemo(
    () => [toRgba(colors.primary, 0.06), toRgba(colors.primary, 0.02), 'transparent'] as const,
    [colors.primary]
  );

  const backgroundGradientHeight = useMemo(() => height * 0.35, []);

  const clearFieldError = useCallback((field: keyof LoginValidationErrors) => {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }, []);

  const onChangeEmail = useCallback(
    (value: string) => {
      setFormData((previous) => ({ ...previous, email: value }));
      if (errors.email) clearFieldError('email');
    },
    [clearFieldError, errors.email]
  );

  const onChangePassword = useCallback(
    (value: string) => {
      setFormData((previous) => ({ ...previous, password: value }));
      if (errors.password) clearFieldError('password');
    },
    [clearFieldError, errors.password]
  );

  const onForgotPassword = useCallback(() => {
    Alert.alert(tl('forgotPasswordTitle'), tl('forgotPasswordMessage'), [{ text: tl('ok') }]);
  }, []);

  const submit = useCallback(
    async (onEmailVerification: (email: string, userType: 'passenger' | 'driver') => void) => {
      const validationErrors = loginFacade.validateCredentials(formData);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      setIsSubmitting(true);
      try {
        const outcome = await loginFacade.login(formData, login);
        if (outcome.kind === 'emailVerification') {
          onEmailVerification(outcome.email, outcome.userType);
          return;
        }

        if (outcome.kind === 'credentialError') {
          setErrors({
            email: ' ',
            password: tl('invalidCredentials'),
          });
          return;
        }

        if (outcome.kind === 'errorAlert') {
          Alert.alert(tl('loginErrorTitle'), outcome.message || tl('loginErrorFallback'), [{ text: tl('ok') }]);
        }
      } catch {
        Alert.alert(tl('unexpectedErrorTitle'), tl('unexpectedErrorMessage'), [{ text: tl('ok') }]);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, login]
  );

  return {
    insets,
    colors,
    formData,
    errors,
    showPassword,
    isSubmitting,
    isLoading,
    gradientColors,
    backgroundGradientHeight,
    setShowPassword,
    onChangeEmail,
    onChangePassword,
    onForgotPassword,
    submit,
  };
}
