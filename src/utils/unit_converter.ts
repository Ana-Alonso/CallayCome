export interface NormalizedQty {
  value: number; // Value in base unit
  baseUnit: string; // The standard name of the base unit
  factor: number; // Multiplier factor to convert back
}

/**
 * Normalizes a unit name to a standard base unit and returns conversion info.
 */
export const normalize_unit = (qty: number, unitStr: string): NormalizedQty => {
  const norm = unitStr.toLowerCase().trim().replace(/\.$/, ''); // remove trailing dot if any

  // 1. Weight Units (base: 'g')
  if (['g', 'gr', 'grs', 'gramo', 'gramos'].includes(norm)) {
    return { value: qty, baseUnit: 'g', factor: 1 };
  }
  if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos'].includes(norm)) {
    return { value: qty * 1000, baseUnit: 'g', factor: 1000 };
  }
  if (['mg', 'miligramo', 'miligramos'].includes(norm)) {
    return { value: qty * 0.001, baseUnit: 'g', factor: 0.001 };
  }

  // 2. Volume Units (base: 'ml')
  if (['ml', 'mililitro', 'mililitros'].includes(norm)) {
    return { value: qty, baseUnit: 'ml', factor: 1 };
  }
  if (['l', 'liter', 'liters', 'litro', 'litros'].includes(norm)) {
    return { value: qty * 1000, baseUnit: 'ml', factor: 1000 };
  }

  // 3. Count / Portions / Slices
  if (['unidad', 'unidades', 'uds', 'ud', 'u'].includes(norm)) {
    return { value: qty, baseUnit: 'unidades', factor: 1 };
  }
  if (['rebanada', 'rebanadas'].includes(norm)) {
    return { value: qty, baseUnit: 'rebanadas', factor: 1 };
  }
  if (['tira', 'tiras'].includes(norm)) {
    return { value: qty, baseUnit: 'tiras', factor: 1 };
  }
  if (['loncha', 'lonchas'].includes(norm)) {
    return { value: qty, baseUnit: 'lonchas', factor: 1 };
  }
  if (['ración', 'raciones', 'racion', 'raciones'].includes(norm)) {
    return { value: qty, baseUnit: 'raciones', factor: 1 };
  }

  // Default fallback for any other custom text
  return { value: qty, baseUnit: norm, factor: 1 };
};

/**
 * Subtracts the recipe quantity from the pantry quantity.
 * If units are compatible (same base unit), does conversion. Otherwise, falls back to direct subtraction.
 */
export const subtract_unit = (
  pantryQty: number,
  pantryUnit: string,
  recipeQty: number,
  recipeUnit: string
): { remainingQty: number; consumedRecipeQty: number; deleted: boolean } => {
  const pantryNorm = normalize_unit(pantryQty, pantryUnit);
  const recipeNorm = normalize_unit(recipeQty, recipeUnit);

  if (pantryNorm.baseUnit === recipeNorm.baseUnit) {
    const consumedValue = Math.min(pantryNorm.value, recipeNorm.value);
    const remainingValue = pantryNorm.value - consumedValue;

    if (remainingValue <= 0) {
      return {
        remainingQty: 0,
        consumedRecipeQty: consumedValue / recipeNorm.factor,
        deleted: true
      };
    }

    const remainingQty = Number((remainingValue / pantryNorm.factor).toFixed(2));
    if (remainingQty <= 0) {
      return {
        remainingQty: 0,
        consumedRecipeQty: pantryQty, // consumed all
        deleted: true
      };
    }

    return {
      remainingQty,
      consumedRecipeQty: consumedValue / recipeNorm.factor,
      deleted: false
    };
  }

  // Fallback to direct subtraction
  const remainingQty = pantryQty - recipeQty;
  if (remainingQty <= 0) {
    return { remainingQty: 0, consumedRecipeQty: pantryQty, deleted: true };
  }
  return {
    remainingQty: Number(remainingQty.toFixed(2)),
    consumedRecipeQty: recipeQty,
    deleted: false
  };
};
