import { z } from 'zod';
import {
  CreateRideErrorInfo,
  CreatedRideData,
  PaymentBrand,
  PaymentEstimate,
  PaymentMethod,
  PaymentMethodType,
} from '@/models/paymentMethod/types';

const paymentMethodApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
});

const paymentBrandApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  enabled: z.boolean(),
});

const paymentEstimateSchema = z.object({
  estimateId: z.string(),
});

const createdRideSchema: z.ZodType<CreatedRideData> = z
  .object({
    id: z.string().optional(),
    trip_id: z.string().optional(),
    estimatedPrice: z.number().optional(),
    estimated_fare: z.number().optional(),
    finalPrice: z.number().optional(),
    final_fare: z.number().optional(),
    errorMessage: z.string().optional(),
    errorCode: z.string().optional(),
  })
  .passthrough();

function getPaymentTypeFromSlug(slug: string): PaymentMethodType {
  const normalizedSlug = slug.toLowerCase();
  if (normalizedSlug.includes('credit') || normalizedSlug === 'credito' || normalizedSlug === 'credit_card') {
    return 'credit_card';
  }
  if (normalizedSlug.includes('debit') || normalizedSlug === 'debito' || normalizedSlug === 'debit_card') {
    return 'debit_card';
  }
  if (normalizedSlug === 'pix') {
    return 'pix';
  }
  if (normalizedSlug === 'cash' || normalizedSlug === 'dinheiro') {
    return 'cash';
  }
  if (normalizedSlug.includes('wallet') || normalizedSlug === 'carteira') {
    return 'wallet';
  }
  return 'credit_card';
}

function requiresCardBrand(slug: string): boolean {
  const type = getPaymentTypeFromSlug(slug);
  return type === 'credit_card' || type === 'debit_card';
}

export function parsePaymentMethods(payload: unknown): PaymentMethod[] {
  const methods = z.array(paymentMethodApiSchema).parse(payload);
  return methods
    .filter((method) => method.enabled)
    .map((method) => ({
      id: method.id,
      name: method.name,
      slug: method.slug,
      type: getPaymentTypeFromSlug(method.slug),
      description: method.description,
      requiresCardBrand: requiresCardBrand(method.slug),
      enabled: method.enabled,
    }));
}

export function parsePaymentBrands(payload: unknown): PaymentBrand[] {
  const brands = z.array(paymentBrandApiSchema).parse(payload);
  return brands.filter((brand) => brand.enabled);
}

export function parsePaymentEstimate(payload: unknown): PaymentEstimate {
  return paymentEstimateSchema.parse(payload);
}

export function parseCreatedRide(payload: unknown): CreatedRideData {
  return createdRideSchema.parse(payload ?? {});
}

export function parseCreateRideErrorInfo(payload: unknown): CreateRideErrorInfo {
  const result = createdRideSchema.safeParse(payload ?? {});
  if (!result.success) {
    return {};
  }
  return {
    errorMessage: result.data.errorMessage,
    errorCode: result.data.errorCode,
  };
}
