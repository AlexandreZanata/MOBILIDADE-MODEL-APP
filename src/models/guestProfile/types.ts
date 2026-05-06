export type GuestProfileNavigationTarget = 'Login' | 'Register';

export interface GuestProfileAction {
  title: string;
  target: GuestProfileNavigationTarget;
  variant: 'primary' | 'ghost';
}

export interface GuestProfileViewData {
  title: string;
  subtitle: string;
  infoTitle: string;
  infoSubtitle: string;
  actions: [GuestProfileAction, GuestProfileAction];
}
