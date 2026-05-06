import React from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TileMap } from '@/components/molecules/TileMap';
import { ChatWindow } from '@/components/organisms/ChatWindow';
import { Card } from '@/components/atoms/Card';
import { Avatar } from '@/components/atoms/Avatar';
import Button from '@/components/atoms/Button';
import { spacing, typography, shadows } from '@/theme';
import { twfd } from '@/i18n/waitingForDriver';

interface DriverSummary {
  id: string;
  name: string;
  rating?: number;
  photoUrl?: string;
  vehicle?: { brand?: string; model?: string; plate?: string; color?: string };
}

interface WaitingForDriverScreenContentProps {
  colors: { background: string; card: string; textPrimary: string; textSecondary: string; primary: string; border: string };
  insetsTop: number;
  insetsBottom: number;
  rideId: string | null;
  userLocation: { lat: number; lon: number } | null;
  driver: DriverSummary | null;
  tripStatus: string;
  estimatedFare: number | null;
  isSearching: boolean;
  chatOpenForRide: boolean;
  ratingModalVisible: boolean;
  ratingValue: number;
  ratingComment: string;
  isSubmittingRating: boolean;
  onToggleChat(): void;
  onCancelRide(): void;
  onSetRatingValue(value: number): void;
  onSetRatingComment(value: string): void;
  onSetRatingModalVisible(value: boolean): void;
  onSubmitRating(): void;
  onSkipRating(): void;
}

export function WaitingForDriverScreenContent(props: WaitingForDriverScreenContentProps) {
  const styles = createStyles(props.colors, props.insetsTop, props.insetsBottom);
  const driverLocation = props.driver ? { lat: props.userLocation?.lat ?? 0, lon: props.userLocation?.lon ?? 0 } : undefined;
  const vehicleLine = [props.driver?.vehicle?.brand, props.driver?.vehicle?.model, props.driver?.vehicle?.plate].filter(Boolean).join(' • ');

  return (
    <View style={styles.container}>
      <TileMap userLocation={props.userLocation ?? undefined} driverLocation={driverLocation} showRoute />

      <View style={styles.overlay}>
        <Card style={styles.card}>
          <Text style={styles.title}>{props.isSearching ? twfd('searchingTitle') : twfd('driverAssignedTitle')}</Text>
          <Text style={styles.subtitle}>{props.isSearching ? twfd('searchingSubtitle') : props.driver?.name}</Text>
          {!props.isSearching && props.driver && (
            <View style={styles.driverRow}>
              <Avatar uri={props.driver.photoUrl} name={props.driver.name} size={44} />
              <View style={styles.driverMeta}>
                <Text style={styles.metaText}>{vehicleLine || '-'}</Text>
                <Text style={styles.metaText}>
                  {twfd('statusLabel')}: {props.tripStatus}
                </Text>
                <Text style={styles.metaText}>
                  {twfd('fareLabel')}: {props.estimatedFare ? `R$ ${props.estimatedFare.toFixed(2)}` : '-'}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.actions}>
            <Button title={props.chatOpenForRide ? twfd('closeChat') : twfd('openChat')} onPress={props.onToggleChat} variant="ghost" />
            <Button title={twfd('cancelRide')} onPress={props.onCancelRide} variant="secondary" />
          </View>
        </Card>
      </View>

      {props.chatOpenForRide && props.rideId && (
        <ChatWindow rideId={props.rideId} otherUserName={props.driver?.name ?? 'Motorista'} otherUserPhoto={props.driver?.photoUrl} />
      )}

      <Modal visible={props.ratingModalVisible} transparent animationType="fade" onRequestClose={() => props.onSetRatingModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.title}>{twfd('rateTitle')}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity key={value} onPress={() => props.onSetRatingValue(value)}>
                  <Ionicons
                    name={value <= props.ratingValue ? 'star' : 'star-outline'}
                    size={32}
                    color={props.colors.primary}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              multiline
              placeholder={twfd('rateCommentPlaceholder')}
              value={props.ratingComment}
              onChangeText={props.onSetRatingComment}
            />
            <View style={styles.actions}>
              <TouchableOpacity onPress={props.onSkipRating}>
                <Text style={styles.skip}>{twfd('skipRating')}</Text>
              </TouchableOpacity>
              <Button title={twfd('submitRating')} onPress={props.onSubmitRating} loading={props.isSubmittingRating} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: WaitingForDriverScreenContentProps['colors'], insetsTop: number, insetsBottom: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    overlay: { position: 'absolute', top: insetsTop + spacing.md, left: spacing.md, right: spacing.md },
    card: { padding: spacing.md, borderRadius: 18, ...shadows.medium },
    title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
    subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
    driverRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
    driverMeta: { flex: 1 },
    metaText: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
    actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, gap: spacing.sm },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    modalCard: { width: '100%', backgroundColor: colors.card, borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, paddingBottom: insetsBottom + spacing.md },
    commentInput: { minHeight: 88, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.sm, marginTop: spacing.md, color: colors.textPrimary },
    starsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm },
    skip: { ...typography.body, color: colors.textSecondary, textDecorationLine: 'underline' },
  });
}
