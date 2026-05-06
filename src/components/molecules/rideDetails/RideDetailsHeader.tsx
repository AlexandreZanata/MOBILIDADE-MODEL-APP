import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { trd } from '@/i18n/rideDetails';

interface RideDetailsHeaderProps {
  onBack: () => void;
  textColor: string;
  styles: {
    header: object;
    backButton: object;
    headerTitle: object;
  };
}

export function RideDetailsHeader(props: RideDetailsHeaderProps) {
  return (
    <View style={props.styles.header}>
      <TouchableOpacity onPress={props.onBack} style={props.styles.backButton} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={props.textColor} />
      </TouchableOpacity>
      <Text style={props.styles.headerTitle}>{trd('title')}</Text>
    </View>
  );
}
