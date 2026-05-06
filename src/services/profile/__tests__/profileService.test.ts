import { apiService } from '@/services/api';
import { profileService } from '@/services/profile/profileService';

jest.mock('@/services/api', () => ({
  apiService: {
    getDriverRating: jest.fn(),
    getPassengerRating: jest.fn(),
    uploadDriverDocument: jest.fn(),
    uploadProfilePhoto: jest.fn(),
  },
}));

const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns parsed rating when payload is valid', async () => {
    mockedApiService.getPassengerRating.mockResolvedValue({
      success: true,
      data: { userId: 'user-1', currentRating: '9.5', totalRatings: 14 },
    });

    const result = await profileService.getRating(false);

    expect(result.success).toBe(true);
    expect(result.data?.currentRating).toBe('9.5');
  });

  it('returns validation error for invalid rating payload', async () => {
    mockedApiService.getDriverRating.mockResolvedValue({
      success: true,
      data: undefined,
    });

    const result = await profileService.getRating(true);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_FAILED');
  });

  it('returns parsed CNH upload response', async () => {
    mockedApiService.uploadDriverDocument.mockResolvedValue({
      success: true,
      data: { message: 'ok', photoUrl: 'https://example.com/photo.jpg' },
    });

    const result = await profileService.uploadDocumentCnh('file://cnh.jpg');

    expect(result.success).toBe(true);
    expect(result.data?.photoUrl).toBe('https://example.com/photo.jpg');
  });
});
