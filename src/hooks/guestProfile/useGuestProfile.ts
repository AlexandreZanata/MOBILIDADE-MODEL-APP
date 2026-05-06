import { useMemo } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { guestProfileFacade } from '@/services/guestProfile/guestProfileFacade';
import { GuestProfileNavigationTarget } from '@/models/guestProfile/types';

interface UseGuestProfileParams {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
}

export function useGuestProfile({ navigation }: UseGuestProfileParams) {
  const viewData = useMemo(() => guestProfileFacade.getViewData(), []);

  const onNavigate = (target: GuestProfileNavigationTarget) => {
    navigation.navigate(target);
  };

  return {
    viewData,
    onNavigate,
  };
}
