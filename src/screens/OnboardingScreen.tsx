import React from 'react';
import {
  View,
  Text,
  StyleSheet,

} from 'react-native';
import Button from '@/components/Button';
import { spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface OnboardingScreenProps {
  title: string;
  subtitle: string;
  icon: string;
  onNext: () => void;
  isLast?: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  title,
  subtitle,
  icon,
  onNext,
  isLast = false,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl * 2,
      paddingBottom: spacing.xxl,
    },
    illustrationContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingBottom: spacing.xl,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    buttonContainer: {
      marginTop: spacing.lg,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.illustrationContainer}>
        <Ionicons name={icon as any} size={120} color={colors.secondary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.buttonContainer}>
          <Button
            title={isLast ? 'Começar' : 'Continuar'}
            onPress={onNext}
            variant="secondary"
            fullWidth
          />
        </View>
      </View>
    </View>
  );
};

