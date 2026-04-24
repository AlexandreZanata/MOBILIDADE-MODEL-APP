import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingLabelInput } from '@/components/molecules/FloatingLabelInput';
import Button from '@/components/atoms/Button';
import { spacing, typography, shadows } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RegisterScreenProps {
  navigation: any;
}

// Chave para armazenar email pendente de verificação
const PENDING_EMAIL_KEY = '@vamu:pending_email_verification';

const {height } = Dimensions.get('window');

type UserType = 'passenger' | 'driver';

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const [userType, setUserType] = useState<UserType>('passenger');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campos comuns
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Campos específicos do motorista
  const [cnhNumber, setCnhNumber] = useState('');
  const [cnhCategory, setCnhCategory] = useState('');
  const [cnhExpirationDate, setCnhExpirationDate] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações comuns
    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 8) {
      newErrors.password = 'Senha deve ter no mínimo 8 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    // Validações comuns obrigatórias
    if (!cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else {
      const cpfNumbers = cpf.replace(/\D/g, '');
      if (cpfNumbers.length < 11) {
        newErrors.cpf = 'CPF deve ter 11 dígitos';
      } else if (cpfNumbers.length > 11) {
        newErrors.cpf = 'CPF inválido';
      } else if (!validateCpf(cpf)) {
        newErrors.cpf = 'CPF inválido';
      }
    }

    // Validações específicas do passageiro
    if (userType === 'passenger') {
      if (!phone.trim()) {
        newErrors.phone = 'Telefone é obrigatório';
      } else if (!validatePhone(phone)) {
        newErrors.phone = 'Telefone inválido (deve ter 10 ou 11 dígitos)';
      }

      if (!birthDate.trim()) {
        newErrors.birthDate = 'Data de nascimento é obrigatória';
      } else {
        const dateNumbers = birthDate.replace(/\D/g, '');
        if (dateNumbers.length < 8) {
          newErrors.birthDate = 'Data incompleta (DD-MM-AAAA)';
        } else if (!/^\d{2}-\d{2}-\d{4}$/.test(birthDate)) {
          newErrors.birthDate = 'Data deve estar no formato DD-MM-AAAA';
        } else if (!validateDate(birthDate)) {
          const [day, month, year] = birthDate.split('-').map(Number);
          if (year < 1900 || year > new Date().getFullYear()) {
            newErrors.birthDate = 'Ano inválido (1900 até hoje)';
          } else if (month < 1 || month > 12) {
            newErrors.birthDate = 'Mês inválido (01-12)';
          } else {
            const daysInMonth = new Date(year, month, 0).getDate();
            if (day < 1 || day > daysInMonth) {
              newErrors.birthDate = `Dia inválido (01-${daysInMonth})`;
            } else {
              newErrors.birthDate = 'Data de nascimento inválida';
            }
          }
        }
      }
    }

    // Validações específicas do motorista
    if (userType === 'driver') {
      if (!phone.trim()) {
        newErrors.phone = 'Telefone é obrigatório para motoristas';
      } else if (!validatePhone(phone)) {
        newErrors.phone = 'Telefone inválido (deve ter 10 ou 11 dígitos)';
      }

      if (!cnhNumber.trim()) {
        newErrors.cnhNumber = 'Número da CNH é obrigatório';
      } else {
        const cnhNumbers = cnhNumber.replace(/\D/g, '');
        if (cnhNumbers.length !== 11) {
          newErrors.cnhNumber = 'CNH deve ter 11 dígitos';
        }
        // Validação de dígitos verificadores removida - será validada no backend
      }

      if (!cnhCategory.trim()) {
        newErrors.cnhCategory = 'Categoria da CNH é obrigatória';
      } else if (!/^[A-Z]{1,2}$/.test(cnhCategory.toUpperCase())) {
        newErrors.cnhCategory = 'Categoria inválida (ex: A, B, AB, etc)';
      }

      if (!cnhExpirationDate.trim()) {
        newErrors.cnhExpirationDate = 'Data de validade da CNH é obrigatória';
      } else if (!/^\d{2}-\d{2}-\d{4}$/.test(cnhExpirationDate)) {
        newErrors.cnhExpirationDate = 'Data deve estar no formato DD-MM-AAAA';
      } else {
        // Valida formato básico
        const [day, month, year] = cnhExpirationDate.split('-').map(Number);
        if (month < 1 || month > 12 || day < 1 || day > 31) {
          newErrors.cnhExpirationDate = 'Data de validade inválida';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formatação e validação de CPF
  const formatCpf = (text: string): string => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Aplica máscara: 000.000.000-00
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    } else if (limited.length <= 9) {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    } else {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
    }
  };

  const validateCpf = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (numbers.length !== 11) {
      return false;
    }
    
    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1{10}$/.test(numbers)) {
      return false;
    }
    
    // Validação do dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(numbers.charAt(9))) {
      return false;
    }
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    return digit === parseInt(numbers.charAt(10));
    

  };



  // Formatação de telefone
  const formatPhone = (text: string): string => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Limita a 11 dígitos (com DDD)
    const limited = numbers.slice(0, 11);
    
    // Aplica máscara: (00) 00000-0000 ou (00) 0000-0000
    if (limited.length <= 2) {
      return limited.length > 0 ? `(${limited}` : '';
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else if (limited.length <= 10) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
  };

  const validatePhone = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    // Telefone deve ter 10 ou 11 dígitos (com DDD)
    return numbers.length >= 10 && numbers.length <= 11;
  };

  // Formatação de data (DD-MM-AAAA visual -> ISO no envio)
  const formatDate = (text: string): string => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    
    // Limita a 8 dígitos (DDMMAAAA)
    const limited = numbers.slice(0, 8);
    if (limited.length === 0) return '';

    // Aplica máscara: DD-MM-AAAA
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      const day = limited.slice(0, 2);
      const month = limited.slice(2);
      // Corrige mês básico
      if (month.length === 2) {
        const monthNum = parseInt(month, 10);
        if (monthNum > 12) return `${day}-12`;
        if (monthNum === 0) return `${day}-${month[0]}`;
      }
      return `${day}-${month}`;
    } else {
      const day = limited.slice(0, 2);
      const month = limited.slice(2, 4);
      const year = limited.slice(4);

      // Valida mês básico
      const monthNum = parseInt(month, 10);
      if (monthNum > 12) return `${day}-12-${year}`;
      if (monthNum === 0) return `${day}-${month[0]}-${year}`;

      // Valida dia básico
      if (year.length === 4) {
        const dayNum = parseInt(day, 10);
        const daysInMonth = new Date(parseInt(year, 10), monthNum, 0).getDate();
        if (dayNum > daysInMonth) {
          return `${dayNum.toString().padStart(2, '0')}-${month}-${daysInMonth
            .toString()
            .padStart(2, '0')}`;
        }
        if (dayNum === 0) {
          return `${day[0]}-${month}-${year}`;
        }
      }

      return `${day}-${month}-${year}`;
    }
  };

  const validateDate = (date: string): boolean => {
    if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      return false;
    }

    const [dayStr, monthStr, yearStr] = date.split('-');
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);

    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) return false;
    if (month < 1 || month > 12) return false;

    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;

    // Não permite datas futuras para nascimento
    const dateObj = new Date(year, month - 1, day);
    return dateObj <= new Date();
  };

  const toIsoDate = (brDate: string): string => {
    // Converte DD-MM-AAAA para AAAA-MM-DD se válido
    if (!/^\d{2}-\d{2}-\d{4}$/.test(brDate)) return brDate;
    const [day, month, year] = brDate.split('-');
    return `${year}-${month}-${day}`;
  };

  // Formatação de CNH (apenas números)
  const formatCnhNumber = (text: string): string => {
    return text.replace(/\D/g, '').slice(0, 11);
  };

  const handleRegister = async () => {
    setErrors({});
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (userType === 'passenger') {
        // Cadastro de passageiro - remove formatação antes de enviar
        const cpfNumbers = cpf.replace(/\D/g, '');
        const phoneNumbers = phone.replace(/\D/g, '');
        
        const result = await apiService.registerPassenger({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phoneNumbers,
          cpf: cpfNumbers,
          birthDate: toIsoDate(birthDate.trim()),
        });

        if (result.success) {
          // Salva email e tipo de usuário para verificação
          const userEmail = email.trim().toLowerCase();
          try {
            await AsyncStorage.setItem(
              PENDING_EMAIL_KEY,
              JSON.stringify({
                email: userEmail,
                userType: 'passenger',
              })
            );
          } catch (error) {
            console.error('[Register] Erro ao salvar email pendente:', error);
          }

          // Navega para tela de verificação de email
          navigation.navigate('VerifyEmail', {
            email: userEmail,
            userType: 'passenger',
          });
        } else {
          Alert.alert('Erro no Cadastro', result.error || 'Não foi possível realizar o cadastro.');
        }
      } else {
        // Cadastro de motorista - remove formatação antes de enviar
        const cpfNumbers = cpf.replace(/\D/g, '');
        const phoneNumbers = phone.replace(/\D/g, '');
        const cnhNumbers = cnhNumber.replace(/\D/g, '');
        
        const result = await apiService.registerDriver({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phoneNumbers,
          cpf: cpfNumbers,
          cnhNumber: cnhNumbers,
          cnhExpirationDate: toIsoDate(cnhExpirationDate.trim()),
          cnhCategory: cnhCategory.trim().toUpperCase(),
        });

        if (result.success) {
          // Salva email e tipo de usuário para verificação
          const userEmail = email.trim().toLowerCase();
          try {
            await AsyncStorage.setItem(
              PENDING_EMAIL_KEY,
              JSON.stringify({
                email: userEmail,
                userType: 'driver',
              })
            );
          } catch (error) {
            console.error('[Register] Erro ao salvar email pendente:', error);
          }

          // Navega para tela de verificação de email
          navigation.navigate('VerifyEmail', {
            email: userEmail,
            userType: 'driver',
          });
        } else {
          Alert.alert('Erro no Cadastro', result.error || 'Não foi possível realizar o cadastro.');
        }
      }
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    backgroundGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: height * 0.35,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: Math.max(insets.top, spacing.xxl) + spacing.xl,
      paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xl,
    },
    mainContent: {
      maxWidth: 440,
      width: '100%',
      alignSelf: 'center',
    },
    header: {
      marginBottom: spacing.xl,
      alignItems: 'flex-start',
    },
    title: {
      ...typography.h1,
      fontSize: 40,
      color: colors.textPrimary,
      fontWeight: '800',
      marginBottom: spacing.sm,
      letterSpacing: -1.5,
      lineHeight: 48,
    },
    subtitle: {
      ...typography.body,
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      fontWeight: '400',
    },
    typeSelector: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    typeButton: {
      flex: 1,
      paddingVertical: spacing.sm + 6,
      paddingHorizontal: spacing.md,
      borderRadius: 14,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    typeButtonActive: {
      borderColor: colors.primary,
      borderWidth: 2.5,
      backgroundColor: hexToRgba(colors.primary, isDark ? 0.22 : 0.12),
    },
    typeButtonInactive: {
      borderColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    typeButtonText: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    typeButtonTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    formSection: {
      marginBottom: spacing.lg,
    },
    inputWrapper: {
      marginBottom: spacing.sm,
    },
    errorText: {
      ...typography.caption,
      color: colors.status.error,
      fontSize: 12,
      marginTop: 4,
      marginLeft: spacing.md,
      marginBottom: 0,
      fontWeight: '500',
      minHeight: 16,
    },
    registerButton: {
      marginTop: spacing.md,
      minHeight: 56,
      height: 56,
      borderRadius: 16,
      ...shadows.medium,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      elevation: 6,
    },
    footer: {
      marginTop: spacing.xl,
      alignItems: 'center',
    },
    footerText: {
      ...typography.body,
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },
    footerLink: {
      ...typography.body,
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
      marginTop: spacing.xs,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        {/* Background Gradient */}
        <LinearGradient
          colors={[
            hexToRgba(colors.primary, 0.06),
            hexToRgba(colors.primary, 0.02),
            'transparent',
          ]}
          style={styles.backgroundGradient}
          pointerEvents="none"
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets
          scrollEventThrottle={16}
          alwaysBounceVertical
          bounces
          overScrollMode="always"
          nestedScrollEnabled
          scrollEnabled
        >
          <View style={styles.content}>
            <View style={styles.mainContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Criar conta</Text>
                <Text style={styles.subtitle}>
                  Preencha os dados para criar sua conta
                </Text>
              </View>

              {/* Seletor de Tipo */}
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    userType === 'passenger' ? styles.typeButtonActive : styles.typeButtonInactive,
                  ]}
                  onPress={() => setUserType('passenger')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      userType === 'passenger' && styles.typeButtonTextActive,
                    ]}
                  >
                    Passageiro
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    userType === 'driver' ? styles.typeButtonActive : styles.typeButtonInactive,
                  ]}
                  onPress={() => setUserType('driver')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      userType === 'driver' && styles.typeButtonTextActive,
                    ]}
                  >
                    Motorista
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Formulário */}
              <View style={styles.formSection}>
                {/* Nome */}
                <View style={styles.inputWrapper}>
                  <FloatingLabelInput
                    label="Nome completo"
                    placeholder="Seu nome completo"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    autoCapitalize="words"
                    error={!!errors.name}
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                {/* Email */}
                <View style={styles.inputWrapper}>
                  <FloatingLabelInput
                    label="E-mail"
                    placeholder="seu@email.com"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={!!errors.email}
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {/* Telefone */}
                <View style={styles.inputWrapper}>
                  <FloatingLabelInput
                    label={userType === 'driver' ? 'Telefone *' : 'Telefone *'}
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(formatPhone(text));
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    keyboardType="phone-pad"
                    error={!!errors.phone}
                    maxLength={15}
                  />
                  {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                </View>

                {/* CPF */}
                <View style={styles.inputWrapper}>
                  <FloatingLabelInput
                    label="CPF *"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChangeText={(text) => {
                      const formatted = formatCpf(text);
                      setCpf(formatted);
                      // Limpa erro se estiver corrigindo
                      if (errors.cpf) {
                        const cpfNumbers = formatted.replace(/\D/g, '');
                        // Só limpa erro se tiver 11 dígitos e for válido
                        if (cpfNumbers.length === 11 && validateCpf(formatted)) {
                          setErrors({ ...errors, cpf: '' });
                        } else if (cpfNumbers.length < 11) {
                          // Limpa erro se ainda está digitando
                          setErrors({ ...errors, cpf: '' });
                        }
                      }
                    }}
                    onBlur={() => {
                      // Valida CPF quando perde o foco
                      const cpfNumbers = cpf.replace(/\D/g, '');
                      if (cpfNumbers.length > 0 && cpfNumbers.length < 11) {
                        setErrors({ ...errors, cpf: 'CPF deve ter 11 dígitos' });
                      } else if (cpfNumbers.length === 11 && !validateCpf(cpf)) {
                        setErrors({ ...errors, cpf: 'CPF inválido' });
                      }
                    }}
                    keyboardType="numeric"
                    error={!!errors.cpf}
                    maxLength={14}
                  />
                  {errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text>}
                </View>

                {/* Data de Nascimento (apenas para passageiro) */}
              {userType === 'passenger' && (
                  <View style={styles.inputWrapper}>
                    <FloatingLabelInput
                      label="Data de nascimento *"
                    placeholder="DD-MM-AAAA"
                      value={birthDate}
                      onChangeText={(text) => {
                        const formatted = formatDate(text);
                        setBirthDate(formatted);
                        // Limpa erro se estiver corrigindo
                        if (errors.birthDate) {
                          const dateNumbers = formatted.replace(/\D/g, '');
                          // Só valida quando estiver completo (8 dígitos)
                          if (dateNumbers.length === 8 && validateDate(formatted)) {
                            setErrors({ ...errors, birthDate: '' });
                          } else if (dateNumbers.length < 8) {
                            // Limpa erro se ainda está digitando
                            setErrors({ ...errors, birthDate: '' });
                          }
                        }
                      }}
                      onBlur={() => {
                        // Valida data quando perde o foco
                      const dateNumbers = birthDate.replace(/\D/g, '');
                      if (dateNumbers.length > 0 && dateNumbers.length < 8) {
                        setErrors({ ...errors, birthDate: 'Data incompleta (DD-MM-AAAA)' });
                      } else if (dateNumbers.length === 8 && !validateDate(birthDate)) {
                        const [day, month, year] = birthDate.split('-').map(Number);
                        if (year < 1900 || year > new Date().getFullYear()) {
                          setErrors({ ...errors, birthDate: 'Ano inválido (1900 até hoje)' });
                        } else if (month < 1 || month > 12) {
                          setErrors({ ...errors, birthDate: 'Mês inválido (01-12)' });
                        } else {
                          const daysInMonth = new Date(year, month, 0).getDate();
                          if (day < 1 || day > daysInMonth) {
                            setErrors({ ...errors, birthDate: `Dia inválido (01-${daysInMonth})` });
                          } else {
                            setErrors({ ...errors, birthDate: 'Data de nascimento inválida' });
                          }
                        }
                      }
                      }}
                      keyboardType="numeric"
                      error={!!errors.birthDate}
                      maxLength={10}
                    />
                    {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
                  </View>
                )}

                {/* Campos específicos do motorista */}
                {userType === 'driver' && (
                  <>
                    {/* Número da CNH */}
                    <View style={styles.inputWrapper}>
                      <FloatingLabelInput
                        label="Número da CNH *"
                        placeholder="00000000000"
                        value={cnhNumber}
                        onChangeText={(text) => {
                          setCnhNumber(formatCnhNumber(text));
                          if (errors.cnhNumber) setErrors({ ...errors, cnhNumber: '' });
                        }}
                        keyboardType="numeric"
                        error={!!errors.cnhNumber}
                        maxLength={11}
                      />
                      {errors.cnhNumber && <Text style={styles.errorText}>{errors.cnhNumber}</Text>}
                    </View>

                    {/* Categoria da CNH */}
                    <View style={styles.inputWrapper}>
                      <FloatingLabelInput
                        label="Categoria da CNH *"
                        placeholder="Ex: B, AB, etc."
                        value={cnhCategory}
                        onChangeText={(text) => {
                          // Limita a 2 caracteres e converte para maiúsculo
                          const upper = text.toUpperCase().slice(0, 2);
                          setCnhCategory(upper);
                          if (errors.cnhCategory) setErrors({ ...errors, cnhCategory: '' });
                        }}
                        autoCapitalize="characters"
                        error={!!errors.cnhCategory}
                        maxLength={2}
                      />
                      {errors.cnhCategory && (
                        <Text style={styles.errorText}>{errors.cnhCategory}</Text>
                      )}
                    </View>

                    {/* Validade da CNH */}
                    <View style={styles.inputWrapper}>
                      <FloatingLabelInput
                      label="Validade da CNH *"
                      placeholder="DD-MM-AAAA"
                        value={cnhExpirationDate}
                        onChangeText={(text) => {
                          const formatted = formatDate(text);
                          setCnhExpirationDate(formatted);
                          // Limpa erro se estiver corrigindo
                          if (errors.cnhExpirationDate) {
                            const dateNumbers = formatted.replace(/\D/g, '');
                            if (dateNumbers.length === 8) {
                          const [day, month, year] = formatted.split('-').map(Number);
                          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                            setErrors({ ...errors, cnhExpirationDate: '' });
                          }
                            } else if (dateNumbers.length < 8) {
                              setErrors({ ...errors, cnhExpirationDate: '' });
                            }
                          }
                        }}
                        onBlur={() => {
                          // Valida data quando perde o foco
                          const dateNumbers = cnhExpirationDate.replace(/\D/g, '');
                          if (dateNumbers.length > 0 && dateNumbers.length < 8) {
                            setErrors({ ...errors, cnhExpirationDate: 'Data incompleta (DD-MM-AAAA)' });
                          } else if (dateNumbers.length === 8) {
                            const [day, month, year] = cnhExpirationDate.split('-').map(Number);
                            if (month < 1 || month > 12) {
                              setErrors({ ...errors, cnhExpirationDate: 'Mês inválido (01-12)' });
                            } else if (day < 1 || day > 31) {
                              setErrors({ ...errors, cnhExpirationDate: 'Dia inválido (01-31)' });
                            } else {
                              const daysInMonth = new Date(year, month, 0).getDate();
                              if (day > daysInMonth) {
                                setErrors({ ...errors, cnhExpirationDate: `Dia inválido (01-${daysInMonth})` });
                              } else {
                                setErrors({ ...errors, cnhExpirationDate: '' });
                              }
                            }
                          }
                        }}
                        keyboardType="numeric"
                        error={!!errors.cnhExpirationDate}
                        maxLength={10}
                      />
                      {errors.cnhExpirationDate && (
                        <Text style={styles.errorText}>{errors.cnhExpirationDate}</Text>
                      )}
                    </View>
                  </>
                )}

                {/* Senha */}
                <View style={styles.inputWrapper}>
                  <FloatingLabelInput
                    label="Senha"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={!!errors.password}
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={24}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    }
                  />
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* Confirmar Senha */}
                <View style={styles.inputWrapper}>
                  <FloatingLabelInput
                    label="Confirmar senha"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={!!errors.confirmPassword}
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={24}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    }
                  />
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}
                </View>

                {/* Botão de Cadastro */}
                <Button
                  title="Criar conta"
                  onPress={handleRegister}
                  variant="primary"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  style={styles.registerButton}
                />
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Já tem uma conta?
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.footerLink}>Fazer login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
export default RegisterScreen

