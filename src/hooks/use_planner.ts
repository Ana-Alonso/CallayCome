import type { MealPlanDay, Recipe, PantryItem, ShoppingItem, CookRecipeConfig, Profile } from '../types';
import { get_supabase_client } from '../services/supabase_client';
import { create_empty_day_plan, normalize_day_plan, serialize_day_plan_for_db } from '../utils/planner_helpers';

type MealType = 'desayuno' | 'comida' | 'cena';

interface UsePlannerParams {
  meal_plan: MealPlanDay[];
  set_meal_plan: React.Dispatch<React.SetStateAction<MealPlanDay[]>>;
  start_date: string | null;
  set_start_date: (date: string | null) => void;
  pantry_items: PantryItem[];
  set_pantry_items: React.Dispatch<React.SetStateAction<PantryItem[]>>;
  shopping_items: ShoppingItem[];
  profile: Profile | null;
  supabase_connected: boolean;
  trigger_push: (title: string, message: string) => void;
  get_pantry_match_info: (recipe: Recipe) => { matches: number; pct: number };
  get_filtered_recipes: () => Recipe[];
}

export const use_planner = ({
  meal_plan,
  set_meal_plan,
  start_date,
  set_start_date,
  pantry_items,
  set_pantry_items,
  shopping_items,
  profile,
  supabase_connected,
  trigger_push,
  get_pantry_match_info,
  get_filtered_recipes
}: UsePlannerParams) => {

  const handle_auto_generate_plan = async (recipes: Recipe[]): Promise<void> => {
    const list_desayunos = recipes.filter(r => r.meal_type === 'desayuno');
    const list_comidas = recipes.filter(r => r.meal_type === 'comida');
    const list_cenas = recipes.filter(r => r.meal_type === 'cena');

    if (list_desayunos.length === 0 || list_comidas.length === 0 || list_cenas.length === 0) {
      trigger_push("Error", "No hay suficientes recetas cargadas para generar un plan.");
      return;
    }

    const new_plan: MealPlanDay[] = Array.from({ length: 30 }, (_, i) => {
      const dayNum = i + 1;
      const des = list_desayunos[Math.floor(Math.random() * list_desayunos.length)].id;
      const com = list_comidas[Math.floor(Math.random() * list_comidas.length)].id;
      const cen = list_cenas[Math.floor(Math.random() * list_cenas.length)].id;
      return {
        day: dayNum,
        desayuno: [des],
        comida: [com],
        cena: [cen]
      };
    });

    if (supabase_connected && profile?.active_family_id) {
      const supabase = get_supabase_client();
      if (!supabase) return;

      try {
        await supabase
          .from('meal_plans')
          .delete()
          .eq('family_id', profile.active_family_id);

        const inserts = new_plan.map(dp => ({
          family_id: profile.active_family_id,
          ...serialize_day_plan_for_db(dp)
        }));

        const { error } = await supabase.from('meal_plans').insert(inserts);
        if (!error) {
          set_meal_plan(new_plan);
          trigger_push("Menú Generado 🎉", "Se ha creado un menú equilibrado para los próximos 30 días.");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      set_meal_plan(new_plan);
      trigger_push("Menú Generado 🎉", "Se ha creado un menú equilibrado localmente.");
    }
  };

  const handle_clear_plan = async (): Promise<void> => {
    const empty_plan = Array.from({ length: 30 }, (_, i) => create_empty_day_plan(i + 1));

    if (supabase_connected && profile?.active_family_id) {
      const supabase = get_supabase_client();
      if (!supabase) return;

      try {
        const { error } = await supabase
          .from('meal_plans')
          .delete()
          .eq('family_id', profile.active_family_id);

        if (!error) {
          set_meal_plan(empty_plan);
          trigger_push("Plan Vaciado 🗑️", "Se han eliminado todas las comidas del planificador.");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      set_meal_plan(empty_plan);
      trigger_push("Plan Vaciado 🗑️", "Se han eliminado todas las comidas localmente.");
    }
  };

  const save_or_update_day_plan = async (dayPlan: MealPlanDay): Promise<void> => {
    if (supabase_connected && profile?.active_family_id) {
      const supabase = get_supabase_client();
      if (!supabase) return;

      try {
        const serialized = serialize_day_plan_for_db(dayPlan);
        const { data } = await supabase
          .from('meal_plans')
          .select('id')
          .eq('family_id', profile.active_family_id)
          .eq('day', dayPlan.day)
          .single();

        if (data) {
          await supabase
            .from('meal_plans')
            .update(serialized)
            .eq('id', data.id);
        } else {
          await supabase
            .from('meal_plans')
            .insert([{
              family_id: profile.active_family_id,
              ...serialized
            }]);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handle_add_meal_slot = async (day: number, type: MealType): Promise<void> => {
    set_meal_plan(prev => prev.map(d => {
      if (d.day === day) {
        const updated = {
          ...d,
          [type]: [...d[type], null]
        };
        save_or_update_day_plan(updated);
        return updated;
      }
      return d;
    }));
  };

  const handle_remove_meal_slot = async (day: number, type: MealType, slot_index: number): Promise<void> => {
    set_meal_plan(prev => prev.map(d => {
      if (d.day === day) {
        const list = [...d[type]];
        if (list.length <= 1) {
          list[0] = null;
        } else {
          list.splice(slot_index, 1);
        }
        const updated = {
          ...d,
          [type]: list
        };
        save_or_update_day_plan(updated);
        return updated;
      }
      return d;
    }));
  };

  const handle_move_meal_slot = async (
    day: number,
    type: MealType,
    slot_index: number,
    direction: 'up' | 'down'
  ): Promise<void> => {
    set_meal_plan(prev => prev.map(d => {
      if (d.day === day) {
        const list = [...d[type]];
        const target_index = direction === 'up' ? slot_index - 1 : slot_index + 1;
        if (target_index >= 0 && target_index < list.length) {
          const temp = list[slot_index];
          list[slot_index] = list[target_index];
          list[target_index] = temp;
        }
        const updated = {
          ...d,
          [type]: list
        };
        save_or_update_day_plan(updated);
        return updated;
      }
      return d;
    }));
  };

  const handle_assign_recipe = async (
    day: number,
    type: MealType,
    slot_index: number,
    recipe_id: number
  ): Promise<void> => {
    set_meal_plan(prev => prev.map(d => {
      if (d.day === day) {
        const list = [...d[type]];
        list[slot_index] = recipe_id;
        const updated = {
          ...d,
          [type]: list
        };
        save_or_update_day_plan(updated);
        return updated;
      }
      return d;
    }));
  };

  const handle_remove_assigned_recipe = async (
    day: number,
    type: MealType,
    slot_index: number
  ): Promise<void> => {
    set_meal_plan(prev => prev.map(d => {
      if (d.day === day) {
        const list = [...d[type]];
        list[slot_index] = null;
        const updated = {
          ...d,
          [type]: list
        };
        save_or_update_day_plan(updated);
        return updated;
      }
      return d;
    }));
  };

  const handle_change_start_date = async (date: string | null): Promise<void> => {
    set_start_date(date);
    localStorage.setItem('calla_y_come_start_date', date || '');

    if (supabase_connected && profile?.active_family_id) {
      const supabase = get_supabase_client();
      if (supabase) {
        try {
          const { error } = await supabase
            .from('family_units')
            .update({ start_date: date })
            .eq('id', profile.active_family_id);
          if (error) {
            console.warn("Error updating start_date in family_units:", error.message);
          }
        } catch (err) {
          console.warn("Exception updating start_date in family_units:", err);
        }
      }
    }
  };

  const handle_cook_day = async (
    day: number,
    configs: CookRecipeConfig[],
    recipes: Recipe[]
  ): Promise<void> => {
    const day_plan = meal_plan.find(d => d.day === day);
    if (!day_plan) {
      trigger_push("Error", "No se encontró el menú para ese día.");
      return;
    }

    // 1. Compile required ingredients
    const needed: Record<string, { quantity: number; unit: string }> = {};
    const leftovers_to_add: Array<{ name: string; quantity: number; unit: string }> = [];

    configs.forEach(conf => {
      const recipe = recipes.find(r => r.id === conf.recipe_id);
      if (recipe && recipe.ingredients) {
        recipe.ingredients.forEach(ing => {
          const key = ing.name.toLowerCase().trim();
          const quantity_used = ing.quantity * conf.portions;
          if (needed[key]) {
            needed[key].quantity += quantity_used;
          } else {
            needed[key] = { quantity: quantity_used, unit: ing.unit };
          }
        });
      }

      // Leftovers to add
      if (conf.leftovers > 0) {
        const recipeName = recipe?.name || "Plato";
        leftovers_to_add.push({
          name: `Sobras de ${recipeName}`,
          quantity: conf.leftovers,
          unit: 'ración/es'
        });
      }
    });

    // 2. Subtract from local/remote pantry
    const items_to_delete: number[] = [];
    const items_to_update: Array<{ id: number; quantity: number }> = [];

    const updated_pantry = pantry_items.map(item => {
      const key = item.ingredient_name.toLowerCase().trim();
      if (needed[key]) {
        const remaining = Math.max(0, item.quantity - needed[key].quantity);
        needed[key].quantity = Math.max(0, needed[key].quantity - item.quantity);
        if (remaining <= 0) {
          if (item.id !== undefined) {
            items_to_delete.push(item.id);
          }
          return null;
        } else {
          if (item.id !== undefined) {
            items_to_update.push({ id: item.id, quantity: Number(remaining.toFixed(1)) });
          }
          return { ...item, quantity: Number(remaining.toFixed(1)) };
        }
      }
      return item;
    }).filter((item): item is PantryItem => item !== null);

    set_pantry_items(updated_pantry);

    // 3. Add leftovers
    for (const leftover of leftovers_to_add) {
      const existing_index = updated_pantry.findIndex(
        item => item.ingredient_name.toLowerCase() === leftover.name.toLowerCase()
      );

      if (supabase_connected && profile?.active_family_id) {
        const supabase = get_supabase_client();
        if (supabase) {
          if (existing_index !== -1) {
            const item = updated_pantry[existing_index];
            const new_qty = item.quantity + leftover.quantity;
            await supabase
              .from('pantry')
              .update({ quantity: new_qty })
              .eq('id', item.id);
            
            set_pantry_items(prev => prev.map((it, idx) => 
              idx === existing_index ? { ...it, quantity: new_qty } : it
            ));
          } else {
            const { data } = await supabase
              .from('pantry')
              .insert([{
                family_id: profile.active_family_id,
                ingredient_name: leftover.name,
                quantity: leftover.quantity,
                unit: leftover.unit
              }])
              .select()
              .single();

            if (data) {
              set_pantry_items(prev => [...prev, {
                id: data.id,
                ingredient_name: data.ingredient_name,
                quantity: Number(data.quantity),
                unit: data.unit
              }]);
            }
          }
        }
      } else {
        // Local fallback
        if (existing_index !== -1) {
          set_pantry_items(prev => prev.map((it, idx) => 
            idx === existing_index ? { ...it, quantity: it.quantity + leftover.quantity } : it
          ));
        } else {
          set_pantry_items(prev => [...prev, {
            id: Date.now() + Math.random(),
            ingredient_name: leftover.name,
            quantity: leftover.quantity,
            unit: leftover.unit
          }]);
        }
      }
    }

    // Process database deletes/updates for ingredients
    if (supabase_connected) {
      const supabase = get_supabase_client();
      if (supabase) {
        if (items_to_delete.length > 0) {
          await supabase.from('pantry').delete().in('id', items_to_delete);
        }
        for (const up of items_to_update) {
          await supabase.from('pantry').update({ quantity: up.quantity }).eq('id', up.id);
        }
      }
    }

    const has_leftovers = configs.some(c => c.leftovers > 0);
    trigger_push(
      "¡Día Cocinado! 🍽️",
      has_leftovers 
        ? "Buen provecho. Se han restado los ingredientes usados y guardado las raciones de sobras en la despensa."
        : "Buen provecho. Los ingredientes utilizados se han restado de tu despensa."
    );
  };

  const get_panic_recipe = (): { recipe: Recipe; missing_count: number; pct: number } | null => {
    const filtered = get_filtered_recipes();
    if (filtered.length === 0) return null;

    const ranked = filtered.map(recipe => {
      const match_info = get_pantry_match_info(recipe);
      const total = recipe.ingredients.length;
      const missing_count = total - match_info.matches;
      return {
        recipe,
        missing_count,
        pct: match_info.pct
      };
    });

    ranked.sort((a, b) => {
      if (a.missing_count !== b.missing_count) {
        return a.missing_count - b.missing_count;
      }
      return b.pct - a.pct;
    });

    return ranked[0] || null;
  };

  const get_nfc_payload = (recipes: Recipe[]): string => {
    let current_day_num: number | null = null;
    if (start_date) {
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
          current_day_num = currentDay;
        }
      } catch (e) {
        console.error(e);
      }
    }

    let menu_text = "No planificado";
    if (current_day_num !== null) {
      const day_plan = meal_plan.find(d => d.day === current_day_num);
      if (day_plan) {
        const des = day_plan.desayuno.map(id => recipes.find(r => r.id === id)?.name).filter(Boolean).join(", ") || "Nada";
        const com = day_plan.comida.map(id => recipes.find(r => r.id === id)?.name).filter(Boolean).join(", ") || "Nada";
        const cen = day_plan.cena.map(id => recipes.find(r => r.id === id)?.name).filter(Boolean).join(", ") || "Nada";
        menu_text = `🍳 Desayuno: ${des}\n🍲 Comida: ${com}\n🍽️ Cena: ${cen}`;
      }
    }

    const urgent_items = shopping_items.slice(0, 5);
    let shopping_text = "Lista urgente vacía";
    if (urgent_items.length > 0) {
      shopping_text = urgent_items.map(item => `- ${item.quantity} ${item.unit} de ${item.ingredient_name}`).join("\n");
    }

    return `📍 *Calla y Come - Vista NFC* 📲\n\n📅 *Día ${current_day_num || "?"} del plan*\n${menu_text}\n\n🛒 *Faltantes Urgentes*:\n${shopping_text}`;
  };

  const load_planner_data = async (familyId: string): Promise<void> => {
    if (!supabase_connected) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('family_id', familyId);

      if (!error && data) {
        const empty_plan = Array.from({ length: 30 }, (_, i) => create_empty_day_plan(i + 1));
        const final_plan = empty_plan.map(empty_day => {
          const db_day = data.find((d: any) => d.day === empty_day.day);
          if (db_day) {
            return normalize_day_plan(db_day, empty_day.day);
          }
          return empty_day;
        });
        set_meal_plan(final_plan);
      }
    } catch (err) {
      console.error('Error loading meal plans:', err);
    }
  };

  return {
    handle_auto_generate_plan,
    handle_clear_plan,
    handle_add_meal_slot,
    handle_remove_meal_slot,
    handle_move_meal_slot,
    handle_assign_recipe,
    handle_remove_assigned_recipe,
    handle_change_start_date,
    handle_cook_day,
    get_panic_recipe,
    get_nfc_payload,
    load_planner_data
  };
};
