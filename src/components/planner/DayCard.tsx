import { MealSlot } from './MealSlot';
import { Boton } from '../common/Boton';
import { DayCardContainer, DayCardHeader, DayTitle, DayDate, DayMeals } from '../common';
import type { MealPlanDay, Recipe } from '../../types';

interface DayCardProps {
  plan_dia: MealPlanDay;
  recipes: Recipe[];
  on_slot_click: (type: 'desayuno' | 'comida' | 'cena', slot_index: number) => void;
  on_slot_clear: (type: 'desayuno' | 'comida' | 'cena', slot_index: number, e: React.MouseEvent) => void;
  on_add_slot: (type: 'desayuno' | 'comida' | 'cena') => void;
  on_remove_slot: (type: 'desayuno' | 'comida' | 'cena', slot_index: number) => void;
  on_move_slot: (type: 'desayuno' | 'comida' | 'cena', slot_index: number, direction: 'up' | 'down') => void;
  on_view_recipe?: (recipe_id: number) => void;
  can_add_slots: boolean;
  can_clear_slots?: boolean;
  destacado?: boolean;
  on_cook?: () => void;
  can_cook?: boolean;
  hide_breakfasts?: boolean;
  cooked_days?: number[];
}

export const DayCard = ({
  plan_dia,
  recipes,
  on_slot_click,
  on_slot_clear,
  on_add_slot,
  on_remove_slot,
  on_move_slot,
  on_view_recipe,
  can_add_slots,
  can_clear_slots = true,
  destacado,
  on_cook,
  can_cook,
  hide_breakfasts = false,
  cooked_days = []
}: DayCardProps) => {
  const get_recipe = (id: number | null): Recipe | null => {
    if (id === null) return null;
    return recipes.find(item => item.id === id) ?? null;
  };

  const is_cooked = cooked_days.includes(plan_dia.day);

  return (
    <DayCardContainer destacado={destacado}>
      <DayCardHeader>
        <DayTitle>Día {plan_dia.day}</DayTitle>
        <DayDate style={{ color: destacado ? '#4caf50' : undefined, fontWeight: destacado ? 'bold' : undefined }}>
          {destacado ? '⭐ MENÚ DE HOY' : 'Menú del día'}
        </DayDate>
      </DayCardHeader>

      {destacado && can_cook && on_cook && (
        <div style={{ padding: '0 16px 12px 16px' }}>
          <Boton
            texto={is_cooked ? "Cocinado/Comido ✓" : "Marcar como Cocinado/Comido 🍽️"}
            color="success"
            variante={is_cooked ? "outlined" : "contained"}
            clase_css="full-width btn-sm"
            on_click={on_cook}
            deshabilitado={is_cooked}
          />
        </div>
      )}

      <DayMeals>
        {((hide_breakfasts ? ['comida', 'cena'] : ['desayuno', 'comida', 'cena']) as ('desayuno' | 'comida' | 'cena')[]).map(type => (
          <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plan_dia[type].map((slot_recipe_id, slot_index) => {
              const recipe = get_recipe(slot_recipe_id);
              return (
                <div key={`${type}-${slot_index}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <MealSlot
                    etiqueta={`${type.charAt(0).toUpperCase() + type.slice(1)} · Opción ${slot_index + 1}`}
                    receta_nombre={recipe ? recipe.name : null}
                    on_click={() => on_slot_click(type, slot_index)}
                    on_clear={(e) => on_slot_clear(type, slot_index, e)}
                    on_view_recipe={recipe && on_view_recipe ? () => on_view_recipe(recipe.id) : undefined}
                    can_clear={can_clear_slots}
                  />
                  {can_add_slots && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {slot_index > 0 && (
                        <Boton
                          texto="Subir"
                          variante="outlined"
                          color="inherit"
                          clase_css="btn-sm"
                          on_click={() => on_move_slot(type, slot_index, 'up')}
                        />
                      )}
                      {slot_index < plan_dia[type].length - 1 && (
                        <Boton
                          texto="Bajar"
                          variante="outlined"
                          color="inherit"
                          clase_css="btn-sm"
                          on_click={() => on_move_slot(type, slot_index, 'down')}
                        />
                      )}
                      {slot_index > 0 && (
                        <Boton
                          texto={`Eliminar opción ${slot_index + 1}`}
                          variante="outlined"
                          color="inherit"
                          clase_css="btn-sm"
                          on_click={() => on_remove_slot(type, slot_index)}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {can_add_slots && (
              <Boton
                texto={`+ Añadir opción de ${type}`}
                variante="outlined"
                color="inherit"
                clase_css="btn-sm"
                on_click={() => on_add_slot(type)}
              />
            )}
          </div>
        ))}
      </DayMeals>
    </DayCardContainer>
  );
};
