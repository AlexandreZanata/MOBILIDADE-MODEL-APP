import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { tve } from '@/i18n/verifyEmail';
import { VerifyEmailUserType } from '@/models/verifyEmail/types';
import { verifyEmailFacade } from '@/services/verifyEmail/verifyEmailFacade';

interface UseVerifyEmailScreenParams {
  initialEmail?: string;
  initialUserType?: VerifyEmailUserType;
  onNavigateLogin(): void;
  onNavigateRegister(): void;
}

const DIGITS_COUNT = 6;

export function useVerifyEmailScreen({
  initialEmail,
  initialUserType,
  onNavigateLogin,
  onNavigateRegister,
}: UseVerifyEmailScreenParams) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [email, setEmail] = useState(initialEmail ?? '');
  const [userType, setUserType] = useState<VerifyEmailUserType>(initialUserType ?? 'passenger');
  const [digits, setDigits] = useState<string[]>(Array.from({ length: DIGITS_COUNT }, () => ''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (initialEmail) return;
      const pending = await verifyEmailFacade.loadPendingEmail();
      if (!isMounted) return;
      if (!pending) {
        onNavigateLogin();
        return;
      }
      setEmail(pending.email);
      setUserType(pending.userType);
    })();
    return () => {
      isMounted = false;
    };
  }, [initialEmail, onNavigateLogin]);

  const code = useMemo(() => digits.join(''), [digits]);

  const onChangeDigit = useCallback((value: string, index: number) => {
    const numericValue = value.replace(/\D/g, '');
    setError('');
    setDigits((previous) => {
      const next = [...previous];
      if (numericValue.length > 1) {
        numericValue.slice(0, DIGITS_COUNT).split('').forEach((digit, offset) => {
          const target = index + offset;
          if (target < DIGITS_COUNT) next[target] = digit;
        });
        const focusIndex = Math.min(index + numericValue.length, DIGITS_COUNT - 1);
        inputRefs.current[focusIndex]?.focus();
        return next;
      }
      next[index] = numericValue;
      if (numericValue && index < DIGITS_COUNT - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      return next;
    });
  }, []);

  const onKeyPress = useCallback((key: string, index: number) => {
    if (key !== 'Backspace') return;
    setDigits((previous) => {
      const next = [...previous];
      if (!next[index] && index > 0) inputRefs.current[index - 1]?.focus();
      next[index] = '';
      return next;
    });
    setError('');
  }, []);

  const onVerify = useCallback(async () => {
    if (code.length !== DIGITS_COUNT) {
      setError(tve('missingCode'));
      return;
    }
    if (!email) {
      Alert.alert(tve('missingEmailTitle'), tve('missingEmailMessage'), [{ text: tve('ok') }]);
      onNavigateRegister();
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const response = await verifyEmailFacade.verifyEmail(email, code, userType);
      if (!response.success) {
        setError(response.error ?? tve('invalidCodeFallback'));
        return;
      }
      await verifyEmailFacade.clearPendingEmail();
      Alert.alert(tve('successTitle'), tve('successMessage'), [{ text: tve('ok'), onPress: onNavigateLogin }]);
    } catch {
      setError(tve('verificationError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [code, email, onNavigateLogin, onNavigateRegister, userType]);

  const onAlreadyVerified = useCallback(async () => {
    await verifyEmailFacade.clearPendingEmail();
    onNavigateLogin();
  }, [onNavigateLogin]);

  const onResendCode = useCallback(() => {
    Alert.alert(tve('resendTitle'), tve('resendMessage'), [{ text: tve('ok') }]);
  }, []);

  return {
    insets,
    colors,
    inputRefs,
    email,
    digits,
    focusedIndex,
    error,
    isSubmitting,
    code,
    setFocusedIndex,
    onChangeDigit,
    onKeyPress,
    onVerify,
    onAlreadyVerified,
    onResendCode,
  };
}
