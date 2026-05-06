/**
 * @file Billing zod schemas.
 * @description Runtime validation for external payloads used by billing feature.
 *
 * The GET /api/v1/driver/billing/status response shape differs from the domain
 * model — this file handles the mapping:
 *
 *   API field        → Domain field
 *   ─────────────────────────────────
 *   totalDebt        → totalPending
 *   blockReason      → blockedReason
 *   pendingCycles[]  → pendingCycles (+ currentCycle = first item)
 *   currentPix       → currentPix
 *   driverName       → driverName (optional in API, defaults to '')
 */

import { z } from 'zod';
import {
  BillingCyclesPage,
  BillingCycleStatus,
  DriverBillingStatus,
  PixQrCode,
} from '@/models/billing/types';

// ─── Shared sub-schemas ───────────────────────────────────────────────────────

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
  driverName: z.string().optional().default(''),
  periodStart: z.string(),
  periodEnd: z.string(),
  rideCount: z.number().default(0),
  pricePerRide: z.number().default(0),
  totalAmount: z.number().default(0),
  paidAmount: z.number().default(0),
  remainingAmount: z.number().default(0),
  status: billingCycleStatusSchema,
  pixGeneratedAt: z.string().nullable().optional().default(null),
  pixExpiresAt: z.string().nullable().optional().default(null),
  gracePeriodEndsAt: z.string().nullable().optional().default(null),
  paidAt: z.string().nullable().optional().default(null),
  blockedAt: z.string().nullable().optional().default(null),
  createdAt: z.string(),
});

export const pixQrCodeSchema = z.object({
  billingCycleId: z.string(),
  paymentId: z.string(),
  amount: z.number(),
  qrCode: z.string(),
  qrCodeBase64: z.string(),
  copyPaste: z.string(),
  expiresAt: z.string(),
  externalReference: z.string().optional().default(''),
  generatedAt: z.string(),
});

// ─── Billing status — raw API shape ──────────────────────────────────────────

/**
 * Maximally defensive schema for GET /api/v1/driver/billing/status.
 * Every field that could be absent or null is handled with .optional()/.nullable()
 * and a safe default so a driver with no cycles / no debt never causes a parse error.
 */
const driverBillingStatusRawSchema = z.object({
  driverId: z.string(),
  driverName: z.string().optional().nullable().default(''),
  isBlocked: z.boolean().default(false),
  blockedAt: z.string().optional().nullable(),
  // API uses blockReason (not blockedReason)
  blockReason: z.string().optional().nullable(),
  // API uses totalDebt; some versions may send totalPending
  totalDebt: z.number().optional().nullable().default(0),
  totalPending: z.number().optional().nullable(),
  totalPendingRides: z.number().optional().nullable().default(0),
  pendingCyclesCount: z.number().optional().nullable().default(0),
  nextDueDate: z.string().optional().nullable(),
  // pendingCycles may be absent, null, or an empty array
  pendingCycles: z.array(billingCycleSchema).optional().nullable().default([]),
  currentPix: pixQrCodeSchema.optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});

// ─── Billing cycles response ──────────────────────────────────────────────────

const billingCyclesPageSchema = z.object({
  items: z.array(billingCycleSchema),
  nextCursor: z.string().optional(),
  hasMore: z.boolean(),
});

export const driverBillingCyclesResponseSchema = z.union([
  z.array(billingCycleSchema),
  billingCyclesPageSchema,
]);

// ─── Parse functions ──────────────────────────────────────────────────────────

/**
 * Parses and normalises the billing status API response into the domain model.
 * Maps `totalDebt` → `totalPending` and `blockReason` → `blockedReason`.
 * Logs the Zod error detail before re-throwing so failures are diagnosable.
 */
export function parseBillingStatus(payload: unknown): DriverBillingStatus {
  const result = driverBillingStatusRawSchema.safeParse(payload);
  if (!result.success) {
    console.error('[billing/schemas] parseBillingStatus failed:', result.error.flatten());
    throw result.error;
  }

  const raw = result.data;
  const pendingCycles = raw.pendingCycles ?? [];
  const currentCycle = pendingCycles.length > 0 ? pendingCycles[0] : null;

  return {
    driverId: raw.driverId,
    driverName: raw.driverName ?? '',
    totalPending: raw.totalPending ?? raw.totalDebt ?? 0,
    totalPendingRides: raw.totalPendingRides ?? 0,
    pendingCyclesCount: raw.pendingCyclesCount ?? pendingCycles.length,
    nextDueDate: raw.nextDueDate ?? null,
    pendingCycles,
    currentPix: raw.currentPix ?? null,
    currentCycle,
    isBlocked: raw.isBlocked,
    blockedReason: raw.blockReason ?? undefined,
    blockedAt: raw.blockedAt ?? undefined,
    updatedAt: raw.updatedAt ?? undefined,
  };
}

export function parsePixQrCode(payload: unknown): PixQrCode {
  const result = pixQrCodeSchema.safeParse(payload);
  if (!result.success) {
    console.error('[billing/schemas] parsePixQrCode failed:', result.error.flatten());
    throw result.error;
  }
  return result.data;
}

export function parseBillingCyclesPage(payload: unknown): BillingCyclesPage {
  const result = driverBillingCyclesResponseSchema.safeParse(payload);
  if (!result.success) {
    console.error('[billing/schemas] parseBillingCyclesPage failed:', result.error.flatten());
    throw result.error;
  }
  const parsed = result.data;
  if (Array.isArray(parsed)) {
    return { items: parsed, hasMore: false, nextCursor: undefined };
  }
  return parsed;
}

export function parseBillingCycleStatus(payload: unknown): BillingCycleStatus {
  return billingCycleStatusSchema.parse(payload);
}
