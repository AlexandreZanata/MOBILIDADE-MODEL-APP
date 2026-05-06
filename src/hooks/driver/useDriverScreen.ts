import { useMemo } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { driverFacade } from '@/services/driver/driverFacade';
import { DriverRouteParams } from '@/models/driver/types';

interface UseDriverScreenParams {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
  routeParams?: DriverRouteParams;
}

export function useDriverScreen({ navigation, routeParams }: UseDriverScreenParams) {
  const viewData = useMemo(() => driverFacade.getViewData(), []);

  const onReject = () => {
    navigation.goBack();
  };

  const onAccept = () => {
    navigation.navigate('WaitingForDriver', {
      userLocation: routeParams?.userLocation || undefined,
    });
  };

  return {
    viewData,
    onReject,
    onAccept,
  };
}
