import type { TripStatus } from '@/services/websocket';

export const STORAGE_ACTIVE_TRIP_ID = '@vamu:active_trip_id';
export const STORAGE_ACTIVE_TRIP_DATA = '@vamu:active_trip_data';

export const COMPLETED_OR_CANCELLED_STATUSES: TripStatus[] = [
  'COMPLETED',
  'CANCELLED',
  'CANCELED_BY_DRIVER',
  'CANCELED_BY_PASSENGER',
  'NO_SHOW',
  'EXPIRED',
];

export const ACCEPTED_DRIVER_STATUSES: TripStatus[] = [
  'MOTORISTA_ACEITOU',
  'DRIVER_ASSIGNED',
  'DRIVER_ARRIVING',
  'MOTORISTA_A_CAMINHO',
  'DRIVER_NEARBY',
  'MOTORISTA_PROXIMO',
  'DRIVER_ARRIVED',
  'MOTORISTA_CHEGOU',
  'PASSAGEIRO_EMBARCADO',
  'IN_PROGRESS',
  'EM_ROTA',
  'PROXIMO_DESTINO',
  'WAITING_AT_DESTINATION',
];
