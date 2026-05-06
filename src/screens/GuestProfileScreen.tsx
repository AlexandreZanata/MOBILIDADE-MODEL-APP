import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { useGuestProfile } from '@/hooks/guestProfile/useGuestProfile';
import { GuestProfileContent } from '@/components/organisms/guestProfile/GuestProfileContent';

interface GuestProfileScreenProps {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}

export const GuestProfileScreen: React.FC<GuestProfileScreenProps> = ({ navigation }) => {
  const vm = useGuestProfile({ navigation });
  return <GuestProfileContent viewData={vm.viewData} onNavigate={vm.onNavigate} />;
};

