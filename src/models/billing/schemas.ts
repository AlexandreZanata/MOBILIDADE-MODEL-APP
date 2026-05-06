/**
 * @file Billing zod schemas.
 * @description Runtime validation for external payloads used by billing feature.
 */

import { z } from 'zod';
import { BillingCyclesPage, BillingCycleStatus, DriverBillingStatus, PixQrCode } from '@/models/billing/types';

const billingCycleStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'AWAITING_PAYMENT',
  'PAID',
  'PARTIALLY_PAID',
  'OVERDUE',
  'GRACE_PERIOD',
  'BLOCKED',
  'CANCELLED',
]);

export const billingCycleSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  rideCount: z.number(),
  pricePerRide: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  status: billingCycleStatusSchema,
  pixGeneratedAt: z.string().nullable(),
  pixExpiresAt: z.string().nullable(),
  gracePeriodEndsAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  blockedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const driverBillingStatusSchema = z.object({
  driverId: z.string(),
  driverName: z.string(),
  totalPending: z.number(),
  totalPendingRides: z.number(),
  currentCycle: billingCycleSchema.nullable(),
  isBlocked: z.boolean(),
  blockedReason: z.string().optional(),
  blockedAt: z.string().optional(),
});

export const pixQrCodeSchema = z.object({
  billingCycleId: z.string(),
  paymentId: z.string(),
  amount: z.number(),
  qrCode: z.string(),
  qrCodeBase64: z.string(),
  copyPaste: z.string(),
  expiresAt: z.string(),
  externalReference: z.string(),
  generatedAt: z.string(),
});

const billingCyclesPageSchema = z.object({
  items: z.array(billingCycleSchema),
  nextCursor: z.string().optional(),
  hasMore: z.boolean(),
});

export const driverBillingCyclesResponseSchema = z.union([
  z.array(billingCycleSchema),
  billingCyclesPageSchema,
]);

export function parseBillingStatus(payload: unknown): DriverBillingStatus {
  return driverBillingStatusSchema.parse(payload);
}

export function parsePixQrCode(payload: unknown): PixQrCode {
  return pixQrCodeSchema.parse(payload);
}

export function parseBillingCyclesPage(payload: unknown): BillingCyclesPage {
  const parsed = driverBillingCyclesResponseSchema.parse(payload);
  if (Array.isArray(parsed)) {
    return { items: parsed, hasMore: false, nextCursor: undefined };
  }
  return parsed;
}

export function parseBillingCycleStatus(payload: unknown): BillingCycleStatus {
  return billingCycleStatusSchema.parse(payload);
}
