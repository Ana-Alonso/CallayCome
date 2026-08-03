import { useState } from 'react';
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
  IconoBoton, 
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

  // Get start and end day of selected week
  const get_week_day_range = (weekNum: number) => {
    if (weekNum === 1) return { start: 1, end: 7, label: 'Semana 1 (Días 1-7)' };
    if (weekNum === 2) return { start: 8, end: 14, label: 'Semana 2 (Días 8-14)' };
    if (weekNum === 3) return { start: 15, end: 21, label: 'Semana 3 (Días 15-21)' };
    return { start: 22, end: 30, label: 'Semana 4 (Días 22-30)' };
  };

  const week_range = get_week_day_range(selected_week);
  const week_plan = meal_plan.filter(dp => dp.day >= week_range.start && dp.day <= week_range.end);

  // 1. Gather all required ingredients for the selected week's recipes
  const gather_weekly_ingredients = () => {
    const required: Record<string, { quantity: number; unit: string; recipeCount: number }> = {};
    
    week_plan.forEach(dayPlan => {
      const all_recipe_ids = [
        ...dayPlan.desayuno,
        ...dayPlan.comida,
        ...dayPlan.cena
      ].filter((id): id is number => id !== null);

      all_recipe_ids.forEach(recipeId => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe && recipe.ingredients) {
          recipe.ingredients.forEach(ing => {
            const key = ing.name.toLowerCase().trim();
            const norm = normalize_unit(ing.quantity, ing.unit);

            if (required[key]) {
              const storedNorm = normalize_unit(required[key].quantity, required[key].unit);
              if (storedNorm.baseUnit === norm.baseUnit) {
                required[key].quantity = storedNorm.value + norm.value;
                required[key].unit = storedNorm.baseUnit;
              } else {
                required[key].quantity += ing.quantity;
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
      let supermarket = '';

      if (mapping) {
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
      } else {
        // Fallback estimated cost based on quantity
        cost = 0.50 * req.recipeCount; // generic estimate
      }

      return {
        name: displayName,
        quantity: req.quantity,
        unit: req.unit,
        cost: Number(cost.toFixed(2)),
        isMapped,
        matchedProdName,
        supermarket,
        recipeCount: req.recipeCount
      };
    }).sort((a, b) => b.cost - a.cost); // sort by cost impact
  };

  const weekly_ingredients = gather_weekly_ingredients();
  const total_weekly_cost = Number(weekly_ingredients.reduce((sum, item) => sum + item.cost, 0).toFixed(2));

  // Progress Bar styling details
  const cost_percentage = Math.min((total_weekly_cost / (weekly_budget || 1)) * 100, 100);
  const is_over_budget = total_weekly_cost > weekly_budget;
  const progress_color = is_over_budget 
    ? '#ef5350' 
    : cost_percentage > 85 
      ? '#ffa726' 
      : '#81c784';

  const trigger_product_search = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedProduct(null);
    try {
      const results = await searchProducts(queryStr.trim(), preferred_supermarket);
      setSearchResults(results.slice(0, 15));
    } catch (e: any) {
      console.error("Error al buscar productos:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handle_search_api = async () => {
    await trigger_product_search(search_query);
  };

  const handle_auto_map_all = async () => {
    setIsUpdatingAll(true);
    try {
      let count = 0;
      // Loop through all weekly ingredients
      for (const ing of weekly_ingredients) {
        // If it is not mapped, or if its supermarket doesn't match the preferred supermarket (if specific)
        const needsMapping = !ing.isMapped || 
          (preferred_supermarket !== 'todos' && preferred_supermarket !== 'cheapest' && ing.supermarket !== preferred_supermarket);
          
        if (needsMapping) {
          const queryStr = ing.name;
          const results = await searchProducts(queryStr, preferred_supermarket === 'cheapest' ? undefined : preferred_supermarket);
          if (results.length > 0) {
            // Find the cheapest one
            const cheapest = results.reduce((min, p) => p.precio < min.precio ? p : min, results[0]);
            const parsed = parse_product_info(cheapest.nombre);
            
            await handle_save_mapping({
              ingredient_name: ing.name,
              product_name: cheapest.nombre,
              price: cheapest.precio,
              package_qty: parsed.quantity,
              package_unit: parsed.unit,
              supermarket_id: cheapest.supermercado,
              reference_id: cheapest.referencia_id
            });
            count++;
          }
        }
      }
      alert(`Búsqueda y vinculación de ingredientes actualizada con éxito. Se vincularon ${count} productos.`);
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
      <TitleH2>Presupuesto Semanal 💸</TitleH2>
      <TextMuted>Compara precios en tiempo real y estima el coste de tus menús planificados.</TextMuted>

      <Spacer height={15} />

      {/* GLOBAL BUDGET ACTIVATION TOGGLE */}
      <CardContainer style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '16px 20px', 
        border: budget_filter_active ? '1px solid rgba(129, 199, 132, 0.3)' : '1px solid rgba(255,255,255,0.06)',
        backgroundColor: budget_filter_active ? 'rgba(129, 199, 132, 0.02)' : 'rgba(255,255,255,0.01)',
        textAlign: 'left'
      }}>
        <Box style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '15px' }}>Activar Control de Presupuesto</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            Habilita la estimación de costes de recetas y ordena las recomendaciones del menú por precio.
          </div>
        </Box>
        <Box style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={budget_filter_active}
            onChange={e => set_budget_filter_active(e.target.checked)}
            style={{ 
              width: '20px', 
              height: '20px', 
              cursor: 'pointer', 
              accentColor: '#81c784'
            }}
          />
        </Box>
      </CardContainer>

      <Spacer height={15} />

      {!budget_filter_active && (
        <Box style={{
          backgroundColor: 'rgba(255, 167, 38, 0.08)',
          border: '1px solid rgba(255, 167, 38, 0.2)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#ffa726',
          fontSize: '13px',
          textAlign: 'left',
          marginBottom: '15px'
        }}>
          <AlertCircle size={18} />
          <div>
            <strong>El control de presupuesto está desactivado:</strong> Las sugerencias de platos del menú semanal se ordenarán siguiendo el algoritmo tradicional de ingredientes y votos familiares en lugar del precio.
          </div>
        </Box>
      )}

      {/* 1. CONFIGURATION CARD */}
      <CardContainer>
        <PantryInputGrid style={{ gap: '16px' }}>
          <FormGroup>
            <FormLabel>Presupuesto Semanal (€)</FormLabel>
            <CampoTexto
              etiqueta=""
              valor={weekly_budget || ''}
              on_change={(val) => set_weekly_budget(Number(val))}
              tipo="number"
              marcador_posicion="Ej. 60.00"
            />
          </FormGroup>

          <FormGroup>
            <FormLabel>Supermercado Preferido</FormLabel>
            <SelectControl
              value={preferred_supermarket}
              onChange={e => set_preferred_supermarket(e.target.value)}
            >
              <option value="cheapest">El más barato (Cheapest)</option>
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
        
        <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Boton
            texto={is_updating_all ? "Actualizando productos..." : "Actualizar Búsqueda de Precios"}
            variante="outlined"
            on_click={handle_auto_map_all}
            icono={is_updating_all ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} /> : <RefreshCw size={16} />}
            deshabilitado={is_updating_all || weekly_ingredients.length === 0}
            tipo="button"
          />
        </Box>
      </CardContainer>

      <Spacer height={15} />

      {/* 2. BUDGET OVERVIEW */}
      <CardContainer style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <Box style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>
              Coste Estimado ({week_range.label})
            </span>
            <div style={{ fontSize: '32px', fontWeight: '800', color: progress_color, marginTop: '4px' }}>
              {total_weekly_cost.toFixed(2)} €
              <span style={{ fontSize: '16px', fontWeight: '400', color: 'rgba(255,255,255,0.4)', marginLeft: '6px' }}>
                de {weekly_budget.toFixed(2)} €
              </span>
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

      {/* 3. TWO COLUMN DETAILED VIEW */}
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', width: '100%' }} sx={{ '@media (min-width: 900px)': { gridTemplateColumns: '3fr 2fr' } }}>
        
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
            <CardContainer style={{ padding: '40px', textAlign: 'center' }}>
              <ShoppingCart size={40} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '12px' }} />
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                No hay comidas planificadas en la semana seleccionada. Ve a la pestaña "Plan del Mes" para añadir recetas.
              </div>
            </CardContainer>
          ) : (
            weekly_ingredients.map(ing => (
              <Box 
                key={ing.name}
                style={{
                  backgroundColor: '#13131f',
                  border: '1px solid #1f1f2e',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'transform 0.2s',
                }}
              >
                <Box style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', flex: 1, minWidth: 0, paddingRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{ing.name}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                      ({ing.quantity} {ing.unit})
                    </span>
                  </div>
                  
                  {ing.isMapped ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                      <span style={{
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: ing.supermarket === 'mercadona' ? '#00A859' :
                                         ing.supermarket === 'carrefour' ? '#003893' :
                                         ing.supermarket === 'dia' ? '#E2001A' :
                                         ing.supermarket === 'aldi' ? '#002C5B' : '#005CA9',
                        color: '#fff',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {ing.supermarket}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ing.matchedProdName}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HelpCircle size={10} /> Precio estimado (Sin vincular a supermercado)
                    </div>
                  )}
                </Box>

                <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: ing.isMapped ? '#81c784' : 'rgba(255,255,255,0.6)' }}>
                      {ing.cost.toFixed(2)} €
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
                      {ing.recipeCount} {ing.recipeCount === 1 ? 'receta' : 'recetas'}
                    </div>
                  </div>

                  <Box style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                    <IconoBoton 
                      on_click={() => open_mapper_for_ingredient(ing.name)}
                      color="primary"
                    >
                      {ing.isMapped ? <Edit2 size={14} /> : <Search size={14} />}
                    </IconoBoton>
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

          <Box style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recipes.map(recipe => {
              const cost = calculate_recipe_cost(recipe);
              // Calculate portion cost (assume 4 default if unspecified)
              const portionCost = Number((cost / 4).toFixed(2));
              
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
        <Box style={{ minWidth: '320px', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                on_click={handle_search_api}
                icono={is_searching ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} /> : <Search size={16} />}
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

            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />

            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              Desglose de Ingredientes:
            </div>

            <Box style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
              {selected_recipe_for_detail.ingredients.map(ing => {
                const key = ing.name.toLowerCase().trim();
                const mapping = ingredient_mappings[key];
                
                let cost = 0;
                if (mapping) {
                  cost = calculate_ingredient_cost(
                    ing.quantity,
                    ing.unit,
                    ing.name,
                    mapping.package_qty,
                    mapping.package_unit,
                    mapping.price
                  );
                } else {
                  cost = selected_recipe_for_detail.price === 'economica' ? 0.30 : 1.20;
                }

                return (
                  <Box
                    key={ing.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                      <span style={{ color: '#fff', fontWeight: '500' }}>{ing.name}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                        {ing.quantity} {ing.unit} {mapping ? `(de ${mapping.supermarket_id})` : '(estimado)'}
                      </span>
                    </div>
                    <span style={{ fontWeight: 'bold', color: mapping ? '#81c784' : 'rgba(255,255,255,0.4)' }}>
                      {cost.toFixed(2)} €
                    </span>
                  </Box>
                );
              })}
            </Box>

            <Boton
              texto="Cerrar"
              on_click={() => setSelectedRecipeForDetail(null)}
              clase_css="full-width"
              tipo="button"
            />
          </Box>
        )}
      </Dialogo>
    </PageContainer>
  );
};
