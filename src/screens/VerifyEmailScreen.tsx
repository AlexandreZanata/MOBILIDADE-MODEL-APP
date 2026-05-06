import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { VerifyEmailScreenContent } from '@/components/organisms/verifyEmail/VerifyEmailScreenContent';
import { useVerifyEmailScreen } from '@/hooks/verifyEmail/useVerifyEmailScreen';

type VerifyEmailNavigationParams = {
  VerifyEmail: { email?: string; userType?: 'passenger' | 'driver' };
  Login: undefined;
  Register: undefined;
};

interface VerifyEmailScreenProps {
  navigation: NavigationProp<VerifyEmailNavigationParams, 'VerifyEmail'>;
  route?: { params?: { email?: string; userType?: 'passenger' | 'driver' } };
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ navigation, route }) => {
  const state = useVerifyEmailScreen({
    initialEmail: route?.params?.email,
    initialUserType: route?.params?.userType,
    onNavigateLogin: () => navigation.navigate('Login'),
    onNavigateRegister: () => navigation.navigate('Register'),
  });

  return (
    <VerifyEmailScreenContent
      colors={state.colors}
      insetsTop={state.insets.top}
      insetsBottom={state.insets.bottom}
      email={state.email}
      digits={state.digits}
      focusedIndex={state.focusedIndex}
      error={state.error}
      isSubmitting={state.isSubmitting}
      inputRefs={state.inputRefs}
      onChangeDigit={state.onChangeDigit}
      onKeyPress={state.onKeyPress}
      onSetFocusedIndex={state.setFocusedIndex}
      onVerify={state.onVerify}
      onAlreadyVerified={state.onAlreadyVerified}
      onResendCode={state.onResendCode}
    />
  );
};

