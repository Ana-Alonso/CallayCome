import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPERMARKET_SUPABASE_URL = import.meta.env.VITE_SUPERMARKET_SUPABASE_URL || 'https://placeholder-supermarket.supabase.co';
const SUPERMARKET_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPERMARKET_SUPABASE_ANON_KEY || 'placeholder-key';
const SUPERMARKET_API_BASE_URL = import.meta.env.VITE_SUPERMARKET_API_BASE_URL || 'https://supermarketapi-z9yb.onrender.com/api/v1';

if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('supermarket_supabase_session');
  } catch {}
}

export const supermarketSupabase: SupabaseClient = createClient(
  SUPERMARKET_SUPABASE_URL,
  SUPERMARKET_SUPABASE_ANON_KEY,
  {
    auth: {
      storageKey: 'supermarket_supabase_session',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

export interface SuperMarketProduct {
  referencia_id: string;
  nombre: string;
  precio: number;
  supermercado: string;
  last_seen: string;
  categoria_nombre?: string;
}

export async function searchProducts(
  query: string,
  supermarketId?: string
): Promise<SuperMarketProduct[]> {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim().toLowerCase();

  // Generate word stems for plurals/singulars (e.g. "huevos" -> "huevo")
  const stems = [cleanQuery];
  if (cleanQuery.endsWith('s')) stems.push(cleanQuery.slice(0, -1));
  if (cleanQuery.endsWith('es')) stems.push(cleanQuery.slice(0, -2));

  const words = cleanQuery.split(/\s+/).filter(w => w.length >= 3);
  words.forEach(w => {
    stems.push(w);
    if (w.endsWith('s')) stems.push(w.slice(0, -1));
    if (w.endsWith('es')) stems.push(w.slice(0, -2));
  });

  const uniqueStems = [...new Set(stems)];
  const isSpecificSupermarket = supermarketId && supermarketId !== 'todos' && supermarketId !== 'cheapest';
  const targetSuper = isSpecificSupermarket ? supermarketId.toLowerCase() : null;

  // 1. FIRST TRY DATABASE SEARCH (SUPABASE)
  try {
    const { data, error } = await supermarketSupabase
      .from('productos')
      .select('referencia_id, nombre, precio, supermercado_id, last_seen, kcal, proteinas, carbohidratos, grasas')
      .limit(200);

    if (!error && data && data.length > 0) {
      let matches = data.filter((p: any) => {
        const pName = p.nombre.toLowerCase();
        return uniqueStems.some(s => pName.includes(s));
      });

      // Filter to specific supermarket if specified
      if (isSpecificSupermarket && targetSuper) {
        const exactMatches = matches.filter((p: any) => p.supermercado_id === targetSuper);
        if (exactMatches.length > 0) {
          matches = exactMatches;
        }
      }

      if (matches.length > 0) {
        matches.sort((a: any, b: any) => {
          if (targetSuper) {
            const aPref = a.supermercado_id === targetSuper;
            const bPref = b.supermercado_id === targetSuper;
            if (aPref && !bPref) return -1;
            if (!aPref && bPref) return 1;
          }
          return Number(a.precio) - Number(b.precio);
        });

        return matches.slice(0, 20).map((item: any) => ({
          referencia_id: item.referencia_id || item.id || `ref_${Math.random()}`,
          nombre: item.nombre,
          precio: Number(item.precio),
          supermercado: item.supermercado_id || item.supermercado || 'general',
          last_seen: item.last_seen || new Date().toISOString(),
          kcal: item.kcal != null ? Number(item.kcal) : null,
          proteinas: item.proteinas != null ? Number(item.proteinas) : null,
          carbohidratos: item.carbohidratos != null ? Number(item.carbohidratos) : null,
          grasas: item.grasas != null ? Number(item.grasas) : null
        }));
      }
    }
  } catch (err) {
    console.warn('Error al consultar productos en Supabase DB:', err);
  }

  // 2. IF NOT FOUND IN DATABASE, CALL THE SUPERMARKET API TO SCRAPE/FETCH REALTIME
  if (SUPERMARKET_API_BASE_URL) {
    try {
      const url = isSpecificSupermarket && targetSuper
        ? `${SUPERMARKET_API_BASE_URL}/supermercados/${targetSuper}/search?q=${encodeURIComponent(cleanQuery)}`
        : `${SUPERMARKET_API_BASE_URL}/supermercados/search?q=${encodeURIComponent(cleanQuery)}`;

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const json = await response.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          return json.data.map((item: any) => ({
            referencia_id: item.referencia_id || item.id || `ref_${Math.random()}`,
            nombre: item.nombre,
            precio: Number(item.precio),
            supermercado: item.supermercado || item.supermercado_id || 'general',
            last_seen: item.last_seen || new Date().toISOString(),
            kcal: item.kcal != null ? Number(item.kcal) : null,
            proteinas: item.proteinas != null ? Number(item.proteinas) : null,
            carbohidratos: item.carbohidratos != null ? Number(item.carbohidratos) : null,
            grasas: item.grasas != null ? Number(item.grasas) : null
          }));
        }
      }
    } catch (apiErr) {
      console.warn('SuperMarket API fallback no disponible:', apiErr);
    }
  }

  return [];
}

export interface SuperMarketProductMacro {
  referencia_id?: string;
  nombre: string;
  supermercado: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  unit?: string;
}

export function getProductMacros(productName: string, _supermarket: string = ''): SuperMarketProductMacro | null {
  const cleanName = productName.toLowerCase().trim();

  try {
    const customMacrosStr = localStorage.getItem('supermarket_custom_macros');
    if (customMacrosStr) {
      const customList: SuperMarketProductMacro[] = JSON.parse(customMacrosStr);
      const match = customList.find(m => 
        cleanName.includes(m.nombre.toLowerCase()) || m.nombre.toLowerCase().includes(cleanName)
      );
      if (match) return match;
    }
  } catch (e) {
    console.error('Error leyendo macros de SuperMarketAPI desde localStorage:', e);
  }

  return null;
}

export async function saveSupermarketProductMacros(macro: SuperMarketProductMacro): Promise<boolean> {
  try {
    const existingStr = localStorage.getItem('supermarket_custom_macros') || '[]';
    const existingList: SuperMarketProductMacro[] = JSON.parse(existingStr);
    const updated = [macro, ...existingList.filter(item => item.nombre.toLowerCase() !== macro.nombre.toLowerCase())];
    localStorage.setItem('supermarket_custom_macros', JSON.stringify(updated));
  } catch (e) {
    console.error('Error guardando macro localmente:', e);
  }

  try {
    const { error } = await supermarketSupabase
      .from('productos')
      .update({
        kcal: macro.calories,
        proteinas: macro.protein_g,
        carbohidratos: macro.carbs_g,
        grasas: macro.fat_g
      })
      .ilike('nombre', `%${macro.nombre}%`);

    if (error) {
      console.warn('Nota sobre actualización en la tabla productos:', error.message);
    }
    return true;
  } catch (err) {
    console.warn('Guardado en Supabase fallback local completado:', err);
    return true;
  }
}

export interface IngredientMacroBreakdown {
  ingredient_name: string;
  recipe_quantity: number;
  recipe_unit: string;
  product_name: string;
  supermarket: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  hasMacro: boolean;
}

export interface RecipeMacroCalculationResult {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  ingredients: IngredientMacroBreakdown[];
  missingIngredients: IngredientMacroBreakdown[];
}

export function calculateRecipeNutritionalMacros(
  recipe: any,
  ingredientMappings: Record<string, any> = {}
): RecipeMacroCalculationResult {
  const result: RecipeMacroCalculationResult = {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    ingredients: [],
    missingIngredients: []
  };

  if (!recipe || !Array.isArray(recipe.ingredients)) return result;

  recipe.ingredients.forEach((ing: any) => {
    const mapping = ingredientMappings[ing.name];
    const productName = mapping?.product_name || ing.name;
    const supermarket = mapping?.supermarket_id || '';

    const macro = getProductMacros(productName, supermarket);

    if (macro) {
      let quantityInBaseUnit = ing.quantity;

      if (ing.unit === 'g' || ing.unit === 'gr' || ing.unit === 'ml') {
        quantityInBaseUnit = ing.quantity;
      } else if (ing.unit === 'kg' || ing.unit === 'l') {
        quantityInBaseUnit = ing.quantity * 1000;
      } else {
        const cleanIngName = ing.name.toLowerCase();
        if (cleanIngName.includes('huevo')) quantityInBaseUnit = ing.quantity * 60;
        else if (cleanIngName.includes('cebolla') || cleanIngName.includes('tomate') || cleanIngName.includes('patata')) quantityInBaseUnit = ing.quantity * 150;
        else if (cleanIngName.includes('zanahoria')) quantityInBaseUnit = ing.quantity * 80;
        else if (cleanIngName.includes('ajo')) quantityInBaseUnit = ing.quantity * 5;
        else quantityInBaseUnit = ing.quantity * 100;
      }

      const scaleFactor = quantityInBaseUnit / 100;
      const cal = Math.round(macro.calories * scaleFactor);
      const prot = Number((macro.protein_g * scaleFactor).toFixed(1));
      const carbs = Number((macro.carbs_g * scaleFactor).toFixed(1));
      const fat = Number((macro.fat_g * scaleFactor).toFixed(1));

      result.totalCalories += cal;
      result.totalProtein += prot;
      result.totalCarbs += carbs;
      result.totalFat += fat;

      const itemBreakdown: IngredientMacroBreakdown = {
        ingredient_name: ing.name,
        recipe_quantity: ing.quantity,
        recipe_unit: ing.unit,
        product_name: productName,
        supermarket: supermarket ? formatSupermarketName(supermarket) : 'Supermercado General',
        calories: cal,
        protein_g: prot,
        carbs_g: carbs,
        fat_g: fat,
        hasMacro: true
      };

      result.ingredients.push(itemBreakdown);
    } else {
      const missingItem: IngredientMacroBreakdown = {
        ingredient_name: ing.name,
        recipe_quantity: ing.quantity,
        recipe_unit: ing.unit,
        product_name: productName,
        supermarket: supermarket ? formatSupermarketName(supermarket) : 'Sin especificar',
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        hasMacro: false
      };

      result.ingredients.push(missingItem);
      result.missingIngredients.push(missingItem);
    }
  });

  result.totalCalories = Math.round(result.totalCalories);
  result.totalProtein = Number(result.totalProtein.toFixed(1));
  result.totalCarbs = Number(result.totalCarbs.toFixed(1));
  result.totalFat = Number(result.totalFat.toFixed(1));

  return result;
}

export function getRecipeSuperMarketMacros(recipe: any) {
  const breakdown = calculateRecipeNutritionalMacros(recipe);
  const portions = recipe.portions || recipe.servings || 1;

  const caloriesPerServing = Math.round(breakdown.totalCalories / portions);
  const proteinPerServing = Number((breakdown.totalProtein / portions).toFixed(1));
  const carbsPerServing = Number((breakdown.totalCarbs / portions).toFixed(1));
  const fatPerServing = Number((breakdown.totalFat / portions).toFixed(1));

  return {
    portions,
    totalCalories: breakdown.totalCalories,
    totalProtein: breakdown.totalProtein,
    totalCarbs: breakdown.totalCarbs,
    totalFat: breakdown.totalFat,
    caloriesPerServing,
    proteinPerServing,
    carbsPerServing,
    fatPerServing
  };
}

export function formatSupermarketName(superName: string = ''): string {
  if (!superName) return 'Supermercado General';
  const clean = superName.toLowerCase().trim();
  if (clean.includes('mercadona')) return 'Mercadona';
  if (clean.includes('aldi')) return 'Aldi';
  if (clean.includes('carrefour')) return 'Carrefour';
  if (clean.includes('dia')) return 'Dia';
  if (clean.includes('lidl')) return 'Lidl';
  if (clean.includes('eroski')) return 'Eroski';
  if (clean.length > 0 && !clean.includes('sin macro')) {
    return superName.charAt(0).toUpperCase() + superName.slice(1);
  }
  return 'Supermercado General';
}

export async function populateSuperMarketProductMacros(): Promise<{ success: boolean; count: number }> {
  try {
    const { data: productos } = await supermarketSupabase.from('productos').select('*').limit(1000);
    let count = 0;

    if (productos && Array.isArray(productos)) {
      const macrosList: SuperMarketProductMacro[] = productos
        .filter((prod: any) => prod.kcal !== undefined && prod.kcal !== null)
        .map((prod: any) => ({
          referencia_id: prod.referencia_id,
          nombre: prod.nombre,
          supermercado: formatSupermarketName(prod.supermercado_id || prod.supermercado),
          calories: Number(prod.kcal) || 0,
          protein_g: Number(prod.proteinas) || 0,
          carbs_g: Number(prod.carbohidratos) || 0,
          fat_g: Number(prod.grasas) || 0,
          unit: '100g'
        }));

      count = macrosList.length;

      try {
        const existingStr = localStorage.getItem('supermarket_custom_macros') || '[]';
        const existingList: SuperMarketProductMacro[] = JSON.parse(existingStr);
        const combined = [...macrosList, ...existingList];
        const uniqueMap = new Map<string, SuperMarketProductMacro>();
        combined.forEach(item => {
          const key = `${item.nombre.toLowerCase()}_${item.supermercado.toLowerCase()}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
          }
        });
        localStorage.setItem('supermarket_custom_macros', JSON.stringify(Array.from(uniqueMap.values())));
      } catch (e) {
        console.error('Error guardando en localStorage:', e);
      }
    }

    return { success: true, count };
  } catch (err) {
    console.error('Error en sincronización de macros desde SuperMarketAPI:', err);
    return { success: false, count: 0 };
  }
}

export interface SupermarketBasketResult {
  name: string;
  id: string;
  totalCost: number;
  logoColor: string;
  badge?: string;
  matchedCount: number;
}

export async function calculateBasketSupermarketComparison(
  shoppingItems: Array<{ ingredient_name: string; quantity: number; unit: string; purchased?: boolean }>
): Promise<SupermarketBasketResult[]> {
  const pendingItems = shoppingItems.filter(i => !i.purchased);
  if (pendingItems.length === 0) return [];

  const supermarketConfigs: Record<string, { name: string; color: string }> = {
    mercadona: { name: 'Mercadona', color: '#10b981' },
    aldi: { name: 'Aldi', color: '#3b82f6' },
    dia: { name: 'Dia', color: '#ef4444' },
    eroski: { name: 'Eroski', color: '#f59e0b' },
    carrefour: { name: 'Carrefour', color: '#8b5cf6' }
  };

  try {
    const { data: productos, error } = await supermarketSupabase
      .from('productos')
      .select('nombre, precio, supermercado_id');

    const productList = (error || !productos) ? [] : productos;

    const results: SupermarketBasketResult[] = Object.entries(supermarketConfigs).map(([supId, cfg]) => {
      const supProds = productList.filter((p: any) => p.supermercado_id === supId);
      const avgPrice = supProds.length > 0
        ? supProds.reduce((sum: number, p: any) => sum + Number(p.precio), 0) / supProds.length
        : 1.65;

      let total = 0;
      let matchedCount = 0;

      pendingItems.forEach(item => {
        const cleanName = item.ingredient_name.toLowerCase().trim();
        const match = supProds.find((p: any) => {
          const pName = p.nombre.toLowerCase();
          return pName.includes(cleanName) || cleanName.split(' ').some(w => w.length > 3 && pName.includes(w));
        });

        if (match) {
          total += Number(match.precio);
          matchedCount++;
        } else {
          total += avgPrice;
        }
      });

      return {
        id: supId,
        name: cfg.name,
        totalCost: Number(total.toFixed(2)),
        logoColor: cfg.color,
        matchedCount
      };
    });

    results.sort((a, b) => a.totalCost - b.totalCost);

    if (results.length > 0) {
      results[0].badge = 'Más Económico 💰';
    }
    const merc = results.find(r => r.id === 'mercadona');
    if (merc && merc !== results[0]) {
      merc.badge = 'Más Recomendado 🥇';
    }

    return results;
  } catch (err) {
    console.error('Error calculando cesta en supermercados:', err);
    return [];
  }
}
