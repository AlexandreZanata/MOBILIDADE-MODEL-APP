export type VerifyEmailUserType = 'passenger' | 'driver';

export interface VerifyEmailCodeState {
  digits: string[];
  focusedIndex: number | null;
}

export interface PendingVerifyEmailPayload {
  email: string;
  userType: VerifyEmailUserType;
}
