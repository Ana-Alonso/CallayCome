import { useState } from 'react';
import type { Recipe, FilterState } from '../types';
import local_recipes from '../recipesData.json';
import { get_supabase_client } from '../services/supabase_client';

interface UseRecipesParams {
  supabase_connected: boolean;
  trigger_push: (title: string, message: string) => void;
  get_recipe_votes?: (recipeId: number) => number;
}

export const use_recipes = ({
  supabase_connected,
  trigger_push,
  get_recipe_votes
}: UseRecipesParams) => {
  const [recipes, set_recipes] = useState<Recipe[]>(local_recipes as Recipe[]);
  const [recipe_search, set_recipe_search] = useState<string>('');
  const [is_filter_modal_open, set_is_filter_modal_open] = useState<boolean>(false);
  const [active_filters, set_filters] = useState<FilterState>({
    ingredients_count: 'all',
    allergies: [],
    diets: [],
    price: 'all',
    difficulty: 'all',
    health: 'all'
  });

  const load_recipes = async (): Promise<void> => {
    if (!supabase_connected) {
      set_recipes(local_recipes as Recipe[]);
      return;
    }
    const supabase = get_supabase_client();
    if (!supabase) return;
    try {
      const { data: db_recipes, error } = await supabase.from('recipes').select('*');
      if (!error && db_recipes) {
        if (db_recipes.length === 0) {
          for (const r of local_recipes) {
            await supabase.from('recipes').insert([{ recipe_data: r }]);
          }
          const { data: refreshed } = await supabase.from('recipes').select('*');
          if (refreshed) {
            set_recipes(refreshed.map((row: any) => ({ ...row.recipe_data, id: row.id })));
          }
        } else {
          set_recipes(db_recipes.map((row: any) => ({ ...row.recipe_data, id: row.id })));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggle_allergy = (allergy: string): void => {
    set_filters(prev => {
      const active = prev.allergies.includes(allergy);
      return {
        ...prev,
        allergies: active ? prev.allergies.filter(a => a !== allergy) : [...prev.allergies, allergy]
      };
    });
  };

  const toggle_diet = (diet: string): void => {
    set_filters(prev => {
      const active = prev.diets.includes(diet);
      return {
        ...prev,
        diets: active ? prev.diets.filter(d => d !== diet) : [...prev.diets, diet]
      };
    });
  };

  const get_filtered_recipes = (): Recipe[] => {
    return recipes.filter(recipe => {
      // 1. Search Query
      if (recipe_search.trim().length > 0) {
        const query = recipe_search.toLowerCase().trim();
        const matches_name = recipe.name.toLowerCase().includes(query);
        const matches_instruction = recipe.instructions.some(i => i.toLowerCase().includes(query));
        const matches_ingredients = recipe.ingredients.some(i => i.name.toLowerCase().includes(query));
        if (!matches_name && !matches_instruction && !matches_ingredients) {
          return false;
        }
      }

      // 2. Ingredients Count Filter
      if (active_filters.ingredients_count !== 'all') {
        const count = recipe.ingredients.length;
        if (active_filters.ingredients_count === 'few' && count > 5) return false;
        if (active_filters.ingredients_count === 'many' && count <= 5) return false;
      }

      // 3. Allergies Filter (exclude if it has the allergen)
      if (active_filters.allergies.length > 0) {
        const has_allergy = active_filters.allergies.some(allergy =>
          recipe.allergens.map(a => a.toLowerCase().trim()).includes(allergy.toLowerCase().trim())
        );
        if (has_allergy) return false;
      }

      // 4. Diets Filter (must match all selected diets)
      if (active_filters.diets.length > 0) {
        const matches_all_diets = active_filters.diets.every(diet => {
          if (diet.toLowerCase() === 'vegetariano') {
            return recipe.diet_type === 'vegetariano' || recipe.diet_type === 'vegano';
          }
          if (diet.toLowerCase() === 'vegano') {
            return recipe.diet_type === 'vegano';
          }
          return recipe.diet_type?.toLowerCase() === diet.toLowerCase();
        });
        if (!matches_all_diets) return false;
      }

      // 5. Price Filter
      if (active_filters.price !== 'all' && recipe.price !== active_filters.price) return false;

      // 6. Difficulty Filter
      if (active_filters.difficulty !== 'all' && recipe.difficulty !== active_filters.difficulty) return false;

      // 7. Health Filter
      if (active_filters.health !== 'all' && recipe.health !== active_filters.health) return false;

      return true;
    });
  };

  const get_selectable_recipes = (
    assigning_meal: { day: number; type: 'desayuno' | 'comida' | 'cena'; slot_index: number } | null,
    get_pantry_match_info: (recipe: Recipe) => { matches: number; total: number; pct: number }
  ): Array<{ recipe: Recipe; match_info: { matches: number; total: number; pct: number }; votes: number }> => {
    if (!assigning_meal) return [];
    const type = assigning_meal.type;
    return recipes
      .filter(r => r.meal_type === type)
      .filter(r => r.name.toLowerCase().includes(recipe_search.toLowerCase()))
      .map(recipe => {
        const match_info = get_pantry_match_info(recipe);
        const votes = get_recipe_votes ? get_recipe_votes(recipe.id) : 0;
        return { recipe, match_info, votes };
      })
      .sort((a, b) => {
        if (b.votes !== a.votes) {
          return b.votes - a.votes;
        }
        return b.match_info.pct - a.match_info.pct;
      });
  };

  const handle_add_recipe = async (recipe: Omit<Recipe, 'id'>): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) {
      trigger_push("Error", "No conectado a base de datos");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert([{ recipe_data: recipe }])
        .select()
        .single();

      if (!error && data) {
        set_recipes(prev => [...prev, { ...data.recipe_data, id: data.id }]);
        trigger_push("Receta Añadida 🍳", `${recipe.name} se ha guardado en el catálogo.`);
      } else {
        trigger_push("Error al guardar receta", error?.message || "Error desconocido");
      }
    } catch (err: any) {
      trigger_push("Error", err.message);
    }
  };

  return {
    recipes,
    set_recipes,
    recipe_search,
    set_recipe_search,
    active_filters,
    set_filters,
    is_filter_modal_open,
    set_is_filter_modal_open,
    load_recipes,
    toggle_allergy,
    toggle_diet,
    get_filtered_recipes,
    get_selectable_recipes,
    handle_add_recipe
  };
};
