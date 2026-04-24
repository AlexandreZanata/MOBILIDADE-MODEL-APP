import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { spacing, typography, shadows } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/Button';

interface GuestProfileScreenProps {
  navigation: any;
}

export const GuestProfileScreen: React.FC<GuestProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 0,
      paddingTop: 0,
    },
    headerContainer: {
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
    },
    profileSection: {
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    avatarContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      borderWidth: 3,
      borderColor: colors.border,
      ...shadows.small,
    },
    avatarIcon: {
      fontSize: 48,
      color: colors.textSecondary,
    },
    userInfo: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    userName: {
      ...typography.h2,
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    userSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      fontSize: 15,
      textAlign: 'center',
    },
    infoContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
    },
    infoCard: {
      marginBottom: spacing.md,
    },
    infoCardHeader: {
      marginBottom: spacing.md,
    },
    infoCardTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    infoCardSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      fontSize: 14,
    },
    actionButtons: {
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    loginButton: {
      minHeight: 56,
      height: 56,
      borderRadius: 16,
      ...shadows.medium,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      elevation: 6,
    },
    registerButton: {
      minHeight: 56,
      height: 56,
      borderRadius: 16,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          contentInsetAdjustmentBehavior="automatic"
          bounces={true}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>Navegação Anônima</Text>
                <Text style={styles.userSubtitle}>
                  Você está explorando o aplicativo. Faça login para acessar todas as funcionalidades
                </Text>
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoContainer}>
            <Card style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Text style={styles.infoCardTitle}>Bem-vindo ao VAMU</Text>
                <Text style={styles.infoCardSubtitle}>
                  Crie uma conta ou faça login para começar a usar nossos serviços
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  title="Fazer Login"
                  onPress={() => navigation.navigate('Login')}
                  variant="primary"
                  fullWidth
                  style={styles.loginButton}
                />
                <Button
                  title="Criar Conta"
                  onPress={() => navigation.navigate('Register')}
                  variant="ghost"
                  fullWidth
                  style={styles.registerButton}
                />
              </View>
            </Card>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

