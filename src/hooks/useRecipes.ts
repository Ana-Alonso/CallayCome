import { useState } from 'react';
import type { Recipe, FilterState, PantryItem } from '../types';
import local_recipes from '../recipesData.json';
import { get_supabase_client } from '../services/supabase_client';

interface UseRecipesParams {
  trigger_push: (title: string, message: string) => void;
  get_recipe_votes?: (recipeId: number) => number;
}

export const useRecipes = ({
  trigger_push,
  get_recipe_votes
}: UseRecipesParams) => {
  const [recipes, set_recipes] = useState<Recipe[]>(local_recipes as Recipe[]);
  const [recipe_search, set_recipe_search] = useState<string>('');
  const [is_filter_modal_open, set_is_filter_modal_open] = useState<boolean>(false);
  const [db_ingredients, set_db_ingredients] = useState<string[]>([]);
  const [active_filters, set_filters] = useState<FilterState>({
    ingredients_count: 'all',
    allergies: [],
    diets: [],
    price: 'all',
    difficulty: 'all',
    health: 'all'
  });

  const map_db_recipe = (row: any): Recipe => {
    return {
      id: row.id,
      name: row.name,
      meal_type: row.meal_type,
      price: row.price,
      difficulty: row.difficulty,
      health: row.health,
      diet_type: row.diet_type,
      allergens: row.allergens || [],
      instructions: row.instructions || [],
      ingredients: (row.recipe_ingredients || []).map((ri: any) => ({
        name: ri.ingredients?.name || '',
        quantity: Number(ri.quantity),
        unit: ri.unit
      }))
    };
  };

  const load_db_ingredients = async (): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('ingredients').select('name').order('name');
      if (!error && data) {
        set_db_ingredients(data.map((i: any) => i.name));
      }
    } catch (e) {
      console.error('Error loading db ingredients:', e);
    }
  };

  const insert_recipe_relational = async (recipe: Omit<Recipe, 'id'>, supabase: any): Promise<number> => {
    // 1. Insert details into public.recipes
    const { data: new_recipe, error: recipe_error } = await supabase
      .from('recipes')
      .insert([{
        name: recipe.name,
        meal_type: recipe.meal_type,
        price: recipe.price,
        difficulty: recipe.difficulty,
        health: recipe.health,
        diet_type: recipe.diet_type,
        allergens: recipe.allergens || [],
        instructions: recipe.instructions || []
      }])
      .select()
      .single();

    if (recipe_error || !new_recipe) {
      throw new Error(recipe_error?.message || "Error al insertar la receta");
    }

    const recipeId = new_recipe.id;

    // 2. Loop through ingredients, insert/re-use in ingredients table, and link in recipe_ingredients
    for (const ing of recipe.ingredients) {
      let ingredient_id: number;
      
      // Try to find if the ingredient already exists in public.ingredients
      const { data: existing_ing } = await supabase
        .from('ingredients')
        .select('id')
        .eq('name', ing.name.trim())
        .maybeSingle();

      if (existing_ing) {
        ingredient_id = existing_ing.id;
      } else {
        // Insert new ingredient
        const { data: new_ing, error: ing_error } = await supabase
          .from('ingredients')
          .insert([{ name: ing.name.trim() }])
          .select()
          .single();

        if (ing_error || !new_ing) {
          throw new Error(`Error al registrar el ingrediente ${ing.name}: ${ing_error?.message}`);
        }
        ingredient_id = new_ing.id;
      }

      // Link it in recipe_ingredients
      const { error: link_error } = await supabase
        .from('recipe_ingredients')
        .insert([{
          recipe_id: recipeId,
          ingredient_id: ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit
        }]);

      if (link_error) {
        throw new Error(`Error al vincular el ingrediente ${ing.name}: ${link_error.message}`);
      }
    }

    return recipeId;
  };

  const load_recipes = async (): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) {
      set_recipes(local_recipes as Recipe[]);
      return;
    }
    try {
      const { data: db_recipes, error } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*, ingredients(*))');

      if (!error && db_recipes) {
        if (db_recipes.length === 0) {
          for (const r of local_recipes) {
            await insert_recipe_relational(r as any, supabase);
          }
          const { data: refreshed } = await supabase
            .from('recipes')
            .select('*, recipe_ingredients(*, ingredients(*))');
          if (refreshed) {
            set_recipes(refreshed.map((row: any) => map_db_recipe(row)));
          }
        } else {
          set_recipes(db_recipes.map((row: any) => map_db_recipe(row)));
        }
      }
      await load_db_ingredients();
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
    get_pantry_match_info: (recipe: Recipe) => { matches: number; total: number; pct: number },
    pantry_items: PantryItem[]
  ): Array<{ recipe: Recipe; match_info: { matches: number; total: number; pct: number }; votes: number; has_leftover: boolean }> => {
    if (!assigning_meal) return [];
    const type = assigning_meal.type;
    return recipes
      .filter(r => r.meal_type === type)
      .filter(r => r.name.toLowerCase().includes(recipe_search.toLowerCase()))
      .map(recipe => {
        const match_info = get_pantry_match_info(recipe);
        const votes = get_recipe_votes ? get_recipe_votes(recipe.id) : 0;
        const leftover_name = `sobras de ${recipe.name.toLowerCase().trim()}`;
        const has_leftover = pantry_items.some(
          p => p.ingredient_name.toLowerCase().trim() === leftover_name && p.quantity > 0
        );
        return { recipe, match_info, votes, has_leftover };
      })
      .sort((a, b) => {
        if (a.has_leftover !== b.has_leftover) {
          return a.has_leftover ? -1 : 1;
        }
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
      const new_id = await insert_recipe_relational(recipe, supabase);
      set_recipes(prev => [...prev, { ...recipe, id: new_id }]);
      await load_db_ingredients();
      trigger_push("Receta Añadida 🍳", `${recipe.name} se ha guardado en el catálogo.`);
    } catch (err: any) {
      console.error('Failed to add recipe:', err);
      trigger_push("Error al guardar receta", err.message || "Error desconocido");
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
    handle_add_recipe,
    db_ingredients,
    load_db_ingredients
  };
};
