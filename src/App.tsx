import {
  Calendar,
  ChefHat,
  ShoppingCart,
  AlertTriangle,
  Search,
  PlusCircle
} from 'lucide-react';

import { use_app_state } from './hooks/use_app_state';
import { Box } from './components/common/Box';
import { Dialogo } from './components/common/Dialogo';
import { ModalFiltros } from './components/common/ModalFiltros';
import { Planner } from './components/planner/Planner';
import { Pantry } from './components/pantry/Pantry';
import { ShoppingList } from './components/shopping/ShoppingList';
import { AddRecipe } from './components/recipes/AddRecipe';
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
  LogoIcon
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
    handle_toggle_purchase,
    toggle_allergy,
    toggle_diet,
    handle_open_assign_meal,
    handle_assign_recipe,
    handle_remove_assigned_recipe,
    get_selectable_recipes,
    handle_add_recipe
  } = use_app_state();

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
          <AppTitle>La Cocina de La Abuela</AppTitle>
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
        />
      )}

      {active_tab === 'despensa' && (
        <Pantry
          pantry_items={pantry_items}
          on_add={on_add_pantry}
          on_delete={handle_delete_pantry_item}
        />
      )}

      {active_tab === 'compra' && (
        <ShoppingList
          shopping_items={shopping_items}
          on_recalculate={handle_recalculate_shopping}
          on_toggle={handle_toggle_purchase}
        />
      )}
      {active_tab === 'recetas' && (
        <AddRecipe on_add={handle_add_recipe} />
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
        titulo={assigning_meal ? `Elegir plato para el/la ${assigning_meal.type} (Día ${assigning_meal.day})` : ''}
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
                  <Box component="p" className="empty-text">No hay recetas de tipo "{assigning_meal.type}" que coincidan con la búsqueda.</Box>
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
                      <RecipePill className="cheap">{recipe.price === 'economica' ? 'Económica' : 'Elaborada'}</RecipePill>
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
    </AppContainer>
  );
};

