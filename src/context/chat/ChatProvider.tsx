import React, { createContext, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChatProvider } from './useChatProvider';
import type { ChatContextType } from './types';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const value = useChatProvider(isAuthenticated, user);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser usado dentro de um ChatProvider');
  }
  return context;
};
