import { Boton } from '../common/Boton';
import { DayCard } from './DayCard';
import { PageContainer, GridTwo, Spacer, PlannerHeader, DaysList, PlannerTitle } from '../common';
import type { MealPlanDay, Recipe } from '../../types';

interface PlannerProps {
  meal_plan: MealPlanDay[];
  recipes: Recipe[];
  on_auto_generate: () => void;
  on_clear: () => void;
  on_open_filters: () => void;
  on_slot_click: (day: number, type: 'desayuno' | 'comida' | 'cena') => void;
  on_slot_clear: (day: number, type: 'desayuno' | 'comida' | 'cena', e: React.MouseEvent) => void;
}

export const Planner = ({
  meal_plan,
  recipes,
  on_auto_generate,
  on_clear,
  on_open_filters,
  on_slot_click,
  on_slot_clear
}: PlannerProps) => {
  return (
    <PageContainer>
      <PlannerHeader>
        <PlannerTitle>Planificación 30 Días</PlannerTitle>
        <Boton
          texto="Filtros"
          on_click={on_open_filters}
          variante="outlined"
          color="primary"
          clase_css="btn-sm"
        />
      </PlannerHeader>

      <Spacer height={10} />

      <GridTwo>
        <Boton
          texto="Auto-generar Menú"
          on_click={on_auto_generate}
          variante="contained"
          color="primary"
        />
        <Boton
          texto="Vaciar Plan"
          on_click={on_clear}
          variante="outlined"
          color="primary"
        />
      </GridTwo>

      <Spacer />

      <DaysList>
        {meal_plan.map(day_plan => (
          <DayCard
            key={day_plan.day}
            plan_dia={day_plan}
            recipes={recipes}
            on_slot_click={(type) => on_slot_click(day_plan.day, type)}
            on_slot_clear={(type, e) => on_slot_clear(day_plan.day, type, e)}
          />
        ))}
      </DaysList>
    </PageContainer>
  );
};
