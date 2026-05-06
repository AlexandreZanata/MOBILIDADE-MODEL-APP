import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { PaymentMethodType } from '@/models/paymentMethod/types';

/**
 * UI display model for a payment method.
 * Extends the API domain type with visual properties (icon, colors).
 */
export interface UiPaymentMethod {
  /** API-issued identifier */
  id: string;
  /** Human-readable name from the API */
  label: string;
  /** Subtitle / description (e.g. card last digits) */
  subtitle: string;
  /** Domain type — drives icon and color mapping */
  type: PaymentMethodType;
  /** Whether selecting this method requires a card brand selection */
  requiresCardBrand: boolean;
  /** Ionicons icon name */
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  /** Icon container background color */
  iconBg: string;
  /** Icon foreground color */
  iconColor: string;
}
