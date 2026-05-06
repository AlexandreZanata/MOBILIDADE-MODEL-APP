import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/atoms/Button';
import { spacing, typography, shadows } from '@/theme';
import { tve } from '@/i18n/verifyEmail';

interface VerifyEmailScreenContentProps {
  colors: { background: string; card: string; border: string; primary: string; textPrimary: string; textSecondary: string; status: { error: string } };
  insetsTop: number;
  insetsBottom: number;
  email: string;
  digits: string[];
  focusedIndex: number | null;
  error: string;
  isSubmitting: boolean;
  inputRefs: React.MutableRefObject<Array<TextInput | null>>;
  onChangeDigit(value: string, index: number): void;
  onKeyPress(key: string, index: number): void;
  onSetFocusedIndex(index: number | null): void;
  onVerify(): void;
  onAlreadyVerified(): void;
  onResendCode(): void;
}

export function VerifyEmailScreenContent(props: VerifyEmailScreenContentProps) {
  const styles = createStyles(props.colors, props.insetsTop, props.insetsBottom);
  const isDisabled = props.digits.join('').length !== 6 || props.isSubmitting;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={40} color={props.colors.primary} />
            </View>
            <Text style={styles.title}>{tve('title')}</Text>
            <Text style={styles.subtitle}>{tve('subtitle')}</Text>
            {Boolean(props.email) && <Text style={styles.email}>{props.email}</Text>}
          </View>

          <View style={styles.codeContainer}>
            {props.digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  props.inputRefs.current[index] = ref;
                }}
                style={[styles.codeInput, props.focusedIndex === index && styles.codeInputFocused]}
                value={digit}
                onChangeText={(value) => props.onChangeDigit(value, index)}
                onKeyPress={({ nativeEvent }) => props.onKeyPress(nativeEvent.key, index)}
                onFocus={() => props.onSetFocusedIndex(index)}
                onBlur={() => props.onSetFocusedIndex(null)}
                keyboardType="number-pad"
                maxLength={6}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          <Text style={styles.errorText}>{props.error || ' '}</Text>

          <Button title={tve('verifyButton')} onPress={props.onVerify} loading={props.isSubmitting} disabled={isDisabled} fullWidth />

          <View style={styles.actions}>
            <Text style={styles.actionText}>
              {tve('resendPrompt')}{' '}
              <Text style={styles.linkSecondary} onPress={props.onAlreadyVerified}>
                {tve('alreadyVerified')}
              </Text>
            </Text>
            <TouchableOpacity onPress={props.onResendCode} disabled={props.isSubmitting}>
              <Text style={styles.linkPrimary}>{tve('resendCode')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: VerifyEmailScreenContentProps['colors'], insetsTop: number, insetsBottom: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, paddingTop: Math.max(insetsTop, spacing.xxl), paddingBottom: insetsBottom + spacing.lg },
    header: { alignItems: 'center', marginBottom: spacing.xl },
    iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, ...shadows.small },
    title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm, textAlign: 'center' },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    email: { ...typography.body, color: colors.primary, marginTop: spacing.md, fontWeight: '600' },
    codeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.md },
    codeInput: { width: 50, height: 60, borderWidth: 2, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card, textAlign: 'center', color: colors.textPrimary, fontSize: 24 },
    codeInputFocused: { borderColor: colors.primary },
    errorText: { ...typography.caption, color: colors.status.error, textAlign: 'center', minHeight: 18, marginBottom: spacing.md },
    actions: { marginTop: spacing.lg, alignItems: 'center' },
    actionText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
    linkPrimary: { ...typography.body, color: colors.primary, fontWeight: '700' },
    linkSecondary: { color: colors.textSecondary, textDecorationLine: 'underline' },
  });
}
