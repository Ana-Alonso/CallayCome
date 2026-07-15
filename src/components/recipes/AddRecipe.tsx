import { useState } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';
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

interface AddRecipeProps {
  on_add: (recipe: Omit<Recipe, 'id'>) => void;
}

export const AddRecipe = ({ on_add }: AddRecipeProps) => {
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

  const [instructions_text, set_instructions_text] = useState<string>('');

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
    set_ingredients(ingredients.filter((_, i) => i !== idx));
  };

  const handle_submit = (e: React.FormEvent): void => {
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

    set_name('');
    set_meal_type('comida');
    set_price('economica');
    set_difficulty('facil');
    set_health('saludable');
    set_diet_type('omnivoro');
    set_allergens_text('');
    set_ingredients([]);
    set_instructions_text('');
  };

  return (
    <PageContainer>
      <TitleH2>Nueva Receta</TitleH2>
      <TextMuted>Crea y guarda tus platos personalizados para añadirlos al menú mensual.</TextMuted>

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
          <CampoTexto
            etiqueta=""
            valor={ing_name}
            on_change={set_ing_name}
            marcador_posicion="Ingrediente (ej. Lentejas)"
          />
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
