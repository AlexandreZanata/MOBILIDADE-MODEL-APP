import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import {
  ServiceSelectionScreenNavigationProp,
  ServiceSelectionScreenRoute,
} from '@/models/serviceSelection/types';
import { serviceSelectionFacade } from '@/services/serviceSelection/serviceSelectionFacade';

interface UseServiceSelectionParams {
  navigation: ServiceSelectionScreenNavigationProp;
  route?: ServiceSelectionScreenRoute;
}

export function useServiceSelection({ navigation, route }: UseServiceSelectionParams) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('1');
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const services = useMemo(() => serviceSelectionFacade.getServices(), []);

  const onConfirm = () => {
    navigation.navigate('Driver', {
      userLocation: route?.params?.userLocation ?? undefined,
    });
  };

  return {
    colors,
    insets,
    services,
    selectedServiceId,
    onSelectService: setSelectedServiceId,
    onConfirm,
  };
}
