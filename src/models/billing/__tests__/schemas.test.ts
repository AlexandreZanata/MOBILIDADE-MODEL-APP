import { parseBillingCyclesPage, parseBillingStatus, parsePixQrCode } from '@/models/billing/schemas';

describe('billing schemas', () => {
  it('parses billing status payload', () => {
    const parsed = parseBillingStatus({
      driverId: 'driver-1',
      driverName: 'Driver',
      totalPending: 100,
      totalPendingRides: 3,
      currentCycle: null,
      isBlocked: false,
    });

    expect(parsed.driverId).toBe('driver-1');
    expect(parsed.totalPending).toBe(100);
  });

  it('normalizes billing cycles array response into page', () => {
    const parsed = parseBillingCyclesPage([
      {
        id: 'cycle-1',
        driverId: 'driver-1',
        driverName: 'Driver',
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-01-07T00:00:00.000Z',
        rideCount: 10,
        pricePerRide: 5,
        totalAmount: 50,
        paidAmount: 0,
        remainingAmount: 50,
        status: 'AWAITING_PAYMENT',
        pixGeneratedAt: null,
        pixExpiresAt: null,
        gracePeriodEndsAt: null,
        paidAt: null,
        blockedAt: null,
        createdAt: '2026-01-08T00:00:00.000Z',
      },
    ]);

    expect(parsed.items).toHaveLength(1);
    expect(parsed.hasMore).toBe(false);
  });

  it('parses pix payload', () => {
    const parsed = parsePixQrCode({
      billingCycleId: 'cycle-1',
      paymentId: 'payment-1',
      amount: 50,
      qrCode: 'qr-text',
      qrCodeBase64: 'base64',
      copyPaste: 'copy',
      expiresAt: '2026-01-10T00:00:00.000Z',
      externalReference: 'ext-1',
      generatedAt: '2026-01-09T00:00:00.000Z',
    });

    expect(parsed.copyPaste).toBe('copy');
  });
});
