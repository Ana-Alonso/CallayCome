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
  CardContainer,
  TitleH2,
} from "../common";
import type { MealPlanDay, Recipe, CookRecipeConfig, RecipeSuggestion, PantryItem, Profile } from "../../types";
import { useState, useEffect } from "react";
import { SuggestionsDialog } from "./SuggestionsDialog";
import { RecipeDetailDialog } from "./RecipeDetailDialog";
import { format_date_display } from "../../utils/planner_helpers";
import { Dialogo } from "../common/Dialogo";
import { Box } from "../common/Box";

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
  start_date: string | null;
  on_change_start_date: (date: string | null) => void;
  on_cook: (day: number, configs: CookRecipeConfig[]) => void;
  get_family_members: (family_id: string) => Promise<any[]>;
  get_family_complaints: (family_id: string) => Promise<Record<string, number>>;
  on_open_nevera: () => void;
  hide_breakfasts: boolean;
  set_hide_breakfasts: (val: boolean) => void;
  show_quejometro: boolean;
  set_show_quejometro: (val: boolean) => void;
  cooked_days: number[];
  suggestions?: RecipeSuggestion[];
  handle_approve_suggestion?: (id: number) => Promise<void>;
  handle_reject_suggestion?: (id: number) => Promise<void>;
  handle_vote_suggestion?: (id: number, vote: "like" | "dislike") => Promise<void>;
  get_panic_recipe?: () => { recipe: Recipe; missing_count: number; pct: number } | null;
  pantry_items?: PantryItem[];
  profile?: Profile | null;
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
  start_date,
  on_change_start_date,
  on_cook,
  get_family_members,
  get_family_complaints,
  on_open_nevera,
  hide_breakfasts,
  set_hide_breakfasts,
  show_quejometro,
  set_show_quejometro,
  cooked_days,
  suggestions = [],
  handle_approve_suggestion = async () => {},
  handle_reject_suggestion = async () => {},
  handle_vote_suggestion = async () => {},
  get_panic_recipe = () => null,
  pantry_items = [],
  profile = null,
}: PlannerProps) => {
  const is_member = current_role === "miembro";
  const [mostrar_sugerencias, set_mostrar_sugerencias] = useState(false);
  const [mostrar_panico, set_mostrar_panico] = useState(false);
  const [panic_result, set_panic_result] = useState<{ recipe: Recipe; missing_count: number; pct: number } | null>(null);
  const [confirmar_cocinado_dia, set_confirmar_cocinado_dia] = useState<number | null>(null);
  const [viewing_recipe, set_viewing_recipe] = useState<Recipe | null>(null);

  const handle_view_recipe = (recipe_id: number): void => {
    const recipe = recipes.find(r => r.id === recipe_id) ?? null;
    set_viewing_recipe(recipe);
  };
  const [recipes_config, set_recipes_config] = useState<CookRecipeConfig[]>([]);

  useEffect(() => {
    if (confirmar_cocinado_dia !== null) {
      const day_plan = meal_plan.find(d => d.day === confirmar_cocinado_dia);
      if (day_plan) {
        const recipe_ids = [
          ...day_plan.desayuno,
          ...day_plan.comida,
          ...day_plan.cena
        ].filter((id): id is number => id !== null);
        
        const initial_configs = recipe_ids.map(id => ({
          recipe_id: id,
          portions: 1,
          leftovers: 0
        }));
        set_recipes_config(initial_configs);
      }
    } else {
      set_recipes_config([]);
    }
  }, [confirmar_cocinado_dia, meal_plan]);
  const [lavaplatos, set_lavaplatos] = useState<string | null>(null);
  const [max_complaints, set_max_complaints] = useState<number>(0);

  useEffect(() => {
    if (profile?.active_family_id) {
      Promise.all([
        get_family_members(profile.active_family_id),
        get_family_complaints(profile.active_family_id)
      ]).then(([members, complaints]) => {
        if (members && members.length > 0) {
          let max_count = -1;
          let whiner: any = null;
          members.forEach(m => {
            const count = complaints[m.user_id] || 0;
            if (count > max_count) {
              max_count = count;
              whiner = m;
            }
          });
          if (whiner && max_count > 0) {
            set_lavaplatos(whiner.display_name);
            set_max_complaints(max_count);
          } else {
            set_lavaplatos(null);
            set_max_complaints(0);
          }
        }
      }).catch(console.error);
    } else {
      set_lavaplatos(null);
      set_max_complaints(0);
    }
  }, [profile?.active_family_id, suggestions]);

  const handle_panic_click = () => {
    const res = get_panic_recipe();
    if (res) {
      set_panic_result(res);
      set_mostrar_panico(true);
    }
  };

  useEffect(() => {
    const handlePanicHotkey = () => {
      handle_panic_click();
    };
    window.addEventListener('hotkey-panic', handlePanicHotkey);
    return () => window.removeEventListener('hotkey-panic', handlePanicHotkey);
  }, [recipes, pantry_items]);

  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const get_current_planner_day = (): number | null => {
    if (!start_date) return null;
    try {
      const start = parseLocalDate(start_date);
      start.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const currentDay = diffDays + 1;

      if (currentDay >= 1 && currentDay <= 30) {
        return currentDay;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const current_day = get_current_planner_day();

  const is_android = typeof window !== 'undefined' && (window as any).Capacitor?.getPlatform() === 'android';

  return (
    <PageContainer>
      <PlannerHeader style={is_android ? { flexDirection: 'column', alignItems: 'flex-start', gap: 12, marginBottom: 16 } : undefined}>
        <PlannerTitle>Planificación 30 Días</PlannerTitle>
        <FlexRow style={is_android ? { gap: 8, width: '100%', flexWrap: 'wrap' } : { gap: 8 }}>
          <Boton
            texto="¡Pánico! 🚨"
            on_click={handle_panic_click}
            variante="contained"
            color="error"
            clase_css="btn-sm"
          />
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
            texto="Modo Nevera 📲"
            on_click={on_open_nevera}
            variante="outlined"
            color="primary"
            clase_css="btn-sm"
          />
          <Boton
            texto="Filtros"
            on_click={on_open_filters}
            variante="outlined"
            color="primary"
            clase_css="btn-sm"
          />
        </FlexRow>
      </PlannerHeader>

      <Spacer height={10} />

      <CardContainer style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FlexRow style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <FlexRow style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>📅 Inicio del plan:</span>
            <label
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#1c1c24',
                border: '1px solid #32323e',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 14,
                color: start_date ? '#ffffff' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                minWidth: 120,
              }}
            >
              <span style={{ pointerEvents: 'none' }}>
                {start_date ? format_date_display(start_date) : 'dd/mm/aaaa'}
              </span>
              <span style={{ fontSize: 12, pointerEvents: 'none', color: 'rgba(255,255,255,0.4)' }}>✏️</span>
              <input
                type="date"
                value={start_date || ''}
                onChange={(e) => on_change_start_date(e.target.value || null)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                }}
              />
            </label>
          </FlexRow>
          <FlexRow style={{ gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              <input
                type="checkbox"
                checked={hide_breakfasts}
                onChange={(e) => set_hide_breakfasts(e.target.checked)}
                style={{ accentColor: '#2196f3', cursor: 'pointer' }}
              />
              <span>Ocultar desayunos</span>
            </label>
            {profile?.active_family_id && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                <input
                  type="checkbox"
                  checked={show_quejometro}
                  onChange={(e) => set_show_quejometro(e.target.checked)}
                  style={{ accentColor: '#2196f3', cursor: 'pointer' }}
                />
                <span>Mostrar quejímetro</span>
              </label>
            )}
          </FlexRow>
          {current_day && (
            <span style={{ fontSize: 14, color: '#4caf50', fontWeight: 'bold' }}>
              🟢 Hoy es el día {current_day} del plan
            </span>
          )}
        </FlexRow>
        
        {/* Dishwasher & NFC Info */}
        {show_quejometro && profile?.active_family_id && (lavaplatos || current_day) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #32323e',
            paddingTop: 10,
            marginTop: 4,
            flexWrap: 'wrap',
            gap: 12
          }}>
            {lavaplatos ? (
              <span style={{ fontSize: 13, color: '#ef5350', fontWeight: 600 }}>
                🧼 Lavaplatos oficial hoy: <span style={{ textDecoration: 'underline' }}>{lavaplatos}</span> (¡por tener {max_complaints} quejas!)
              </span>
            ) : (
              <span style={{ fontSize: 13, color: '#81c784', fontWeight: 500 }}>
                🧼 ¡Nadie se ha quejado! Todos a salvo de fregar hoy.
              </span>
            )}
          </div>
        )}
      </CardContainer>

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
            on_view_recipe={handle_view_recipe}
            can_add_slots={!is_member}
            can_clear_slots={!is_member}
            destacado={day_plan.day === current_day}
            on_cook={() => set_confirmar_cocinado_dia(day_plan.day)}
            can_cook={!is_member}
            hide_breakfasts={hide_breakfasts}
            cooked_days={cooked_days}
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

      <RecipeDetailDialog
        recipe={viewing_recipe}
        abierto={viewing_recipe !== null}
        al_cerrar={() => set_viewing_recipe(null)}
      />

      <Dialogo
        abierto={mostrar_panico}
        on_close={() => set_mostrar_panico(false)}
        titulo="🚨 ¡MENÚ DE EMERGENCIA!"
      >
        {panic_result ? (
          <Box style={{ minWidth: "320px", maxWidth: "500px", padding: '8px' }}>
            <TextMuted style={{ fontSize: 13, marginBottom: "16px" }}>
              Analizando tu despensa... Te sugerimos preparar esta receta porque es la que requiere menos ingredientes adicionales:
            </TextMuted>

            <TitleH2 style={{ fontSize: 20, color: '#f26841', marginBottom: 4 }}>
              {panic_result.recipe.name}
            </TitleH2>
            <TextMuted style={{ fontSize: 13, textTransform: 'capitalize', marginBottom: 12 }}>
              Dificultad: <strong>{panic_result.recipe.difficulty}</strong> · Tipo: <strong>{panic_result.recipe.meal_type}</strong>
            </TextMuted>

            <div style={{
              backgroundColor: 'rgba(242,104,65,0.08)',
              border: '1px solid rgba(242,104,65,0.2)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16
            }}>
              <span style={{ fontSize: 14, fontWeight: 'bold', display: 'block', marginBottom: 6 }}>
                Ingredientes requeridos:
              </span>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                {panic_result.recipe.ingredients.map((ing, idx) => {
                  const has_it = pantry_items.some(
                    p => p.ingredient_name.toLowerCase() === ing.name.toLowerCase() && p.quantity >= ing.quantity
                  );
                  return (
                    <li key={idx} style={{ color: has_it ? '#81c784' : '#ef5350', marginBottom: 4, fontWeight: 500 }}>
                      {has_it ? '✔️' : '❌'} {ing.quantity} {ing.unit} de {ing.name} {has_it ? '(En despensa)' : '(Te falta)'}
                    </li>
                  );
                })}
              </ul>
              {panic_result.missing_count > 0 && (
                <span style={{ fontSize: 12, color: '#ef5350', fontWeight: 'bold', display: 'block', marginTop: 10 }}>
                  ⚠️ Te falta{panic_result.missing_count > 1 ? 'n' : ''} {panic_result.missing_count} ingrediente{panic_result.missing_count > 1 ? 's' : ''} para completar la receta.
                </span>
              )}
            </div>

            <span style={{ fontSize: 14, fontWeight: 'bold', display: 'block', marginBottom: 6 }}>
              🍳 Instrucciones rápidas:
            </span>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
              {panic_result.recipe.instructions.map((inst, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>{inst}</li>
              ))}
            </ol>

            <Spacer height={20} />

            <Boton
              texto="¡Entendido, a cocinar! 👨‍🍳"
              clase_css="full-width"
              color="error"
              on_click={() => set_mostrar_panico(false)}
            />
          </Box>
        ) : (
          <Box style={{ padding: 20, textAlign: 'center' }}>
            <TextMuted>No se encontraron recetas en el catálogo.</TextMuted>
          </Box>
        )}
      </Dialogo>

      <Dialogo
        abierto={confirmar_cocinado_dia !== null}
        on_close={() => {
          set_confirmar_cocinado_dia(null);
        }}
        titulo="🍽️ Marcar día como Cocinado"
      >
        {confirmar_cocinado_dia !== null && (
          <Box style={{ minWidth: "320px", maxWidth: "450px", padding: '8px', textAlign: 'center' }}>
            <TextMuted style={{ fontSize: 13, marginBottom: "16px", display: 'block' }}>
              Ajusta para cuántas raciones has cocinado cada plato hoy y si vas a guardar sobras en la despensa.
            </TextMuted>

            <div style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: 20 }}>
              {recipes_config.map((conf, index) => {
                const r = recipes.find(rec => rec.id === conf.recipe_id);
                if (!r) return null;
                
                const day_plan = meal_plan.find(d => d.day === confirmar_cocinado_dia);
                let meal_type_label = "";
                if (day_plan) {
                  if (day_plan.desayuno.includes(r.id)) meal_type_label = "Desayuno 🍳";
                  else if (day_plan.comida.includes(r.id)) meal_type_label = "Comida 🍲";
                  else if (day_plan.cena.includes(r.id)) meal_type_label = "Cena 🍽️";
                }

                const updatePortions = (val: number) => {
                  set_recipes_config(prev => prev.map((c, i) => i === index ? { ...c, portions: Math.max(1, c.portions + val) } : c));
                };

                const updateLeftovers = (val: number) => {
                  set_recipes_config(prev => prev.map((c, i) => i === index ? { ...c, leftovers: Math.max(0, c.leftovers + val) } : c));
                };

                return (
                  <CardContainer key={conf.recipe_id} style={{ padding: '12px 14px', marginBottom: 12, backgroundColor: '#13131f', border: '1px solid #1f1f2e', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>{r.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 'bold', color: '#ffb74d', textTransform: 'uppercase', backgroundColor: 'rgba(255,183,77,0.1)', padding: '2px 6px', borderRadius: 6 }}>
                        {meal_type_label}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Portions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>👥 Cocinado para:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => updatePortions(-1)}
                            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #32323e', backgroundColor: '#1c1c24', color: '#ffffff', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 'bold', color: '#ffffff', minWidth: 20, textAlign: 'center' }}>
                            {conf.portions}
                          </span>
                          <button
                            type="button"
                            onClick={() => updatePortions(1)}
                            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #32323e', backgroundColor: '#1c1c24', color: '#ffffff', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            +
                          </button>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 50, marginLeft: 4 }}>
                            {conf.portions === 1 ? 'ración' : 'raciones'}
                          </span>
                        </div>
                      </div>

                      {/* Leftovers */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>🍲 Sobras a guardar:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => updateLeftovers(-1)}
                            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #32323e', backgroundColor: '#1c1c24', color: '#ffffff', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 'bold', color: conf.leftovers > 0 ? '#4caf50' : '#ffffff', minWidth: 20, textAlign: 'center' }}>
                            {conf.leftovers}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateLeftovers(1)}
                            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #32323e', backgroundColor: '#1c1c24', color: '#ffffff', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            +
                          </button>
                          <span style={{ fontSize: 11, color: conf.leftovers > 0 ? '#4caf50' : 'rgba(255,255,255,0.5)', width: 50, marginLeft: 4, fontWeight: conf.leftovers > 0 ? 'bold' : 'normal' }}>
                            {conf.leftovers === 1 ? 'ración' : 'raciones'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContainer>
                );
              })}
            </div>

            <Boton
              texto="Confirmar y Cocinar 🍽️"
              clase_css="full-width"
              color="success"
              on_click={() => {
                on_cook(confirmar_cocinado_dia, recipes_config);
                set_confirmar_cocinado_dia(null);
              }}
            />

            <Spacer height={10} />

            <Boton
              texto="Cancelar"
              clase_css="full-width"
              variante="text"
              on_click={() => {
                set_confirmar_cocinado_dia(null);
              }}
            />
          </Box>
        )}
      </Dialogo>
    </PageContainer>
  );
};
