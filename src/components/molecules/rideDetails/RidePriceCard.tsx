import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { RideDetailsRide } from '@/models/rideDetails/types';
import { trd } from '@/i18n/rideDetails';

interface RidePriceCardProps {
  ride: RideDetailsRide;
  primaryColor: string;
  formatPrice: (value?: number | null) => string;
  styles: {
    section: object;
    sectionTitle: object;
    priceCard: object;
    priceCardContent: object;
    priceMainRow: object;
    priceLabelContainer: object;
    priceLabelIcon: object;
    priceLabel: object;
    priceValue: object;
    priceEstimatedRow: object;
    priceEstimatedLabel: object;
    priceEstimatedValue: object;
  };
}

export function RidePriceCard(props: RidePriceCardProps) {
  const hasFinalPrice = Boolean(props.ride.finalPrice);

  return (
    <View style={props.styles.section}>
      <Text style={props.styles.sectionTitle}>{trd('valueSection')}</Text>
      <Card style={props.styles.priceCard}>
        <View style={props.styles.priceCardContent}>
          <View style={props.styles.priceMainRow}>
            <View style={props.styles.priceLabelContainer}>
              <View style={props.styles.priceLabelIcon}>
                <Ionicons name="wallet-outline" size={20} color={props.primaryColor} />
              </View>
              <Text style={props.styles.priceLabel}>
                {hasFinalPrice ? trd('finalPriceLabel') : trd('estimatedPriceLabel')}
              </Text>
            </View>
            <Text style={props.styles.priceValue}>
              {props.formatPrice(hasFinalPrice ? props.ride.finalPrice : props.ride.estimatedPrice)}
            </Text>
          </View>
          {hasFinalPrice &&
            props.ride.estimatedPrice &&
            props.ride.estimatedPrice !== props.ride.finalPrice && (
              <View style={props.styles.priceEstimatedRow}>
                <Text style={props.styles.priceEstimatedLabel}>{trd('estimatedPriceLabel')}</Text>
                <Text style={props.styles.priceEstimatedValue}>
                  {props.formatPrice(props.ride.estimatedPrice)}
                </Text>
              </View>
            )}
        </View>
      </Card>
    </View>
  );
}
