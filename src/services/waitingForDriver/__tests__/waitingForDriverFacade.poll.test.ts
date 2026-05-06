import { apiService } from '@/services/api';
import { waitingForDriverFacade } from '@/services/waitingForDriver/waitingForDriverFacade';

jest.mock('@/services/api', () => ({
  apiService: {
    getPassengerActiveRide: jest.fn(),
  },
}));

const mockGetPassengerActiveRide = apiService.getPassengerActiveRide as jest.MockedFunction<
  typeof apiService.getPassengerActiveRide
>;

describe('waitingForDriverFacade.pollPassengerActiveRide', () => {
  beforeEach(() => {
    mockGetPassengerActiveRide.mockReset();
  });

  it('returns not_found on HTTP 404', async () => {
    mockGetPassengerActiveRide.mockResolvedValue({ success: false, status: 404 });
    const result = await waitingForDriverFacade.pollPassengerActiveRide('ride-1');
    expect(result).toEqual({ kind: 'not_found' });
  });

  it('returns error on other failures', async () => {
    mockGetPassengerActiveRide.mockResolvedValue({ success: false, status: 500 });
    const result = await waitingForDriverFacade.pollPassengerActiveRide('ride-1');
    expect(result).toEqual({ kind: 'error' });
  });
});
