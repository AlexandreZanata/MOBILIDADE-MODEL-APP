import { tp } from '@/i18n/profile';
import { DriverStatus } from '@/models/profile/types';

export function formatProfileDate(value?: string): string {
  if (!value) return tp('noInfo');
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
}

const DRIVER_STATUS_VALUES: DriverStatus[] = [
  'ONBOARDING',
  'AWAITING_CNH',
  'CNH_REVIEW',
  'AWAITING_VEHICLE',
  'VEHICLE_REVIEW',
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
];

export function isDriverStatusValue(value: string): value is DriverStatus {
  return DRIVER_STATUS_VALUES.some((status) => status === value);
}
