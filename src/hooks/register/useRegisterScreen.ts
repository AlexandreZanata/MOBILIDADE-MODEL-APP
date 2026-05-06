import { useCallback, useMemo, useState } from 'react';
import { Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { RegisterField, RegisterFormErrors, RegisterUserType } from '@/models/register/types';
import { registerFacade } from '@/services/register/registerFacade';
import { tr } from '@/i18n/register';

const { height } = Dimensions.get('window');
const PENDING_EMAIL_KEY = '@vamu:pending_email_verification';

export interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  cpf: string;
  birthDate: string;
  cnhNumber: string;
  cnhCategory: string;
  cnhExpirationDate: string;
}

function toRgba(hex: string, alpha: number): string {
  const red = parseInt(hex.slice(1, 3), 16);
  const green = parseInt(hex.slice(3, 5), 16);
  const blue = parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function onlyNumbers(value: string): string {
  return value.replace(/\D/g, '');
}

function formatCpf(value: string): string {
  const numbers = onlyNumbers(value).slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

function formatPhone(value: string): string {
  const numbers = onlyNumbers(value).slice(0, 11);
  if (numbers.length <= 2) return numbers.length > 0 ? `(${numbers}` : '';
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

function formatDate(value: string): string {
  const numbers = onlyNumbers(value).slice(0, 8);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4)}`;
}

function validateCpf(value: string): boolean {
  const numbers = onlyNumbers(value);
  if (numbers.length !== 11 || /^(\d)\1{10}$/.test(numbers)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number.parseInt(numbers.charAt(i), 10) * (10 - i);
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== Number.parseInt(numbers.charAt(9), 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number.parseInt(numbers.charAt(i), 10) * (11 - i);
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  return digit === Number.parseInt(numbers.charAt(10), 10);
}

function toIsoDate(date: string): string {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) return date;
  const [day, month, year] = date.split('-');
  return `${year}-${month}-${day}`;
}

export function useRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [userType, setUserType] = useState<RegisterUserType>('passenger');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [form, setForm] = useState<RegisterFormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
    birthDate: '',
    cnhNumber: '',
    cnhCategory: '',
    cnhExpirationDate: '',
  });

  const gradientColors = useMemo(
    () => [toRgba(colors.primary, 0.06), toRgba(colors.primary, 0.02), 'transparent'] as const,
    [colors.primary]
  );

  const gradientHeight = useMemo(() => height * 0.35, []);

  const setField = useCallback((field: keyof RegisterFormState, value: string) => {
    const formatted =
      field === 'cpf'
        ? formatCpf(value)
        : field === 'phone'
          ? formatPhone(value)
          : field === 'birthDate' || field === 'cnhExpirationDate'
            ? formatDate(value)
            : field === 'cnhNumber'
              ? onlyNumbers(value).slice(0, 11)
              : field === 'cnhCategory'
                ? value.toUpperCase().slice(0, 2)
                : value;
    setForm((prev) => ({ ...prev, [field]: formatted }));
  }, []);

  const clearFieldError = useCallback((field: RegisterField) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const validate = useCallback((): RegisterFormErrors => {
    const nextErrors: RegisterFormErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Nome é obrigatório';
    if (!form.email.trim()) nextErrors.email = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Email inválido';
    if (!form.password) nextErrors.password = 'Senha é obrigatória';
    else if (form.password.length < 8) nextErrors.password = 'Senha deve ter no mínimo 8 caracteres';
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'As senhas não coincidem';
    if (onlyNumbers(form.phone).length < 10 || onlyNumbers(form.phone).length > 11) {
      nextErrors.phone = userType === 'driver' ? 'Telefone é obrigatório para motoristas' : 'Telefone inválido (deve ter 10 ou 11 dígitos)';
    }
    if (onlyNumbers(form.cpf).length !== 11) nextErrors.cpf = 'CPF deve ter 11 dígitos';
    else if (!validateCpf(form.cpf)) nextErrors.cpf = 'CPF inválido';
    if (userType === 'passenger' && !/^\d{2}-\d{2}-\d{4}$/.test(form.birthDate)) {
      nextErrors.birthDate = 'Data deve estar no formato DD-MM-AAAA';
    }
    if (userType === 'driver') {
      if (onlyNumbers(form.cnhNumber).length !== 11) nextErrors.cnhNumber = 'CNH deve ter 11 dígitos';
      if (!/^[A-Z]{1,2}$/.test(form.cnhCategory.trim().toUpperCase())) nextErrors.cnhCategory = 'Categoria inválida (ex: A, B, AB, etc)';
      if (!/^\d{2}-\d{2}-\d{4}$/.test(form.cnhExpirationDate)) nextErrors.cnhExpirationDate = 'Data deve estar no formato DD-MM-AAAA';
    }
    return nextErrors;
  }, [form, userType]);

  const submit = useCallback(
    async (onEmailVerification: (email: string, type: RegisterUserType) => void) => {
      const nextErrors = validate();
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;

      setIsSubmitting(true);
      try {
        const email = form.email.trim().toLowerCase();
        const basePayload = {
          name: form.name.trim(),
          email,
          password: form.password,
          phone: onlyNumbers(form.phone),
          cpf: onlyNumbers(form.cpf),
        };

        const result = userType === 'passenger'
          ? await registerFacade.registerPassenger({
              ...basePayload,
              birthDate: toIsoDate(form.birthDate.trim()),
            })
          : await registerFacade.registerDriver({
              ...basePayload,
              cnhNumber: onlyNumbers(form.cnhNumber),
              cnhExpirationDate: toIsoDate(form.cnhExpirationDate.trim()),
              cnhCategory: form.cnhCategory.trim().toUpperCase(),
            });

        if (!result.success) {
          Alert.alert(tr('registerErrorTitle'), result.error?.message ?? tr('registerErrorFallback'));
          return;
        }

        await AsyncStorage.setItem(PENDING_EMAIL_KEY, JSON.stringify({ email, userType }));
        onEmailVerification(email, userType);
      } catch {
        Alert.alert(tr('unexpectedErrorTitle'), tr('unexpectedErrorMessage'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, userType, validate]
  );

  return {
    insets,
    colors,
    isDark,
    userType,
    form,
    errors,
    isSubmitting,
    showPassword,
    showConfirmPassword,
    gradientColors,
    gradientHeight,
    setUserType,
    setField,
    setShowPassword,
    setShowConfirmPassword,
    clearFieldError,
    submit,
  };
}
