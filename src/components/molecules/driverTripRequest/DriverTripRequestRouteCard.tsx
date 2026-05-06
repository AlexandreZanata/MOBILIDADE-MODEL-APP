import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { DriverTripRequestData } from '@/models/driverTripRequest/types';
import { tdtr } from '@/i18n/driverTripRequest';

interface DriverTripRequestRouteCardProps {
  tripData: DriverTripRequestData;
  originAddress: string;
  destinationAddress: string;
  distanceLabel: string;
  durationLabel: string;
  styles: {
    tripCard: object;
    tripSection: object;
    sectionTitle: object;
    timelineContainer: object;
    timelineColumn: object;
    timelineDot: object;
    timelineLine: object;
    timelineContent: object;
    timelineItem: object;
    locationLabel: object;
    locationText: object;
    paymentBrandBadge: object;
    paymentBrandText: object;
    infoChipsRow: object;
    infoChip: object;
    infoChipText: object;
    priceRow: object;
    priceLabel: object;
    priceValue: object;
  };
  colors: {
    primary: string;
    secondary: string;
    textPrimary: string;
  };
  formatPrice: (value: number) => string;
}

export function DriverTripRequestRouteCard({
  tripData,
  originAddress,
  destinationAddress,
  distanceLabel,
  durationLabel,
  styles,
  colors,
  formatPrice,
}: DriverTripRequestRouteCardProps) {
  return (
    <Card style={styles.tripCard}>
      <View style={styles.tripSection}>
        <Text style={styles.sectionTitle}>{tdtr('routeTitle')}</Text>
        <View style={styles.timelineContainer}>
          <View style={styles.timelineColumn}>
            <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
            <View style={styles.timelineLine} />
            <View style={[styles.timelineDot, { backgroundColor: colors.secondary }]} />
          </View>
          <View style={styles.timelineContent}>
            <View style={styles.timelineItem}>
              <Text style={styles.locationLabel}>{tdtr('originLabel')}</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {originAddress || `${tripData.origin.lat.toFixed(4)}, ${tripData.origin.lng.toFixed(4)}`}
              </Text>
            </View>
            <View style={styles.timelineItem}>
              <Text style={styles.locationLabel}>{tdtr('destinationLabel')}</Text>
              <Text style={styles.locationText} numberOfLines={2}>
                {destinationAddress || `${tripData.destination.lat.toFixed(4)}, ${tripData.destination.lng.toFixed(4)}`}
              </Text>
              {tripData.paymentBrand?.name && (
                <View style={styles.paymentBrandBadge}>
                  <Ionicons name="card" size={14} color={colors.secondary} />
                  <Text style={styles.paymentBrandText}>{tripData.paymentBrand.name}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {(distanceLabel || tripData.category || tripData.paymentMethod?.name) && (
        <View style={styles.tripSection}>
          <Text style={styles.sectionTitle}>{tdtr('detailsTitle')}</Text>
          <View style={styles.infoChipsRow}>
            {distanceLabel && (
              <View style={styles.infoChip}>
                <Ionicons name="navigate" size={16} color={colors.textPrimary} />
                <Text style={styles.infoChipText}>
                  {distanceLabel}
                  {durationLabel ? ` • ${durationLabel}` : ''}
                </Text>
              </View>
            )}
            {tripData.category && (
              <View style={styles.infoChip}>
                <Ionicons name="car" size={16} color={colors.textPrimary} />
                <Text style={styles.infoChipText}>{tripData.category}</Text>
              </View>
            )}
            {tripData.paymentMethod?.name && tripData.paymentMethod.name !== 'Carregando...' && (
              <View style={styles.infoChip}>
                <Ionicons name="card-outline" size={16} color={colors.textPrimary} />
                <Text style={styles.infoChipText}>
                  {tripData.paymentMethod.name}
                  {tripData.paymentBrand?.name ? ` • ${tripData.paymentBrand.name}` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>{tdtr('estimatedFareLabel')}</Text>
        <Text style={styles.priceValue}>{formatPrice(tripData.estimatedFare)}</Text>
      </View>
    </Card>
  );
}
