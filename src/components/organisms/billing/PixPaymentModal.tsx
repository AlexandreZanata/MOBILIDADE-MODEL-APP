import React from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/atoms/Button';
import { useTheme } from '@/context/ThemeContext';
import { tb } from '@/i18n/billing';
import { PixQrCode } from '@/models/billing/types';
import { shadows, spacing, typography } from '@/theme';

interface PixPaymentModalProps {
  visible: boolean;
  pixData: PixQrCode | null;
  formatCurrency(value: number): string;
  formatDate(value: string): string;
  onCopyPixCode(): void;
  onClose(): void;
}

export function PixPaymentModal({
  visible,
  pixData,
  formatCurrency,
  formatDate,
  onCopyPixCode,
  onClose,
}: PixPaymentModalProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors.card, colors.shadow, colors.primary, colors.textPrimary, colors.textSecondary);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.pixModal}>
        <View style={styles.pixModalContent}>
          <View style={styles.pixModalHeader}>
            <Text style={styles.pixModalTitle}>{tb('modalTitle')}</Text>
            <TouchableOpacity style={styles.pixModalClose} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {pixData && (
            <>
              <Text style={styles.pixAmount}>{formatCurrency(pixData.amount)}</Text>

              {pixData.qrCodeBase64 ? (
                <View style={styles.pixQrCode}>
                  <Image
                    source={{ uri: `data:image/png;base64,${pixData.qrCodeBase64}` }}
                    style={styles.pixQrCodeImage}
                  />
                </View>
              ) : (
                <View style={styles.pixQrCode}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              )}

              <Text style={styles.pixExpires}>{tb('modalExpiresIn', { date: formatDate(pixData.expiresAt) })}</Text>

              <Button title={tb('copyPix')} onPress={onCopyPixCode} variant="primary" fullWidth style={styles.pixCopyButton} />

              <Text style={styles.pixInstructions}>{tb('modalInstructions')}</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (
  cardColor: string,
  shadowColor: string,
  primaryColor: string,
  textPrimary: string,
  textSecondary: string
) =>
  StyleSheet.create({
    pixModal: {
      flex: 1,
      backgroundColor: `${textPrimary}80`,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    pixModalContent: {
      backgroundColor: cardColor,
      borderRadius: spacing.md + spacing.xs,
      padding: spacing.lg,
      width: '100%',
      maxWidth: 400,
      ...shadows.large,
      shadowColor,
    },
    pixModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    pixModalTitle: {
      ...typography.h2,
      color: textPrimary,
      fontWeight: '700',
    },
    pixModalClose: {
      padding: spacing.xs,
    },
    pixQrCode: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: cardColor,
      borderRadius: spacing.sm + spacing.xs,
      marginBottom: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pixQrCodeImage: {
      width: '90%',
      height: '90%',
      resizeMode: 'contain',
    },
    pixAmount: {
      ...typography.h2,
      color: primaryColor,
      textAlign: 'center',
      marginBottom: spacing.md,
      fontWeight: '700',
    },
    pixExpires: {
      ...typography.caption,
      color: textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    pixCopyButton: {
      marginBottom: spacing.md,
    },
    pixInstructions: {
      ...typography.body,
      fontSize: typography.caption.fontSize + 2,
      color: textSecondary,
      textAlign: 'center',
      lineHeight: spacing.lg - spacing.xs,
    },
  });
