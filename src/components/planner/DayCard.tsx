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
  can_add_slots: boolean;
}

export const DayCard = ({
  plan_dia,
  recipes,
  on_slot_click,
  on_slot_clear,
  on_add_slot,
  on_remove_slot,
  on_move_slot,
  can_add_slots
}: DayCardProps) => {
  const get_recipe_name = (id: number | null): string | null => {
    if (id === null) {
      return null;
    }
    const r = recipes.find(item => item.id === id);
    return r ? r.name : null;
  };

  return (
    <DayCardContainer>
      <DayCardHeader>
        <DayTitle>Día {plan_dia.day}</DayTitle>
        <DayDate>Menú del día</DayDate>
      </DayCardHeader>

      <DayMeals>
        {(['desayuno', 'comida', 'cena'] as const).map(type => (
          <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {plan_dia[type].map((slot_recipe_id, slot_index) => (
              <div key={`${type}-${slot_index}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <MealSlot
                  etiqueta={`${type.charAt(0).toUpperCase() + type.slice(1)} · Opción ${slot_index + 1}`}
                  receta_nombre={get_recipe_name(slot_recipe_id)}
                  on_click={() => on_slot_click(type, slot_index)}
                  on_clear={(e) => on_slot_clear(type, slot_index, e)}
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
            ))}
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
