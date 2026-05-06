import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Button from '@/components/atoms/Button';
import { spacing, typography } from '@/theme';
import { HistoryViewState } from '@/services/history/historyFacade';
import { th } from '@/i18n/history';

interface HistoryScreenContentProps {
  colors: {
    background: string;
    textPrimary: string;
    textSecondary: string;
    primary: string;
  };
  isDark: boolean;
  insetsTop: number;
  insetsBottom: number;
  title: string;
  viewState: HistoryViewState;
  onPressLogin(): void;
}

export function HistoryScreenContent({
  colors,
  isDark,
  insetsTop,
  insetsBottom,
  title,
  viewState,
  onPressLogin,
}: HistoryScreenContentProps) {
  const styles = createStyles(colors, insetsTop, insetsBottom);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{viewState.subtitle}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="wallet-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{viewState.title}</Text>
          <Text style={styles.emptyText}>{viewState.message}</Text>

          {viewState.showLoginAction && (
            <Button
              title={th('loginButton')}
              onPress={onPressLogin}
              variant="primary"
              fullWidth
              style={styles.loginButton}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(
  colors: HistoryScreenContentProps['colors'],
  insetsTop: number,
  insetsBottom: number
) {
  const primaryTint = `${colors.primary}14`;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: Math.max(insetsTop, spacing.lg) + spacing.sm,
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
      paddingBottom: Math.max(insetsBottom, spacing.lg),
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
      backgroundColor: primaryTint,
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
}
