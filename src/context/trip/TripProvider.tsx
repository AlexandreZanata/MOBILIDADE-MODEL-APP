import React, { createContext, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTripProvider } from './useTripProvider';
import type { TripContextData } from './types';

const TripContext = createContext<TripContextData | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const value = useTripProvider(isAuthenticated, user);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
};

export const useTrip = (): TripContextData => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip deve ser usado dentro de um TripProvider');
  }
  return context;
};
