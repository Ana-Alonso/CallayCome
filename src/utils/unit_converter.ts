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
  if (['ml', 'mililitro', 'mililitros', 'cc'].includes(norm)) {
    return { value: qty, baseUnit: 'ml', factor: 1 };
  }
  if (['l', 'liter', 'liters', 'litro', 'litros'].includes(norm)) {
    return { value: qty * 1000, baseUnit: 'ml', factor: 1000 };
  }
  if (['cl', 'centilitro', 'centilitros'].includes(norm)) {
    return { value: qty * 10, baseUnit: 'ml', factor: 10 };
  }
  if (['dl', 'decilitro', 'decilitros'].includes(norm)) {
    return { value: qty * 100, baseUnit: 'ml', factor: 100 };
  }
  if (['cucharada', 'cucharadas', 'tbsp', 'cbs', 'el'].includes(norm)) {
    return { value: qty * 15, baseUnit: 'ml', factor: 15 };
  }
  if (['cucharadita', 'cucharaditas', 'tsp', 'tl'].includes(norm)) {
    return { value: qty * 5, baseUnit: 'ml', factor: 5 };
  }
  if (['vaso', 'vasos', 'taza', 'tazas', 'cup', 'cups'].includes(norm)) {
    return { value: qty * 250, baseUnit: 'ml', factor: 250 };
  }
  if (['chorro', 'chorrito', 'chorritos'].includes(norm)) {
    return { value: qty * 15, baseUnit: 'ml', factor: 15 };
  }
  if (['brik', 'briks'].includes(norm)) {
    return { value: qty * 1000, baseUnit: 'ml', factor: 1000 };
  }
  if (['pizca', 'pizcas'].includes(norm)) {
    return { value: qty, baseUnit: 'g', factor: 1 };
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
 * Average weight in grams for 1 unit of common food ingredients.
 */
export const get_average_unit_weight_grams = (ingredientName: string): number => {
  const name = ingredientName.toLowerCase().trim();
  if (name.includes('huevo')) return 60;
  if (name.includes('ajo') || name.includes('diente')) return 5;
  if (name.includes('limón') || name.includes('limon') || name.includes('naranja')) return 120;
  if (name.includes('manzana') || name.includes('pera') || name.includes('plátano') || name.includes('platano')) return 150;
  if (name.includes('pan') || name.includes('rebanada')) return 30;
  if (name.includes('zanahoria')) return 80;
  if (name.includes('pimiento')) return 150;
  if (name.includes('tomate')) return 150;
  if (name.includes('cebolla')) return 150;
  if (name.includes('patata') || name.includes('papa')) return 150;
  // Default average weight for 1 produce unit
  return 150;
};

/**
 * Converts a quantity from one unit to a target unit for an ingredient.
 */
export const convert_qty_to_unit = (
  qty: number,
  fromUnit: string,
  targetUnit: string,
  ingredientName: string = ''
): number => {
  if (!fromUnit || !targetUnit || qty <= 0) return qty;
  
  const fromNorm = normalize_unit(qty, fromUnit);
  const targetNorm = normalize_unit(1, targetUnit);

  // 1. Same base unit (e.g. g <-> kg, ml <-> l, unidades <-> unidades)
  if (fromNorm.baseUnit === targetNorm.baseUnit) {
    return fromNorm.value / targetNorm.factor;
  }

  // 2. Weight (g) <-> Count (unidades)
  const avgGram = get_average_unit_weight_grams(ingredientName);
  if (fromNorm.baseUnit === 'g' && targetNorm.baseUnit === 'unidades') {
    return fromNorm.value / avgGram;
  }
  if (fromNorm.baseUnit === 'unidades' && targetNorm.baseUnit === 'g') {
    return (fromNorm.value * avgGram) / targetNorm.factor;
  }

  // 3. Volume (ml) <-> Weight (g) (Density ~ 1 g/ml for liquids/sauces)
  if (fromNorm.baseUnit === 'ml' && targetNorm.baseUnit === 'g') {
    return fromNorm.value / targetNorm.factor;
  }
  if (fromNorm.baseUnit === 'g' && targetNorm.baseUnit === 'ml') {
    return fromNorm.value / targetNorm.factor;
  }

  // 4. Volume (ml) <-> Count (unidades) (Assuming ~250 ml per liquid unit/container)
  if (fromNorm.baseUnit === 'ml' && targetNorm.baseUnit === 'unidades') {
    return fromNorm.value / 250;
  }
  if (fromNorm.baseUnit === 'unidades' && targetNorm.baseUnit === 'ml') {
    return (fromNorm.value * 250) / targetNorm.factor;
  }

  return qty;
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
