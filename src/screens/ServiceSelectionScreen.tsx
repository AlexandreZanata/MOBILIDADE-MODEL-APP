import React from 'react';
import { ServiceSelectionContent } from '@/components/organisms/serviceSelection/ServiceSelectionContent';
import { useServiceSelection } from '@/hooks/serviceSelection/useServiceSelection';
import {
  ServiceSelectionScreenNavigationProp,
  ServiceSelectionScreenRoute,
} from '@/models/serviceSelection/types';

interface ServiceSelectionScreenProps {
  navigation: ServiceSelectionScreenNavigationProp;
  route?: ServiceSelectionScreenRoute;
}

export const ServiceSelectionScreen: React.FC<ServiceSelectionScreenProps> = ({ navigation, route }) => {
  const vm = useServiceSelection({ navigation, route });

  return (
    <ServiceSelectionContent
      colors={vm.colors}
      insetsTop={vm.insets.top}
      insetsBottom={vm.insets.bottom}
      services={vm.services}
      selectedServiceId={vm.selectedServiceId}
      onSelectService={vm.onSelectService}
      onConfirm={vm.onConfirm}
    />
  );
};

