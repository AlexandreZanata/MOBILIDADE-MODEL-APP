import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/atoms/Button';

interface HistoryScreenProps {
  navigation: any;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuth();

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: Math.max(insets.top, spacing.lg) + spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.background,
    },
    headerTitle: {
      ...typography.h1,
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      ...typography.body,
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      minHeight: 400,
    },
    emptyIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: hexToRgba(colors.primary, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      ...typography.h2,
      fontSize: 20,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      textAlign: 'center',
      fontWeight: '700',
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      fontSize: 15,
      lineHeight: 22,
    },
    loginButton: {
      marginTop: spacing.lg,
      minHeight: 56,
      height: 56,
      borderRadius: 16,
    },
  });
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pagamentos</Text>
        <Text style={styles.headerSubtitle}>
          {isAuthenticated 
            ? 'Gerencie seus métodos de pagamento' 
            : 'Faça login para ver seu histórico de pagamentos'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {!isAuthenticated ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Faça login para continuar</Text>
            <Text style={styles.emptyText}>
              Você precisa estar logado para ver seu histórico de pagamentos
            </Text>
            <Button
              title="Fazer Login"
              onPress={() => navigation.navigate('Login')}
              variant="primary"
              fullWidth
              style={styles.loginButton}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum pagamento ainda</Text>
            <Text style={styles.emptyText}>
              Seus métodos de pagamento aparecerão aqui quando você adicionar um
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

