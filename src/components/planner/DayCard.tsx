import { MealSlot } from './MealSlot';
import { DayCardContainer, DayCardHeader, DayTitle, DayDate, DayMeals } from '../common';
import type { MealPlanDay, Recipe } from '../../types';

interface DayCardProps {
  plan_dia: MealPlanDay;
  recipes: Recipe[];
  on_slot_click: (type: 'desayuno' | 'comida' | 'cena') => void;
  on_slot_clear: (type: 'desayuno' | 'comida' | 'cena', e: React.MouseEvent) => void;
}

export const DayCard = ({
  plan_dia,
  recipes,
  on_slot_click,
  on_slot_clear
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
        <MealSlot
          etiqueta="Desayuno"
          receta_nombre={get_recipe_name(plan_dia.desayuno)}
          on_click={() => on_slot_click('desayuno')}
          on_clear={(e) => on_slot_clear('desayuno', e)}
        />
        <MealSlot
          etiqueta="Comida"
          receta_nombre={get_recipe_name(plan_dia.comida)}
          on_click={() => on_slot_click('comida')}
          on_clear={(e) => on_slot_clear('comida', e)}
        />
        <MealSlot
          etiqueta="Cena"
          receta_nombre={get_recipe_name(plan_dia.cena)}
          on_click={() => on_slot_click('cena')}
          on_clear={(e) => on_slot_clear('cena', e)}
        />
      </DayMeals>
    </DayCardContainer>
  );
};
