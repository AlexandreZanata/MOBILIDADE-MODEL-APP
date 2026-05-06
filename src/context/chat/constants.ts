import type { ChatState } from './types';

export const ACTIVE_RIDE_STATUSES = [
  'MOTORISTA_ENCONTRADO',
  'MOTORISTA_ACEITOU',
  'MOTORISTA_A_CAMINHO',
  'MOTORISTA_PROXIMO',
  'MOTORISTA_CHEGOU',
  'PASSAGEIRO_EMBARCADO',
  'EM_ROTA',
  'PROXIMO_DESTINO',
  'CORRIDA_FINALIZADA',
  'AGUARDANDO_AVALIACAO',
  'DRIVER_FOUND',
  'DRIVER_ASSIGNED',
  'DRIVER_ON_THE_WAY',
  'DRIVER_NEARBY',
  'DRIVER_ARRIVING',
  'DRIVER_ARRIVED',
  'PASSENGER_BOARDED',
  'IN_PROGRESS',
  'IN_ROUTE',
  'NEAR_DESTINATION',
  'WAITING_AT_DESTINATION',
  'COMPLETED',
  'AWAITING_REVIEW',
  'ACCEPTED',
] as const;

export const initialChatState: ChatState = {
  messages: [],
  unreadCount: 0,
  isOnline: false,
  isConnected: false,
  isLoading: false,
  hasMoreMessages: false,
  rideStatus: undefined,
  isChatAvailable: false,
};
