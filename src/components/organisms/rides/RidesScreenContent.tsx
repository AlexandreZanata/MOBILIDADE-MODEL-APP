import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/atoms/Button';
import { spacing, typography } from '@/theme';
import { trd } from '@/i18n/rides';
import { RideHistoryCard } from '@/components/molecules/rides/RideHistoryCard';
import { Ride } from '@/models/rides/types';

interface RideItemViewModel {
  raw: Ride;
  id: string;
  displayName: string;
  dateText: string;
  priceText: string;
  distanceText: string;
  durationText: string;
  photoUrl?: string;
}

interface RidesScreenContentProps {
  colors: {
    background: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
    border: string;
    card: string;
    status: { success: string; error: string; warning: string };
  };
  insetsTop: number;
  insetsBottom: number;
  title: string;
  subtitle: string;
  rides: RideItemViewModel[];
  hasMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isAuthenticated: boolean;
  onRefresh(): void;
  onLoadMore(): void;
  onPressLogin(): void;
  onPressRide(ride: Ride): void;
}

export function RidesScreenContent(props: RidesScreenContentProps) {
  const styles = createStyles(props.colors, props.insetsTop, props.insetsBottom);

  if (props.isLoading && props.rides.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={props.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{props.title}</Text>
        <Text style={styles.headerSubtitle}>{props.subtitle}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={props.isRefreshing}
            onRefresh={props.onRefresh}
            tintColor={props.colors.primary}
            colors={[props.colors.primary]}
          />
        }
      >
        {!props.isAuthenticated ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color={props.colors.primary} />
            <Text style={styles.emptyTitle}>{trd('loginTitle')}</Text>
            <Text style={styles.emptyText}>{trd('loginMessage')}</Text>
            <Button title={trd('loginButton')} onPress={props.onPressLogin} variant="primary" fullWidth style={styles.loginButton} />
          </View>
        ) : props.rides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color={props.colors.primary} />
            <Text style={styles.emptyTitle}>{trd('emptyTitle')}</Text>
            <Text style={styles.emptyText}>{trd('emptyMessage')}</Text>
          </View>
        ) : (
          <>
            {props.rides.map((ride) => (
              <RideHistoryCard
                key={ride.id}
                colors={props.colors}
                name={ride.displayName}
                dateText={ride.dateText}
                priceText={ride.priceText}
                distanceText={ride.distanceText}
                durationText={ride.durationText}
                status={ride.raw.status}
                photoUrl={ride.photoUrl}
                onPress={() => props.onPressRide(ride.raw)}
              />
            ))}
            {props.hasMore && (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity style={styles.loadMoreButton} onPress={props.onLoadMore} disabled={props.isLoading}>
                  {props.isLoading ? (
                    <ActivityIndicator size="small" color={props.colors.primary} />
                  ) : (
                    <Text style={styles.loadMoreText}>{trd('loadMore')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(
  colors: RidesScreenContentProps['colors'],
  insetsTop: number,
  insetsBottom: number
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: Math.max(insetsTop, spacing.lg) + spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.background,
    },
    headerTitle: { ...typography.h1, fontSize: 28, fontWeight: '800', color: colors.textPrimary },
    headerSubtitle: { ...typography.body, fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
    content: { flex: 1 },
    contentContainer: { paddingHorizontal: spacing.sm, paddingTop: spacing.xs, paddingBottom: Math.max(insetsBottom, spacing.lg) },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyContainer: { flex: 1, minHeight: 400, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm },
    emptyTitle: { ...typography.h2, fontSize: 20, color: colors.textPrimary, textAlign: 'center' },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    loginButton: { marginTop: spacing.lg, minHeight: 56, borderRadius: 16 },
    loadMoreContainer: { paddingVertical: spacing.md, alignItems: 'center' },
    loadMoreButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 10, backgroundColor: `${colors.primary}14` },
    loadMoreText: { ...typography.body, color: colors.primary, fontWeight: '700' },
  });
}
