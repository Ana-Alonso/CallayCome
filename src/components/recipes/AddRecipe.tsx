import { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, Search, Loader2, Check, Sparkles } from 'lucide-react';
import { Boton } from '../common/Boton';
import { CampoTexto } from '../common/CampoTexto';
import { IconoBoton } from '../common/IconoBoton';
import { Box } from '../common/Box';
import { 
  PageContainer, 
  CardContainer, 
  TitleH2, 
  TextMuted, 
  Spacer, 
  FormGroup, 
  FormLabel, 
  PantryInputGrid, 
  SelectControl,
  FlexRow,
  PantryItemContainer,
  PantryItemName,
  PantryItemQty
} from '../common';
import type { Recipe, Ingredient } from '../../types';
import { searchProducts, type SuperMarketProduct } from '../../services/supermarket_api';
import { parse_product_info } from '../../utils/product_parser';

interface AddRecipeProps {
  on_add: (recipe: Omit<Recipe, 'id'>) => void;
  handle_save_mapping: (mapping: any) => Promise<void>;
  db_ingredients?: string[];
}

export const AddRecipe = ({ on_add, handle_save_mapping, db_ingredients = [] }: AddRecipeProps) => {
  const [name, set_name] = useState<string>('');
  const [meal_type, set_meal_type] = useState<'desayuno' | 'comida' | 'cena'>('comida');
  const [price, set_price] = useState<'economica' | 'cara'>('economica');
  const [difficulty, set_difficulty] = useState<'facil' | 'intermedia' | 'dificil'>('facil');
  const [health, set_health] = useState<'saludable' | 'no saludable'>('saludable');
  const [diet_type, set_diet_type] = useState<'omnivoro' | 'vegetariano' | 'vegano' | 'pescetariano' | 'keto' | 'paleo' | 'sin_gluten' | 'sin_lactosa' | 'mediterranea'>('omnivoro');
  const [allergens_text, set_allergens_text] = useState<string>('');
  
  const [ing_name, set_ing_name] = useState<string>('');
  const [ing_qty, set_ing_qty] = useState<number>(0);
  const [ing_unit, set_ing_unit] = useState<string>('g');
  const [ingredients, set_ingredients] = useState<Ingredient[]>([]);

  // Trigger allergen detection when ingredients change
  useEffect(() => {
    if (ingredients.length === 0) return;
    
    const detectAllergens = async () => {
      try {
        const recetatorUrl = import.meta.env.VITE_RECETATOR_API_URL || 'https://recetator.onrender.com';
        const res = await fetch(`${recetatorUrl}/api/ai/detect-allergens`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ingredients: ingredients.map(ing => ing.name)
          })
        });
        const json = await res.json();
        if (json.status === 'success' && json.data?.allergens) {
          const list = json.data.allergens;
          if (list.length > 0) {
            // merge with existing allergens
            const existing = allergens_text
              .split(',')
              .map(a => a.trim().toLowerCase())
              .filter(a => a.length > 0);
            
            const merged = Array.from(new Set([...existing, ...list]));
            set_allergens_text(merged.join(', '));
          }
        }
      } catch (err) {
        console.error('Failed to auto-detect allergens:', err);
      }
    };

    detectAllergens();
  }, [ingredients]);

  // Search & confirmation states
  const [is_searching, set_is_searching] = useState<boolean>(false);
  const [search_results, set_search_results] = useState<SuperMarketProduct[]>([]);
  const [selected_product, set_selected_product] = useState<SuperMarketProduct | null>(null);
  const [confirm_qty, set_confirm_qty] = useState<number>(1);
  const [confirm_unit, set_confirm_unit] = useState<string>('unidades');
  const [confirm_price, set_confirm_price] = useState<number>(0);
  const [mappings_to_save, set_mappings_to_save] = useState<any[]>([]);

  const [instructions_text, set_instructions_text] = useState<string>('');
  const [cargandoAI, set_cargando_ai] = useState<boolean>(false);

  const handle_generate_ai = async (): Promise<void> => {
    set_cargando_ai(true);
    try {
      const parsed_allergens = allergens_text
        .split(',')
        .map(a => a.trim().toLowerCase())
        .filter(a => a.length > 0);

      const recetatorUrl = import.meta.env.VITE_RECETATOR_API_URL || 'https://recetator.onrender.com';
      const res = await fetch(`${recetatorUrl}/api/ai/generate-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_type: meal_type,
          diet_type: diet_type,
          allergens: parsed_allergens,
          max_budget: 15,
          supermarket_id: 'todos'
        })
      });
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const recipe = json.data;
        set_name(recipe.name);
        set_meal_type(recipe.meal_type);
        set_price(recipe.price);
        set_difficulty(recipe.difficulty || 'facil');
        set_health(recipe.health || 'saludable');
        set_diet_type(recipe.diet_type || 'omnivoro');
        set_allergens_text(recipe.allergens ? recipe.allergens.join(', ') : '');
        set_ingredients(recipe.ingredients || []);
        set_instructions_text(recipe.instructions ? recipe.instructions.join('\n') : '');
        
        if (recipe.comparison && recipe.supermarket_id && recipe.comparison[recipe.supermarket_id]) {
          const cheapestProducts = recipe.comparison[recipe.supermarket_id].products || [];
          const newMappings = cheapestProducts.map((p: any) => ({
            ingredient_name: p.ingredient_name,
            product_name: p.product_name,
            price: p.precio,
            package_qty: p.unit === 'g' ? 500 : p.unit === 'ml' ? 1000 : 6,
            package_unit: p.unit,
            supermarket_id: p.supermercado,
            reference_id: p.referencia_id
          }));
          set_mappings_to_save(newMappings);
        }
      } else {
        alert(json.error || 'Error al generar la receta.');
      }
    } catch (err: any) {
      alert('No se pudo comunicar con el servidor de IA. Asegúrate de que Recetator esté corriendo.');
    } finally {
      set_cargando_ai(false);
    }
  };

  const handle_api_search = async (): Promise<void> => {
    if (!ing_name.trim()) return;
    set_is_searching(true);
    set_search_results([]);
    set_selected_product(null);
    try {
      const results = await searchProducts(ing_name.trim());
      set_search_results(results.slice(0, 5));
    } catch (err: any) {
      alert(err.message || 'Error al buscar producto');
    } finally {
      set_is_searching(false);
    }
  };

  const handle_select_product = (product: SuperMarketProduct): void => {
    set_selected_product(product);
    const parsed = parse_product_info(product.nombre);
    set_confirm_qty(parsed.quantity);
    set_confirm_unit(parsed.unit);
    set_confirm_price(product.precio);
  };

  const handle_confirm_mapping = (): void => {
    if (!selected_product) return;
    if (!ing_name.trim() || ing_qty <= 0) {
      alert("Por favor introduce una cantidad y nombre de ingrediente válidos.");
      return;
    }

    const final_name = ing_name.trim();
    const new_ing: Ingredient = {
      name: final_name,
      quantity: ing_qty,
      unit: ing_unit
    };

    set_ingredients([...ingredients, new_ing]);

    const new_mapping = {
      ingredient_name: final_name,
      product_name: selected_product.nombre,
      price: confirm_price,
      package_qty: confirm_qty,
      package_unit: confirm_unit,
      supermarket_id: selected_product.supermercado,
      reference_id: selected_product.referencia_id
    };

    set_mappings_to_save([...mappings_to_save, new_mapping]);

    // Clear fields
    set_ing_name('');
    set_ing_qty(0);
    set_selected_product(null);
    set_search_results([]);
  };

  const handle_add_ingredient = (): void => {
    if (!ing_name || ing_qty <= 0) {
      return;
    }
    const new_ing: Ingredient = {
      name: ing_name.trim(),
      quantity: ing_qty,
      unit: ing_unit
    };
    set_ingredients([...ingredients, new_ing]);
    set_ing_name('');
    set_ing_qty(0);
  };

  const handle_delete_ingredient = (idx: number): void => {
    const deleted_ing = ingredients[idx];
    set_ingredients(ingredients.filter((_, i) => i !== idx));
    set_mappings_to_save(mappings_to_save.filter(m => m.ingredient_name.toLowerCase() !== deleted_ing.name.toLowerCase()));
  };

  const handle_submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    if (ingredients.length === 0) {
      alert("Por favor añade al menos un ingrediente a la receta.");
      return;
    }

    const allergens = allergens_text
      .split(',')
      .map(a => a.trim().toLowerCase())
      .filter(a => a.length > 0);

    const instructions = instructions_text
      .split('\n')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    on_add({
      name: name.trim(),
      meal_type,
      price,
      difficulty,
      health,
      diet_type,
      allergens,
      ingredients,
      instructions
    });

    // Save mappings
    for (const mapping of mappings_to_save) {
      await handle_save_mapping(mapping).catch(console.error);
    }

    set_name('');
    set_meal_type('comida');
    set_price('economica');
    set_difficulty('facil');
    set_health('saludable');
    set_diet_type('omnivoro');
    set_allergens_text('');
    set_ingredients([]);
    set_instructions_text('');
    set_mappings_to_save([]);
  };

  return (
    <PageContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <TitleH2 style={{ margin: 0 }}>Nueva Receta</TitleH2>
          <TextMuted>Crea y guarda tus platos personalizados para añadirlos al menú mensual.</TextMuted>
        </div>
        <Boton
          texto={cargandoAI ? "Generando..." : "Generar con IA"}
          on_click={handle_generate_ai}
          icono={<Sparkles size={16} />}
          tipo="button"
          variante="outlined"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
          deshabilitado={cargandoAI}
        />
      </div>

      <Spacer height={10} />

      <CardContainer component="form" onSubmit={handle_submit}>
        <FormGroup>
          <FormLabel>Nombre de la Receta</FormLabel>
          <CampoTexto
            etiqueta=""
            valor={name}
            on_change={set_name}
            marcador_posicion="Ej. Lentejas de la abuela, Tortilla de patata..."
            requerido
          />
        </FormGroup>

        <PantryInputGrid>
          <FormGroup>
            <FormLabel>Momento del Día</FormLabel>
            <SelectControl
              value={meal_type}
              onChange={e => set_meal_type(e.target.value as 'desayuno' | 'comida' | 'cena')}
            >
              <option value="desayuno">Desayuno</option>
              <option value="comida">Comida</option>
              <option value="cena">Cena</option>
            </SelectControl>
          </FormGroup>

          <FormGroup>
            <FormLabel>Precio aproximado</FormLabel>
            <SelectControl
              value={price}
              onChange={e => set_price(e.target.value as 'economica' | 'cara')}
            >
              <option value="economica">Económica</option>
              <option value="cara">Cara</option>
            </SelectControl>
          </FormGroup>
        </PantryInputGrid>

        <PantryInputGrid>
          <FormGroup>
            <FormLabel>Dificultad</FormLabel>
            <SelectControl
              value={difficulty}
              onChange={e => set_difficulty(e.target.value as 'facil' | 'intermedia' | 'dificil')}
            >
              <option value="facil">Fácil</option>
              <option value="intermedia">Intermedia</option>
              <option value="dificil">Difícil</option>
            </SelectControl>
          </FormGroup>

          <FormGroup>
            <FormLabel>Categoría de Salud</FormLabel>
            <SelectControl
              value={health}
              onChange={e => set_health(e.target.value as 'saludable' | 'no saludable')}
            >
              <option value="saludable">Saludable</option>
              <option value="no saludable">No saludable</option>
            </SelectControl>
          </FormGroup>
        </PantryInputGrid>

        <PantryInputGrid>
          <FormGroup>
            <FormLabel>Tipo de Alimentación</FormLabel>
            <SelectControl
              value={diet_type}
              onChange={e => set_diet_type(e.target.value as 'omnivoro' | 'vegetariano' | 'vegano' | 'pescetariano' | 'keto' | 'paleo' | 'sin_gluten' | 'sin_lactosa' | 'mediterranea')}
            >
              <option value="omnivoro">Omnívoro</option>
              <option value="vegetariano">Vegetariano</option>
              <option value="vegano">Vegano</option>
              <option value="pescetariano">Pescetariano</option>
              <option value="keto">Keto / Cetogénico</option>
              <option value="paleo">Paleo</option>
              <option value="sin_gluten">Sin Gluten</option>
              <option value="sin_lactosa">Sin Lactosa</option>
              <option value="mediterranea">Mediterranea</option>
            </SelectControl>
          </FormGroup>

          <FormGroup>
            <FormLabel>Alérgenos (separados por comas)</FormLabel>
            <CampoTexto
              etiqueta=""
              valor={allergens_text}
              on_change={set_allergens_text}
              marcador_posicion="Ej. gluten, lactosa, frutos secos"
            />
          </FormGroup>
        </PantryInputGrid>

        <Spacer height={10} />
        <FormLabel style={{ marginBottom: 8 }}>Ingredientes de la Receta</FormLabel>

        <Box className="ingredients-form-row">
          <Box style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Box style={{ flex: 1 }}>
              <CampoTexto
                etiqueta=""
                valor={ing_name}
                on_change={set_ing_name}
                marcador_posicion="Ingrediente (ej. Lentejas)"
                inputProps={{ list: 'db-ingredients-list' }}
              />
              <datalist id="db-ingredients-list">
                {db_ingredients.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </Box>
            <Box style={{ width: '48px', height: '48px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: '48px' }}>
              <Boton
                texto=""
                variante="outlined"
                on_click={handle_api_search}
                icono={is_searching ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={18} /> : <Search size={18} />}
                tipo="button"
                deshabilitado={!ing_name.trim() || is_searching}
              />
            </Box>
          </Box>

          {search_results.length > 0 && !selected_product && (
            <Box style={{
              backgroundColor: '#171725',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              marginTop: '8px',
              padding: '6px',
              maxHeight: '220px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', padding: '4px 8px', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '4px' }}>
                Precios de Supermercados (Selecciona para mapear):
              </div>
              {search_results.map(prod => (
                <Box
                  key={prod.referencia_id + prod.supermercado}
                  onClick={() => handle_select_product(prod)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
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
                      padding: '2px 6px',
                      borderRadius: '4px',
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
                  <span style={{ fontWeight: 'bold', color: '#81c784', marginLeft: '12px' }}>{prod.precio.toFixed(2)} €</span>
                </Box>
              ))}
            </Box>
          )}

          {selected_product && (
            <Box style={{
              backgroundColor: 'rgba(129, 199, 132, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(129, 199, 132, 0.3)',
              marginTop: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#81c784', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} /> Producto Vinculado
                </span>
                <span style={{
                  fontSize: '9px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: selected_product.supermercado === 'mercadona' ? '#00A859' :
                                   selected_product.supermercado === 'carrefour' ? '#003893' :
                                   selected_product.supermercado === 'dia' ? '#E2001A' :
                                   selected_product.supermercado === 'aldi' ? '#002C5B' : '#005CA9',
                  color: '#fff',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {selected_product.supermercado}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: '500' }}>
                {selected_product.nombre}
              </div>

              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />

              <PantryInputGrid style={{ gap: '12px' }}>
                <FormGroup>
                  <FormLabel>Cant. Receta</FormLabel>
                  <CampoTexto
                    etiqueta=""
                    valor={ing_qty || ''}
                    on_change={val => set_ing_qty(Number(val))}
                    tipo="number"
                    marcador_posicion="Ej. 150"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Unidad Receta</FormLabel>
                  <SelectControl
                    value={ing_unit}
                    onChange={e => set_ing_unit(e.target.value)}
                  >
                    <option value="g">gramos (g)</option>
                    <option value="ml">ml</option>
                    <option value="unidades">uds</option>
                    <option value="rebanadas">rebanadas</option>
                    <option value="lonchas">lonchas</option>
                  </SelectControl>
                </FormGroup>
              </PantryInputGrid>

              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', marginTop: '4px' }}>
                Confirmar Formato de Venta del Paquete:
              </div>
              <PantryInputGrid style={{ gap: '8px' }}>
                <FormGroup>
                  <FormLabel>Cant. Paquete</FormLabel>
                  <CampoTexto
                    etiqueta=""
                    valor={confirm_qty || ''}
                    on_change={val => set_confirm_qty(Number(val))}
                    tipo="number"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Unidad Paquete</FormLabel>
                  <SelectControl
                    value={confirm_unit}
                    onChange={e => set_confirm_unit(e.target.value)}
                  >
                    <option value="g">gramos (g)</option>
                    <option value="ml">ml</option>
                    <option value="unidades">uds</option>
                    <option value="rebanadas">rebanadas</option>
                    <option value="lonchas">lonchas</option>
                  </SelectControl>
                </FormGroup>
                <FormGroup>
                  <FormLabel>Precio Paquete (€)</FormLabel>
                  <CampoTexto
                    etiqueta=""
                    valor={confirm_price || ''}
                    on_change={val => set_confirm_price(Number(val))}
                    tipo="number"
                  />
                </FormGroup>
              </PantryInputGrid>

              <Box style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <Box style={{ flex: 1 }}>
                  <Boton
                    texto="Confirmar y Añadir"
                    on_click={handle_confirm_mapping}
                    icono={<Plus size={16} />}
                    tipo="button"
                  />
                </Box>
                <Box style={{ flex: 1 }}>
                  <Boton
                    texto="Cancelar"
                    variante="outlined"
                    on_click={() => set_selected_product(null)}
                    tipo="button"
                  />
                </Box>
              </Box>
            </Box>
          )}

          {!selected_product && (
            <>
              <PantryInputGrid style={{ marginTop: 8 }}>
                <CampoTexto
                  etiqueta=""
                  valor={ing_qty || ''}
                  on_change={val => set_ing_qty(Number(val))}
                  tipo="number"
                  marcador_posicion="Cantidad"
                />
                <SelectControl
                  value={ing_unit}
                  onChange={e => set_ing_unit(e.target.value)}
                >
                  <option value="g">gramos (g)</option>
                  <option value="ml">ml</option>
                  <option value="unidades">uds</option>
                  <option value="rebanadas">rebanadas</option>
                  <option value="tiras">tiras</option>
                  <option value="lonchas">lonchas</option>
                </SelectControl>
              </PantryInputGrid>
              <Spacer height={12} />
              <Boton
                texto="Añadir Ingrediente"
                variante="outlined"
                on_click={handle_add_ingredient}
                icono={<Plus size={18} />}
                clase_css="full-width"
                tipo="button"
              />
            </>
          )}
        </Box>

        {ingredients.length > 0 && (
          <Box className="pantry-grid" style={{ marginTop: 12 }}>
            {ingredients.map((ing, idx) => (
              <PantryItemContainer key={idx}>
                <FlexRow>
                  <PantryItemName>{ing.name}</PantryItemName>
                  <PantryItemQty>{ing.quantity} {ing.unit}</PantryItemQty>
                </FlexRow>
                <IconoBoton
                  on_click={() => handle_delete_ingredient(idx)}
                  color="error"
                >
                  <Trash2 size={18} />
                </IconoBoton>
              </PantryItemContainer>
            ))}
          </Box>
        )}

        <Spacer height={16} />

        <FormGroup>
          <FormLabel>Instrucciones de Cocinado (un paso por línea)</FormLabel>
          <textarea
            className="form-control text-area-custom"
            rows={4}
            value={instructions_text}
            onChange={e => set_instructions_text(e.target.value)}
            placeholder="Paso 1: Cocer las lentejas&#10;Paso 2: Añadir el sofrito..."
            style={{
              width: '100%',
              backgroundColor: '#2a2a32',
              border: '1px solid #32323e',
              borderRadius: 12,
              color: '#f5f5f7',
              fontSize: 14,
              padding: '12px 14px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </FormGroup>

        <Spacer height={10} />

        <Boton
          texto="Guardar Receta"
          tipo="submit"
          icono={<BookOpen size={18} />}
          clase_css="full-width"
        />
      </CardContainer>
    </PageContainer>
  );
};
