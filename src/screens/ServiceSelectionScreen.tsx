import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/Button';
import { Card } from '@/components/Card';
import { spacing, typography, borders } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface ServiceSelectionScreenProps {
  navigation: any;
  route?: {
    params?: {
      userLocation?: { lat: number; lon: number };
    };
  };
}

interface ServiceType {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  price: string;
  time: string;
}

const services: ServiceType[] = [
  {
    id: '1',
    name: 'Normal',
    icon: 'cube-outline',
    price: 'R$ 12,90',
    time: '30-45 min',
  },
  {
    id: '2',
    name: 'Express',
    icon: 'flash-outline',
    price: 'R$ 18,90',
    time: '15-20 min',
  },
  {
    id: '3',
    name: 'Agendada',
    icon: 'calendar-outline',
    price: 'R$ 10,90',
    time: 'Escolha o horário',
  },
];

export const ServiceSelectionScreen: React.FC<ServiceSelectionScreenProps> = ({
  navigation,
  route,
}) => {
  const [selectedService, setSelectedService] = useState<string>('1');
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: spacing.md,
      paddingTop: Math.max(insets.top, spacing.lg) + spacing.md,
      paddingBottom: spacing.md,
    },
    horizontalScrollContainer: {
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    serviceCard: {
      marginBottom: Platform.OS === 'ios' ? 0 : spacing.xs,
      width: Platform.OS === 'ios' ? 320 : undefined,
      borderWidth: 1,
      borderColor: colors.border,
    },
    serviceCardSelected: {
      borderWidth: 2,
      borderColor: colors.secondary,
    },
    serviceContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    serviceIconContainer: {
      width: 64,
      height: 64,
      borderRadius: borders.radiusMedium,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    serviceIconContainerSelected: {
      backgroundColor: hexToRgba(colors.secondary, 0.1),
    },
    serviceIcon: {
      // Icon styling handled by Ionicons component
    },
    serviceInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    serviceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    serviceName: {
      ...typography.h2,
      fontSize: 18,
      lineHeight: 24,
      color: colors.textPrimary,
      flex: 1,
    },
    serviceNameSelected: {
      color: colors.secondary,
    },
    checkIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    serviceDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    serviceTime: {
      ...typography.caption,
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
    },
    servicePrice: {
      ...typography.h2,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    servicePriceSelected: {
      color: colors.secondary,
    },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.md),
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });

  const renderServices = () => {
    const renderServiceCard = (service: ServiceType) => {
      const isSelected = selectedService === service.id;
      
      return (
        <TouchableOpacity
          key={service.id}
          onPress={() => setSelectedService(service.id)}
          activeOpacity={0.8}
        >
          <Card
            style={StyleSheet.flatten([
              styles.serviceCard,
              isSelected && styles.serviceCardSelected,
            ])}
            selected={isSelected}
          >
            <View style={styles.serviceContent}>
              <View
                style={[
                  styles.serviceIconContainer,
                  isSelected && styles.serviceIconContainerSelected,
                ]}
              >
                <Ionicons
                  name={service.icon}
                  size={28}
                  color={
                    isSelected
                      ? colors.secondary
                      : colors.textSecondary
                  }
                />
              </View>
              <View style={styles.serviceInfo}>
                <View style={styles.serviceHeader}>
                  <Text
                    style={[
                      styles.serviceName,
                      isSelected && styles.serviceNameSelected,
                    ]}
                  >
                    {service.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </View>
                <View style={styles.serviceDetails}>
                  <Text style={styles.serviceTime}>{service.time}</Text>
                  <Text
                    style={[
                      styles.servicePrice,
                      isSelected && styles.servicePriceSelected,
                    ]}
                  >
                    {service.price}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    };

    if (Platform.OS === 'ios') {
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {services.map(renderServiceCard)}
        </ScrollView>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {services.map(renderServiceCard)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={Platform.OS === 'ios' ? styles.contentContainer : undefined}
      >
        {renderServices()}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title="Confirmar"
          onPress={() => {
            // Passa a localização do usuário para a próxima tela
            const userLocation = route?.params?.userLocation;
            navigation.navigate('Driver', {
              userLocation: userLocation || undefined,
            });
          }}
          variant="secondary"
          fullWidth
        />
      </View>
    </View>
  );
};

