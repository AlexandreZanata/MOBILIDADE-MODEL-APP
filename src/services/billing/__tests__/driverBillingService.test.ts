import { driverBillingService } from '@/services/billing/driverBillingService';
import { apiService } from '@/services/api';

jest.mock('@/services/api', () => ({
  apiService: {
    getDriverBillingStatus: jest.fn(),
    getDriverBillingCycles: jest.fn(),
    generateCyclePix: jest.fn(),
    generateDebtPix: jest.fn(),
  },
}));

const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('driverBillingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns parsed billing status on success', async () => {
    mockedApiService.getDriverBillingStatus.mockResolvedValue({
      success: true,
      data: {
        driverId: 'driver-1',
        driverName: 'Driver',
        totalPending: 15,
        totalPendingRides: 2,
        currentCycle: null,
        isBlocked: false,
      },
    });

    const result = await driverBillingService.getBillingStatus();
    expect(result.success).toBe(true);
    expect(result.data?.totalPending).toBe(15);
  });

  it('returns request failure when API fails', async () => {
    mockedApiService.getDriverBillingCycles.mockResolvedValue({
      success: false,
      message: 'Request failed',
      status: 500,
    });

    const result = await driverBillingService.getBillingCycles({ limit: 20 });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('REQUEST_FAILED');
  });
});
