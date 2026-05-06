/**
 * Unit tests for driver home eligibility helpers (operational vs validation contract).
 */
import {
  getOperationalSnapshotSummary,
  isDriverEligible,
  shouldShowOperationalAvailabilityHint,
} from '@/hooks/driverHome/helpers';
import type { DriverOperationalStatusData, DriverValidationStatusData } from '@/models/driverHome/types';

const offlineCannotReceive: DriverOperationalStatusData = {
  operationalStatus: 'OFFLINE',
  isOnline: false,
  canReceiveRides: false,
};

describe('isDriverEligible', () => {
  it('returns false when both payloads missing', () => {
    expect(isDriverEligible(null, null)).toBe(false);
  });

  it('returns false when only operational exists and canReceiveRides is false', () => {
    expect(isDriverEligible(offlineCannotReceive, null)).toBe(false);
  });

  it('returns true for workflowStatus COMPLETE even if canReceiveRides is false while OFFLINE', () => {
    const validation: DriverValidationStatusData = {
      workflowStatus: 'COMPLETE',
      cnh: { status: 'APPROVED' },
      vehicles: [{ status: 'APPROVED' }],
    };
    expect(isDriverEligible(offlineCannotReceive, validation)).toBe(true);
  });

  it('treats lowercase workflow complete as eligible', () => {
    const validation: DriverValidationStatusData = {
      workflowStatus: 'complete',
      cnh: { status: 'approved' },
      vehicles: [{ status: 'approved' }],
    };
    expect(isDriverEligible(offlineCannotReceive, validation)).toBe(true);
  });

  it('returns true for workflowStatus ACTIVE regardless of canReceiveRides', () => {
    const validation: DriverValidationStatusData = {
      workflowStatus: 'ACTIVE',
      cnh: { status: 'APPROVED' },
      vehicles: [{ status: 'APPROVED' }],
    };
    expect(isDriverEligible(offlineCannotReceive, validation)).toBe(true);
  });

  it('returns true when CNH and at least one vehicle are APPROVED even if workflow string is unexpected', () => {
    const validation: DriverValidationStatusData = {
      workflowStatus: 'UNKNOWN_PHASE',
      cnh: { status: 'APPROVED' },
      vehicles: [{ status: 'APPROVED' }],
    };
    expect(isDriverEligible(offlineCannotReceive, validation)).toBe(true);
  });

  it('falls back to canReceiveRides when validation does not prove onboarding complete', () => {
    const validation: DriverValidationStatusData = {
      workflowStatus: 'CNH_REVIEW',
      cnh: { status: 'PENDING' },
      vehicles: [],
    };
    expect(isDriverEligible({ ...offlineCannotReceive, canReceiveRides: true }, validation)).toBe(true);
    expect(isDriverEligible(offlineCannotReceive, validation)).toBe(false);
  });
});

describe('getOperationalSnapshotSummary', () => {
  it('returns null without operational payload', () => {
    expect(getOperationalSnapshotSummary(null)).toBeNull();
  });

  it('includes Sim/Nao for flags', () => {
    const line = getOperationalSnapshotSummary({
      operationalStatus: 'OFFLINE',
      isOnline: false,
      canReceiveRides: false,
    });
    expect(line).toContain('Nao');
    expect(line).toContain('Offline');
  });
});

describe('shouldShowOperationalAvailabilityHint', () => {
  it('is true when canReceiveRides is false', () => {
    expect(shouldShowOperationalAvailabilityHint(offlineCannotReceive, true)).toBe(true);
  });

  it('is true when driver not eligible even if canReceiveRides true', () => {
    expect(
      shouldShowOperationalAvailabilityHint({ ...offlineCannotReceive, canReceiveRides: true }, false)
    ).toBe(true);
  });

  it('is false when eligible and can receive', () => {
    expect(
      shouldShowOperationalAvailabilityHint({ ...offlineCannotReceive, canReceiveRides: true }, true)
    ).toBe(false);
  });
});
