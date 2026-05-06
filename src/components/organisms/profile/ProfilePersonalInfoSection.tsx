import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { useTheme } from '@/context/ThemeContext';
import { borders, spacing, typography } from '@/theme';
import { tp } from '@/i18n/profile';
import { ProfileDriverFieldRow } from '@/models/profile/types';

export interface ProfilePersonalInfoSectionProps {
  isLoading: boolean;
  isEditing: boolean;
  onPressEditSave(): void;
  draftName: string;
  onChangeDraftName(value: string): void;
  draftEmail: string;
  onChangeDraftEmail(value: string): void;
  draftPhone: string;
  onChangeDraftPhone(value: string): void;
  draftBirthDate: string;
  onChangeDraftBirthDate(value: string): void;
  nameDisplay: string;
  emailDisplay: string;
  emailVerified: boolean;
  birthDisplay: string;
  cpfLabel: string;
  phoneLabel: string;
  cpfShown: string;
  phoneShown: string;
  revealedCpf: boolean;
  revealedPhone: boolean;
  onToggleReveal(field: 'cpf' | 'phone'): void;
  onPressVerifyEmail(): void;
  showCnhUpload: boolean;
  isUploadingCNH: boolean;
  onUploadCnh(): void;
  driverRows: ProfileDriverFieldRow[];
}

export function ProfilePersonalInfoSection({
  isLoading,
  isEditing,
  onPressEditSave,
  draftName,
  onChangeDraftName,
  draftEmail,
  onChangeDraftEmail,
  draftPhone,
  onChangeDraftPhone,
  draftBirthDate,
  onChangeDraftBirthDate,
  nameDisplay,
  emailDisplay,
  emailVerified,
  birthDisplay,
  cpfLabel,
  phoneLabel,
  cpfShown,
  phoneShown,
  revealedCpf,
  revealedPhone,
  onToggleReveal,
  onPressVerifyEmail,
  showCnhUpload,
  isUploadingCNH,
  onUploadCnh,
  driverRows,
}: ProfilePersonalInfoSectionProps) {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    wrap: { marginHorizontal: spacing.md, marginTop: spacing.md },
    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    sectionLabel: { ...typography.label, color: colors.textSecondary, flex: 1 },
    editBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
    editBtnText: { ...typography.body, fontWeight: '500', color: colors.accent },
    subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
    card: {
      borderWidth: borders.widthHairline,
      borderColor: colors.border,
      borderRadius: borders.radiusLarge,
      padding: spacing.lg,
    },
    loadingRow: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
    loadingText: { ...typography.caption, color: colors.textSecondary },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      minHeight: spacing.xxl + spacing.sm,
    },
    divider: { height: borders.widthHairline, backgroundColor: colors.border },
    label: { ...typography.body, color: colors.textSecondary, flexShrink: 0 },
    value: { ...typography.body, color: colors.textPrimary, flex: 1, textAlign: 'right' },
    input: {
      ...typography.body,
      flex: 1,
      textAlign: 'right',
      color: colors.textPrimary,
      borderWidth: borders.widthHairline,
      borderColor: colors.border,
      borderRadius: borders.radiusSmall,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    iconBtn: { padding: spacing.xs },
    verifyLink: { ...typography.body, color: colors.accent, fontWeight: '500', textAlign: 'right', flex: 1 },
    cnhButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderWidth: borders.widthHairline,
      borderColor: colors.accent,
      borderRadius: borders.radiusMedium,
      paddingVertical: spacing.sm,
      marginTop: spacing.md,
    },
    cnhButtonText: { ...typography.button, color: colors.accent },
  });

  const emailRight = () => {
    if (isEditing) {
      return (
        <TextInput
          value={draftEmail}
          onChangeText={onChangeDraftEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.textHint}
        />
      );
    }
    if (!emailVerified) {
      return (
        <Pressable onPress={onPressVerifyEmail} style={{ flex: 1 }} accessibilityRole="link">
          <Text style={styles.verifyLink}>{tp('verifyEmail')}</Text>
        </Pressable>
      );
    }
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1, justifyContent: 'flex-end' }}>
        <Text style={styles.value}>{emailDisplay}</Text>
        <Ionicons name="checkmark-circle" size={spacing.md} color={colors.status.success} />
      </View>
    );
  };

  const sensitiveEye = (field: 'cpf' | 'phone', revealed: boolean) => (
    <Pressable
      onPress={() => onToggleReveal(field)}
      style={styles.iconBtn}
      accessibilityRole="button"
      accessibilityLabel={revealed ? tp('hideSensitive') : tp('revealSensitive')}
    >
      <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={spacing.lg} color={colors.textHint} />
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Text style={styles.sectionLabel}>{tp('personalInfoTitle')}</Text>
        <Pressable style={styles.editBtn} onPress={onPressEditSave} accessibilityRole="button">
          <Text style={styles.editBtnText}>{isEditing ? tp('saveButton') : tp('editButton')}</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>{tp('personalInfoSubtitle')}</Text>
      <Card style={styles.card}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{tp('loadingData')}</Text>
          </View>
        ) : (
          <>
              <View style={styles.row}>
                <Text style={styles.label}>{tp('name')}</Text>
                {isEditing ? (
                  <TextInput value={draftName} onChangeText={onChangeDraftName} style={styles.input} />
                ) : (
                  <Text style={styles.value}>{nameDisplay}</Text>
                )}
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>{tp('email')}</Text>
                {emailRight()}
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>{cpfLabel}</Text>
                <Text style={styles.value}>{cpfShown}</Text>
                {sensitiveEye('cpf', revealedCpf)}
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>{phoneLabel}</Text>
                {isEditing ? (
                  <TextInput value={draftPhone} onChangeText={onChangeDraftPhone} style={styles.input} keyboardType="phone-pad" />
                ) : (
                  <Text style={styles.value}>{phoneShown}</Text>
                )}
                {!isEditing ? sensitiveEye('phone', revealedPhone) : null}
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.label}>{tp('birthDate')}</Text>
                {isEditing ? (
                  <TextInput value={draftBirthDate} onChangeText={onChangeDraftBirthDate} style={styles.input} />
                ) : (
                  <Text style={styles.value}>{birthDisplay}</Text>
                )}
              </View>
              {driverRows.map((r) => (
                <React.Fragment key={r.id}>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <Text style={styles.label}>{r.label}</Text>
                    <Text style={styles.value}>{r.value}</Text>
                  </View>
                </React.Fragment>
              ))}
              {showCnhUpload ? (
                <Pressable style={styles.cnhButton} onPress={onUploadCnh} disabled={isUploadingCNH}>
                  {isUploadingCNH ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={spacing.md} color={colors.accent} />
                      <Text style={styles.cnhButtonText}>{tp('uploadCnh')}</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
          </>
        )}
      </Card>
    </View>
  );
}
