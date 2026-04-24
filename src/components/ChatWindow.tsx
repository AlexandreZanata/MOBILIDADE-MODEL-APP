/**
 * ChatWindow - Componente de Chat em Tela Cheia
 * Design moderno como WhatsApp/Telegram
 * 
 * Solução robusta para teclado que funciona em todos os dispositivos:
 * - iOS: KeyboardWillShow/Hide para animações suaves
 * - Android: KeyboardDidShow/Hide com ajuste manual
 * - Animated API para transições fluidas
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Keyboard,
  Animated,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Alert,
  EmitterSubscription,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useChat, ChatMessage } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { spacing, shadows } from '@/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ChatWindowProps {
  rideId: string;
  otherUserName?: string;
  otherUserPhoto?: string | null;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  rideId,
  otherUserName = 'Chat',
  otherUserPhoto,
  onClose,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    chatState,
    currentRideId,
    sendMessage,
    markAsRead,
    closeChat,
    loadMoreMessages,
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Função robusta para forçar o foco do input e abrir o teclado
  const focusInput = useCallback(() => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }

    const tryFocus = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Tenta focar em três momentos diferentes para garantir
    requestAnimationFrame(tryFocus);
    focusTimeoutRef.current = setTimeout(tryFocus, 80);
    setTimeout(tryFocus, 180);
  }, []);
  
  // Cleanup do timeout quando o componente desmontar
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);
  
  // Animações
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const keyboardPadding = useRef(new Animated.Value(0)).current;

  const currentUserId = user?.userId || user?.id;

  // Verifica se o chat está aberto para a corrida correta
  useEffect(() => {
    if (currentRideId !== rideId) {
      console.warn('[ChatWindow] ⚠️ rideId mismatch:', { currentRideId, propRideId: rideId });
    }
  }, [currentRideId, rideId]);

  // ============================================
  // KEYBOARD HANDLING - Solução Robusta
  // ============================================

  useEffect(() => {
    // Função para animar o padding
    const animateKeyboardPadding = (toValue: number, duration: number = 250) => {
      Animated.timing(keyboardPadding, {
        toValue,
        duration,
        useNativeDriver: false, // paddingBottom não suporta native driver
      }).start();
    };

    // Handlers para iOS (animações suaves com keyboardWill)
    // e Android (keyboardDid)
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener: EmitterSubscription = Keyboard.addListener(
      showEvent,
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        // No iOS, descontamos o safe area bottom porque o teclado já considera
        // No Android, usamos o valor total
        const adjustedHeight = Platform.OS === 'ios' 
          ? keyboardHeight - insets.bottom 
          : keyboardHeight;
        
        const duration = Platform.OS === 'ios' 
          ? event.duration || 250 
          : 150; // Android não tem duration, usar valor fixo

        animateKeyboardPadding(adjustedHeight, duration);
        
        // Scroll para a última mensagem
        setTimeout(() => {
          if (flatListRef.current && groupedMessages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 150);
      }
    );

    const keyboardHideListener: EmitterSubscription = Keyboard.addListener(
      hideEvent,
      (event) => {
        const duration = Platform.OS === 'ios' 
          ? event?.duration || 250 
          : 150;
        
        animateKeyboardPadding(0, duration);
      }
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [insets.bottom]);

  // ============================================
  // ANIMAÇÃO DE ENTRADA
  // ============================================

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, []);

  // Garante que o input esteja pronto quando o chat é aberto
  useEffect(() => {
    // Pequeno delay para garantir que o componente está totalmente montado
    const timer = setTimeout(() => {
      // Reseta qualquer estado de foco anterior para garantir estado limpo
      if (inputRef.current) {
        inputRef.current.blur();
        // Limpa o estado de foco
        setIsInputFocused(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [rideId]); // Quando o rideId muda (chat é aberto)
  
  // Handler adicional para garantir que o input receba foco quando o container é tocado
  const handleInputContainerPress = useCallback(() => {
    // Força o foco imediatamente
    focusInput();
  }, [focusInput]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) {
        onClose();
      } else {
        closeChat();
      }
    });
  }, [closeChat, onClose]);

  // ============================================
  // SCROLL E MENSAGENS
  // ============================================

  // Scroll automático quando novas mensagens chegam
  useEffect(() => {
    if (chatState.messages.length > 0) {
      // Usa requestAnimationFrame para garantir que o layout foi atualizado
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (flatListRef.current) {
            // Só faz scroll se não estiver no topo (usuário não está vendo mensagens antigas)
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      });
    }
  }, [chatState.messages.length]);

  useEffect(() => {
    // Só marca como lida se o chat estiver aberto e tiver um rideId válido
    if (chatState.messages.length > 0 && currentUserId && rideId) {
      const unreadMessages = chatState.messages
        .filter((msg) => msg.deliveryStatus !== 'READ' && msg.senderId !== currentUserId)
        .map((msg) => msg.id);

      if (unreadMessages.length > 0) {
        // Passa o rideId explicitamente para evitar qualquer descompasso com o ref
        markAsRead(unreadMessages, rideId);
      }
    }
  }, [chatState.messages, currentUserId, markAsRead, rideId]);

  // ============================================
  // ENVIO DE MENSAGEM
  // ============================================

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;

    const text = messageText.trim();
    
    if (!rideId && !currentRideId) {
      Alert.alert('Erro', 'Nenhuma corrida ativa encontrada para enviar mensagem.');
      return;
    }

    // Valida se o chat está disponível para o status atual da corrida
    if (!chatState.isChatAvailable) {
      console.error('[ChatWindow] ❌ Chat não disponível:', {
        rideId: rideId || currentRideId,
        rideStatus: chatState.rideStatus,
        isChatAvailable: chatState.isChatAvailable,
      });
      
      Alert.alert(
        'Chat indisponível', 
        'O chat só está disponível durante uma corrida ativa. Status atual: ' + 
        (chatState.rideStatus || 'desconhecido')
      );
      return;
    }

    console.log('[ChatWindow] 📤 Enviando mensagem:', { 
      rideId: rideId || currentRideId,
      textLength: text.length,
      isChatAvailable: chatState.isChatAvailable,
      rideStatus: chatState.rideStatus,
    });

    setMessageText('');
    setIsSending(true);

    try {
      const success = await sendMessage(text);
      if (!success) {
        console.error('[ChatWindow] ❌ Falha ao enviar mensagem');
        Alert.alert(
          'Falha no envio',
          'Não foi possível enviar a mensagem. Verifique se a corrida ainda está ativa.'
        );
      } else {
        // Scroll para o final após enviar mensagem
        // Usa um pequeno delay para garantir que a mensagem foi adicionada
        setTimeout(() => {
          if (flatListRef.current && groupedMessages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 200);
      }
    } catch (error) {
      console.error('[ChatWindow] ❌ Erro ao enviar:', error);
    } finally {
      setIsSending(false);
    }
  };

  // ============================================
  // FORMATAÇÃO
  // ============================================

  /**
   * Formata hora no formato brasileiro (HH:mm)
   * Garante que o timestamp é válido e trata diferentes formatos
   */
  const formatTime = (dateString: string): string => {
    try {
      if (!dateString) return '';
      
      // Garante que tem formato ISO válido
      const date = new Date(dateString);
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('[ChatWindow] ⚠️ Data inválida:', dateString);
        return '';
      }
      
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo', // Garante timezone brasileiro
      });
    } catch (error) {
      console.error('[ChatWindow] ❌ Erro ao formatar hora:', error, dateString);
      return '';
    }
  };

  /**
   * Formata data no formato brasileiro
   * Mostra "Hoje", "Ontem" ou data formatada
   */
  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('[ChatWindow] ⚠️ Data inválida:', dateString);
        return '';
      }
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Compara apenas a data (ignora hora)
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

      if (dateOnly.getTime() === todayOnly.getTime()) {
        return 'Hoje';
      } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
        return 'Ontem';
      } else {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
      }
    } catch (error) {
      console.error('[ChatWindow] ❌ Erro ao formatar data:', error, dateString);
      return '';
    }
  };

  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; messages: ChatMessage[]; key: string }[] = [];
    let currentDate = 'INITIAL_STATE';

    chatState.messages.forEach((msg) => {
      const msgDate = formatDate(msg.createdAt);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        // Cria chave única combinando data com o ID da primeira mensagem do grupo
        groups.push({ date: msgDate, messages: [msg], key: `${msgDate}-${msg.id}` });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  }, [chatState.messages]);

  // ============================================
  // RENDERIZAÇÃO DE MENSAGEM
  // ============================================

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderId === currentUserId;
    const isRead = item.deliveryStatus === 'READ';
    const isDelivered = item.deliveryStatus === 'DELIVERED';
    const isSendingMsg = item.deliveryStatus === 'SENDING';
    const isFailed = item.deliveryStatus === 'FAILED';

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage
              ? [styles.myMessageBubble, { backgroundColor: colors.primary }]
              : [styles.otherMessageBubble, { backgroundColor: colors.card }],
            isFailed && styles.failedMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : { color: colors.textPrimary },
            ]}
          >
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMyMessage
                  ? styles.myMessageTime
                  : { color: colors.textSecondary },
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>
            {/* Indicadores de status para MINHAS mensagens */}
            {isMyMessage && (
              <View style={styles.statusContainer}>
                {isSendingMsg && (
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                )}
                {isDelivered && !isRead && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="rgba(255, 255, 255, 0.7)"
                  />
                )}
                {isRead && (
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color="#4FC3F7"
                  />
                )}
                {isFailed && (
                  <TouchableOpacity onPress={() => {
                    Alert.alert(
                      'Falha no envio',
                      'A mensagem não pôde ser enviada. Deseja tentar novamente?',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { 
                          text: 'Reenviar', 
                          onPress: () => {
                            setMessageText(item.content);
                          }
                        },
                      ]
                    );
                  }}>
                    <Ionicons
                      name="alert-circle"
                      size={14}
                      color="#EF4444"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
            {/* Indicador de leitura para mensagens de OUTROS usuários */}
            {!isMyMessage && isRead && (
              <View style={styles.statusContainer}>
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color={colors.primary}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderDateSeparator = (date: string) => (
    <View style={styles.dateSeparator}>
      <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
      <Text style={[styles.dateText, { color: colors.textSecondary }]}>{date}</Text>
      <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
    </View>
  );

  // ============================================
  // STATUS DE CONEXÃO
  // ============================================

  const renderConnectionStatus = () => {
    // Prioridade: Mostra primeiro se o chat não está disponível, depois se está desconectado
    if (!chatState.isChatAvailable) {
      return (
        <View style={[styles.connectionBanner, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="ban-outline" size={16} color="#991B1B" />
          <Text style={[styles.connectionText, { color: '#991B1B' }]}>
            Chat indisponível neste momento
          </Text>
        </View>
      );
    }
    
    if (!chatState.isConnected) {
      return (
        <View style={[styles.connectionBanner, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="cloud-offline-outline" size={16} color="#92400E" />
          <Text style={[styles.connectionText, { color: '#92400E' }]}>
            Reconectando...
          </Text>
        </View>
      );
    }
    
    return null;
  };

  // ============================================
  // ESTILOS DINÂMICOS
  // ============================================

  const dynamicStyles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: insets.top + spacing.sm,
      paddingBottom: spacing.sm + 4,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    inputWrapper: {
      flex: 1,
      minHeight: 48, // Aumentado de 40 para 48
      maxHeight: 120, // Aumentado de 100 para 120
      borderRadius: 24, // Aumentado de 20 para 24 para melhor proporção
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      // Garante que o wrapper seja totalmente clicável
    },
    input: {
      fontSize: 15,
      color: colors.textPrimary,
      paddingVertical: Platform.OS === 'ios' ? 12 : 10, // Aumentado de 10/8 para 12/10
      paddingHorizontal: 2, // Adiciona um pouco de padding horizontal interno
      maxHeight: 100, // Aumentado de 80 para 100
    },
    sendButton: {
      width: 48, // Aumentado de 40 para 48 para corresponder ao minHeight do input
      height: 48, // Aumentado de 40 para 48 para corresponder ao minHeight do input
      borderRadius: 24, // Aumentado de 20 para 24 para manter proporção
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.border,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    avatarText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    onlineText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  // ============================================
  // RENDER
  // ============================================

  return (
    <Animated.View 
      style={[
        dynamicStyles.container, 
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.card} />
      
      {/* Container principal com flex: 1 */}
      <View style={styles.mainContainer}>
        {/* Header - Fixo no topo */}
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={dynamicStyles.avatarContainer}>
              <Text style={dynamicStyles.avatarText}>
                {(chatState.otherUserName || otherUserName)?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={dynamicStyles.headerTitle} numberOfLines={1}>
                {chatState.otherUserName || otherUserName}
              </Text>
              <View style={styles.headerSubtitle}>
                <View
                  style={[
                    dynamicStyles.onlineDot,
                    {
                      backgroundColor: chatState.isOnline
                        ? '#10B981'
                        : colors.textSecondary,
                    },
                  ]}
                />
                <Text style={dynamicStyles.onlineText}>
                  {chatState.isOnline
                    ? 'Online'
                    : chatState.lastSeenAt
                    ? `Visto por último ${formatTime(chatState.lastSeenAt)}`
                    : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Banner de conexão */}
        {renderConnectionStatus()}

        {/* Lista de mensagens - Flex: 1 para ocupar todo espaço disponível */}
        {chatState.isLoading && chatState.messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : chatState.messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={dynamicStyles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={36} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.emptyText}>
              Nenhuma mensagem ainda.{'\n'}Diga olá! 👋
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={groupedMessages}
            renderItem={({ item }) => (
              <View>
                {renderDateSeparator(item.date)}
                {item.messages.map((msg: ChatMessage) => (
                  <View key={msg.id}>{renderMessage({ item: msg })}</View>
                ))}
              </View>
            )}
            keyExtractor={(item) => item.key}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.5}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => {
              // Scroll para o final quando o conteúdo muda (nova mensagem)
              // Só faz scroll se o usuário não estiver rolando manualmente
              if (flatListRef.current && groupedMessages.length > 0 && !isInputFocused) {
                // Usa requestAnimationFrame para garantir que o layout foi atualizado
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 50);
                });
              }
            }}
            onScrollToIndexFailed={(info) => {
              // Fallback se scrollToIndex falhar
              console.warn('[ChatWindow] ScrollToIndex failed:', info);
            }}
            ListHeaderComponent={
              chatState.hasMoreMessages ? (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={loadMoreMessages}
                >
                  {chatState.isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={{ color: colors.primary, fontSize: 14 }}>
                      Carregar mais mensagens
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null
            }
          />
        )}

        {/* Input Container - Animado com o teclado */}
        <Animated.View 
          style={[
            styles.inputContainer,
            { 
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              // Padding top igual ao padding bottom para simetria
              paddingTop: spacing.md, // Aumentado de spacing.sm para spacing.md
              // Padding bottom animado baseado na altura do teclado
              // Adiciona padding extra (spacing.lg = 24px) para evitar que o teclado fique grudado no input
              paddingBottom: Animated.add(
                keyboardPadding,
                (insets.bottom > 0 ? insets.bottom : 0) + spacing.lg // Padding extra fixo (24px) + safe area
              ),
            }
          ]}
        >
          <View
            style={styles.inputRow}
            onStartShouldSetResponder={() => true}
            onResponderGrant={focusInput}
          >
            <TouchableOpacity
              style={dynamicStyles.inputWrapper}
              activeOpacity={1}
              onPress={focusInput}
              onPressIn={focusInput}
            >
              <TextInput
                ref={inputRef}
                style={dynamicStyles.input}
                placeholder={
                  chatState.isChatAvailable 
                    ? "Digite uma mensagem..." 
                    : "Chat indisponível"
                }
                placeholderTextColor={colors.textSecondary}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
                returnKeyType="default"
                blurOnSubmit={false}
                onFocus={() => {
                  setIsInputFocused(true);
                  if (focusTimeoutRef.current) {
                    clearTimeout(focusTimeoutRef.current);
                    focusTimeoutRef.current = null;
                  }
                  setTimeout(() => {
                    if (flatListRef.current && groupedMessages.length > 0) {
                      flatListRef.current.scrollToEnd({ animated: true });
                    }
                  }, 100);
                }}
                onBlur={() => {
                  setIsInputFocused(false);
                }}
                onTouchStart={focusInput}
                onPressIn={focusInput}
                editable={chatState.isChatAvailable}
                keyboardType="default"
                textContentType="none"
                autoCorrect
                autoCapitalize="sentences"
                showSoftInputOnFocus
                selectTextOnFocus={false}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.sendButton,
                (!messageText.trim() || isSending || !chatState.isChatAvailable) && dynamicStyles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!messageText.trim() || isSending || !chatState.isChatAvailable}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={(messageText.trim() && chatState.isChatAvailable) ? '#FFFFFF' : colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

// ============================================
// ESTILOS ESTÁTICOS
// ============================================

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md, // Aumentado para melhor espaçamento
    flexGrow: 1, // Garante que o conteúdo ocupe o espaço disponível
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadMoreButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  inputContainer: {
    borderTopWidth: 1,
    // paddingTop será definido dinamicamente no Animated.View
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center', // Mudado de 'flex-end' para 'center' para centralizar verticalmente
    paddingHorizontal: spacing.md, // Aumentado para melhor espaçamento
    gap: spacing.sm, // Aumentado para melhor espaçamento entre input e botão
  },
  messageContainer: {
    marginBottom: spacing.xs,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  failedMessageBubble: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statusContainer: {
    marginLeft: 2,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: spacing.sm,
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  connectionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default ChatWindow;
