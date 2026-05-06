import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DriverVehicleFormModal } from '@/components/organisms/driverVehicles/DriverVehicleFormModal';
import { DriverVehiclesContent } from '@/components/organisms/driverVehicles/DriverVehiclesContent';
import { useTheme } from '@/context/ThemeContext';
import { useDriverVehicles } from '@/hooks/driverVehicles/useDriverVehicles';

type DriverVehiclesScreenProps = {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
};

export const DriverVehiclesScreen: React.FC<DriverVehiclesScreenProps> = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const vm = useDriverVehicles();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });

  if (vm.isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <>
      <DriverVehiclesContent
        insets={insets}
        vehicles={vm.vehicles}
        uploadingVehicleId={vm.uploadingVehicleId}
        isDocumentPending={vm.helpers.isDocumentPending}
        onUploadDocument={vm.actions.handleUploadDocument}
        onAddVehicle={vm.actions.openModal}
      />
      <DriverVehicleFormModal
        visible={vm.showAddModal}
        insets={insets}
        isSubmitting={vm.isSubmitting}
        serviceCategories={vm.serviceCategories}
        form={vm.form}
        actions={vm.actions}
      />
    </>
  );
};
