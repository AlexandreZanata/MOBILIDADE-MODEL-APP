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

export interface BillingCycleResponse {
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

export interface PixQrCodeResponse {
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

export interface DriverBillingStatusResponse {
  driverId: string;
  driverName: string;
  totalPending: number;
  totalPendingRides: number;
  currentCycle: BillingCycleResponse | null;
  isBlocked: boolean;
  blockedReason?: string;
  blockedAt?: string;
}

export type DriverBillingCyclesResponse =
  | BillingCycleResponse[]
  | {
      items: BillingCycleResponse[];
      nextCursor?: string;
      hasMore: boolean;
    };

export interface DriverBlockedResponse {
  blocked: boolean;
  reason?: string;
}
