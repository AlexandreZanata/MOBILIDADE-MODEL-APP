import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme';
import { ChatWindow } from '@/components/organisms/ChatWindow';
import { TileMapRef } from '@/components/molecules/TileMap';
import { tdt } from '@/i18n/driverTripInProgress';
import { useDriverTripInProgress } from '@/hooks/driverTripInProgress/useDriverTripInProgress';
import { DriverTripInProgressTopBar } from '@/components/organisms/driverTripInProgress/DriverTripInProgressTopBar';
import { DriverTripInProgressMap } from '@/components/organisms/driverTripInProgress/DriverTripInProgressMap';
import { DriverTripInProgressInfoCard } from '@/components/organisms/driverTripInProgress/DriverTripInProgressInfoCard';
import { DriverTripInProgressModals } from '@/components/molecules/driverTripInProgress/DriverTripInProgressModals';

type DriverTripInProgressScreenProps = {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  route: { params?: { tripId?: string; tripData?: unknown } };
};

export const DriverTripInProgressScreen: React.FC<DriverTripInProgressScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const mapRef = useRef<TileMapRef>(null);
  const [topBarHeight, setTopBarHeight] = useState(0);
  const [infoCardHeight, setInfoCardHeight] = useState(220);
  const vm = useDriverTripInProgress({
    tripIdParam: route?.params?.tripId,
    tripDataParam: route?.params?.tripData,
    onNavigateHome: () => navigation.navigate('Main', { screen: 'DriverHome' }),
  });

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chatFab: {
      position: 'absolute',
      left: spacing.md,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chatBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      backgroundColor: colors.primary,
    },
    chatBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  });

  if (vm.view.isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>{tdt('loadingTrip')}</Text>
        </View>
      </View>
    );
  }

  if (!vm.view.tripData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>{tdt('tripNotFound')}</Text>
        </View>
      </View>
    );
  }

  const chatBottom = infoCardHeight + Math.max(insets.bottom, spacing.md) + spacing.sm;
  return (
    <View style={styles.container}>
      <DriverTripInProgressTopBar tripData={vm.view.tripData} destinationAddress={vm.view.destinationAddress} onHeightChange={setTopBarHeight} />
      <DriverTripInProgressMap
        mapRef={mapRef}
        mapCenter={vm.view.mapCenter}
        mapZoom={vm.view.mapZoom}
        routePoints={vm.view.routePoints}
        driverLocation={vm.view.driverLocation}
        passengerLocation={vm.view.passengerLocation}
        destinationLocation={vm.view.destinationLocation}
        topSpaceHeight={topBarHeight}
        bottomContainerHeight={infoCardHeight + 64 + Math.max(insets.bottom, 0)}
        onZoom={vm.handleSetMapZoom}
        onZoomIn={vm.handleZoomIn}
        onZoomOut={vm.handleZoomOut}
        onRecenter={vm.handleRecenter}
      />
      <DriverTripInProgressInfoCard
        view={vm.view}
        onLayoutHeight={setInfoCardHeight}
        onToggleMinimized={vm.handleToggleMinimized}
        onPrimaryAction={() => vm.view.statusButton && vm.handleStatusUpdate(vm.view.statusButton.status)}
        onOpenCancelModal={() => vm.handleSetCancelModalVisible(true)}
      />
      <TouchableOpacity style={[styles.chatFab, { bottom: chatBottom }]} onPress={vm.handleToggleChat}>
        <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
        {vm.chatUnreadCount > 0 ? (
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>{vm.chatUnreadCount > 99 ? '99+' : vm.chatUnreadCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
      {vm.isChatOpenForRide && vm.view.rideId ? (
        <ChatWindow rideId={vm.view.rideId} otherUserName={vm.view.passengerInfo?.name ?? tdt('passengerFallbackName')} otherUserPhoto={vm.view.passengerInfo?.photoUrl} />
      ) : null}
      <DriverTripInProgressModals
        view={vm.view}
        onSetCancelVisible={vm.handleSetCancelModalVisible}
        onSetCancelReason={vm.handleSetCancelReason}
        onConfirmCancel={vm.handleCancelRide}
        onSetRatingVisible={vm.handleSetRatingModalVisible}
        onSetRatingValue={vm.handleSetRatingValue}
        onSetRatingComment={vm.handleSetRatingComment}
        onSubmitRating={vm.handleSubmitRating}
      />
    </View>
  );
};
