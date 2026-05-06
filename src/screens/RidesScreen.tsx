import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { Ride } from '@/models/rides/types';
import { useRidesScreen } from '@/hooks/rides/useRidesScreen';
import { RidesScreenContent } from '@/components/organisms/rides/RidesScreenContent';

type RidesNavigationParams = {
  Rides: undefined;
  Login: undefined;
  RideDetails: { ride: Ride };
};

interface RidesScreenProps {
  navigation: NavigationProp<RidesNavigationParams, 'Rides'>;
}

export const RidesScreen: React.FC<RidesScreenProps> = ({ navigation }) => {
  const {
    insets,
    colors,
    title,
    subtitle,
    rides,
    hasMore,
    isLoading,
    isRefreshing,
    isAuthenticated,
    onRefresh,
    onLoadMore,
  } = useRidesScreen();

  return (
    <RidesScreenContent
      colors={colors}
      insetsTop={insets.top}
      insetsBottom={insets.bottom}
      title={title}
      subtitle={subtitle}
      rides={rides}
      hasMore={hasMore}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      isAuthenticated={isAuthenticated}
      onRefresh={onRefresh}
      onLoadMore={onLoadMore}
      onPressLogin={() => navigation.navigate('Login')}
      onPressRide={(ride) => navigation.navigate('RideDetails', { ride })}
    />
  );
};

