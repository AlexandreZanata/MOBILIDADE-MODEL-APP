import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaymentMethodContent } from '@/components/organisms/paymentMethod/PaymentMethodContent';
import { usePaymentMethod } from '@/hooks/paymentMethod/usePaymentMethod';
import { PaymentMethodScreenNavigationProp, PaymentMethodScreenRoute } from '@/models/paymentMethod/types';

interface PaymentMethodScreenProps {
  navigation: PaymentMethodScreenNavigationProp;
  route: PaymentMethodScreenRoute;
}

export const PaymentMethodScreen: React.FC<PaymentMethodScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const vm = usePaymentMethod({
    navigation,
    routeParams: route?.params,
  });

  return (
    <PaymentMethodContent
      insets={insets}
      methods={vm.methods}
      brands={vm.brands}
      selectedMethod={vm.selectedMethod}
      selectedBrand={vm.selectedBrand}
      isLoadingMethods={vm.isLoadingMethods}
      isLoadingBrands={vm.isLoadingBrands}
      isSubmitting={vm.isSubmitting}
      onSelectMethod={vm.actions.selectMethod}
      onSelectBrand={vm.actions.selectBrand}
      onConfirm={vm.actions.confirm}
    />
  );
};

