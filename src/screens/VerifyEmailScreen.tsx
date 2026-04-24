import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/atoms/Button';
import { spacing, typography, shadows } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VerifyEmailScreenProps {
  navigation: any;
  route?: {
    params?: {
      email?: string;
      userType?: 'passenger' | 'driver';
    };
  };
}

// Chave para armazenar email pendente de verificação
const PENDING_EMAIL_KEY = '@vamu:pending_email_verification';

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Obtém email e tipo do usuário dos parâmetros ou do AsyncStorage
  const [email, setEmail] = useState(route?.params?.email || '');
  const [userType, setUserType] = useState<'passenger' | 'driver'>(route?.params?.userType || 'passenger');

  // Carrega email salvo se não vier nos parâmetros
  useEffect(() => {
    const loadPendingEmail = async () => {
      if (!email) {
        try {
          const savedData = await AsyncStorage.getItem(PENDING_EMAIL_KEY);
          if (savedData) {
            const { email: savedEmail, userType: savedUserType } = JSON.parse(savedData);
            setEmail(savedEmail);
            setUserType(savedUserType || 'passenger');
          } else {
            // Se não há email pendente, pode ser que já foi verificado
            // Redireciona para login
            navigation.navigate('Login');
          }
        } catch (error) {
          console.error('[VerifyEmail] Erro ao carregar email pendente:', error);
        }
      } else {
        // Verifica se o email ainda está pendente
        try {
          const savedData = await AsyncStorage.getItem(PENDING_EMAIL_KEY);
          if (!savedData) {
            // Email não está mais pendente, pode ter sido verificado
            // Redireciona para login
            navigation.navigate('Login');
          }
        } catch (error) {
          console.error('[VerifyEmail] Erro ao verificar email pendente:', error);
        }
      }
    };
    loadPendingEmail();
  }, [email, navigation]);

  const handleCodeChange = (value: string, index: number) => {
    // Aceita apenas números
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue.length > 1) {
      // Se colou múltiplos dígitos, distribui pelos campos começando do índice atual
      const digits = numericValue.slice(0, 6).split('');
      const newCode = [...code];
      
      // Preenche os campos a partir do índice atual
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      
      setCode(newCode);
      setError('');
      
      // Foca no próximo campo após o último preenchido ou no último campo
      const lastFilledIndex = Math.min(index + digits.length - 1, 5);
      const nextIndex = Math.min(lastFilledIndex + 1, 5);
      
      // Se todos os campos foram preenchidos, remove o foco
      if (nextIndex === 5 && newCode[5]) {
        inputRefs.current[5]?.blur();
      } else {
        inputRefs.current[nextIndex]?.focus();
      }
    } else if (numericValue.length === 1) {
      // Digitação normal - apenas um dígito
      const newCode = [...code];
      newCode[index] = numericValue;
      setCode(newCode);
      setError('');

      // Move para o próximo campo automaticamente
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      // Campo vazio (backspace)
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
      setError('');
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (!code[index]) {
        // Se o campo está vazio e pressionou backspace, limpa todos os campos
        setCode(['', '', '', '', '', '']);
        setError('');
        inputRefs.current[0]?.focus();
      } else {
        // Se o campo tem conteúdo, limpa apenas esse campo (comportamento normal)
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
        setError('');
      }
    }
  };

  const handleVerify = async () => {
    const codeString = code.join('');
    
    if (codeString.length !== 6) {
      setError('Por favor, preencha todos os 6 dígitos');
      return;
    }

    if (!email) {
      Alert.alert('Erro', 'Email não encontrado. Por favor, faça o cadastro novamente.');
      navigation.navigate('Register');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let result;
      
      if (userType === 'passenger') {
        result = await apiService.verifyPassengerEmail(email, codeString);
      } else {
        result = await apiService.verifyDriverEmail(email, codeString);
      }

      if (result.success) {
        // Remove email pendente do storage
        await AsyncStorage.removeItem(PENDING_EMAIL_KEY);
        
        Alert.alert(
          'Email verificado!',
          'Seu email foi verificado com sucesso. Agora você pode fazer login.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        setError(result.error || 'Código inválido. Verifique o código enviado para seu email.');
      }
    } catch (error) {
      console.error('[VerifyEmail] Erro ao verificar email:', error);
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    // TODO: Implementar reenvio de código se a API suportar
    Alert.alert(
      'Reenviar código',
      'Funcionalidade de reenvio de código será implementada em breve.'
    );
  };

  const handleAlreadyVerified = async () => {
    // Remove email pendente e volta para login
    // O usuário pode tentar fazer login normalmente
    try {
      await AsyncStorage.removeItem(PENDING_EMAIL_KEY);
      navigation.navigate('Login');
    } catch (error) {
      console.error('[VerifyEmail] Erro ao remover email pendente:', error);
      navigation.navigate('Login');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: Math.max(insets.top, spacing.xxl) + spacing.md,
      paddingBottom: insets.bottom + spacing.lg,
      justifyContent: 'center',
    },
    header: {
      marginBottom: spacing.xl,
      alignItems: 'center',
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      ...shadows.small,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
      fontSize: 26,
      fontWeight: '700',
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
      fontSize: 15,
      lineHeight: 22,
    },
    emailContainer: {
      backgroundColor: colors.card,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emailText: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
      textAlign: 'center',
      fontSize: 14,
    },
    codeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    codeInput: {
      width: 50,
      height: 60,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor: colors.card,
      textAlign: 'center',
      ...typography.h2,
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: '600',
      ...shadows.small,
    },
    codeInputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.card,
      borderWidth: 2.5,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    codeInputFilled: {
      borderColor: colors.primary,
      backgroundColor: colors.card,
    },
    errorText: {
      ...typography.caption,
      color: colors.status.error,
      textAlign: 'center',
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
      minHeight: 18,
      fontSize: 13,
    },
    buttonContainer: {
      marginTop: spacing.md,
    },
    resendContainer: {
      marginTop: spacing.lg,
      alignItems: 'center',
      paddingHorizontal: spacing.md,
    },
    resendText: {
      ...typography.body,
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xs,
    },
    resendButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    resendLink: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '600',
      fontSize: 14,
    },
    alreadyVerifiedLink: {
      color: colors.textSecondary,
      fontSize: 14,
      textDecorationLine: 'underline',
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Verificar Email</Text>
            <Text style={styles.subtitle}>
              Digite o código de 6 dígitos que enviamos para:
            </Text>
            {email && (
              <View style={styles.emailContainer}>
                <Text style={styles.emailText}>{email}</Text>
              </View>
            )}
          </View>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                  focusedIndex === index && styles.codeInputFocused,
                ]}
                value={digit}
                onChangeText={(value) => handleCodeChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : <View style={styles.errorText} />}

          <View style={styles.buttonContainer}>
            <Button
              title="Verificar"
              onPress={handleVerify}
              loading={isSubmitting}
              disabled={code.join('').length !== 6 || isSubmitting}
              fullWidth
              style={{ minHeight: 56, height: 56, borderRadius: 16 }}
            />
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Não recebeu o código?{' '}
              <Text style={styles.alreadyVerifiedLink} onPress={handleAlreadyVerified}>
                Já verifiquei
              </Text>
            </Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isSubmitting}
              activeOpacity={0.7}
              style={styles.resendButton}
            >
              <Text style={styles.resendLink}>Reenviar código</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

