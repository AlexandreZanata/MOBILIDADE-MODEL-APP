import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '@/context/ThemeContext';
import { useDriverHome } from '@/hooks/driverHome/useDriverHome';
import { DriverHomeHeader } from '@/components/organisms/driverHome/DriverHomeHeader';
import { DriverHomeStatusCard } from '@/components/organisms/driverHome/DriverHomeStatusCard';
import { DriverHomeMapSection } from '@/components/organisms/driverHome/DriverHomeMapSection';
import { DriverHomeTripRequestModal } from '@/components/organisms/driverHome/DriverHomeTripRequestModal';

type DriverHomeScreenProps = {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
};

export const DriverHomeScreen: React.FC<DriverHomeScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const vm = useDriverHome({ navigation });
  const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background } });

  return (
    <View style={styles.container}>
      <DriverHomeMapSection
        mapCenter={vm.mapCenter}
        mapZoom={vm.mapZoom}
        currentLocation={vm.currentLocation}
        passengerLocation={vm.passengerLocation}
        nearbyDrivers={vm.nearbyDrivers}
        isAvailable={vm.isAvailable}
        infoCardHeight={vm.infoCardHeight}
        locationError={vm.locationError}
        apiError={vm.apiError}
        isCheckingActiveRide={vm.isCheckingActiveRide}
        onMapMove={vm.handleMapMove}
        onZoomIn={vm.handleZoomIn}
        onZoomOut={vm.handleZoomOut}
        onRecenter={vm.handleRecenterLocation}
      />

      <DriverHomeStatusCard
        isAvailable={vm.isAvailable}
        isConnecting={vm.isConnecting}
        isLoadingStatus={vm.isLoadingStatus}
        isDriverEligible={vm.isDriverEligible()}
        isAvailabilityRateLimited={vm.isAvailabilityRateLimited}
        isRateLimited={vm.isRateLimited}
        isUpdatingLocation={vm.isUpdatingLocation}
        hasPendingDocuments={vm.hasPendingDocuments()}
        eligibilityMessage={vm.getEligibilityMessage()}
        validationWarningMessage={vm.getValidationWarningMessage()}
        onToggleAvailability={vm.handleToggleAvailability}
        onActivate={() => vm.handleToggleAvailability(true)}
        onStatusCardLayout={vm.setStatusCardHeight}
        onInfoCardLayout={vm.setInfoCardHeight}
      />

      <DriverHomeHeader
        statusCardHeight={vm.statusCardHeight}
        onPressBilling={() => navigation.navigate('DriverBilling')}
      />

      <DriverHomeTripRequestModal
        visible={vm.showTripRequest}
        tripData={vm.pendingTrip}
        onAccept={vm.handleAcceptTrip}
        onReject={vm.handleRejectTrip}
        onTimeout={vm.handleOfferTimeout}
      />
    </View>
  );
};
