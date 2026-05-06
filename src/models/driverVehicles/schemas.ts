import { z } from 'zod';
import {
  DriverServiceCategory,
  DriverVehicle,
  DriverVehicleBrand,
  DriverVehicleModel,
  DriverVehicleMutation,
  DriverVehiclesPage,
  DriverVehicleSearchPage,
} from '@/models/driverVehicles/types';

const driverVehicleSchema = z.object({
  id: z.string(),
  driverProfileId: z.string(),
  serviceCategoryId: z.string().nullable(),
  licensePlate: z.string(),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
  color: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const driverVehiclesPageSchema = z.object({
  items: z.array(driverVehicleSchema),
  nextCursor: z.string().nullable(),
  prevCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

/** API may return fares as decimal strings or numbers; normalize to string for UI. */
const decimalLike = z.union([z.string(), z.number()]).transform((v) => String(v));

const serviceCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  baseFare: decimalLike,
  perKmRate: decimalLike,
  minFare: decimalLike,
});

const serviceCategoriesPageSchema = z.object({
  items: z.array(serviceCategorySchema),
});

const vehicleBrandSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** Models include brandId/slug in API; only id+name required for forms. */
const vehicleModelSchema = z.object({
  id: z.string(),
  brandId: z.string().optional(),
  name: z.string(),
  slug: z.string().optional(),
});

const searchPageSchema = <TSchema extends z.ZodTypeAny>(itemSchema: TSchema) =>
  z.object({
    items: z.array(itemSchema),
    // API returns null when there is no cursor; nullish() accepts null | undefined | string.
    nextCursor: z.string().nullish(),
    prevCursor: z.string().nullish(),
    hasMore: z.boolean(),
  });

const mutationSchema = z.object({
  message: z.string().optional(),
});

export function parseDriverVehiclesPage(payload: unknown): DriverVehiclesPage {
  return driverVehiclesPageSchema.parse(payload);
}

export function parseDriverServiceCategories(payload: unknown): DriverServiceCategory[] {
  return serviceCategoriesPageSchema.parse(payload).items;
}

export function parseDriverVehicleBrands(payload: unknown): DriverVehicleSearchPage<DriverVehicleBrand> {
  return searchPageSchema(vehicleBrandSchema).parse(payload);
}

export function parseDriverVehicleModels(payload: unknown): DriverVehicleSearchPage<DriverVehicleModel> {
  return searchPageSchema(vehicleModelSchema).parse(payload);
}

export function parseDriverVehicleMutation(payload: unknown): DriverVehicleMutation {
  return mutationSchema.parse(payload ?? {});
}

export type DriverVehicleSchema = z.infer<typeof driverVehicleSchema>;
export type ParsedDriverVehicle = DriverVehicle | DriverVehicleSchema;
