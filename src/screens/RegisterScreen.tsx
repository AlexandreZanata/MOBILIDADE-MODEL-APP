import React, { useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RegisterScreenContent } from '@/components/organisms/register/RegisterScreenContent';
import { useRegisterScreen } from '@/hooks/register/useRegisterScreen';
import { RegisterUserType } from '@/models/register/types';

type RegisterNavigationParams = {
  Register: undefined;
  Login: undefined;
  VerifyEmail: { email: string; userType: RegisterUserType };
};

interface RegisterScreenProps {
  navigation: NavigationProp<RegisterNavigationParams, 'Register'>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const {
    insets,
    colors,
    isDark,
    userType,
    form,
    errors,
    isSubmitting,
    showPassword,
    showConfirmPassword,
    gradientColors,
    gradientHeight,
    setUserType,
    setField,
    setShowPassword,
    setShowConfirmPassword,
    clearFieldError,
    submit,
  } = useRegisterScreen();

  const onEmailVerification = useCallback(
    (email: string, type: RegisterUserType) => {
      requestAnimationFrame(() => {
        navigation.navigate('VerifyEmail', { email, userType: type });
      });
    },
    [navigation]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <RegisterScreenContent
        colors={colors}
        isDark={isDark}
        insetsTop={insets.top}
        insetsBottom={insets.bottom}
        gradientColors={gradientColors}
        gradientHeight={gradientHeight}
        userType={userType}
        form={form}
        errors={errors}
        isSubmitting={isSubmitting}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        onChangeUserType={setUserType}
        onChangeField={setField}
        onClearError={clearFieldError}
        onToggleShowPassword={() => setShowPassword((prev) => !prev)}
        onToggleShowConfirmPassword={() => setShowConfirmPassword((prev) => !prev)}
        onSubmit={() => {
          submit(onEmailVerification);
        }}
        onNavigateLogin={() => navigation.navigate('Login')}
      />
    </SafeAreaView>
  );
};

export default RegisterScreen;

