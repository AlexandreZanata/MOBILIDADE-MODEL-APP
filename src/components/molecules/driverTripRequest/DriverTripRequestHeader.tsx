import React from 'react';
import { Text, View } from 'react-native';
import { Avatar } from '@/components/atoms/Avatar';
import { StarRatingBadge } from '@/components/atoms/StarRating';
import { Ionicons } from '@expo/vector-icons';
import { DriverTripRequestPassenger } from '@/models/driverTripRequest/types';

interface DriverTripRequestHeaderProps {
  passenger: DriverTripRequestPassenger | null;
  title: string;
  subtitle: string;
  timerValue: number | null;
  fallbackPassengerName: string;
  textSecondaryColor: string;
  styles: {
    header: object;
    title: object;
    subtitle: object;
    timerContainer: object;
    timerText: object;
    passengerCard: object;
    passengerAvatarWrapper: object;
    passengerDetails: object;
    passengerNameLarge: object;
    passengerMetaRow: object;
    passengerIdPill: object;
    passengerIdText: object;
  };
}

export function DriverTripRequestHeader({
  passenger,
  title,
  subtitle,
  timerValue,
  fallbackPassengerName,
  textSecondaryColor,
  styles,
}: DriverTripRequestHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {passenger && (
          <View style={styles.passengerCard}>
            <View style={styles.passengerAvatarWrapper}>
              <Avatar uri={passenger.photoUri} name={passenger.name || 'P'} size={60} showBorder />
            </View>
            <View style={styles.passengerDetails}>
              <Text style={styles.passengerNameLarge}>{passenger.name || fallbackPassengerName}</Text>
              <View style={styles.passengerMetaRow}>
                {typeof passenger.rating === 'number' && passenger.rating > 0 && (
                  <StarRatingBadge rating={passenger.rating} maxRating={10} starCount={5} starSize={13} />
                )}
                {passenger.id && (
                  <View style={styles.passengerIdPill}>
                    <Ionicons name="person" size={12} color={textSecondaryColor} />
                    <Text style={styles.passengerIdText}>{passenger.id.slice(0, 6)}...</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{Math.max(0, timerValue ?? 0)}</Text>
      </View>
    </View>
  );
}
