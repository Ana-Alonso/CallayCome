import { describe, test, expect } from 'vitest';
import { normalize_unit, subtract_unit } from '../unit_converter';

describe('unit_converter utility', () => {
  test('normalize_unit weights', () => {
    expect(normalize_unit(1.5, 'kg')).toEqual({ value: 1500, baseUnit: 'g', factor: 1000 });
    expect(normalize_unit(250, 'grs')).toEqual({ value: 250, baseUnit: 'g', factor: 1 });
    expect(normalize_unit(2, 'Kilos')).toEqual({ value: 2000, baseUnit: 'g', factor: 1000 });
  });

  test('normalize_unit volumes', () => {
    expect(normalize_unit(1, 'l')).toEqual({ value: 1000, baseUnit: 'ml', factor: 1000 });
    expect(normalize_unit(500, 'Mililitros')).toEqual({ value: 500, baseUnit: 'ml', factor: 1 });
  });

  test('subtract_unit compatible units (grams/kilos)', () => {
    // Pantry: 2 kg, Recipe: 250 g
    const res1 = subtract_unit(2, 'kg', 250, 'g');
    expect(res1).toEqual({ remainingQty: 1.75, consumedRecipeQty: 250, deleted: false });

    // Pantry: 500 g, Recipe: 0.2 kg
    const res2 = subtract_unit(500, 'g', 0.2, 'kg');
    expect(res2).toEqual({ remainingQty: 300, consumedRecipeQty: 0.2, deleted: false });

    // Pantry: 100 g, Recipe: 150 g (depletes)
    const res3 = subtract_unit(100, 'g', 150, 'g');
    expect(res3).toEqual({ remainingQty: 0, consumedRecipeQty: 100, deleted: true });
  });

  test('subtract_unit compatible volumes (liters/ml)', () => {
    const res = subtract_unit(1.5, 'l', 500, 'ml');
    expect(res).toEqual({ remainingQty: 1, consumedRecipeQty: 500, deleted: false });
  });

  test('subtract_unit incompatible fallback', () => {
    const res = subtract_unit(5, 'uds', 2, 'lonchas');
    expect(res).toEqual({ remainingQty: 3, consumedRecipeQty: 2, deleted: false });
  });
});
