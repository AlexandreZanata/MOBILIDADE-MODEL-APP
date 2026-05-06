/**
 * @file schemas.test.ts
 * @description Unit tests for billing Zod schemas and parse functions.
 * Covers: field mapping (totalDebt→totalPending, blockReason→blockedReason),
 * flat-array cycles response, paginated cycles response, and invalid payloads.
 */

import {
  parseBillingStatus,
  parseBillingCyclesPage,
  parsePixQrCode,
} from '../schemas';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const validCycle = {
  id: 'cycle-1',
  driverId: 'driver-1',
  driverName: 'João',
  periodStart: '2026-01-01T00:00:00.000Z',
  periodEnd: '2026-01-31T23:59:59.000Z',
  rideCount: 10,
  pricePerRide: 2.5,
  totalAmount: 25,
  paidAmount: 0,
  remainingAmount: 25,
  status: 'PENDING',
  pixGeneratedAt: null,
  pixExpiresAt: null,
  gracePeriodEndsAt: null,
  paidAt: null,
  blockedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const validPix = {
  billingCycleId: 'cycle-1',
  paymentId: 'pay-1',
  amount: 25,
  qrCode: 'qr-string',
  qrCodeBase64: 'base64string',
  copyPaste: '00020126...',
  expiresAt: '2026-01-10T00:00:00.000Z',
  externalReference: 'ext-ref-1',
  generatedAt: '2026-01-01T00:00:00.000Z',
};

// ── parseBillingStatus ────────────────────────────────────────────────────────

describe('parseBillingStatus', () => {
  it('maps totalDebt → totalPending', () => {
    const raw = {
      driverId: 'driver-1',
      isBlocked: false,
      totalDebt: 99.9,
      totalPendingRides: 5,
      pendingCycles: [],
    };

    const result = parseBillingStatus(raw);

    expect(result.totalPending).toBe(99.9);
  });

  it('prefers explicit totalPending over totalDebt when both present', () => {
    const raw = {
      driverId: 'driver-1',
      isBlocked: false,
      totalDebt: 50,
      totalPending: 75,
      totalPendingRides: 3,
      pendingCycles: [],
    };

    const result = parseBillingStatus(raw);

    expect(result.totalPending).toBe(75);
  });

  it('maps blockReason → blockedReason', () => {
    const raw = {
      driverId: 'driver-1',
      isBlocked: true,
      blockReason: 'Pagamento em atraso',
      totalDebt: 100,
      totalPendingRides: 2,
      pendingCycles: [],
    };

    const result = parseBillingStatus(raw);

    expect(result.blockedReason).toBe('Pagamento em atraso');
  });

  it('sets currentCycle to first pendingCycle', () => {
    const raw = {
      driverId: 'driver-1',
      isBlocked: false,
      totalDebt: 25,
      totalPendingRides: 10,
      pendingCycles: [validCycle],
    };

    const result = parseBillingStatus(raw);

    expect(result.currentCycle).not.toBeNull();
    expect(result.currentCycle?.id).toBe('cycle-1');
  });

  it('sets currentCycle to null when pendingCycles is empty', () => {
    const raw = {
      driverId: 'driver-1',
      isBlocked: false,
      totalDebt: 0,
      totalPendingRides: 0,
      pendingCycles: [],
    };

    const result = parseBillingStatus(raw);

    expect(result.currentCycle).toBeNull();
  });

  it('parses currentPix when present', () => {
    const raw = {
      driverId: 'driver-1',
      isBlocked: false,
      totalDebt: 25,
      totalPendingRides: 10,
      pendingCycles: [validCycle],
      currentPix: validPix,
    };

    const result = parseBillingStatus(raw);

    expect(result.currentPix).not.toBeNull();
    expect(result.currentPix?.billingCycleId).toBe('cycle-1');
    expect(result.currentPix?.qrCodeBase64).toBe('base64string');
  });

  it('sets currentPix to null when absent', () => {
    const raw = {
      driverId: 'driver-1',
      isBlocked: false,
      totalDebt: 0,
      totalPendingRides: 0,
      pendingCycles: [],
    };

    const result = parseBillingStatus(raw);

    expect(result.currentPix).toBeNull();
  });

  it('defaults driverName to empty string when absent', () => {
    const raw = {
      driverId: 'driver-1',
      isBlocked: false,
      totalDebt: 0,
      totalPendingRides: 0,
      pendingCycles: [],
    };

    const result = parseBillingStatus(raw);

    expect(result.driverName).toBe('');
  });

  it('throws when driverId is missing', () => {
    const raw = {
      isBlocked: false,
      totalDebt: 0,
      totalPendingRides: 0,
    };

    expect(() => parseBillingStatus(raw)).toThrow();
  });

  it('defaults isBlocked to false when absent', () => {
    const raw = {
      driverId: 'driver-1',
      totalDebt: 0,
      totalPendingRides: 0,
    };

    const result = parseBillingStatus(raw);
    expect(result.isBlocked).toBe(false);
  });

  it('parses nextDueDate when present', () => {
    const raw = {
      driverId: 'driver-1',
      isBlocked: false,
      totalDebt: 0,
      totalPendingRides: 0,
      pendingCycles: [],
      nextDueDate: '2026-02-01T00:00:00.000Z',
    };

    const result = parseBillingStatus(raw);

    expect(result.nextDueDate).toBe('2026-02-01T00:00:00.000Z');
  });
});

// ── parseBillingCyclesPage ────────────────────────────────────────────────────

describe('parseBillingCyclesPage', () => {
  it('handles flat array response', () => {
    const result = parseBillingCyclesPage([validCycle]);

    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it('handles empty flat array', () => {
    const result = parseBillingCyclesPage([]);

    expect(result.items).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });

  it('handles paginated response with nextCursor', () => {
    const raw = {
      items: [validCycle],
      hasMore: true,
      nextCursor: 'cursor-abc',
    };

    const result = parseBillingCyclesPage(raw);

    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('cursor-abc');
  });

  it('handles paginated response without nextCursor', () => {
    const raw = {
      items: [validCycle],
      hasMore: false,
    };

    const result = parseBillingCyclesPage(raw);

    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it('throws on invalid cycle status', () => {
    const invalidCycle = { ...validCycle, status: 'UNKNOWN_STATUS' };

    expect(() => parseBillingCyclesPage([invalidCycle])).toThrow();
  });
});

// ── parsePixQrCode ────────────────────────────────────────────────────────────

describe('parsePixQrCode', () => {
  it('parses a valid PIX response', () => {
    const result = parsePixQrCode(validPix);

    expect(result.billingCycleId).toBe('cycle-1');
    expect(result.amount).toBe(25);
    expect(result.qrCodeBase64).toBe('base64string');
    expect(result.copyPaste).toBe('00020126...');
  });

  it('throws when required fields are missing', () => {
    const incomplete = { billingCycleId: 'cycle-1' };

    expect(() => parsePixQrCode(incomplete)).toThrow();
  });

  it('throws when amount is not a number', () => {
    const invalid = { ...validPix, amount: 'not-a-number' };

    expect(() => parsePixQrCode(invalid)).toThrow();
  });
});
