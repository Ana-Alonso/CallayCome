import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, ChefHat, AlertTriangle } from 'lucide-react';
import { Boton } from '../common/Boton';
import { CardContainer } from '../common/CardContainer';
import { TitleH2 } from '../common/TitleH2';
import { TextMuted } from '../common/TextMuted';
import { Spacer } from '../common/Spacer';
import type { MealPlanDay, Recipe, ShoppingItem } from '../../types';

interface ModoNeveraProps {
  on_close: () => void;
  meal_plan: MealPlanDay[];
  recipes: Recipe[];
  shopping_items: ShoppingItem[];
  handle_toggle_purchase: (index: number) => Promise<void> | void;
  lavaplatos: string | null;
  max_complaints: number;
  start_date: string | null;
  hide_breakfasts?: boolean;
  show_quejometro?: boolean;
}

export const ModoNevera: React.FC<ModoNeveraProps> = ({
  on_close,
  meal_plan,
  recipes,
  shopping_items,
  handle_toggle_purchase,
  lavaplatos,
  max_complaints,
  start_date,
  hide_breakfasts = false,
  show_quejometro = true
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [selected_recipe, set_selected_recipe] = useState<Recipe | null>(null);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute current day of plan
  const get_current_day_number = (): number | null => {
    if (!start_date) return null;
    try {
      const [year, month, day] = start_date.split('-').map(Number);
      const start = new Date(year, month - 1, day);
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

  const current_day_num = get_current_day_number();
  const day_plan = current_day_num ? meal_plan.find(d => d.day === current_day_num) : null;

  const get_recipes_for_meal = (ids: (number | null)[]) => {
    return ids.filter((id): id is number => id !== null).map(id => recipes.find(r => r.id === id)).filter(Boolean) as Recipe[];
  };

  const des_recipes = day_plan ? get_recipes_for_meal(day_plan.desayuno) : [];
  const com_recipes = day_plan ? get_recipes_for_meal(day_plan.comida) : [];
  const cen_recipes = day_plan ? get_recipes_for_meal(day_plan.cena) : [];

  const urgent_shopping = shopping_items.slice(0, 5);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0c0c12',
      color: '#ffffff',
      zIndex: 9999,
      overflowY: 'auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header with Clock and Date */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #1f1f2e',
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f26841', fontWeight: 'bold' }}>
            ** MODO NEVERA INTELIGENTE
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, marginTop: 4, letterSpacing: '-0.5px' }}>
            {timeStr}
          </div>
          <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', marginTop: 2 }}>
            {dateStr}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {current_day_num && (
            <div style={{
              backgroundColor: 'rgba(76,175,80,0.12)',
              border: '1px solid rgba(76,175,80,0.3)',
              borderRadius: '12px',
              padding: '8px 16px',
              textAlign: 'right'
            }}>
              <span style={{ fontSize: '10px', color: '#81c784', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Menú Activo</span>
              <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#81c784' }}>Día {current_day_num} de 30</span>
            </div>
          )}
          <button
            onClick={on_close}
            style={{
              backgroundColor: '#1f1f2e',
              border: 'none',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#ffffff',
              transition: 'background-color 0.2s'
            }}
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '7fr 5fr',
        gap: '24px',
        flex: 1
      }}>
        {/* Left Side: Today's Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TitleH2 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChefHat size={20} color="#f26841" /> Menú de Hoy
          </TitleH2>

          {show_quejometro && lavaplatos && (
            <div style={{
              backgroundColor: 'rgba(239,83,80,0.08)',
              border: '1px solid rgba(239,83,80,0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 8
            }}>
              <AlertTriangle size={20} color="#ef5350" />
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
                🧼 Hoy le toca fregar platos a: <strong>{lavaplatos}</strong> (por tener {max_complaints} quejas en el quejómetro).
              </span>
            </div>
          )}

          {!day_plan ? (
            <CardContainer style={{ padding: 24, textAlign: 'center', backgroundColor: '#13131f' }}>
              <TextMuted>No hay menú planificado para hoy. Configura la fecha de inicio en el planificador.</TextMuted>
            </CardContainer>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Desayuno */}
              {!hide_breakfasts && (
                <div style={{
                  backgroundColor: '#13131f',
                  border: '1px solid #1f1f2e',
                  borderRadius: 16,
                  padding: 16
                }}>
                  <span style={{ fontSize: 11, fontWeight: 'bold', color: '#90caf9', textTransform: 'uppercase', letterSpacing: 1 }}>🍳 DESAYUNO</span>
                  <Spacer height={6} />
                  {des_recipes.length === 0 ? (
                    <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>Sin planificar</span>
                  ) : (
                    des_recipes.map(r => (
                      <div
                        key={r.id}
                        onClick={() => set_selected_recipe(r)}
                        style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', cursor: 'pointer', marginTop: 4, textDecoration: 'underline' }}
                      >
                        {r.name}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Comida */}
              <div style={{
                backgroundColor: '#13131f',
                border: '1px solid #1f1f2e',
                borderRadius: 16,
                padding: 16
              }}>
                <span style={{ fontSize: 11, fontWeight: 'bold', color: '#ffb74d', textTransform: 'uppercase', letterSpacing: 1 }}>🍲 COMIDA</span>
                <Spacer height={6} />
                {com_recipes.length === 0 ? (
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>Sin planificar</span>
                ) : (
                  com_recipes.map(r => (
                    <div
                      key={r.id}
                      onClick={() => set_selected_recipe(r)}
                      style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', cursor: 'pointer', marginTop: 4, textDecoration: 'underline' }}
                    >
                      {r.name}
                    </div>
                  ))
                )}
              </div>

              {/* Cena */}
              <div style={{
                backgroundColor: '#13131f',
                border: '1px solid #1f1f2e',
                borderRadius: 16,
                padding: 16
              }}>
                <span style={{ fontSize: 11, fontWeight: 'bold', color: '#b0bec5', textTransform: 'uppercase', letterSpacing: 1 }}>🍽️ CENA</span>
                <Spacer height={6} />
                {cen_recipes.length === 0 ? (
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>Sin planificar</span>
                ) : (
                  cen_recipes.map(r => (
                    <div
                      key={r.id}
                      onClick={() => set_selected_recipe(r)}
                      style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', cursor: 'pointer', marginTop: 4, textDecoration: 'underline' }}
                    >
                      {r.name}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Urgent Shopping list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TitleH2 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={20} color="#f26841" /> Lista de Compra Urgente
          </TitleH2>

          <CardContainer style={{
            flex: 1,
            backgroundColor: '#13131f',
            border: '1px solid #1f1f2e',
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {urgent_shopping.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
                🎉 ¡Todo comprado! No falta nada en la despensa.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {urgent_shopping.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handle_toggle_purchase(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      backgroundColor: item.purchased ? 'rgba(76,175,80,0.06)' : '#1c1c2b',
                      borderRadius: 10,
                      cursor: 'pointer',
                      border: '1px solid #28283d',
                      opacity: item.purchased ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.purchased}
                      readOnly
                      style={{
                        width: 18,
                        height: 18,
                        accentColor: '#f26841',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{
                      fontSize: 15,
                      textDecoration: item.purchased ? 'line-through' : 'none',
                      color: item.purchased ? 'rgba(255,255,255,0.4)' : '#ffffff'
                    }}>
                      <strong>{item.quantity} {item.unit}</strong> de {item.ingredient_name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContainer>
        </div>
      </div>

      {/* Recipe Modal overlay inside nevera mode */}
      {selected_recipe && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }}>
          <div style={{
            backgroundColor: '#13131f',
            border: '1px solid #28283d',
            borderRadius: 20,
            maxWidth: 500,
            width: '100%',
            padding: 24,
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <TitleH2 style={{ fontSize: 22, color: '#f26841', margin: 0 }}>{selected_recipe.name}</TitleH2>
              <button
                onClick={() => set_selected_recipe(null)}
                style={{
                  backgroundColor: '#1c1c2b',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <span style={{ fontSize: 13, display: 'block', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize', marginBottom: 16 }}>
              Dificultad: <strong>{selected_recipe.difficulty}</strong> · Tipo: <strong>{selected_recipe.meal_type}</strong>
            </span>

            <div style={{
              backgroundColor: '#1c1c2b',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16
            }}>
              <span style={{ fontSize: 14, fontWeight: 'bold', display: 'block', marginBottom: 6 }}>
                Ingredientes necesarios:
              </span>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                {selected_recipe.ingredients.map((ing, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {ing.quantity} {ing.unit} de {ing.name}
                  </li>
                ))}
              </ul>
            </div>

            <span style={{ fontSize: 14, fontWeight: 'bold', display: 'block', marginBottom: 6 }}>
              🍳 Instrucciones:
            </span>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
              {selected_recipe.instructions.map((inst, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>{inst}</li>
              ))}
            </ol>

            <Spacer height={20} />
            <Boton
              texto="Cerrar receta"
              clase_css="full-width"
              on_click={() => set_selected_recipe(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
