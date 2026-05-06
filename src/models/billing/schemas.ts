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
  driverName: z.string().default(''),
  periodStart: z.string(),
  periodEnd: z.string(),
  rideCount: z.number(),
  pricePerRide: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  status: billingCycleStatusSchema,
  pixGeneratedAt: z.string().nullable().default(null),
  pixExpiresAt: z.string().nullable().default(null),
  gracePeriodEndsAt: z.string().nullable().default(null),
  paidAt: z.string().nullable().default(null),
  blockedAt: z.string().nullable().default(null),
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
  externalReference: z.string(),
  generatedAt: z.string(),
});

// ─── Billing status — raw API shape ──────────────────────────────────────────

/**
 * Zod schema for the raw GET /api/v1/driver/billing/status response.
 * Field names match the API exactly; mapping to domain types happens in
 * `parseBillingStatus()` below.
 */
const driverBillingStatusRawSchema = z.object({
  driverId: z.string(),
  // driverName is absent in some API versions
  driverName: z.string().optional().default(''),
  isBlocked: z.boolean(),
  blockedAt: z.string().optional(),
  // API uses blockReason (not blockedReason)
  blockReason: z.string().optional(),
  // API uses totalDebt (not totalPending)
  totalDebt: z.number().optional().default(0),
  // Kept for backwards compat if the API ever returns totalPending directly
  totalPending: z.number().optional(),
  totalPendingRides: z.number().default(0),
  pendingCyclesCount: z.number().optional().default(0),
  nextDueDate: z.string().nullable().optional(),
  pendingCycles: z.array(billingCycleSchema).optional().default([]),
  currentPix: pixQrCodeSchema.nullable().optional(),
  updatedAt: z.string().optional(),
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
 */
export function parseBillingStatus(payload: unknown): DriverBillingStatus {
  const raw = driverBillingStatusRawSchema.parse(payload);

  const pendingCycles = raw.pendingCycles ?? [];
  const currentCycle = pendingCycles.length > 0 ? pendingCycles[0] : null;

  return {
    driverId: raw.driverId,
    driverName: raw.driverName ?? '',
    // Prefer explicit totalPending if present, otherwise fall back to totalDebt
    totalPending: raw.totalPending ?? raw.totalDebt ?? 0,
    totalPendingRides: raw.totalPendingRides,
    pendingCyclesCount: raw.pendingCyclesCount ?? pendingCycles.length,
    nextDueDate: raw.nextDueDate ?? null,
    pendingCycles,
    currentPix: raw.currentPix ?? null,
    currentCycle,
    isBlocked: raw.isBlocked,
    // Normalise blockReason → blockedReason
    blockedReason: raw.blockReason ?? undefined,
    blockedAt: raw.blockedAt,
    updatedAt: raw.updatedAt,
  };
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
