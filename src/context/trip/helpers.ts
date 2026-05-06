import type { TripStatus } from '@/services/websocket';

export const normalizeTripStatus = (rawStatus?: string | null): TripStatus => {
  if (!rawStatus) return 'REQUESTED';
  let normalized = rawStatus.trim().toUpperCase();
  const explicitMap: Record<string, TripStatus> = {
    'AGUARDANDO MOTORISTA': 'AGUARDANDO_MOTORISTA',
    'MOTORISTA ENCONTRADO': 'DRIVER_ASSIGNED',
    'MOTORISTA ACEITOU': 'MOTORISTA_ACEITOU',
    'MOTORISTA A CAMINHO': 'MOTORISTA_A_CAMINHO',
    'MOTORISTA PROXIMO': 'MOTORISTA_PROXIMO',
    'MOTORISTA PRÓXIMO': 'MOTORISTA_PROXIMO',
    'MOTORISTA CHEGOU': 'MOTORISTA_CHEGOU',
    'PASSAGEIRO EMBARCADO': 'PASSAGEIRO_EMBARCADO',
    'EM ROTA': 'EM_ROTA',
    'PRÓXIMO DESTINO': 'PROXIMO_DESTINO',
    'PROXIMO DESTINO': 'PROXIMO_DESTINO',
    'CORRIDA FINALIZADA': 'COMPLETED',
    'CANCELADA PASSAGEIRO': 'CANCELADA_PASSAGEIRO',
    'CANCELADA MOTORISTA': 'CANCELADA_MOTORISTA',
    'CANCELADA ADMIN': 'CANCELADA_ADMIN',
    'CANCELADO PELO MOTORISTA': 'CANCELED_BY_DRIVER',
    'CANCELADA PELO MOTORISTA': 'CANCELED_BY_DRIVER',
    'CANCELADO PELO PASSAGEIRO': 'CANCELED_BY_PASSENGER',
    'CANCELADA PELO PASSAGEIRO': 'CANCELED_BY_PASSENGER',
    'CORRIDA EXPIRADA': 'EXPIRED',
    'DRIVER ON THE WAY': 'DRIVER_ON_THE_WAY',
    'DRIVER NEARBY': 'DRIVER_NEARBY',
    'DRIVER ARRIVED': 'DRIVER_ARRIVED',
    'PASSENGER BOARDED': 'PASSENGER_BOARDED',
    'IN ROUTE': 'IN_ROUTE',
    'NEAR DESTINATION': 'NEAR_DESTINATION',
    'WAITING AT DESTINATION': 'WAITING_AT_DESTINATION',
  };
  if (explicitMap[normalized]) return explicitMap[normalized];
  normalized = normalized.replace(/\s+/g, '_');
  return normalized as TripStatus;
};

export const getCoords = (location?: Record<string, unknown> | null): { lat: number; lng: number } => {
  if (!location) return { lat: 0, lng: 0 };
  return {
    lat: Number(location.lat ?? location.latitude ?? 0),
    lng: Number(location.lng ?? location.longitude ?? location.lon ?? 0),
  };
};
