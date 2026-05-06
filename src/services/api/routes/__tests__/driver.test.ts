/**
 * @file driver.test.ts
 * @description Unit tests for driver API routes — Zod validation and status update logic.
 * Covers: valid responses, invalid shapes, missing fields, and error pass-through.
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequest = jest.fn();

jest.mock('@/services/api/core/client', () => ({
  apiCoreClient: { request: mockRequest },
}));

// ── Subject ───────────────────────────────────────────────────────────────────

import { driverRoutes } from '../driver';

// ── Helpers ───────────────────────────────────────────────────────────────────

const validStatusResponse = {
  operationalStatus: 'AVAILABLE' as const,
  isOnline: true,
  canReceiveRides: true,
};

// ── getDriverOperationalStatus ────────────────────────────────────────────────

describe('driverRoutes.getDriverOperationalStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns parsed data for a valid response', async () => {
    mockRequest.mockResolvedValue({ success: true, data: validStatusResponse });

    const result = await driverRoutes.getDriverOperationalStatus();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(validStatusResponse);
  });

  it('passes through all valid operationalStatus values', async () => {
    const statuses = ['AVAILABLE', 'BUSY', 'PAUSED', 'OFFLINE'] as const;

    for (const status of statuses) {
      mockRequest.mockResolvedValue({
        success: true,
        data: { operationalStatus: status, isOnline: false, canReceiveRides: false },
      });
      const result = await driverRoutes.getDriverOperationalStatus();
      expect(result.success).toBe(true);
      expect(result.data?.operationalStatus).toBe(status);
    }
  });

  it('returns error response when API call fails', async () => {
    mockRequest.mockResolvedValue({ success: false, message: 'Unauthorized', status: 401 });

    const result = await driverRoutes.getDriverOperationalStatus();

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
  });

  it('returns invalid response error when operationalStatus is unknown', async () => {
    mockRequest.mockResolvedValue({
      success: true,
      data: { operationalStatus: 'UNKNOWN_STATUS', isOnline: true, canReceiveRides: true },
    });

    const result = await driverRoutes.getDriverOperationalStatus();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Resposta inválida do servidor');
  });

  it('returns invalid response error when isOnline is missing', async () => {
    mockRequest.mockResolvedValue({
      success: true,
      data: { operationalStatus: 'AVAILABLE', canReceiveRides: true },
    });

    const result = await driverRoutes.getDriverOperationalStatus();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Resposta inválida do servidor');
  });

  it('returns invalid response error when canReceiveRides is missing', async () => {
    mockRequest.mockResolvedValue({
      success: true,
      data: { operationalStatus: 'AVAILABLE', isOnline: true },
    });

    const result = await driverRoutes.getDriverOperationalStatus();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Resposta inválida do servidor');
  });

  it('returns invalid response error when data is null', async () => {
    mockRequest.mockResolvedValue({ success: true, data: null });

    const result = await driverRoutes.getDriverOperationalStatus();

    expect(result.success).toBe(false);
    expect(result.message).toBe('Resposta inválida do servidor');
  });
});

// ── updateDriverOperationalStatus ─────────────────────────────────────────────

describe('driverRoutes.updateDriverOperationalStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends PATCH with correct body and returns parsed data', async () => {
    mockRequest.mockResolvedValue({ success: true, data: validStatusResponse });

    const result = await driverRoutes.updateDriverOperationalStatus('AVAILABLE');

    expect(mockRequest).toHaveBeenCalledWith('/drivers/operational-status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'AVAILABLE' }),
    });
    expect(result.success).toBe(true);
    expect(result.data?.operationalStatus).toBe('AVAILABLE');
    expect(result.data?.isOnline).toBe(true);
    expect(result.data?.canReceiveRides).toBe(true);
  });

  it('sends OFFLINE status correctly', async () => {
    mockRequest.mockResolvedValue({
      success: true,
      data: { operationalStatus: 'OFFLINE', isOnline: false, canReceiveRides: false },
    });

    const result = await driverRoutes.updateDriverOperationalStatus('OFFLINE');

    expect(mockRequest).toHaveBeenCalledWith('/drivers/operational-status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'OFFLINE' }),
    });
    expect(result.data?.operationalStatus).toBe('OFFLINE');
  });

  it('passes through API error responses without parsing', async () => {
    mockRequest.mockResolvedValue({
      success: false,
      message: 'Cannot set AVAILABLE with active ride',
      status: 409,
    });

    const result = await driverRoutes.updateDriverOperationalStatus('AVAILABLE');

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
  });

  it('returns invalid response error when response shape is wrong', async () => {
    mockRequest.mockResolvedValue({
      success: true,
      data: { status: 'AVAILABLE' }, // wrong field name
    });

    const result = await driverRoutes.updateDriverOperationalStatus('AVAILABLE');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Resposta inválida do servidor');
  });
});
