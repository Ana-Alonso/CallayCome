import { useState, useEffect } from 'react';
import { 
  Search, 
  Check, 
  AlertCircle, 
  ShoppingCart, 
  HelpCircle, 
  Loader2, 
  Edit2,
  RefreshCw
} from 'lucide-react';
import { 
  PageContainer, 
  CardContainer, 
  TitleH2, 
  TextMuted, 
  Spacer, 
  FormGroup, 
  FormLabel, 
  SelectControl, 
  Boton, 
  Box, 
  CampoTexto, 
  Dialogo, 
  PantryInputGrid
} from '../common';
import type { MealPlanDay, Recipe, IngredientMapping } from '../../types';
import { get_current_planner_day, get_active_week_info } from '../../utils/planner_helpers';
import { searchProducts, type SuperMarketProduct } from '../../services/supermarket_api';
import { parse_product_info, calculate_ingredient_cost } from '../../utils/product_parser';
import { normalize_unit } from '../../utils/unit_converter';

interface BudgetTabProps {
  meal_plan: MealPlanDay[];
  recipes: Recipe[];
  start_date: string | null;
  weekly_budget: number;
  set_weekly_budget: (budget: number) => void;
  preferred_supermarket: string;
  set_preferred_supermarket: (supermarket: string) => void;
  ingredient_mappings: Record<string, IngredientMapping>;
  handle_save_mapping: (mapping: Omit<IngredientMapping, 'id'>) => Promise<void>;
  handle_delete_mapping: (ingredient_name: string) => Promise<void>;
  calculate_recipe_cost: (recipe: Recipe) => number;
  budget_filter_active: boolean;
  set_budget_filter_active: (active: boolean) => void;
}

export const BudgetTab = ({
  meal_plan,
  recipes,
  start_date,
  weekly_budget,
  set_weekly_budget,
  preferred_supermarket,
  set_preferred_supermarket,
  ingredient_mappings,
  handle_save_mapping,
  handle_delete_mapping,
  calculate_recipe_cost,
  budget_filter_active,
  set_budget_filter_active
}: BudgetTabProps) => {
  // Determine current active week from planner
  const current_day = get_current_planner_day(start_date);
  const active_week_info = get_active_week_info(current_day);
  
  const [selected_week, set_selected_week] = useState<number>(active_week_info.week_number);
  const [selected_recipe_for_detail, setSelectedRecipeForDetail] = useState<Recipe | null>(null);

  // Ingredient search modal states
  const [mapping_ingredient_name, setMappingIngredientName] = useState<string>('');
  const [is_search_open, setIsSearchOpen] = useState<boolean>(false);
  const [search_query, setSearchQuery] = useState<string>('');
  const [search_results, setSearchResults] = useState<SuperMarketProduct[]>([]);
  const [is_searching, setIsSearching] = useState<boolean>(false);
  const [is_updating_all, setIsUpdatingAll] = useState<boolean>(false);
  const [selected_product, setSelectedProduct] = useState<SuperMarketProduct | null>(null);
  
  // Confirmed mapping state
  const [confirm_qty, setConfirmQty] = useState<number>(1);
  const [confirm_unit, setConfirmUnit] = useState<string>('unidades');
  const [confirm_price, setConfirmPrice] = useState<number>(0);

  // Household budget scope states (individual vs family)
  const [budget_scope, set_budget_scope] = useState<'family' | 'individual'>(() => {
    return (localStorage.getItem('budget_scope') as 'family' | 'individual') || 'family';
  });
  const [household_members, set_household_members] = useState<number>(() => {
    return Number(localStorage.getItem('budget_household_members')) || 2;
  });

  const handle_change_scope = (scope: 'family' | 'individual') => {
    set_budget_scope(scope);
    localStorage.setItem('budget_scope', scope);
  };

  const handle_change_members = (members: number) => {
    const val = Math.max(1, Math.min(12, members));
    set_household_members(val);
    localStorage.setItem('budget_household_members', String(val));
  };

  // Get start and end day of selected week
  const get_week_day_range = (weekNum: number) => {
    if (weekNum === 1) return { start: 1, end: 7, label: 'Semana 1 (Días 1-7)' };
    if (weekNum === 2) return { start: 8, end: 14, label: 'Semana 2 (Días 8-14)' };
    if (weekNum === 3) return { start: 15, end: 21, label: 'Semana 3 (Días 15-21)' };
    return { start: 22, end: 30, label: 'Semana 4 (Días 22-30)' };
  };

  const week_range = get_week_day_range(selected_week);
  const week_plan = meal_plan.filter(dp => dp.day >= week_range.start && dp.day <= week_range.end);

  // 1. Gather all required ingredients for the selected week's recipes (scaled by individual / family members)
  const gather_weekly_ingredients = () => {
    const required: Record<string, { quantity: number; unit: string; recipeCount: number }> = {};
    const target_members = budget_scope === 'individual' ? 1 : Math.max(1, household_members);

    week_plan.forEach(dayPlan => {
      const all_recipe_ids = [
        ...dayPlan.desayuno,
        ...dayPlan.comida,
        ...dayPlan.cena
      ].filter((id): id is number => id !== null);

      all_recipe_ids.forEach(recipeId => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe && recipe.ingredients) {
          const recipePortions = (recipe as any).portions || (recipe as any).servings || 1;
          const scaleFactor = target_members / recipePortions;

          recipe.ingredients.forEach(ing => {
            const key = ing.name.toLowerCase().trim();
            const scaledQty = ing.quantity * scaleFactor;
            const norm = normalize_unit(scaledQty, ing.unit);

            if (required[key]) {
              const storedNorm = normalize_unit(required[key].quantity, required[key].unit);
              if (storedNorm.baseUnit === norm.baseUnit) {
                required[key].quantity = storedNorm.value + norm.value;
                required[key].unit = storedNorm.baseUnit;
              } else {
                required[key].quantity += scaledQty;
              }
              required[key].recipeCount += 1;
            } else {
              required[key] = { quantity: norm.value, unit: norm.baseUnit, recipeCount: 1 };
            }
          });
        }
      });
    });

    return Object.keys(required).map(key => {
      // Find original display casing
      let displayName = key;
      for (const r of recipes) {
        const ing = r.ingredients?.find(i => i.name.toLowerCase().trim() === key);
        if (ing) {
          displayName = ing.name;
          break;
        }
      }

      const req = required[key];
      const mapping = ingredient_mappings[key];

      let cost = 0;
      let isMapped = false;
      let matchedProdName = '';
      const isSpecificSuper = preferred_supermarket !== 'todos' && preferred_supermarket !== 'cheapest';
      let supermarket = isSpecificSuper ? preferred_supermarket : '';
      let productPrice: number | null = null;
      let packageQty: number | null = null;
      let packageUnit: string | null = null;

      if (mapping && (!isSpecificSuper || mapping.supermarket_id === preferred_supermarket)) {
        cost = calculate_ingredient_cost(
          req.quantity,
          req.unit,
          displayName,
          mapping.package_qty,
          mapping.package_unit,
          mapping.price
        );
        isMapped = true;
        matchedProdName = mapping.product_name;
        supermarket = mapping.supermarket_id;
        productPrice = mapping.price;
        packageQty = mapping.package_qty;
        packageUnit = mapping.package_unit;
      } else {
        // Fallback estimated cost based on quantity for current selected supermarket
        cost = 0.50 * req.recipeCount * (budget_scope === 'individual' ? 1 : (household_members / 2));
      }

      return {
        name: displayName,
        quantity: req.quantity,
        unit: req.unit,
        cost: Number(cost.toFixed(2)),
        isMapped,
        matchedProdName,
        supermarket,
        productPrice,
        packageQty,
        packageUnit,
        recipeCount: req.recipeCount
      };
    }).sort((a, b) => b.cost - a.cost);
  };

  const weekly_ingredients = gather_weekly_ingredients();
  const total_weekly_cost = Number(weekly_ingredients.reduce((sum, item) => sum + item.cost, 0).toFixed(2));
  const active_members_count = budget_scope === 'individual' ? 1 : Math.max(1, household_members);
  const cost_per_person = Number((total_weekly_cost / active_members_count).toFixed(2));
  const daily_cost_per_person = Number((cost_per_person / 7).toFixed(2));

  // Progress Bar styling details
  const cost_percentage = Math.min((total_weekly_cost / (weekly_budget || 1)) * 100, 100);
  const is_over_budget = total_weekly_cost > weekly_budget;
  const progress_color = is_over_budget 
    ? '#ef5350' 
    : cost_percentage > 85 
      ? '#ffa726' 
      : '#81c784';

  // Auto-resolve prices for unmapped ingredients when tab loads
  useEffect(() => {
    let isMounted = true;
    const autoMapOnLoad = async () => {
      const unmapped = weekly_ingredients.filter(ing => !ing.isMapped);
      if (unmapped.length > 0) {
        for (const ing of unmapped) {
          if (!isMounted) break;
          try {
            const results = await searchProducts(ing.name, preferred_supermarket);
            if (results.length > 0 && isMounted) {
              const isSpecificSupermarket = preferred_supermarket !== 'todos' && preferred_supermarket !== 'cheapest';
              let selectedProd = results[0];
              if (isSpecificSupermarket) {
                const exactMatch = results.find(p => p.supermercado === preferred_supermarket);
                if (exactMatch) selectedProd = exactMatch;
              } else {
                selectedProd = results.reduce((min, p) => p.precio < min.precio ? p : min, results[0]);
              }

              const parsed = parse_product_info(selectedProd.nombre);
              await handle_save_mapping({
                ingredient_name: ing.name,
                product_name: selectedProd.nombre,
                price: selectedProd.precio,
                package_qty: parsed.quantity,
                package_unit: parsed.unit,
                supermarket_id: selectedProd.supermercado,
                reference_id: selectedProd.referencia_id
              });
            }
          } catch (err) {
            console.error('Error auto-mapping on load:', err);
          }
        }
      }
    };

    autoMapOnLoad();
    return () => { isMounted = false; };
  }, [selected_week, preferred_supermarket]);

  const trigger_product_search = async (queryStr: string, forceApi: boolean = false) => {
    if (!queryStr.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedProduct(null);
    try {
      const results = await searchProducts(queryStr.trim(), preferred_supermarket, forceApi);
      setSearchResults(results.slice(0, 15));
    } catch (e: any) {
      console.error("Error al buscar productos:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handle_search_api = async (forceApi: boolean = false) => {
    await trigger_product_search(search_query, forceApi);
  };

  const handle_auto_map_all = async () => {
    setIsUpdatingAll(true);
    try {
      let count = 0;
      const isSpecificSupermarket = preferred_supermarket !== 'todos' && preferred_supermarket !== 'cheapest';

      for (const ing of weekly_ingredients) {
        const queryStr = ing.name;
        const results = await searchProducts(queryStr, preferred_supermarket);

        if (results.length > 0) {
          let selectedProd = results[0];
          if (isSpecificSupermarket) {
            const exactMatch = results.find(p => p.supermercado === preferred_supermarket);
            if (exactMatch) selectedProd = exactMatch;
          } else {
            selectedProd = results.reduce((min, p) => p.precio < min.precio ? p : min, results[0]);
          }

          const parsed = parse_product_info(selectedProd.nombre);
          
          await handle_save_mapping({
            ingredient_name: ing.name,
            product_name: selectedProd.nombre,
            price: selectedProd.precio,
            package_qty: parsed.quantity,
            package_unit: parsed.unit,
            supermarket_id: selectedProd.supermercado,
            reference_id: selectedProd.referencia_id
          });
          count++;
        } else if (isSpecificSupermarket && ingredient_mappings[ing.name.toLowerCase().trim()]) {
          // Clear stale mapping from another supermarket if not available in current preferred super
          await handle_delete_mapping(ing.name);
        }
      }
      const labelMode = preferred_supermarket === 'cheapest' 
        ? 'el más barato' 
        : preferred_supermarket === 'todos' 
          ? 'modo comparador' 
          : preferred_supermarket.toUpperCase();

      alert(`Búsqueda y vinculación de ingredientes actualizada con éxito. Se vincularon ${count} productos en base a: ${labelMode}.`);
    } catch (e: any) {
      console.error(e);
      alert("Error al actualizar la búsqueda: " + e.message);
    } finally {
      setIsUpdatingAll(false);
    }
  };

  const handle_select_search_product = (product: SuperMarketProduct) => {
    setSelectedProduct(product);
    const parsed = parse_product_info(product.nombre);
    setConfirmQty(parsed.quantity);
    setConfirmUnit(parsed.unit);
    setConfirmPrice(product.precio);
  };

  const handle_save_confirmed_mapping = async () => {
    if (!selected_product || !mapping_ingredient_name) return;

    await handle_save_mapping({
      ingredient_name: mapping_ingredient_name,
      product_name: selected_product.nombre,
      price: confirm_price,
      package_qty: confirm_qty,
      package_unit: confirm_unit,
      supermarket_id: selected_product.supermercado,
      reference_id: selected_product.referencia_id
    });

    setIsSearchOpen(false);
    setSelectedProduct(null);
    setSearchResults([]);
    setSearchQuery('');
  };

  const open_mapper_for_ingredient = async (ingName: string) => {
    setMappingIngredientName(ingName);
    setSearchQuery(ingName);
    setIsSearchOpen(true);
    setSelectedProduct(null);
    await trigger_product_search(ingName);
  };

  return (
    <PageContainer>
      <TitleH2>Presupuesto Inteligente y Comparador</TitleH2>
      <TextMuted>
        Calcula el gasto semanal exacto de tu menú planificado comparando precios en supermercados reales, ajustado para usuarios individuales o familias.
      </TextMuted>

      <Spacer height={15} />

      {/* GLOBAL BUDGET ACTIVATION TOGGLE */}
      <CardContainer style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '14px 18px',
        backgroundColor: budget_filter_active ? 'rgba(129, 199, 132, 0.08)' : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${budget_filter_active ? 'rgba(129, 199, 132, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
        marginBottom: '15px'
      }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>
            Activar Ordenación por Presupuesto en Menú Semanal
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
            Prioriza las recetas más económicas y aptas para tu límite de gasto en la ruleta y recomendaciones.
          </div>
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={budget_filter_active} 
            onChange={e => set_budget_filter_active(e.target.checked)}
            style={{ opacity: 0, width: 0, height: 0 }} 
          />
          <span style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: budget_filter_active ? '#81c784' : '#374151',
            borderRadius: '26px',
            transition: '0.3s'
          }}>
            <span style={{
              position: 'absolute',
              content: '""',
              height: '20px',
              width: '20px',
              left: budget_filter_active ? '24px' : '3px',
              bottom: '3px',
              backgroundColor: 'white',
              borderRadius: '50%',
              transition: '0.3s'
            }} />
          </span>
        </label>
      </CardContainer>

      {!budget_filter_active && (
        <Box style={{
          backgroundColor: 'rgba(255, 167, 38, 0.08)',
          border: '1px solid rgba(255, 167, 38, 0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#ffa726',
          fontSize: '13px',
          textAlign: 'left'
        }}>
          <AlertCircle size={18} />
          <div>
            <strong>El control de presupuesto está desactivado:</strong> Las sugerencias de platos del menú semanal se ordenarán siguiendo el algoritmo tradicional de ingredientes y votos familiares en lugar del precio.
          </div>
        </Box>
      )}

      {/* 1. CONFIGURATION CARD */}
      <CardContainer>
        <PantryInputGrid style={{ gap: '10px' }}>
          <FormGroup>
            <FormLabel>Ámbito Presupuesto</FormLabel>
            <SelectControl
              value={budget_scope}
              onChange={e => handle_change_scope(e.target.value as 'family' | 'individual')}
            >
              <option value="family">👨‍👩‍👧‍👦 Familiar</option>
              <option value="individual">👤 Individual</option>
            </SelectControl>
          </FormGroup>

          {budget_scope === 'family' && (
            <FormGroup>
              <FormLabel>Nº Comensales</FormLabel>
              <CampoTexto
                etiqueta=""
                valor={household_members}
                on_change={(val) => handle_change_members(Number(val))}
                tipo="number"
                marcador_posicion="2"
              />
            </FormGroup>
          )}

          <FormGroup>
            <FormLabel>Presupuesto (€)</FormLabel>
            <CampoTexto
              etiqueta=""
              valor={weekly_budget || ''}
              on_change={(val) => set_weekly_budget(Number(val))}
              tipo="number"
              marcador_posicion="Ej. 60.00"
            />
          </FormGroup>

          <FormGroup>
            <FormLabel>Supermercado</FormLabel>
            <SelectControl
              value={preferred_supermarket}
              onChange={e => set_preferred_supermarket(e.target.value)}
            >
              <option value="cheapest">Más barato</option>
              <option value="todos">Todos (Comparador)</option>
              <option value="mercadona">Mercadona</option>
              <option value="carrefour">Carrefour</option>
              <option value="dia">Dia</option>
              <option value="aldi">Aldi</option>
              <option value="eroski">Eroski</option>
            </SelectControl>
          </FormGroup>

          <FormGroup>
            <FormLabel>Semana Planificada</FormLabel>
            <SelectControl
              value={selected_week}
              onChange={e => set_selected_week(Number(e.target.value))}
            >
              <option value={1}>Semana 1 (Días 1-7)</option>
              <option value={2}>Semana 2 (Días 8-14)</option>
              <option value={3}>Semana 3 (Días 15-21)</option>
              <option value={4}>Semana 4 (Días 22-30)</option>
            </SelectControl>
          </FormGroup>
        </PantryInputGrid>
        
        <Box style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '16px 0 10px 0' }} />
        
        <Box style={{ display: 'flex', justifyContent: 'stretch', width: '100%' }}>
          <Boton
            texto={is_updating_all ? "Actualizando..." : "Actualizar Búsqueda de Precios"}
            variante="outlined"
            on_click={handle_auto_map_all}
            icono={is_updating_all ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} /> : <RefreshCw size={16} />}
            deshabilitado={is_updating_all || weekly_ingredients.length === 0}
            tipo="button"
            clase_css="full-width"
          />
        </Box>
      </CardContainer>

      <Spacer height={15} />

      {/* 2. BUDGET OVERVIEW */}
      <CardContainer style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', overflow: 'hidden', padding: '14px 16px' }}>
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <Box style={{ textAlign: 'left', flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>
                Coste Estimado ({week_range.label})
              </span>
              <span style={{
                fontSize: '9px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                padding: '2px 6px',
                borderRadius: '12px',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600
              }}>
                {budget_scope === 'family' ? `👨‍👩‍👧‍👦 Familiar (${household_members} pers.)` : `👤 Individual`}
              </span>
            </div>

            <div style={{ fontSize: '24px', fontWeight: '800', color: progress_color, marginTop: '2px' }}>
              {total_weekly_cost.toFixed(2)} €
              <span style={{ fontSize: '14px', fontWeight: '400', color: 'rgba(255,255,255,0.4)', marginLeft: '6px' }}>
                de {weekly_budget.toFixed(2)} €
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
              <strong>{cost_per_person.toFixed(2)} €</strong> / pers. semana ({daily_cost_per_person.toFixed(2)} € / día)
            </div>
          </Box>

          <Box style={{ display: 'flex', gap: '8px' }}>
            <div style={{
              backgroundColor: is_over_budget ? 'rgba(239, 83, 80, 0.1)' : 'rgba(129, 199, 132, 0.1)',
              border: `1px solid ${is_over_budget ? '#ef5350' : '#81c784'}`,
              color: is_over_budget ? '#ef5350' : '#81c784',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {is_over_budget ? (
                <>
                  <AlertCircle size={14} /> Excede en {(total_weekly_cost - weekly_budget).toFixed(2)} €
                </>
              ) : (
                <>
                  <Check size={14} /> Quedan {(weekly_budget - total_weekly_cost).toFixed(2)} €
                </>
              )}
            </div>
          </Box>
        </Box>

        {/* Progress bar */}
        <Box style={{ width: '100%', height: '10px', backgroundColor: '#20202e', borderRadius: '5px', overflow: 'hidden' }}>
          <Box style={{
            width: `${cost_percentage}%`,
            height: '100%',
            backgroundColor: progress_color,
            borderRadius: '5px',
            transition: 'width 0.5s ease-in-out, background-color 0.5s'
          }} />
        </Box>
      </CardContainer>

      <Spacer height={15} />

      {/* 3. MAIN CONTENT: INGREDIENTS LIST + RECIPE COST EXPLORER */}
      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* LEFT COLUMN: INGREDIENTS LIST & MAPPER */}
        <Box style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0, textAlign: 'left' }}>
              Ingredientes Requeridos ({weekly_ingredients.length})
            </h3>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              Ordenado por impacto de coste
            </span>
          </Box>

          {weekly_ingredients.length === 0 ? (
            <CardContainer style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              <ShoppingCart size={36} style={{ marginBottom: '8px', opacity: 0.4 }} />
              <div>No hay recetas planificadas para {week_range.label}.</div>
            </CardContainer>
          ) : (
            weekly_ingredients.map(ing => (
              <Box 
                key={ing.name}
                style={{
                  backgroundColor: '#13131f',
                  border: '1px solid #1f1f2e',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  width: '100%',
                  boxSizing: 'border-box',
                  transition: 'transform 0.2s',
                }}
              >
                {/* ROW 1: INGREDIENT NAME & QTY (LEFT) | COST PRICE (RIGHT) */}
                <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ing.name}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', flexShrink: 0 }}>
                      ({ing.quantity} {ing.unit})
                    </span>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '800',
                      color: ing.isMapped ? '#4ADE80' : '#FFA726',
                      backgroundColor: ing.isMapped ? 'rgba(74, 222, 128, 0.12)' : 'rgba(255, 167, 38, 0.12)',
                      border: `1px solid ${ing.isMapped ? 'rgba(74, 222, 128, 0.25)' : 'rgba(255, 167, 38, 0.25)'}`,
                      padding: '3px 9px',
                      borderRadius: '8px',
                      display: 'inline-block'
                    }}>
                      {ing.cost.toFixed(2)} €
                    </span>
                  </div>
                </Box>

                {/* ROW 2: SUPERMARKET & PRODUCT NAME (LEFT) | RECIPES & EDIT BUTTON (RIGHT) */}
                <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    {ing.isMapped ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: ing.supermarket === 'mercadona' ? '#00A859' :
                                           ing.supermarket === 'carrefour' ? '#003893' :
                                           ing.supermarket === 'dia' ? '#E2001A' :
                                           ing.supermarket === 'aldi' ? '#002C5B' : '#005CA9',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          flexShrink: 0
                        }}>
                          {ing.supermarket}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ing.matchedProdName}
                        </span>
                      </div>
                    ) : (
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HelpCircle size={12} style={{ color: '#FFA726', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Precio estimado (Sin vincular)</span>
                      </div>
                    )}
                  </div>

                  <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                      {ing.recipeCount} {ing.recipeCount === 1 ? 'receta' : 'recetas'}
                    </span>
                    <button
                      type="button"
                      onClick={() => open_mapper_for_ingredient(ing.name)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38BDF8',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Buscar o vincular producto"
                    >
                      {ing.isMapped ? <Edit2 size={15} color="#38BDF8" /> : <Search size={15} color="#38BDF8" />}
                    </button>
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </Box>

        {/* RIGHT COLUMN: RECIPE CATALOG PRICE EXPLORER */}
        <Box style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: 0, textAlign: 'left' }}>
              Catálogo de Recetas
            </h3>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              Estimaciones de coste
            </span>
          </Box>

          <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recipes.slice(0, 10).map((recipe) => {
              const cost = calculate_recipe_cost(recipe);
              const servings = (recipe as any).portions || (recipe as any).servings || 1;
              const portionCost = cost / servings;

              // Determine if affordable (e.g. if one portion is less than 10% of weekly budget)
              const isAffordable = portionCost < (weekly_budget * 0.1);

              return (
                <CardContainer 
                  key={recipe.id}
                  onClick={() => setSelectedRecipeForDetail(recipe)}
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, background-color 0.2s',
                    backgroundColor: '#13131f',
                    border: '1px solid #1f1f2e',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#161625'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#13131f'}
                >
                  <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {recipe.name}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '70px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#81c784' }}>
                        {cost.toFixed(2)} €
                      </span>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>
                        {portionCost.toFixed(2)} € / ración
                      </span>
                    </div>
                  </Box>

                  <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                      {recipe.ingredients.length} ing. | {recipe.meal_type}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: isAffordable ? '#81c784' : '#ffa726',
                      backgroundColor: isAffordable ? 'rgba(129, 199, 132, 0.08)' : 'rgba(255, 167, 38, 0.08)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: `1px solid ${isAffordable ? 'rgba(129, 199, 132, 0.15)' : 'rgba(255, 167, 38, 0.15)'}`
                    }}>
                      {isAffordable ? 'Apto Presupuesto' : 'Moderado'}
                    </span>
                  </Box>
                </CardContainer>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* 4. MODAL DIALOGS */}

      {/* SEARCH AND MAP PRODUCT DIALOG */}
      <Dialogo
        abierto={is_search_open}
        on_close={() => setIsSearchOpen(false)}
        titulo={`Vincular Ingrediente: ${mapping_ingredient_name}`}
      >
        <Box style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Box style={{ display: 'flex', gap: '8px' }}>
            <Box style={{ flex: 1 }}>
              <CampoTexto
                etiqueta=""
                valor={search_query}
                on_change={setSearchQuery}
                marcador_posicion="Buscar producto en supermercados..."
              />
            </Box>
            <Box style={{ width: '48px', height: '48px', minWidth: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Boton
                texto=""
                variante="outlined"
                on_click={() => handle_search_api(false)}
                icono={is_searching ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} /> : <Search size={16} />}
                deshabilitado={!search_query.trim() || is_searching}
              />
            </Box>
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <Boton
                texto="🌐 API"
                variante="outlined"
                on_click={() => handle_search_api(true)}
                icono={<RefreshCw size={14} />}
                deshabilitado={!search_query.trim() || is_searching}
              />
            </Box>
          </Box>

          {/* Search results list */}
          {search_results.length > 0 && !selected_product && (
            <Box style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '4px'
            }}>
              {search_results.map(prod => (
                <Box
                  key={prod.referencia_id + prod.supermercado}
                  onClick={() => handle_select_search_product(prod)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    fontSize: '13px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: '9px',
                      padding: '2px 5px',
                      borderRadius: '3px',
                      backgroundColor: prod.supermercado === 'mercadona' ? '#00A859' :
                                       prod.supermercado === 'carrefour' ? '#003893' :
                                       prod.supermercado === 'dia' ? '#E2001A' :
                                       prod.supermercado === 'aldi' ? '#002C5B' : '#005CA9',
                      color: '#fff',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {prod.supermercado}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                      {prod.nombre}
                    </span>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#81c784', marginLeft: '8px' }}>{prod.precio.toFixed(2)} €</span>
                </Box>
              ))}
            </Box>
          )}

          {/* Confirm product mapping details */}
          {selected_product && (
            <Box style={{
              backgroundColor: 'rgba(129, 199, 132, 0.03)',
              border: '1px solid rgba(129, 199, 132, 0.2)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#81c784' }}>
                ✓ Producto Seleccionado:
              </div>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>
                {selected_product.nombre} ({selected_product.supermercado})
              </div>
              
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />
              
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>
                Confirmar Formato Comercial:
              </div>

              <PantryInputGrid style={{ gap: '8px' }}>
                <FormGroup>
                  <FormLabel>Cant. Paquete</FormLabel>
                  <CampoTexto
                    etiqueta=""
                    valor={confirm_qty || ''}
                    on_change={val => setConfirmQty(Number(val))}
                    tipo="number"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Unidad Paquete</FormLabel>
                  <SelectControl
                    value={confirm_unit}
                    onChange={e => setConfirmUnit(e.target.value)}
                  >
                    <option value="g">gramos (g)</option>
                    <option value="ml">ml</option>
                    <option value="unidades">uds</option>
                    <option value="rebanadas">rebanadas</option>
                    <option value="lonchas">lonchas</option>
                  </SelectControl>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Precio (€)</FormLabel>
                  <CampoTexto
                    etiqueta=""
                    valor={confirm_price || ''}
                    on_change={val => setConfirmPrice(Number(val))}
                    tipo="number"
                  />
                </FormGroup>
              </PantryInputGrid>

              <Box style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <Box style={{ flex: 1 }}>
                  <Boton
                    texto="Guardar Mapeo"
                    on_click={handle_save_confirmed_mapping}
                    icono={<Check size={16} />}
                    tipo="button"
                  />
                </Box>
                <Box style={{ flex: 1 }}>
                  <Boton
                    texto="Volver"
                    variante="outlined"
                    on_click={() => setSelectedProduct(null)}
                    tipo="button"
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* Delete existing mapping */}
          {ingredient_mappings[mapping_ingredient_name.toLowerCase().trim()] && (
            <Box style={{ marginTop: '12px' }}>
              <Boton
                texto="Eliminar Vinculación Existente"
                variante="outlined"
                on_click={async () => {
                  await handle_delete_mapping(mapping_ingredient_name);
                  setIsSearchOpen(false);
                }}
                color="error"
                tipo="button"
              />
            </Box>
          )}
        </Box>
      </Dialogo>

      {/* RECIPE DETAIL COST BREAKDOWN DIALOG */}
      <Dialogo
        abierto={selected_recipe_for_detail !== null}
        on_close={() => setSelectedRecipeForDetail(null)}
        titulo={selected_recipe_for_detail ? `Coste de: ${selected_recipe_for_detail.name}` : ''}
      >
        {selected_recipe_for_detail && (
          <Box style={{ minWidth: '320px', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                Coste Estimado Total:
              </span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#81c784' }}>
                {calculate_recipe_cost(selected_recipe_for_detail).toFixed(2)} €
              </span>
            </Box>

            <Box style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />

            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Desglose de Ingredientes:
            </div>

            <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
              {selected_recipe_for_detail.ingredients.map(ing => {
                const key = ing.name.toLowerCase().trim();
                const mapping = ingredient_mappings[key];
                let cost = 0;
                if (mapping) {
                  cost = calculate_ingredient_cost(ing.quantity, ing.unit, ing.name, mapping.package_qty, mapping.package_unit, mapping.price);
                } else {
                  cost = 0.50;
                }

                return (
                  <Box key={ing.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <div>
                      <span style={{ color: '#fff', fontWeight: '500' }}>{ing.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginLeft: '6px' }}>
                        ({ing.quantity} {ing.unit})
                      </span>
                    </div>
                    <span style={{ fontWeight: 'bold', color: mapping ? '#81c784' : 'rgba(255,255,255,0.5)' }}>
                      {cost.toFixed(2)} €
                    </span>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Dialogo>
    </PageContainer>
  );
};
