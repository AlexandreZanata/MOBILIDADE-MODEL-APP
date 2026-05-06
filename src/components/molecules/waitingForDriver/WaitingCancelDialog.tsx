/**
 * @file WaitingCancelDialog.tsx
 * @description In-app cancellation confirmation dialog (spec: modal overlay, NOT Alert).
 *
 * Spec layout:
 *   overlay → dialog card → warning icon → title → body →
 *   [ghost "Voltar"] [filled danger "Sim, cancelar"]
 */
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { twfd } from '@/i18n/waitingForDriver';
import { borders, shadows, spacing, typography } from '@/theme';

interface WaitingCancelDialogProps {
  visible: boolean;
  onConfirm(): void;
  onDismiss(): void;
}

export function WaitingCancelDialog({
  visible,
  onConfirm,
  onDismiss,
}: WaitingCancelDialogProps): React.ReactElement {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            shadows.large,
          ]}
        >
          {/* Warning icon */}
          <View style={[styles.iconWrapper, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="warning-outline" size={32} color={colors.status.warning} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {twfd('cancelDialogTitle')}
          </Text>

          {/* Body */}
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {twfd('cancelDialogBody')}
          </Text>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.ghostBtn, { borderColor: colors.border }]}
              onPress={onDismiss}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={twfd('goBack')}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>
                {twfd('goBack')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.dangerBtn, { backgroundColor: colors.status.error }]}
              onPress={onConfirm}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={twfd('yesCancel')}
            >
              <Text style={[styles.btnText, styles.dangerBtnText]}>
                {twfd('yesCancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: borders.radiusXL,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: borders.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: borders.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtn: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  dangerBtn: {},
  btnText: {
    ...typography.button,
    fontSize: 14,
  },
  dangerBtnText: {
    color: '#FFFFFF',
  },
});
