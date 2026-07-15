import { Boton } from "../common/Boton";
import { DayCard } from "./DayCard";
import {
  PageContainer,
  GridTwo,
  Spacer,
  PlannerHeader,
  DaysList,
  PlannerTitle,
  TextMuted,
  FlexRow,
} from "../common";
import type { MealPlanDay, Recipe } from "../../types";
import { useState } from "react";
import { SuggestionsDialog } from "./SuggestionsDialog";
import { use_app_state } from "../../hooks/use_app_state";

interface PlannerProps {
  meal_plan: MealPlanDay[];
  recipes: Recipe[];
  on_auto_generate: () => void;
  on_clear: () => void;
  on_open_filters: () => void;
  on_slot_click: (
    day: number,
    type: "desayuno" | "comida" | "cena",
    slot_index: number,
  ) => void;
  on_slot_clear: (
    day: number,
    type: "desayuno" | "comida" | "cena",
    slot_index: number,
    e: React.MouseEvent,
  ) => void;
  on_add_slot: (day: number, type: "desayuno" | "comida" | "cena") => void;
  on_remove_slot: (
    day: number,
    type: "desayuno" | "comida" | "cena",
    slot_index: number,
  ) => void;
  on_move_slot: (
    day: number,
    type: "desayuno" | "comida" | "cena",
    slot_index: number,
    direction: "up" | "down",
  ) => void;
  current_role?: "cocinitas" | "miembro" | null;
  pending_suggestions?: number;
}

export const Planner = ({
  meal_plan,
  recipes,
  on_auto_generate,
  on_clear,
  on_open_filters,
  on_slot_click,
  on_slot_clear,
  on_add_slot,
  on_remove_slot,
  on_move_slot,
  current_role,
  pending_suggestions = 0,
}: PlannerProps) => {
  const is_member = current_role === "miembro";
  const [mostrar_sugerencias, set_mostrar_sugerencias] = useState(false);
  const {
    suggestions,
    handle_approve_suggestion,
    handle_reject_suggestion,
    handle_vote_suggestion,
  } = use_app_state();

  return (
    <PageContainer>
      <PlannerHeader>
        <PlannerTitle>Planificación 30 Días</PlannerTitle>
        <FlexRow style={{ gap: 8 }}>
          {pending_suggestions > 0 && (
            <Boton
              texto={`${pending_suggestions} sugerencia${pending_suggestions > 1 ? "s" : ""}`}
              on_click={() => set_mostrar_sugerencias(true)}
              variante="outlined"
              color="warning"
              clase_css="btn-sm"
            />
          )}
          <Boton
            texto="Filtros"
            on_click={on_open_filters}
            variante="outlined"
            color="primary"
            clase_css="btn-sm"
          />
        </FlexRow>
      </PlannerHeader>

      {is_member ? (
        <>
          <Spacer height={10} />
          <TextMuted style={{ textAlign: "center", padding: "8px 0" }}>
            Eres <strong>Miembro</strong>. Pulsa en un slot para sugerir una
            alternativa a "El Cocinitas".
          </TextMuted>
        </>
      ) : (
        <>
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
        </>
      )}

      <Spacer />

      <DaysList>
        {(meal_plan.length > 0
          ? meal_plan
          : Array.from({ length: 30 }, (_, i) => ({
              day: i + 1,
              desayuno: [null],
              comida: [null],
              cena: [null],
            }))
        ).map((day_plan) => (
          <DayCard
            key={day_plan.day}
            plan_dia={day_plan}
            recipes={recipes}
            on_slot_click={(type, slot_index) =>
              on_slot_click(day_plan.day, type, slot_index)
            }
            on_slot_clear={(type, slot_index, e) =>
              on_slot_clear(day_plan.day, type, slot_index, e)
            }
            on_add_slot={(type) => on_add_slot(day_plan.day, type)}
            on_remove_slot={(type, slot_index) =>
              on_remove_slot(day_plan.day, type, slot_index)
            }
            on_move_slot={(type, slot_index, direction) =>
              on_move_slot(day_plan.day, type, slot_index, direction)
            }
            can_add_slots={!is_member}
          />
        ))}
      </DaysList>
      <SuggestionsDialog
        abierto={mostrar_sugerencias}
        al_cerrar={() => set_mostrar_sugerencias(false)}
        suggestions={suggestions}
        current_role={current_role}
        on_vote={handle_vote_suggestion}
        on_approve={(id) => {
          handle_approve_suggestion(id);
          if (suggestions.length === 1) set_mostrar_sugerencias(false);
        }}
        on_reject={(id) => {
          handle_reject_suggestion(id);
          if (suggestions.length === 1) set_mostrar_sugerencias(false);
        }}
      />
    </PageContainer>
  );
};
