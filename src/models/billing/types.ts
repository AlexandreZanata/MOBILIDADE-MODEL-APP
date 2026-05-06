/**
 * @file Billing domain types.
 * @description Shared single source of truth for Driver Billing feature.
 */

export type BillingCycleStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'GRACE_PERIOD'
  | 'BLOCKED'
  | 'CANCELLED';

export interface BillingCycle {
  id: string;
  driverId: string;
  driverName: string;
  periodStart: string;
  periodEnd: string;
  rideCount: number;
  pricePerRide: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: BillingCycleStatus;
  pixGeneratedAt: string | null;
  pixExpiresAt: string | null;
  gracePeriodEndsAt: string | null;
  paidAt: string | null;
  blockedAt: string | null;
  createdAt: string;
}

export interface PixQrCode {
  billingCycleId: string;
  paymentId: string;
  amount: number;
  qrCode: string;
  qrCodeBase64: string;
  copyPaste: string;
  expiresAt: string;
  externalReference: string;
  generatedAt: string;
}

/**
 * Domain model for driver billing status.
 * Normalised from the raw API response — use this throughout the app.
 */
export interface DriverBillingStatus {
  driverId: string;
  /** Driver full name — may be absent in some API versions. */
  driverName: string;
  /** Total outstanding debt in BRL (mapped from `totalDebt` in the API). */
  totalPending: number;
  totalPendingRides: number;
  /** Number of unpaid billing cycles. */
  pendingCyclesCount: number;
  /** ISO 8601 date of the next payment due (nullable). */
  nextDueDate: string | null;
  /** Pending billing cycles returned inline by the status endpoint. */
  pendingCycles: BillingCycle[];
  /** Active PIX payment if one was already generated (nullable). */
  currentPix: PixQrCode | null;
  /** Most recent cycle — derived from the first item in pendingCycles or null. */
  currentCycle: BillingCycle | null;
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
  updatedAt?: string;
}

export interface BillingCyclesPage {
  items: BillingCycle[];
  nextCursor?: string;
  hasMore: boolean;
}
