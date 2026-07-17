import { useState, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import {
  Calendar,
  ChefHat,
  ShoppingCart,
  AlertTriangle,
  Search,
  PlusCircle,
  Users
} from 'lucide-react';

import { use_global_state } from './hooks/use_global_state';
import { Box } from './components/common/Box';
import { Dialogo } from './components/common/Dialogo';
import { ModalFiltros } from './components/common/ModalFiltros';
import { Planner } from './components/planner/Planner';
import { ModoNevera } from './components/nevera/ModoNevera';
import { Pantry } from './components/pantry/Pantry';
import { ShoppingList } from './components/shopping/ShoppingList';
import { AddRecipe } from './components/recipes/AddRecipe';
import { MiFamilia } from './components/family/MiFamilia';
import { Auth } from './components/auth/Auth';
import {
  AppContainer,
  HeaderContainer,
  NavContainer,
  ToastContainer,
  ToastItem,
  NavTabButton,
  AppLogo,
  AppTitle,
  RecipeSelectCard,
  RecipeCardTop,
  RecipeSelectTitle,
  PantryMatchBadge,
  RecipeIngredientsPreview,
  RecipeTagContainer,
  RecipePill,
  LogoIcon,
  PageContainer,
  TextMuted,
  Spacer
} from './components/common';

export const App = () => {
  const {
    active_tab,
    set_active_tab,
    recipes,
    pantry_items,
    shopping_items,
    meal_plan,
    toast_messages,
    user,
    profile,
    my_families,
    suggestions,
    current_role,
    auth_loading,
    is_filter_modal_open,
    set_is_filter_modal_open,
    active_filters,
    set_filters,
    assigning_meal,
    set_assigning_meal,
    recipe_search,
    set_recipe_search,
    trigger_push,
    handle_auto_generate_plan,
    handle_recalculate_shopping,
    handle_clear_plan,
    handle_add_pantry,
    handle_delete_pantry_item,
    handle_update_pantry_qty,
    handle_toggle_purchase,
    toggle_allergy,
    toggle_diet,
    handle_open_assign_meal,
    handle_add_meal_slot,
    handle_remove_meal_slot,
    handle_move_meal_slot,
    handle_assign_recipe,
    handle_remove_assigned_recipe,
    get_selectable_recipes,
    handle_add_recipe,
    handle_login,
    handle_signup,
    handle_logout,
    handle_create_family,
    handle_join_family,
    handle_switch_family,
    handle_leave_family,
    handle_approve_suggestion,
    handle_reject_suggestion,
    handle_vote_suggestion,
    handle_transfer_role,
    get_family_members,
    get_family_complaints,
    start_date,
    handle_change_start_date,
    handle_cook_day,
    handle_add_custom_shopping_item,
    hide_breakfasts,
    set_hide_breakfasts,
    show_quejometro,
    set_show_quejometro,
    cooked_days,
    get_panic_recipe
  } = use_global_state();

  const [mostrar_modo_nevera, set_mostrar_modo_nevera] = useState(false);
  const [lavaplatos, set_lavaplatos] = useState<string | null>(null);
  const [max_complaints, set_max_complaints] = useState<number>(0);

  useEffect(() => {
    const setupDeepLink = async () => {
      try {
        CapApp.addListener('appUrlOpen', (event: any) => {
          if (event.url && (event.url.includes('nevera') || event.url.includes('nfc'))) {
            set_mostrar_modo_nevera(true);
          }
        });
      } catch (e) {
        console.warn("CapApp listener not supported:", e);
      }
    };
    setupDeepLink();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events when the user is typing in inputs or textareas
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === '1') {
        set_active_tab('plan');
      } else if (key === '2') {
        set_active_tab('despensa');
      } else if (key === '3') {
        set_active_tab('compra');
      } else if (key === '4') {
        set_active_tab('recetas');
      } else if (key === '5') {
        set_active_tab('familia');
      } else if (active_tab === 'plan') {
        if (key === 'p') {
          window.dispatchEvent(new CustomEvent('hotkey-panic'));
        } else if (key === 'n') {
          set_mostrar_modo_nevera(prev => !prev);
        } else if (key === 'f') {
          set_is_filter_modal_open(prev => !prev);
        }
      } else if (active_tab === 'compra') {
        if (key === 'c') {
          handle_recalculate_shopping();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active_tab, handle_recalculate_shopping]);

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

  const handle_filter_modal_open = (): void => {
    set_is_filter_modal_open(true);
  };

  const handle_filter_modal_close = (): void => {
    set_is_filter_modal_open(false);
  };

  const handle_filter_apply = (): void => {
    set_is_filter_modal_open(false);
    trigger_push("Filtros Aplicados", "Se han guardado tus preferencias de alimentación.");
  };

  const on_add_pantry = (name: string, qty: number, unit: string): void => {
    handle_add_pantry(name, qty, unit);
  };

  const dialog_title = assigning_meal
    ? current_role === 'miembro'
      ? `Sugerir Alternativa para el/la ${assigning_meal.type} (Día ${assigning_meal.day}, opción ${assigning_meal.slot_index + 1})`
      : `Elegir plato para el/la ${assigning_meal.type} (Día ${assigning_meal.day}, opción ${assigning_meal.slot_index + 1})`
    : '';

  if (auth_loading) {
    return (
      <AppContainer>
        <PageContainer style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <AppLogo style={{ flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <LogoIcon style={{ fontSize: 64 }}>🍳</LogoIcon>
            <AppTitle>Calla y Come</AppTitle>
          </AppLogo>
          <TextMuted>Cargando sesión...</TextMuted>
          <Spacer height={20} />
          <Box sx={{ display: 'flex', gap: '8px' }}>
            {[0, 1, 2].map(i => (
              <Box
                key={i}
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  animation: 'pulse-dot 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                  '@keyframes pulse-dot': {
                    '0%, 80%, 100%': { opacity: 0.2, transform: 'scale(0.8)' },
                    '40%': { opacity: 1, transform: 'scale(1)' }
                  }
                }}
              />
            ))}
          </Box>
        </PageContainer>
      </AppContainer>
    );
  }

  if (!user) {
    return (
      <AppContainer>
        <ToastContainer>
          {toast_messages.map(toast => (
            <ToastItem key={toast.id}>
              <Box className="toast-title">{toast.title}</Box>
              <Box className="toast-body">{toast.body}</Box>
            </ToastItem>
          ))}
        </ToastContainer>

        <HeaderContainer>
          <AppLogo>
            <LogoIcon>🍳</LogoIcon>
            <AppTitle>Calla y Come</AppTitle>
          </AppLogo>
        </HeaderContainer>

        <Auth
          on_login={handle_login}
          on_signup={handle_signup}
          on_success={() => {}}
        />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <ToastContainer>
        {toast_messages.map(toast => (
          <ToastItem key={toast.id}>
            <Box className="toast-title">{toast.title}</Box>
            <Box className="toast-body">{toast.body}</Box>
          </ToastItem>
        ))}
      </ToastContainer>

      <HeaderContainer>
        <AppLogo>
          <LogoIcon>🍳</LogoIcon>
          <AppTitle>Calla y Come</AppTitle>
        </AppLogo>
      </HeaderContainer>

      <NavContainer>
        <NavTabButton
          active={active_tab === 'plan'}
          onClick={() => set_active_tab('plan')}
        >
          <Calendar />
          <Box component="span">Plan del Mes</Box>
        </NavTabButton>
        <NavTabButton
          active={active_tab === 'despensa'}
          onClick={() => set_active_tab('despensa')}
        >
          <ChefHat />
          <Box component="span">Despensa</Box>
        </NavTabButton>
        <NavTabButton
          active={active_tab === 'compra'}
          onClick={() => set_active_tab('compra')}
        >
          <ShoppingCart />
          <Box component="span">Lista Compra</Box>
        </NavTabButton>
        <NavTabButton
          active={active_tab === 'recetas'}
          onClick={() => set_active_tab('recetas')}
        >
          <PlusCircle />
          <Box component="span">Nueva Receta</Box>
        </NavTabButton>
        <NavTabButton
          active={active_tab === 'familia'}
          onClick={() => set_active_tab('familia')}
        >
          <Users />
          <Box component="span">Familia</Box>
        </NavTabButton>
      </NavContainer>

      {active_tab === 'plan' && (
        <Planner
          meal_plan={meal_plan}
          recipes={recipes}
          on_auto_generate={handle_auto_generate_plan}
          on_clear={handle_clear_plan}
          on_open_filters={handle_filter_modal_open}
          on_slot_click={handle_open_assign_meal}
          on_slot_clear={handle_remove_assigned_recipe}
          on_add_slot={handle_add_meal_slot}
          on_remove_slot={handle_remove_meal_slot}
          on_move_slot={handle_move_meal_slot}
          current_role={current_role}
          pending_suggestions={suggestions.length}
          start_date={start_date}
          on_change_start_date={handle_change_start_date}
          on_cook={handle_cook_day}
          get_family_members={get_family_members}
          get_family_complaints={get_family_complaints}
          on_open_nevera={() => set_mostrar_modo_nevera(true)}
          hide_breakfasts={hide_breakfasts}
          set_hide_breakfasts={set_hide_breakfasts}
          show_quejometro={show_quejometro}
          set_show_quejometro={set_show_quejometro}
          cooked_days={cooked_days}
          suggestions={suggestions}
          handle_approve_suggestion={handle_approve_suggestion}
          handle_reject_suggestion={handle_reject_suggestion}
          handle_vote_suggestion={handle_vote_suggestion}
          get_panic_recipe={get_panic_recipe}
          pantry_items={pantry_items}
          profile={profile}
        />
      )}

      {active_tab === 'despensa' && (
        <Pantry
          pantry_items={pantry_items}
          on_add={on_add_pantry}
          on_delete={handle_delete_pantry_item}
          on_update_qty={handle_update_pantry_qty}
        />
      )}

      {active_tab === 'compra' && (
        <ShoppingList
          shopping_items={shopping_items}
          on_recalculate={handle_recalculate_shopping}
          on_toggle={handle_toggle_purchase}
          on_add_custom={handle_add_custom_shopping_item}
          start_date={start_date}
        />
      )}

      {active_tab === 'recetas' && (
        <AddRecipe on_add={handle_add_recipe} />
      )}

      {active_tab === 'familia' && (
        <MiFamilia
          user={user}
          profile={profile}
          my_families={my_families}
          suggestions={suggestions}
          current_role={current_role}
          handle_login={handle_login}
          handle_signup={handle_signup}
          handle_logout={handle_logout}
          handle_create_family={handle_create_family}
          handle_join_family={handle_join_family}
          handle_switch_family={handle_switch_family}
          handle_leave_family={handle_leave_family}
          handle_approve_suggestion={handle_approve_suggestion}
          handle_reject_suggestion={handle_reject_suggestion}
          handle_vote_suggestion={handle_vote_suggestion}
          handle_transfer_role={handle_transfer_role}
          get_family_members={get_family_members}
          get_family_complaints={get_family_complaints}
          show_quejometro={show_quejometro}
        />
      )}

      <ModalFiltros
        abierto={is_filter_modal_open}
        on_close={handle_filter_modal_close}
        filtros={active_filters}
        set_filtros={set_filters}
        toggle_alergia={toggle_allergy}
        toggle_dieta={toggle_diet}
        on_aplicar={handle_filter_apply}
      />

      <Dialogo
        abierto={assigning_meal !== null}
        on_close={() => set_assigning_meal(null)}
        titulo={dialog_title}
      >
        {assigning_meal && (
          <>
            <Box className="assign-recipe-header">
              <Box className="form-group assign-recipe-search-container">
                <input
                  type="text"
                  className="form-control assign-recipe-search-input"
                  placeholder="Buscar receta por nombre..."
                  value={recipe_search}
                  onChange={e => set_recipe_search(e.target.value)}
                />
                <Search className="search-icon-position" size={16} />
              </Box>
            </Box>

            <Box className="recipe-suggestions-list">
              {get_selectable_recipes().length === 0 ? (
                <Box className="empty-state">
                  <AlertTriangle className="empty-icon" />
                  <Box component="p" className="empty-text">
                    No hay recetas de tipo "{assigning_meal.type}" que coincidan con la búsqueda.
                  </Box>
                </Box>
              ) : (
                get_selectable_recipes().map(({ recipe, match_info }) => (
                  <RecipeSelectCard
                    key={recipe.id}
                    onClick={() => handle_assign_recipe(recipe.id)}
                  >
                    <RecipeCardTop>
                      <RecipeSelectTitle>{recipe.name}</RecipeSelectTitle>
                      <PantryMatchBadge low={match_info.pct < 50}>
                        🎯 {match_info.matches}/{match_info.total} ing.
                      </PantryMatchBadge>
                    </RecipeCardTop>

                    <RecipeIngredientsPreview>
                      Ingredientes: {recipe.ingredients.map(i => i.name).join(', ')}
                    </RecipeIngredientsPreview>

                    <RecipeTagContainer>
                      <RecipePill className="cheap">
                        {recipe.price === 'economica' ? 'Económica' : 'Elaborada'}
                      </RecipePill>
                      <RecipePill className="easy">{recipe.difficulty}</RecipePill>
                      <RecipePill className="healthy">{recipe.health}</RecipePill>
                      {recipe.diet_type !== 'omnivoro' && (
                        <RecipePill className="recipe-pill-diet">
                          {recipe.diet_type}
                        </RecipePill>
                      )}
                    </RecipeTagContainer>
                  </RecipeSelectCard>
                ))
              )}
            </Box>
          </>
        )}
      </Dialogo>

      {mostrar_modo_nevera && (
        <ModoNevera
          on_close={() => set_mostrar_modo_nevera(false)}
          meal_plan={meal_plan}
          recipes={recipes}
          shopping_items={shopping_items}
          handle_toggle_purchase={handle_toggle_purchase}
          lavaplatos={lavaplatos}
          max_complaints={max_complaints}
          start_date={start_date}
          hide_breakfasts={hide_breakfasts}
          show_quejometro={show_quejometro}
        />
      )}
      {/* Keyboard shortcuts footer guide for PC users */}
      <div style={{
        textAlign: 'center',
        padding: '10px 14px',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: '#0c0c10',
        lineHeight: 1.4,
        marginTop: 'auto'
      }}>
        💻 <strong>Atajos de teclado (PC):</strong> [1-5] Navegar | [P] Pánico | [N] Modo Nevera | [F] Filtros | [C] Recalcular compra
      </div>
    </AppContainer>
  );
};
