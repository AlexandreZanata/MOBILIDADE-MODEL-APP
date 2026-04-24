import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Avatar } from '@/components/atoms/Avatar';
import { spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { StarRating } from '@/components/atoms/StarRating';

interface DriverScreenProps {
  navigation: any;
  route?: {
    params?: {
      userLocation?: { lat: number; lon: number };
    };
  };
}

export const DriverScreen: React.FC<DriverScreenProps> = ({ navigation, route }) => {
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
      paddingBottom: spacing.xl,
    },
    profileSection: {
      alignItems: 'center',
      paddingBottom: spacing.md,
      paddingTop: Math.max(insets.top, spacing.xl) + spacing.lg,
      backgroundColor: colors.background,
    },
    driverName: {
      ...typography.h1,
      color: colors.textPrimary,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    rating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    ratingText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    carCard: {
      margin: spacing.md,
      marginTop: spacing.md,
    },
    carHeader: {
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    carHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    carTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    carInfo: {
      gap: spacing.sm,
    },
    carItem: {
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    carItemContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    carIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: hexToRgba(colors.textSecondary, 0.06),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    carItemText: {
      flex: 1,
      gap: 2,
    },
    carLabel: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      fontFamily: 'Poppins-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    carValue: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      color: colors.textPrimary,
      fontFamily: 'Poppins-Regular',
    },
    deliveryCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    deliveryHeader: {
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    deliveryHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    deliveryTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'Poppins-SemiBold',
    },
    deliveryInfo: {
      gap: spacing.sm,
    },
    deliveryItem: {
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    deliveryItemContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    deliveryIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: hexToRgba(colors.primary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    deliveryTimeIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: hexToRgba(colors.textSecondary, 0.06),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    deliveryItemText: {
      flex: 1,
      gap: 2,
    },
    deliveryLabel: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      fontFamily: 'Poppins-SemiBold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    deliveryValue: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      color: colors.textPrimary,
      fontFamily: 'Poppins-Regular',
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.md),
      backgroundColor: colors.background,
      gap: spacing.md,
    },
    rejectButton: {
      flex: 1,
    },
    acceptButton: {
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.profileSection}>
          <Avatar
            size={100}
            name="João Silva"
          />
          <Text style={styles.driverName}>João Silva</Text>
          <View style={styles.rating}>
            <StarRating
              rating={10}
              maxRating={10}
              starCount={5}
              starSize={20}
              showRatingText={false}
            />
            <Text style={styles.ratingText}>5.0 (247 avaliações)</Text>
          </View>
        </View>

        <Card style={styles.carCard}>
          <View style={styles.carHeader}>
            <View style={styles.carHeaderContent}>
              <Ionicons name="car-outline" size={20} color={colors.primary} />
              <Text style={styles.carTitle}>Detalhes do Veículo</Text>
            </View>
          </View>
          <View style={styles.carInfo}>
            <View style={styles.carItem}>
              <View style={styles.carItemContent}>
                <View style={styles.carIconContainer}>
                  <Ionicons name="car" size={16} color={colors.textSecondary} />
                </View>
                <View style={styles.carItemText}>
                  <Text style={styles.carLabel}>Modelo</Text>
                  <Text style={styles.carValue}>Honda Civic 2020</Text>
                </View>
              </View>
            </View>
            <View style={styles.carItem}>
              <View style={styles.carItemContent}>
                <View style={styles.carIconContainer}>
                  <Ionicons name="document-text" size={16} color={colors.textSecondary} />
                </View>
                <View style={styles.carItemText}>
                  <Text style={styles.carLabel}>Placa</Text>
                  <Text style={styles.carValue}>ABC-1234</Text>
                </View>
              </View>
            </View>
            <View style={[styles.carItem, { borderBottomWidth: 0 }]}>
              <View style={styles.carItemContent}>
                <View style={styles.carIconContainer}>
                  <Ionicons name="color-fill" size={16} color={colors.textSecondary} />
                </View>
                <View style={styles.carItemText}>
                  <Text style={styles.carLabel}>Cor</Text>
                  <Text style={styles.carValue}>Branco</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        <Card style={styles.deliveryCard}>
          <View style={styles.deliveryHeader}>
            <View style={styles.deliveryHeaderContent}>
              <Ionicons name="cube-outline" size={20} color={colors.primary} />
              <Text style={styles.deliveryTitle}>Entrega</Text>
            </View>
          </View>
          <View style={styles.deliveryInfo}>
            <View style={styles.deliveryItem}>
              <View style={styles.deliveryItemContent}>
                <View style={styles.deliveryIconContainer}>
                  <Ionicons name="location" size={18} color={colors.primary} />
                </View>
                <View style={styles.deliveryItemText}>
                  <Text style={styles.deliveryLabel}>Local</Text>
                  <Text style={styles.deliveryValue} numberOfLines={2}>
                    Rua das Flores, 123 - Centro
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.deliveryItem}>
              <View style={styles.deliveryItemContent}>
                <View style={styles.deliveryTimeIconContainer}>
                  <Ionicons name="time" size={16} color={colors.textSecondary} />
                </View>
                <View style={styles.deliveryItemText}>
                  <Text style={styles.deliveryLabel}>Tempo</Text>
                  <Text style={styles.deliveryValue}>25 min</Text>
                </View>
              </View>
            </View>
            <View style={[styles.deliveryItem, { borderBottomWidth: 0 }]}>
              <View style={styles.deliveryItemContent}>
                <View style={styles.deliveryTimeIconContainer}>
                  <Ionicons name="cash" size={16} color={colors.textSecondary} />
                </View>
                <View style={styles.deliveryItemText}>
                  <Text style={styles.deliveryLabel}>Valor</Text>
                  <Text style={styles.deliveryValue}>R$ 18,90</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Recusar"
          onPress={() => navigation.goBack()}
          variant="ghost"
          style={styles.rejectButton}
        />
        <Button
          title="Aceitar"
          onPress={() => {
            // Passa a localização do usuário para a próxima tela
            const userLocation = route?.params?.userLocation;
            navigation.navigate('WaitingForDriver', {
              userLocation: userLocation || undefined,
            });
          }}
          variant="secondary"
          style={styles.acceptButton}
        />
      </View>
    </View>
  );
};

