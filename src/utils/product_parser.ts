import { normalize_unit } from './unit_converter';

export interface ParsedProductInfo {
  quantity: number;
  unit: string;
}

export const AVERAGE_WEIGHTS: Record<string, { weight: number; unit: string }> = {
  'huevo': { weight: 60, unit: 'g' },
  'huevos': { weight: 60, unit: 'g' },
  'cebolla': { weight: 150, unit: 'g' },
  'cebollas': { weight: 150, unit: 'g' },
  'tomate': { weight: 150, unit: 'g' },
  'tomates': { weight: 150, unit: 'g' },
  'patata': { weight: 150, unit: 'g' },
  'patatas': { weight: 150, unit: 'g' },
  'zanahoria': { weight: 80, unit: 'g' },
  'zanahorias': { weight: 80, unit: 'g' },
  'diente de ajo': { weight: 5, unit: 'g' },
  'dientes de ajo': { weight: 5, unit: 'g' },
  'ajo': { weight: 5, unit: 'g' },
  'ajos': { weight: 5, unit: 'g' },
  'limón': { weight: 100, unit: 'g' },
  'limónes': { weight: 100, unit: 'g' },
  'limon': { weight: 100, unit: 'g' },
  'limones': { weight: 100, unit: 'g' },
  'manzana': { weight: 150, unit: 'g' },
  'manzanas': { weight: 150, unit: 'g' },
  'plátano': { weight: 120, unit: 'g' },
  'plátanos': { weight: 120, unit: 'g' },
  'platano': { weight: 120, unit: 'g' },
  'platanos': { weight: 120, unit: 'g' },
  'aguacate': { weight: 150, unit: 'g' },
  'aguacates': { weight: 150, unit: 'g' }
};

/**
 * Checks if an ingredient name contains a reference to an item with a known average weight.
 */
export const get_average_weight = (ingredientName: string): { weight: number; unit: string } | null => {
  const name = ingredientName.toLowerCase().trim();
  for (const key of Object.keys(AVERAGE_WEIGHTS)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(name)) {
      return AVERAGE_WEIGHTS[key];
    }
  }
  return null;
};

/**
 * Parses quantity and unit from a supermarket product name (e.g. "Arroz 1 kg" -> {quantity: 1000, unit: "g"})
 */
export const parse_product_info = (name: string): ParsedProductInfo => {
  const lowercaseName = name.toLowerCase().trim();

  // 1. Check for multiplier pack sizes like "pack 6 x 250 ml", "pack de 3 bricks de 390 g", "3x390g"
  const packRegex = /(\d+)\s*(?:x|de|pack de|pack|bricks de|bricks|botes de|botes)\s*(\d+(?:\.\d+)?)\s*(g|gr|grs|kg|kilos|kilo|ml|l|litros|litro|unidades|uds|ud|u)\b/;
  const matchPack = lowercaseName.match(packRegex);
  
  if (matchPack) {
    const packSize = parseInt(matchPack[1], 10);
    const itemQty = parseFloat(matchPack[2]);
    const rawUnit = matchPack[3];
    
    let baseQty = itemQty;
    let normUnit = 'unidades';

    if (['kg', 'kilos', 'kilo'].includes(rawUnit)) {
      baseQty = itemQty * 1000;
      normUnit = 'g';
    } else if (['l', 'litros', 'litro'].includes(rawUnit)) {
      baseQty = itemQty * 1000;
      normUnit = 'ml';
    } else if (['g', 'gr', 'grs'].includes(rawUnit)) {
      normUnit = 'g';
    } else if (['ml'].includes(rawUnit)) {
      normUnit = 'ml';
    }
    
    return { quantity: packSize * baseQty, unit: normUnit };
  }

  // 2. Simple single quantity check (e.g., "1 kg", "250 g", "500 ml", "1 l")
  const singleRegex = /(\d+(?:\.\d+)?)\s*(g|gr|grs|kg|kilos|kilo|ml|l|litros|litro|unidades|uds|ud|u)\b/;
  const matchSingle = lowercaseName.match(singleRegex);
  if (matchSingle) {
    const qty = parseFloat(matchSingle[1]);
    const rawUnit = matchSingle[2];
    
    let baseQty = qty;
    let normUnit = 'unidades';

    if (['kg', 'kilos', 'kilo'].includes(rawUnit)) {
      baseQty = qty * 1000;
      normUnit = 'g';
    } else if (['l', 'litros', 'litro'].includes(rawUnit)) {
      baseQty = qty * 1000;
      normUnit = 'ml';
    } else if (['g', 'gr', 'grs'].includes(rawUnit)) {
      normUnit = 'g';
    } else if (['ml'].includes(rawUnit)) {
      normUnit = 'ml';
    }
    
    return { quantity: baseQty, unit: normUnit };
  }

  // 3. Look for standard Spanish phrases
  if (lowercaseName.includes('docena')) {
    return { quantity: 12, unit: 'unidades' };
  }
  
  if (lowercaseName.includes('media docena')) {
    return { quantity: 6, unit: 'unidades' };
  }

  // 4. Default fallbacks based on keyword
  if (lowercaseName.includes('al peso') || lowercaseName.includes('/kg') || lowercaseName.endsWith(' kg') || lowercaseName.includes('por kg')) {
    return { quantity: 1000, unit: 'g' };
  }

  return { quantity: 1, unit: 'unidades' };
};

/**
 * Calculates the estimated prorated cost of a recipe ingredient using commercial product info.
 */
export const calculate_ingredient_cost = (
  recipeQty: number,
  recipeUnit: string,
  ingredientName: string,
  packageQty: number,
  packageUnit: string,
  packagePrice: number
): number => {
  if (packagePrice <= 0 || packageQty <= 0) return 0;

  const recipeNorm = normalize_unit(recipeQty, recipeUnit);
  const packageNorm = normalize_unit(packageQty, packageUnit);

  let rVal = recipeNorm.value;
  let rUnit = recipeNorm.baseUnit;
  let pVal = packageNorm.value;
  let pUnit = packageNorm.baseUnit;

  // Handle unit mismatch (e.g. recipe needs "2 huevos" (unidades) and package is "500 g")
  if (rUnit !== pUnit) {
    const avg = get_average_weight(ingredientName);
    if (avg) {
      if (rUnit === 'unidades' && pUnit === avg.unit) {
        // Convert recipe units to grams
        rVal = rVal * avg.weight;
        rUnit = avg.unit;
      } else if (pUnit === 'unidades' && rUnit === avg.unit) {
        // Convert package units to grams
        pVal = pVal * avg.weight;
        pUnit = avg.unit;
      }
    }
  }

  // If still mismatched, apply smart assumptions before fallback
  if (rUnit !== pUnit) {
    if (rUnit === 'g' && pUnit === 'unidades') {
      // Recipe needs grams, package is units (e.g. 1 package of sugar = 1000g)
      pVal = pVal * 1000;
      pUnit = 'g';
    } else if (rUnit === 'ml' && pUnit === 'unidades') {
      // Recipe needs ml, package is units (e.g. 1 package of milk = 1000ml)
      pVal = pVal * 1000;
      pUnit = 'ml';
    } else if (rUnit === 'unidades' && pUnit === 'g') {
      // Recipe needs units (e.g. 1 onion), package is grams (e.g. 1000g of onions)
      const avg = get_average_weight(ingredientName) || { weight: 100, unit: 'g' };
      rVal = rVal * avg.weight;
      rUnit = 'g';
    } else if (rUnit === 'unidades' && pUnit === 'ml') {
      // Recipe needs units, package is ml
      const avg = get_average_weight(ingredientName) || { weight: 100, unit: 'ml' };
      rVal = rVal * avg.weight;
      rUnit = 'ml';
    }
  }

  if (rUnit === pUnit && pVal > 0) {
    const cost = (rVal / pVal) * packagePrice;
    return Number(cost.toFixed(2));
  }

  // Fallback if units cannot be converted
  const cost = (recipeQty / packageQty) * packagePrice;
  return Number(cost.toFixed(2));
};
