import React, { memo } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/atoms/Button';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography } from '@/theme';
import { DriverTripViewData } from '@/models/driverTripInProgress/types';
import { tdt } from '@/i18n/driverTripInProgress';

interface Props {
  view: DriverTripViewData;
  onSetCancelVisible: (value: boolean) => void;
  onSetCancelReason: (value: string) => void;
  onConfirmCancel: () => void;
  onSetRatingVisible: (value: boolean) => void;
  onSetRatingValue: (value: number) => void;
  onSetRatingComment: (value: string) => void;
  onSubmitRating: () => void;
}

const getRatingLabel = (value: number) => {
  if (value >= 5) return tdt('ratingLabelExcellent');
  if (value >= 4) return tdt('ratingLabelVeryGood');
  if (value >= 3) return tdt('ratingLabelGood');
  if (value >= 2) return tdt('ratingLabelRegular');
  return tdt('ratingLabelBad');
};

export const DriverTripInProgressModals = memo((props: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: spacing.lg },
    card: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, padding: spacing.lg },
    title: { ...typography.body, color: colors.textPrimary, fontWeight: '700', marginBottom: spacing.xs },
    subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, minHeight: 80, padding: spacing.md, color: colors.textPrimary },
    row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md },
  });

  return (
    <>
      <Modal visible={props.view.cancelModalVisible} transparent animationType="fade" onRequestClose={() => props.onSetCancelVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{tdt('cancelRideTitle')}</Text>
            <Text style={styles.subtitle}>{tdt('cancelRideDescription')}</Text>
            <TextInput style={styles.input} multiline value={props.view.cancelForm.reason} onChangeText={props.onSetCancelReason} placeholder={tdt('cancelRidePlaceholder')} />
            <Button title={tdt('cancelRideAction')} variant="secondary" fullWidth onPress={props.onConfirmCancel} />
            <Button title={tdt('cancelRideSecondaryAction')} variant="ghost" fullWidth onPress={() => props.onSetCancelVisible(false)} />
          </View>
        </View>
      </Modal>
      <Modal visible={props.view.ratingModalVisible} transparent animationType="fade" onRequestClose={() => props.onSetRatingVisible(false)}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 24 : 24}>
            <View style={styles.card}>
              <Text style={styles.title}>{tdt('ratingTitle')}</Text>
              <Text style={styles.subtitle}>{tdt('ratingDescription')}</Text>
              <Text style={styles.subtitle}>{tdt('ratingLabel')}</Text>
              <View style={styles.row}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity key={value} onPress={() => props.onSetRatingValue(value)}>
                    <Ionicons name={value <= props.view.ratingForm.ratingValue ? 'star' : 'star-outline'} size={26} color={colors.secondary} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.subtitle, { textAlign: 'center' }]}>{getRatingLabel(props.view.ratingForm.ratingValue)}</Text>
              <TextInput
                style={styles.input}
                multiline
                value={props.view.ratingForm.ratingComment}
                onChangeText={props.onSetRatingComment}
                placeholder={tdt('ratingCommentPlaceholder')}
              />
              <Button title={tdt('ratingSubmit')} fullWidth onPress={props.onSubmitRating} disabled={props.view.isSubmittingRating} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
});
