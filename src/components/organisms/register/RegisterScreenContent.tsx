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
import { RegisterField, RegisterFormErrors, RegisterUserType } from '@/models/register/types';
import { tr } from '@/i18n/register';
import { RegisterFormState } from '@/hooks/register/useRegisterScreen';

interface RegisterScreenContentProps {
  colors: {
    background: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
    border: string;
    backgroundSecondary: string;
    status: { error: string };
  };
  isDark: boolean;
  insetsTop: number;
  insetsBottom: number;
  gradientColors: readonly [string, string, string];
  gradientHeight: number;
  userType: RegisterUserType;
  form: RegisterFormState;
  errors: RegisterFormErrors;
  isSubmitting: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onChangeUserType(value: RegisterUserType): void;
  onChangeField(field: keyof RegisterFormState, value: string): void;
  onClearError(field: RegisterField): void;
  onToggleShowPassword(): void;
  onToggleShowConfirmPassword(): void;
  onSubmit(): void;
  onNavigateLogin(): void;
}

export function RegisterScreenContent(props: RegisterScreenContentProps) {
  const styles = createStyles(props.colors, props.insetsTop, props.insetsBottom, props.gradientHeight);
  const { form, errors } = props;

  const renderInput = (field: keyof RegisterFormState, label: string, placeholder: string, secure = false) => (
    <View style={styles.inputWrapper}>
      <FloatingLabelInput
        label={label}
        placeholder={placeholder}
        value={form[field]}
        onChangeText={(value) => {
          props.onChangeField(field, value);
          props.onClearError(field as RegisterField);
        }}
        secureTextEntry={secure}
        error={!!errors[field as RegisterField]}
      />
      {Boolean(errors[field as RegisterField]?.trim()) && (
        <Text style={styles.errorText}>{errors[field as RegisterField]}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? props.insetsTop : 0}
    >
      <LinearGradient colors={[...props.gradientColors]} style={styles.backgroundGradient} pointerEvents="none" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.mainContent}>
            <View style={styles.header}>
              <Text style={styles.title}>{tr('title')}</Text>
              <Text style={styles.subtitle}>{tr('subtitle')}</Text>
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, props.userType === 'passenger' ? styles.typeButtonActive : styles.typeButtonInactive]}
                onPress={() => props.onChangeUserType('passenger')}
              >
                <Text style={[styles.typeButtonText, props.userType === 'passenger' && styles.typeButtonTextActive]}>
                  {tr('passenger')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, props.userType === 'driver' ? styles.typeButtonActive : styles.typeButtonInactive]}
                onPress={() => props.onChangeUserType('driver')}
              >
                <Text style={[styles.typeButtonText, props.userType === 'driver' && styles.typeButtonTextActive]}>
                  {tr('driver')}
                </Text>
              </TouchableOpacity>
            </View>

            {renderInput('name', 'Nome completo', 'Seu nome completo')}
            {renderInput('email', 'E-mail', 'seu@email.com')}
            {renderInput('phone', 'Telefone *', '(00) 00000-0000')}
            {renderInput('cpf', 'CPF *', '000.000.000-00')}

            {props.userType === 'passenger' && renderInput('birthDate', 'Data de nascimento *', 'DD-MM-AAAA')}
            {props.userType === 'driver' && (
              <>
                {renderInput('cnhNumber', 'Número da CNH *', '00000000000')}
                {renderInput('cnhCategory', 'Categoria da CNH *', 'Ex: B, AB')}
                {renderInput('cnhExpirationDate', 'Validade da CNH *', 'DD-MM-AAAA')}
              </>
            )}

            <View style={styles.inputWrapper}>
              <FloatingLabelInput
                label="Senha"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChangeText={(value) => {
                  props.onChangeField('password', value);
                  props.onClearError('password');
                }}
                secureTextEntry={!props.showPassword}
                error={!!errors.password}
                rightIcon={
                  <TouchableOpacity onPress={props.onToggleShowPassword}>
                    <Ionicons name={props.showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color={props.colors.textSecondary} />
                  </TouchableOpacity>
                }
              />
              {Boolean(errors.password?.trim()) && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputWrapper}>
              <FloatingLabelInput
                label="Confirmar senha"
                placeholder="Digite a senha novamente"
                value={form.confirmPassword}
                onChangeText={(value) => {
                  props.onChangeField('confirmPassword', value);
                  props.onClearError('confirmPassword');
                }}
                secureTextEntry={!props.showConfirmPassword}
                error={!!errors.confirmPassword}
                rightIcon={
                  <TouchableOpacity onPress={props.onToggleShowConfirmPassword}>
                    <Ionicons
                      name={props.showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={24}
                      color={props.colors.textSecondary}
                    />
                  </TouchableOpacity>
                }
              />
              {Boolean(errors.confirmPassword?.trim()) && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <Button title={tr('submit')} onPress={props.onSubmit} variant="primary" fullWidth loading={props.isSubmitting} style={styles.submitButton} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{tr('hasAccount')}</Text>
              <TouchableOpacity onPress={props.onNavigateLogin}>
                <Text style={styles.footerLink}>{tr('login')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(
  colors: RegisterScreenContentProps['colors'],
  insetsTop: number,
  insetsBottom: number,
  gradientHeight: number
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, paddingBottom: Math.max(insetsBottom, spacing.md) + spacing.xl },
    backgroundGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: gradientHeight },
    content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: Math.max(insetsTop, spacing.xxl) + spacing.xl },
    mainContent: { maxWidth: 440, width: '100%', alignSelf: 'center' },
    header: { marginBottom: spacing.xl },
    title: { ...typography.h1, fontSize: 40, color: colors.textPrimary, fontWeight: '800' },
    subtitle: { ...typography.body, color: colors.textSecondary },
    typeSelector: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    typeButton: {
      flex: 1,
      paddingVertical: spacing.sm + 6,
      borderRadius: 14,
      borderWidth: 2,
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    typeButtonActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}1F` },
    typeButtonInactive: { borderColor: colors.border },
    typeButtonText: { ...typography.body, fontSize: 15, color: colors.textSecondary },
    typeButtonTextActive: { color: colors.primary, fontWeight: '700' },
    inputWrapper: { marginBottom: spacing.sm },
    errorText: { ...typography.caption, color: colors.status.error, marginTop: 4, marginLeft: spacing.md, minHeight: 16 },
    submitButton: {
      marginTop: spacing.md,
      minHeight: 56,
      borderRadius: 16,
      ...shadows.medium,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      elevation: 6,
    },
    footer: { marginTop: spacing.xl, alignItems: 'center' },
    footerText: { ...typography.body, color: colors.textSecondary, fontSize: 14 },
    footerLink: { ...typography.body, color: colors.primary, fontSize: 15, fontWeight: '700', marginTop: spacing.xs },
  });
}
