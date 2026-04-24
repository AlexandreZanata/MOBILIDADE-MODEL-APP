import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { spacing, typography } from '@/theme';
import { useTheme } from '@/context/ThemeContext';

interface NotificationScreenProps {
  navigation: any;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'promotion' | 'system' | 'driver';
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Motorista a caminho',
    message: 'João Silva está a 5 minutos do seu endereço',
    time: 'Agora',
    type: 'driver',
    read: false,
  },
  {
    id: '2',
    title: 'Corrida aceita',
    message: 'Sua corrida foi aceita! O motorista está vindo até você',
    time: 'Há 10 min',
    type: 'order',
    read: false,
  },
  {
    id: '3',
    title: 'Promoção especial',
    message: 'Desconto de 20% na sua próxima corrida! Use o cupom: VAMU20',
    time: 'Há 1 hora',
    type: 'promotion',
    read: true,
  },
  {
    id: '4',
    title: 'Entrega concluída',
    message: 'Sua entrega foi finalizada com sucesso. Avalie sua experiência!',
    time: 'Ontem',
    type: 'order',
    read: true,
  },
  {
    id: '5',
    title: 'Atualização do app',
    message: 'Nova versão disponível com melhorias de performance',
    time: 'Há 2 dias',
    type: 'system',
    read: true,
  },
  {
    id: '6',
    title: 'Corrida cancelada',
    message: 'Infelizmente sua corrida foi cancelada. Tente novamente',
    time: 'Há 3 dias',
    type: 'order',
    read: true,
  },
];

export const NotificationsScreen: React.FC<NotificationScreenProps> = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const getStatusColor = (read: boolean) => {
    return read ? colors.textSecondary : colors.primary;
  };

  const getStatusText = (read: boolean) => {
    return read ? 'Lida' : 'Nova';
  };
    const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.md,
      paddingTop: Math.max(insets.top, spacing.lg) + spacing.md,
    },
    header: {
      marginBottom: spacing.lg,
    },
    headerTitle: {
      ...typography.h1,
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    headerSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      fontSize: 14,
    },
    notificationCard: {
      marginBottom: spacing.xs,
    },
    notificationHeader: {
      marginBottom: spacing.xs,
    },
    notificationInfo: {
      marginBottom: 2,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2,
    },
    notificationTitle: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: 15,
      flex: 1,
      marginRight: spacing.xs,
    },
    notificationTime: {
      ...typography.caption,
      color: colors.textSecondary,
      fontSize: 13,
    },
    statusBadge: {
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 3,
      borderRadius: 6,
      flexShrink: 0,
    },
    statusText: {
      ...typography.caption,
      fontWeight: '600',
      fontSize: 11,
    },
    notificationFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 0,
    },
    notificationMessage: {
      ...typography.caption,
      color: colors.textSecondary,
      fontSize: 12,
    },
  });

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notificações</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0
              ? `${unreadCount} ${unreadCount === 1 ? 'nova' : 'novas'} notificação${unreadCount === 1 ? '' : 'ões'}`
              : 'Nenhuma notificação nova'}
          </Text>
        </View>
        {mockNotifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <Card style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notificationTitle} numberOfLines={2}>
                      {notification.title}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(notification.read) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(notification.read) },
                        ]}
                      >
                        {getStatusText(notification.read)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.notificationTime}>{notification.time}</Text>
                </View>
              </View>
              <View style={styles.notificationFooter}>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

