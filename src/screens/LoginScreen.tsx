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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import Button from '@/components/Button';
import { spacing, typography, shadows } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface LoginScreenProps {
  navigation: any;
}

const {height } = Dimensions.get('window');

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    // Validação de email
    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    // Validação de senha
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 8) {
      newErrors.password = 'Senha deve ter no mínimo 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    // Limpa erros anteriores
    setErrors({});
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login(email.trim(), password);

      console.log('[LoginScreen] Resultado do login:', {
        success: result.success,
        requiresEmailVerification: result.requiresEmailVerification,
        email: result.email,
        userType: result.userType,
      });

      // Verifica primeiro se precisa verificar email (mesmo que success seja false)
      if (result.requiresEmailVerification && result.email && result.userType) {
        console.log('[LoginScreen] Redirecionando para verificação de email');
        setIsSubmitting(false);
        // Usa requestAnimationFrame para garantir que o estado seja atualizado antes da navegação
        requestAnimationFrame(() => {
          navigation.navigate('VerifyEmail', {
            email: result.email,
            userType: result.userType,
          });
        });
        return;
      }

      if (!result.success) {
        // Mostra erro específico
        const errorMessage = result.error || 'Não foi possível fazer login. Verifique suas credenciais.';
        
        // Se for erro de credenciais, destaca os campos
        if (errorMessage.toLowerCase().includes('credencial') || 
            errorMessage.toLowerCase().includes('inválid') ||
            errorMessage.toLowerCase().includes('401')) {
          setErrors({
            email: ' ',
            password: 'Email ou senha incorretos',
          });
        } else {
          Alert.alert(
            'Erro no Login',
            errorMessage,
            [{ text: 'OK' }]
          );
        }
      }
      // Se o login for bem-sucedido, o AuthContext atualizará o estado
      // e a navegação será redirecionada automaticamente
    } catch (error) {
      console.error('[LoginScreen] Erro ao fazer login:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
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
      paddingTop: Math.max(insets.top, spacing.xxl) + spacing.lg,
      paddingBottom: spacing.lg,
    },
    mainContent: {
      maxWidth: 440,
      width: '100%',
      alignSelf: 'center',
    },
    header: {
      marginBottom: spacing.xxl,
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
      fontWeight: '500',
      minHeight: 16,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    forgotPasswordText: {
      ...typography.body,
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    loginButton: {
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={[
          hexToRgba(colors.primary, 0.06),
          hexToRgba(colors.primary, 0.02),
          'transparent',
        ]}
        style={styles.backgroundGradient}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.mainContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Bem-vindo</Text>
              <Text style={styles.subtitle}>
                Entre com suas credenciais para acessar sua conta
              </Text>
            </View>

            {/* Campos de Input - Fora do Container */}
            <View style={styles.formSection}>
              {/* Campo de Email */}
              <View style={styles.inputWrapper}>
                <FloatingLabelInput
                  label="E-mail"
                  placeholder="seu@email.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined });
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={!!errors.email}
                />
                {errors.email && errors.email.trim() && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Campo de Senha */}
              <View style={styles.inputWrapper}>
                <FloatingLabelInput
                  label="Senha"
                  placeholder="Digite sua senha"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
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
                {errors.password && errors.password.trim() && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
                {/* Esqueci minha senha */}
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => {
                    Alert.alert(
                      'Recuperar Senha',
                      'Entre em contato com o suporte para recuperar sua senha.',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão de Login */}
            <Button
              title="Entrar"
              onPress={handleLogin}
              variant="primary"
              fullWidth
              loading={isLoading || isSubmitting}
              disabled={isLoading || isSubmitting}
              style={styles.loginButton}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Não tem uma conta?
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.footerLink}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
