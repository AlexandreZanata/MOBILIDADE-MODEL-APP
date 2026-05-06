import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/atoms/Button';
import { FloatingLabelInput } from '@/components/molecules/FloatingLabelInput';
import { spacing, typography, shadows } from '@/theme';
import { LoginValidationErrors } from '@/models/login/types';
import { tl } from '@/i18n/login';

interface LoginScreenContentProps {
  colors: {
    background: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
    status: { error: string };
  };
  insetsTop: number;
  gradientColors: readonly [string, string, string];
  backgroundGradientHeight: number;
  email: string;
  password: string;
  errors: LoginValidationErrors;
  showPassword: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  onChangeEmail(value: string): void;
  onChangePassword(value: string): void;
  onToggleShowPassword(): void;
  onForgotPassword(): void;
  onSubmit(): void;
  onNavigateRegister(): void;
}

export function LoginScreenContent({
  colors,
  insetsTop,
  gradientColors,
  backgroundGradientHeight,
  email,
  password,
  errors,
  showPassword,
  isSubmitting,
  isLoading,
  onChangeEmail,
  onChangePassword,
  onToggleShowPassword,
  onForgotPassword,
  onSubmit,
  onNavigateRegister,
}: LoginScreenContentProps) {
  const styles = createStyles(colors, insetsTop, backgroundGradientHeight);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={[...gradientColors]} style={styles.backgroundGradient} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.mainContent}>
            <View style={styles.header}>
              <Text style={styles.title}>{tl('welcomeTitle')}</Text>
              <Text style={styles.subtitle}>{tl('welcomeSubtitle')}</Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputWrapper}>
                <FloatingLabelInput
                  label={tl('emailLabel')}
                  placeholder={tl('emailPlaceholder')}
                  value={email}
                  onChangeText={onChangeEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={!!errors.email}
                />
                {Boolean(errors.email?.trim()) && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputWrapper}>
                <FloatingLabelInput
                  label={tl('passwordLabel')}
                  placeholder={tl('passwordPlaceholder')}
                  value={password}
                  onChangeText={onChangePassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={!!errors.password}
                  rightIcon={
                    <TouchableOpacity
                      onPress={onToggleShowPassword}
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
                {Boolean(errors.password?.trim()) && <Text style={styles.errorText}>{errors.password}</Text>}
                <TouchableOpacity style={styles.forgotPassword} onPress={onForgotPassword}>
                  <Text style={styles.forgotPasswordText}>{tl('forgotPassword')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title={tl('submit')}
              onPress={onSubmit}
              variant="primary"
              fullWidth
              loading={isLoading || isSubmitting}
              disabled={isLoading || isSubmitting}
              style={styles.loginButton}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{tl('noAccount')}</Text>
              <TouchableOpacity onPress={onNavigateRegister}>
                <Text style={styles.footerLink}>{tl('register')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(
  colors: LoginScreenContentProps['colors'],
  insetsTop: number,
  backgroundGradientHeight: number
) {
  return StyleSheet.create({
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
      height: backgroundGradientHeight,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: Math.max(insetsTop, spacing.xxl) + spacing.lg,
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
}
