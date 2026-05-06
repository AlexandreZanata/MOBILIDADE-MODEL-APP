import React from 'react';
import { TripPriceContent } from '@/components/organisms/tripPrice/TripPriceContent';
import { useTripPrice } from '@/hooks/tripPrice/useTripPrice';
import { TripPriceScreenNavigationProp, TripPriceScreenRoute } from '@/models/tripPrice/types';

interface TripPriceScreenProps {
  navigation: TripPriceScreenNavigationProp;
  route: TripPriceScreenRoute;
}

export const TripPriceScreen: React.FC<TripPriceScreenProps> = ({ navigation, route }) => {
  const vm = useTripPrice({ navigation, route });

  return (
    <TripPriceContent
      colors={vm.colors}
      insetsTop={vm.insets.top}
      insetsBottom={vm.insets.bottom}
      categories={vm.categories}
      selectedCategoryId={vm.selectedCategoryId}
      isLoading={vm.isLoading}
      hasTooShortDistance={vm.hasTooShortDistance}
      onSelectCategory={vm.onSelectCategory}
      onConfirm={vm.onConfirm}
    />
  );
};

