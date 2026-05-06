/**
 * @file useWaitingForDriverScreen.test.ts
 * @description Unit tests for the WaitingForDriver hook logic.
 * Tests the facade and service layer interactions without React rendering.
 */
import { waitingForDriverFacade } from '@/services/waitingForDriver/waitingForDriverFacade';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/services/api', () => ({
  apiService: {
    getPassengerActiveRide: jest.fn(),
    passengerRideRate: jest.fn(),
  },
}));

jest.mock('@/models/waitingForDriver/schemas', () => ({
  parseWaitingActiveRide: jest.fn((data: unknown) => data),
}));

const { apiService } = require('@/services/api') as {
  apiService: {
    getPassengerActiveRide: jest.Mock;
    passengerRideRate: jest.Mock;
  };
};

// ── WaitingForDriverFacade ────────────────────────────────────────────────────

describe('waitingForDriverFacade', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── isDriverAccepted ────────────────────────────────────────────────────

  describe('isDriverAccepted', () => {
    const acceptedStatuses = [
      'MOTORISTA_ACEITOU',
      'MOTORISTA_A_CAMINHO',
      'MOTORISTA_PROXIMO',
      'MOTORISTA_CHEGOU',
      'PASSAGEIRO_EMBARCADO',
      'EM_ROTA',
      'DRIVER_ARRIVING',
      'DRIVER_NEARBY',
      'DRIVER_ARRIVED',
      'IN_PROGRESS',
    ];

    it.each(acceptedStatuses)('returns true for status %s', (status) => {
      expect(waitingForDriverFacade.isDriverAccepted(status)).toBe(true);
    });

    it('returns true for lowercase accepted status', () => {
      expect(waitingForDriverFacade.isDriverAccepted('motorista_aceitou')).toBe(true);
    });

    it('returns false for REQUESTED status', () => {
      expect(waitingForDriverFacade.isDriverAccepted('REQUESTED')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(waitingForDriverFacade.isDriverAccepted(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(waitingForDriverFacade.isDriverAccepted('')).toBe(false);
    });
  });

  // ── isFinalStatus ───────────────────────────────────────────────────────

  describe('isFinalStatus', () => {
    const finalStatuses = ['COMPLETED', 'CORRIDA_FINALIZADA', 'CONCLUIDA'];

    it.each(finalStatuses)('returns true for status %s', (status) => {
      expect(waitingForDriverFacade.isFinalStatus(status)).toBe(true);
    });

    it('returns true for lowercase final status', () => {
      expect(waitingForDriverFacade.isFinalStatus('completed')).toBe(true);
    });

    it('returns false for REQUESTED', () => {
      expect(waitingForDriverFacade.isFinalStatus('REQUESTED')).toBe(false);
    });

    it('returns false for CANCELLED', () => {
      expect(waitingForDriverFacade.isFinalStatus('CANCELLED')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(waitingForDriverFacade.isFinalStatus(undefined)).toBe(false);
    });
  });

  // ── fetchActiveRideSnapshot ─────────────────────────────────────────────

  describe('fetchActiveRideSnapshot', () => {
    it('returns null when API call fails', async () => {
      apiService.getPassengerActiveRide.mockResolvedValue({ success: false });
      const result = await waitingForDriverFacade.fetchActiveRideSnapshot('trip-1');
      expect(result).toBeNull();
    });

    it('returns null when API returns no data', async () => {
      apiService.getPassengerActiveRide.mockResolvedValue({ success: true, data: null });
      const result = await waitingForDriverFacade.fetchActiveRideSnapshot('trip-1');
      expect(result).toBeNull();
    });

    it('maps API response to WaitingTripSnapshot', async () => {
      apiService.getPassengerActiveRide.mockResolvedValue({
        success: true,
        data: {
          id: 'trip-42',
          status: 'MOTORISTA_ACEITOU',
          estimated_fare: 28.5,
          origin: { lat: -11.0, lng: -55.0 },
          destination: { lat: -11.1, lng: -55.1 },
          driver: {
            id: 'd-1',
            name: 'Carlos',
            rating: 4.8,
            vehicle: { brand: 'Toyota', model: 'Corolla', licensePlate: 'ABC-1234', color: 'Prata' },
          },
        },
      });

      const snapshot = await waitingForDriverFacade.fetchActiveRideSnapshot('trip-42');

      expect(snapshot).not.toBeNull();
      expect(snapshot?.rideId).toBe('trip-42');
      expect(snapshot?.status).toBe('MOTORISTA_ACEITOU');
      expect(snapshot?.estimatedFare).toBe(28.5);
      expect(snapshot?.driver?.name).toBe('Carlos');
      expect(snapshot?.driver?.vehicle?.plate).toBe('ABC-1234');
    });

    it('uses fallbackRideId when response id is missing', async () => {
      apiService.getPassengerActiveRide.mockResolvedValue({
        success: true,
        data: { id: '', status: 'REQUESTED', estimated_fare: 20 },
      });

      const snapshot = await waitingForDriverFacade.fetchActiveRideSnapshot('fallback-id');
      expect(snapshot?.rideId).toBe('fallback-id');
    });

    it('prefers final_fare over estimated_fare', async () => {
      apiService.getPassengerActiveRide.mockResolvedValue({
        success: true,
        data: { id: 'trip-1', estimated_fare: 20, final_fare: 25 },
      });

      const snapshot = await waitingForDriverFacade.fetchActiveRideSnapshot('trip-1');
      expect(snapshot?.estimatedFare).toBe(25);
    });
  });

  // ── submitPassengerRating ───────────────────────────────────────────────

  describe('submitPassengerRating', () => {
    it('returns true on successful rating submission', async () => {
      apiService.passengerRideRate.mockResolvedValue({ success: true });
      const result = await waitingForDriverFacade.submitPassengerRating('trip-1', 5, 'Ótimo!');
      expect(result).toBe(true);
      expect(apiService.passengerRideRate).toHaveBeenCalledWith('trip-1', 5, 'Ótimo!');
    });

    it('returns true when status is 204', async () => {
      apiService.passengerRideRate.mockResolvedValue({ success: false, status: 204 });
      const result = await waitingForDriverFacade.submitPassengerRating('trip-1', 4);
      expect(result).toBe(true);
    });

    it('returns false when API fails', async () => {
      apiService.passengerRideRate.mockResolvedValue({ success: false, status: 500 });
      const result = await waitingForDriverFacade.submitPassengerRating('trip-1', 3);
      expect(result).toBe(false);
    });

    it('trims empty comment before sending', async () => {
      apiService.passengerRideRate.mockResolvedValue({ success: true });
      await waitingForDriverFacade.submitPassengerRating('trip-1', 5, '   ');
      expect(apiService.passengerRideRate).toHaveBeenCalledWith('trip-1', 5, undefined);
    });
  });
});
