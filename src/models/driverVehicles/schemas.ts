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

const serviceCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  baseFare: z.string(),
  perKmRate: z.string(),
  minFare: z.string(),
});

const serviceCategoriesPageSchema = z.object({
  items: z.array(serviceCategorySchema),
});

const vehicleBrandSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const vehicleModelSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const searchPageSchema = <TSchema extends z.ZodTypeAny>(itemSchema: TSchema) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().optional(),
    prevCursor: z.string().optional(),
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
