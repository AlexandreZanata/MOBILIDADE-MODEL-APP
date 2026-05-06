import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { Avatar } from '@/components/atoms/Avatar';
import { StarRatingBadge } from '@/components/atoms/StarRating';
import { RideDetailsPerson } from '@/models/rideDetails/types';
import { trd } from '@/i18n/rideDetails';

interface RidePersonCardProps {
  isDriver: boolean;
  person: RideDetailsPerson | null;
  personPhoto?: string;
  primaryColor: string;
  styles: {
    section: object;
    sectionTitle: object;
    userCard: object;
    userCardContent: object;
    userHeader: object;
    userInfo: object;
    userName: object;
    vehicleInfo: object;
    vehicleTitleRow: object;
    vehicleTitle: object;
    vehicleGrid: object;
    vehicleItem: object;
    vehicleLabel: object;
    vehicleValue: object;
  };
}

export function RidePersonCard(props: RidePersonCardProps) {
  const sectionTitle = props.isDriver ? trd('passengerLabel') : trd('driverLabel');
  const fallbackName = props.isDriver ? trd('passengerMissing') : trd('driverMissing');

  return (
    <View style={props.styles.section}>
      <Text style={props.styles.sectionTitle}>{sectionTitle}</Text>
      <Card style={props.styles.userCard}>
        <View style={props.styles.userCardContent}>
          <View style={props.styles.userHeader}>
            <Avatar uri={props.personPhoto} name={props.person?.name ?? sectionTitle} size={50} />
            <View style={props.styles.userInfo}>
              <Text style={props.styles.userName}>{props.person?.name ?? fallbackName}</Text>
              {props.person?.rating !== undefined && <StarRatingBadge rating={props.person.rating} />}
            </View>
          </View>
          {!props.isDriver && props.person?.vehicle && (
            <View style={props.styles.vehicleInfo}>
              <View style={props.styles.vehicleTitleRow}>
                <Ionicons name="car" size={18} color={props.primaryColor} />
                <Text style={props.styles.vehicleTitle}>{trd('vehicleTitle')}</Text>
              </View>
              <View style={props.styles.vehicleGrid}>
                <View style={props.styles.vehicleItem}>
                  <Text style={props.styles.vehicleLabel}>{trd('vehiclePlate')}</Text>
                  <Text style={props.styles.vehicleValue}>{props.person.vehicle.licensePlate ?? '-'}</Text>
                </View>
                <View style={props.styles.vehicleItem}>
                  <Text style={props.styles.vehicleLabel}>{trd('vehicleColor')}</Text>
                  <Text style={props.styles.vehicleValue}>{props.person.vehicle.color ?? '-'}</Text>
                </View>
                <View style={props.styles.vehicleItem}>
                  <Text style={props.styles.vehicleLabel}>{trd('vehicleBrand')}</Text>
                  <Text style={props.styles.vehicleValue}>{props.person.vehicle.brand ?? '-'}</Text>
                </View>
                <View style={props.styles.vehicleItem}>
                  <Text style={props.styles.vehicleLabel}>{trd('vehicleModel')}</Text>
                  <Text style={props.styles.vehicleValue}>{props.person.vehicle.model ?? '-'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}
