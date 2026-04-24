// Status possíveis para pedidos/corridas no histórico.
// Mantém os existentes e adiciona variações usadas pelo backend (ex.: corrida_finalizada, expirada).
export type DeliveryOrderStatus =
  | 'pending'
  | 'in-progress'
  | 'delivered'
  | 'cancelled'
  | 'corrida_finalizada'
  | 'corrida_finalizada_motorista'
  | 'corrida_finalizada_passageiro'
  | 'expirada'
  | 'cancelada_pelo_motorista'
  | 'cancelada_pelo_passageiro'
  | 'aceita'
  | 'em_andamento'
  | 'aguardando'
  | 'rejeitada'
  | string; // fallback para qualquer status novo que venha da API

export interface DeliveryOrder {
  id: string;
  address: string;
  estimatedTime: string;
  status: DeliveryOrderStatus;
  price: string;
  date: string;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  avatar: string;
  carModel: string;
  carPlate: string;
}

export interface ServiceType {
  id: string;
  name: string;
  icon: string;
  price: string;
  estimatedTime: string;
}

export interface DriverProfileResponse {
  userId: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnhNumber: string;
  cnhExpirationDate: string;
  cnhCategory: string;
  status: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

