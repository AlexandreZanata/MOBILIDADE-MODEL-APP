import React, { useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { LoginScreenContent } from '@/components/organisms/login/LoginScreenContent';
import { useLoginScreen } from '@/hooks/login/useLoginScreen';

type LoginNavigationParams = {
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string; userType: 'passenger' | 'driver' };
};

interface LoginScreenProps {
  navigation: NavigationProp<LoginNavigationParams, 'Login'>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const {
    insets,
    colors,
    formData,
    errors,
    showPassword,
    isSubmitting,
    isLoading,
    gradientColors,
    backgroundGradientHeight,
    setShowPassword,
    onChangeEmail,
    onChangePassword,
    onForgotPassword,
    submit,
  } = useLoginScreen();

  const onEmailVerification = useCallback(
    (email: string, userType: 'passenger' | 'driver') => {
      requestAnimationFrame(() => {
        navigation.navigate('VerifyEmail', { email, userType });
      });
    },
    [navigation]
  );

  return (
    <LoginScreenContent
      colors={colors}
      insetsTop={insets.top}
      gradientColors={gradientColors}
      backgroundGradientHeight={backgroundGradientHeight}
      email={formData.email}
      password={formData.password}
      errors={errors}
      showPassword={showPassword}
      isSubmitting={isSubmitting}
      isLoading={isLoading}
      onChangeEmail={onChangeEmail}
      onChangePassword={onChangePassword}
      onToggleShowPassword={() => setShowPassword((previous) => !previous)}
      onForgotPassword={onForgotPassword}
      onSubmit={() => {
        submit(onEmailVerification);
      }}
      onNavigateRegister={() => navigation.navigate('Register')}
    />
  );
};
