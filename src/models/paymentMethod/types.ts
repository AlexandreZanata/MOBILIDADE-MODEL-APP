import { StackNavigationProp } from '@react-navigation/stack';

export interface PaymentMethodLocation {
  lat: number;
  lng: number;
}

export type PaymentMethodType = 'credit_card' | 'debit_card' | 'cash' | 'pix' | 'wallet';

export interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  type: PaymentMethodType;
  description?: string;
  requiresCardBrand: boolean;
  enabled: boolean;
}

export interface PaymentBrand {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
}

export interface PaymentEstimate {
  estimateId: string;
}

export interface CreateRideErrorInfo {
  errorMessage?: string;
  errorCode?: string;
}

export interface CreatedRideData {
  id?: string;
  trip_id?: string;
  estimatedPrice?: number;
  estimated_fare?: number;
  finalPrice?: number;
  final_fare?: number;
  errorMessage?: string;
  errorCode?: string;
  [key: string]: unknown;
}

export interface PaymentMethodRouteParams {
  origin?: PaymentMethodLocation;
  destination?: PaymentMethodLocation;
  tripCategoryId?: string;
  estimatedFare?: number;
  estimateId?: string;
  estimateTimestamp?: number;
}

export type PaymentMethodScreenNavigationProp = StackNavigationProp<Record<string, object | undefined>>;

export interface PaymentMethodScreenRoute {
  params?: PaymentMethodRouteParams;
}
