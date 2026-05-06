/**
 * @file WaitingRatingModal.tsx
 * @description Post-trip driver rating modal.
 * Shown after the ride reaches a final status.
 */
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { twfd } from '@/i18n/waitingForDriver';
import { borders, shadows, spacing, typography } from '@/theme';

interface WaitingRatingModalProps {
  visible: boolean;
  ratingValue: number;
  ratingComment: string;
  isSubmitting: boolean;
  insetsBottom: number;
  onSetRatingValue(value: number): void;
  onSetRatingComment(value: string): void;
  onSubmit(): void;
  onSkip(): void;
}

export function WaitingRatingModal({
  visible,
  ratingValue,
  ratingComment,
  isSubmitting,
  insetsBottom,
  onSetRatingValue,
  onSetRatingComment,
  onSubmit,
  onSkip,
}: WaitingRatingModalProps): React.ReactElement {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onSkip}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: insetsBottom + spacing.xl },
            shadows.large,
          ]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {twfd('rateTitle')}
          </Text>

          {/* Star row */}
          <View style={styles.starsRow}>
            {([1, 2, 3, 4, 5] as const).map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => onSetRatingValue(value)}
                accessibilityRole="button"
                accessibilityLabel={`${value} estrelas`}
              >
                <Ionicons
                  name={value <= ratingValue ? 'star' : 'star-outline'}
                  size={36}
                  color={value <= ratingValue ? colors.secondary : colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Comment input */}
          <TextInput
            style={[
              styles.commentInput,
              { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.backgroundSecondary },
            ]}
            multiline
            placeholder={twfd('rateCommentPlaceholder')}
            placeholderTextColor={colors.textHint}
            value={ratingComment}
            onChangeText={onSetRatingComment}
            accessibilityLabel={twfd('rateCommentPlaceholder')}
          />

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onSkip}
              accessibilityRole="button"
              accessibilityLabel={twfd('skipRating')}
            >
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>
                {twfd('skipRating')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={onSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={twfd('submitRating')}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>{twfd('submitRating')}</Text>
              )}
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
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    borderTopLeftRadius: borders.radiusXL,
    borderTopRightRadius: borders.radiusXL,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  commentInput: {
    minHeight: 88,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borders.radiusMedium,
    padding: spacing.md,
    ...typography.body,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  skipText: {
    ...typography.body,
    textDecorationLine: 'underline',
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: borders.radiusMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
