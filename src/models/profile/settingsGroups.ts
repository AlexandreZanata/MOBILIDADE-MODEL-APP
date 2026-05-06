/**
 * Builds grouped settings rows for the profile screen (Screen B spec).
 */
import { tp } from '@/i18n/profile';
import { ProfileSettingsGroup } from '@/models/profile/types';

export function getProfileSettingsGroups(
  notificationsOn: boolean,
  onNotificationsToggle: (value: boolean) => void,
  isDark: boolean,
  onDarkModeToggle: (value: boolean) => void,
  couponsBadgeCount: number | undefined
): ProfileSettingsGroup[] {
  return [
    {
      id: 'my-account',
      label: tp('groupMyAccount'),
      rows: [
        {
          id: 'payment-methods',
          label: tp('paymentMethods'),
          icon: 'card-outline',
          right: { type: 'chevron' },
          action: 'payment-methods',
        },
        {
          id: 'change-password',
          label: tp('changePassword'),
          icon: 'lock-closed-outline',
          right: { type: 'chevron' },
          action: 'change-password',
        },
        {
          id: 'saved-addresses',
          label: tp('savedAddresses'),
          icon: 'location-outline',
          right: { type: 'chevron' },
          action: 'saved-addresses',
        },
        {
          id: 'coupons',
          label: tp('coupons'),
          icon: 'pricetag-outline',
          right:
            couponsBadgeCount !== undefined && couponsBadgeCount > 0
              ? { type: 'badgeAndChevron', count: couponsBadgeCount }
              : { type: 'chevron' },
          action: 'coupons',
        },
      ],
    },
    {
      id: 'activity',
      label: tp('groupActivity'),
      rows: [
        {
          id: 'history',
          label: tp('history'),
          icon: 'time-outline',
          right: { type: 'chevron' },
          action: 'history',
        },
        {
          id: 'ratings',
          label: tp('ratings'),
          icon: 'star-outline',
          right: { type: 'chevron' },
          action: 'ratings',
        },
      ],
    },
    {
      id: 'preferences',
      label: tp('groupPreferences'),
      rows: [
        {
          id: 'notifications',
          label: tp('notifications'),
          icon: 'notifications-outline',
          right: { type: 'toggle', value: notificationsOn, onToggle: (v) => onNotificationsToggle(v) },
          action: 'notifications',
        },
        {
          id: 'language',
          label: tp('language'),
          icon: 'language-outline',
          right: { type: 'value', label: tp('languageCurrentPtBr') },
          action: 'language',
        },
        {
          id: 'dark-mode',
          label: tp('darkMode'),
          icon: 'moon-outline',
          right: { type: 'toggle', value: isDark, onToggle: (v) => onDarkModeToggle(v) },
          action: 'dark-mode',
        },
      ],
    },
    {
      id: 'support',
      label: tp('groupSupport'),
      rows: [
        {
          id: 'help-center',
          label: tp('helpCenter'),
          icon: 'help-circle-outline',
          right: { type: 'chevron' },
          action: 'help-center',
        },
        {
          id: 'contact-us',
          label: tp('contactUs'),
          icon: 'mail-outline',
          right: { type: 'chevron' },
          action: 'contact-us',
        },
        {
          id: 'terms-privacy',
          label: tp('termsPrivacy'),
          icon: 'document-text-outline',
          right: { type: 'chevron' },
          action: 'terms-privacy',
        },
      ],
    },
  ];
}
