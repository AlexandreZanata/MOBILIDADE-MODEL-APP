import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '@/components/atoms/Card';

interface RideStatusCardProps {
  statusLabel: string;
  statusColor: string;
  styles: {
    section: object;
    sectionTitle: object;
    statusCard: object;
    statusCardContent: object;
    statusText: object;
  };
  title: string;
}

export function RideStatusCard(props: RideStatusCardProps) {
  return (
    <View style={props.styles.section}>
      <Text style={props.styles.sectionTitle}>{props.title}</Text>
      <Card style={props.styles.statusCard}>
        <View style={props.styles.statusCardContent}>
          <Text style={[props.styles.statusText, { color: props.statusColor }]}>{props.statusLabel}</Text>
        </View>
      </Card>
    </View>
  );
}
