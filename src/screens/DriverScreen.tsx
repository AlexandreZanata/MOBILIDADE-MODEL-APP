import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { DriverScreenContent } from '@/components/organisms/driver/DriverScreenContent';
import { useDriverScreen } from '@/hooks/driver/useDriverScreen';
import { DriverRouteParams } from '@/models/driver/types';

interface DriverScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  route?: {
    params?: DriverRouteParams;
  };
}

export const DriverScreen: React.FC<DriverScreenProps> = ({ navigation, route }) => {
  const vm = useDriverScreen({ navigation, routeParams: route?.params });
  return <DriverScreenContent viewData={vm.viewData} onReject={vm.onReject} onAccept={vm.onAccept} />;
};

