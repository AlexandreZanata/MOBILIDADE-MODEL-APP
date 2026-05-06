import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors, spacing, borders, shadows, typography } from '@/theme';
import Button from '../atoms/Button';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  message,
  primaryButtonText = 'Confirmar',
  secondaryButtonText = 'Cancelar',
  onPrimaryPress,
  onSecondaryPress,
}) => {
  const handlePrimaryPress = onPrimaryPress ?? onClose;
  const handleSecondaryPress = onSecondaryPress ?? onClose;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              <View style={styles.buttons}>
                {secondaryButtonText && (
                  <Button
                    title={secondaryButtonText}
                    onPress={handleSecondaryPress}
                    variant="ghost"
                    style={styles.secondaryButton}
                  />
                )}
                <Button
                  title={primaryButtonText}
                  onPress={handlePrimaryPress}
                  variant="primary"
                  style={styles.primaryButton}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borders.radiusMedium,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...shadows.large,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 1,
  },
});

