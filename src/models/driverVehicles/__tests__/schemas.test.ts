/**
 * @file schemas.test.ts
 * Regression tests for driverVehicles Zod schemas.
 *
 * Key regression: the API returns `nextCursor: null` and `prevCursor: null`
 * when there are no more pages. The original `z.string().optional()` schema
 * rejected `null`, causing `parseDriverVehicleBrands` and
 * `parseDriverVehicleModels` to throw and the facade to return
 * `VALIDATION_FAILED` — resulting in empty brand/model lists in the UI.
 */

import {
  parseDriverServiceCategories,
  parseDriverVehicleBrands,
  parseDriverVehicleModels,
  parseDriverVehicleMutation,
  parseDriverVehiclesPage,
} from '@/models/driverVehicles/schemas';

// ─── Fixtures matching the exact API response shape ──────────────────────────

const BRAND_PAGE_NULL_CURSORS = {
  items: [{ id: 'brand-1', name: 'Toyota', slug: 'toyota', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }],
  nextCursor: null,
  prevCursor: null,
  hasMore: false,
};

const MODEL_PAGE_NULL_CURSORS = {
  items: [{ id: 'model-1', brandId: 'brand-1', name: 'Corolla', slug: 'corolla', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }],
  nextCursor: null,
  prevCursor: null,
  hasMore: false,
};

const SERVICE_CATEGORIES_PAGE = {
  items: [
    {
      id: 'cat-1',
      name: 'Econômico',
      slug: 'economico',
      baseFare: '5.00',
      perKmRate: '2.50',
      minFare: '10.00',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ],
  nextCursor: null,
  prevCursor: null,
  hasMore: false,
};

const VEHICLES_PAGE = {
  items: [
    {
      id: 'v-1',
      driverProfileId: 'dp-1',
      serviceCategoryId: null,
      licensePlate: 'ABC-1234',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2020,
      color: 'Branco',
      status: 'PENDING_DOCS',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ],
  nextCursor: null,
  prevCursor: null,
  hasMore: false,
};

// ─── parseDriverVehicleBrands ─────────────────────────────────────────────────

describe('parseDriverVehicleBrands', () => {
  it('parses a page with null cursors (regression: API returns null, not undefined)', () => {
    expect(() => parseDriverVehicleBrands(BRAND_PAGE_NULL_CURSORS)).not.toThrow();
    const result = parseDriverVehicleBrands(BRAND_PAGE_NULL_CURSORS);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ id: 'brand-1', name: 'Toyota' });
    expect(result.hasMore).toBe(false);
  });

  it('parses a page with string cursors', () => {
    const payload = { ...BRAND_PAGE_NULL_CURSORS, nextCursor: 'cursor-abc', prevCursor: 'cursor-xyz', hasMore: true };
    const result = parseDriverVehicleBrands(payload);
    expect(result.nextCursor).toBe('cursor-abc');
    expect(result.prevCursor).toBe('cursor-xyz');
    expect(result.hasMore).toBe(true);
  });

  it('parses a page with undefined cursors', () => {
    const { nextCursor: _n, prevCursor: _p, ...rest } = BRAND_PAGE_NULL_CURSORS;
    expect(() => parseDriverVehicleBrands(rest)).not.toThrow();
  });

  it('throws when items is missing', () => {
    expect(() => parseDriverVehicleBrands({ hasMore: false })).toThrow();
  });
});

// ─── parseDriverVehicleModels ─────────────────────────────────────────────────

describe('parseDriverVehicleModels', () => {
  it('parses a page with null cursors (regression: API returns null, not undefined)', () => {
    expect(() => parseDriverVehicleModels(MODEL_PAGE_NULL_CURSORS)).not.toThrow();
    const result = parseDriverVehicleModels(MODEL_PAGE_NULL_CURSORS);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ id: 'model-1', name: 'Corolla' });
  });

  it('parses an empty page', () => {
    const payload = { items: [], nextCursor: null, prevCursor: null, hasMore: false };
    const result = parseDriverVehicleModels(payload);
    expect(result.items).toHaveLength(0);
  });

  it('throws when hasMore is missing', () => {
    const { hasMore: _, ...rest } = MODEL_PAGE_NULL_CURSORS;
    expect(() => parseDriverVehicleModels(rest)).toThrow();
  });
});

// ─── parseDriverServiceCategories ────────────────────────────────────────────

describe('parseDriverServiceCategories', () => {
  it('parses a valid service categories page and returns the items array', () => {
    const result = parseDriverServiceCategories(SERVICE_CATEGORIES_PAGE);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'cat-1', name: 'Econômico', slug: 'economico' });
  });

  it('ignores extra fields like nextCursor/prevCursor/hasMore (schema strips unknowns)', () => {
    expect(() => parseDriverServiceCategories(SERVICE_CATEGORIES_PAGE)).not.toThrow();
  });

  it('throws when a required category field is missing', () => {
    const bad = { items: [{ id: 'cat-1', name: 'Econômico' }] }; // missing slug, baseFare, etc.
    expect(() => parseDriverServiceCategories(bad)).toThrow();
  });

  it('coerces numeric fare fields from API to strings', () => {
    const payload = {
      items: [
        {
          id: 'cat-1',
          name: 'Economico',
          slug: 'economico',
          baseFare: 5,
          perKmRate: 2.5,
          minFare: 10,
        },
      ],
    };
    const result = parseDriverServiceCategories(payload);
    expect(result[0].baseFare).toBe('5');
    expect(result[0].perKmRate).toBe('2.5');
    expect(result[0].minFare).toBe('10');
  });
});

// ─── parseDriverVehiclesPage ──────────────────────────────────────────────────

describe('parseDriverVehiclesPage', () => {
  it('parses a valid vehicles page with null cursors', () => {
    const result = parseDriverVehiclesPage(VEHICLES_PAGE);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].licensePlate).toBe('ABC-1234');
  });

  it('accepts null serviceCategoryId', () => {
    const result = parseDriverVehiclesPage(VEHICLES_PAGE);
    expect(result.items[0].serviceCategoryId).toBeNull();
  });
});

// ─── parseDriverVehicleMutation ───────────────────────────────────────────────

describe('parseDriverVehicleMutation', () => {
  it('parses a mutation response with a message', () => {
    const result = parseDriverVehicleMutation({ message: 'Veículo criado com sucesso.' });
    expect(result.message).toBe('Veículo criado com sucesso.');
  });

  it('parses a mutation response without a message', () => {
    const result = parseDriverVehicleMutation({});
    expect(result.message).toBeUndefined();
  });

  it('handles null payload gracefully', () => {
    expect(() => parseDriverVehicleMutation(null)).not.toThrow();
  });
});
