export type ProfileUserType = 'driver' | 'passenger';

export type DriverStatus =
  | 'ONBOARDING'
  | 'AWAITING_CNH'
  | 'CNH_REVIEW'
  | 'AWAITING_VEHICLE'
  | 'VEHICLE_REVIEW'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED';

export interface ProfileRating {
  userId: string;
  currentRating: string;
  totalRatings: number;
}

export interface ProfileMutationResult {
  message: string;
  photoUrl?: string;
}

export interface ProfileMenuItem {
  id: string;
  title: string;
  icon: 'card-outline' | 'time-outline' | 'location-outline' | 'pricetag-outline' | 'help-circle-outline' | 'information-circle-outline' | 'log-out-outline';
  showChevron: boolean;
  badge?: number;
  action:
    | 'payment-methods'
    | 'history'
    | 'saved-addresses'
    | 'coupons'
    | 'help'
    | 'about'
    | 'logout';
}
