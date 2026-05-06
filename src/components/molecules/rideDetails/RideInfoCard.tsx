import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/atoms/Card';
import { RideDetailsRide } from '@/models/rideDetails/types';
import { trd } from '@/i18n/rideDetails';

interface RideInfoCardProps {
  ride: RideDetailsRide;
  primaryColor: string;
  warningColor: string;
  formatDistance: (value?: number) => string | null;
  formatDuration: (value?: number) => string | null;
  formatDate: (value?: string) => string;
  styles: {
    section: object;
    sectionTitle: object;
    infoCard: object;
    infoCardContent: object;
    infoRowWithIcon: object;
    infoIcon: object;
    infoTextContainer: object;
    infoLabel: object;
    infoValue: object;
    divider: object;
  };
}

function InfoRow(props: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  value: string;
  styles: RideInfoCardProps['styles'];
}) {
  return (
    <View style={props.styles.infoRowWithIcon}>
      <View style={props.styles.infoIcon}>
        <Ionicons name={props.icon} size={18} color={props.iconColor} />
      </View>
      <View style={props.styles.infoTextContainer}>
        <Text style={props.styles.infoLabel}>{props.label}</Text>
        <Text style={props.styles.infoValue}>{props.value}</Text>
      </View>
    </View>
  );
}

export function RideInfoCard(props: RideInfoCardProps) {
  const distance = props.formatDistance(props.ride.distanceKm);
  const duration = props.formatDuration(props.ride.durationMinutes);

  return (
    <View style={props.styles.section}>
      <Text style={props.styles.sectionTitle}>{trd('rideInfoSection')}</Text>
      <Card style={props.styles.infoCard}>
        <View style={props.styles.infoCardContent}>
          {distance && (
            <>
              <InfoRow
                icon="airplane"
                iconColor={props.primaryColor}
                label={trd('distanceLabel')}
                value={distance}
                styles={props.styles}
              />
              <View style={props.styles.divider} />
            </>
          )}
          {duration && (
            <>
              <InfoRow
                icon="time-outline"
                iconColor={props.primaryColor}
                label={trd('durationLabel')}
                value={duration}
                styles={props.styles}
              />
              <View style={props.styles.divider} />
            </>
          )}
          {props.ride.surge && props.ride.surge > 1 && (
            <>
              <InfoRow
                icon="flash"
                iconColor={props.warningColor}
                label={trd('multiplierLabel')}
                value={`${props.ride.surge.toFixed(1)}x`}
                styles={props.styles}
              />
              <View style={props.styles.divider} />
            </>
          )}
          <InfoRow
            icon="calendar-outline"
            iconColor={props.primaryColor}
            label={trd('requestedAtLabel')}
            value={props.formatDate(props.ride.requestedAt ?? props.ride.createdAt)}
            styles={props.styles}
          />
        </View>
      </Card>
    </View>
  );
}
