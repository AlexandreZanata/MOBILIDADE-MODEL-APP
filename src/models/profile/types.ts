/**
 * @file types.ts
 * @description Domain types for the Profile feature.
 */

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

// ─── Settings ─────────────────────────────────────────────────────────────────

export type ProfileMenuAction =
  | 'payment-methods'
  | 'change-password'
  | 'history'
  | 'saved-addresses'
  | 'coupons'
  | 'ratings'
  | 'notifications'
  | 'language'
  | 'dark-mode'
  | 'help-center'
  | 'contact-us'
  | 'terms-privacy'
  | 'logout'
  | 'delete-account';

export type ProfileSettingsRowRight =
  | { type: 'chevron' }
  | { type: 'toggle'; value: boolean; onToggle(next: boolean): void }
  | { type: 'badge'; count: number }
  | { type: 'badgeAndChevron'; count: number }
  | { type: 'value'; label: string };

export interface ProfileSettingsRow {
  id: string;
  label: string;
  icon: string;
  right: ProfileSettingsRowRight;
  action: ProfileMenuAction;
}

export interface ProfileSettingsGroup {
  id: string;
  label: string;
  rows: ProfileSettingsRow[];
}

/** @deprecated Use ProfileSettingsRow instead */
export interface ProfileMenuItem {
  id: string;
  title: string;
  icon:
    | 'card-outline'
    | 'time-outline'
    | 'location-outline'
    | 'pricetag-outline'
    | 'help-circle-outline'
    | 'information-circle-outline'
    | 'log-out-outline';
  showChevron: boolean;
  badge?: number;
  action: ProfileMenuAction;
}

// ─── Personal info ────────────────────────────────────────────────────────────

export interface ProfileDriverFieldRow {
  id: string;
  label: string;
  value: string;
}

export type PersonalInfoFieldId =
  | 'name'
  | 'email'
  | 'cpf'
  | 'phone'
  | 'birthDate'
  | 'cnhNumber'
  | 'cnhCategory'
  | 'cnhExpiration'
  | 'driverStatus';

export interface PersonalInfoField {
  id: PersonalInfoFieldId;
  label: string;
  value: string;
  /** Whether the field value is masked by default (CPF, phone). */
  masked?: boolean;
  /** Whether the field shows an email verification indicator. */
  verified?: boolean;
  /** Whether the field is editable in edit mode. */
  editable?: boolean;
}
