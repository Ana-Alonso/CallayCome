import type { ShoppingItem, PantryItem, Recipe, MealPlanDay, Profile } from '../types';
import { get_supabase_client } from '../services/supabase_client';
import type { User } from '@supabase/supabase-js';
import { get_current_planner_day, get_active_week_info } from '../utils/planner_helpers';
import { normalize_unit } from '../utils/unit_converter';

interface UseShoppingParams {
  shopping_items: ShoppingItem[];
  set_shopping_items: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
  profile: Profile | null;
  trigger_push: (title: string, message: string) => void;
  start_date: string | null;
  handle_add_pantry: (name: string, qty: number, unit: string) => Promise<void>;
  user: User | null;
}

export const useShopping = ({
  shopping_items,
  set_shopping_items,
  profile,
  trigger_push,
  start_date,
  handle_add_pantry,
  user
}: UseShoppingParams) => {

  // Helper: notify every family member except the actor
  const notify_all_family_members = async (
    family_id: string,
    title: string,
    body: string
  ): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;
    try {
      const { data: members } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('family_id', family_id);
      if (!members || members.length === 0) return;
      const notifications = members
        .map((m: any) => ({
          family_id,
          recipient_user_id: m.user_id,
          title,
          body
        }));
      if (notifications.length > 0) {
        const { error } = await supabase.from('family_notifications').insert(notifications);
        if (error) {
          console.error('family_notifications insert error:', error);
        }
      }
    } catch (err) {
      console.error('shopping notify_all error:', err);
    }
  };

  const handle_recalculate_shopping = async (
    meal_plan: MealPlanDay[],
    recipes: Recipe[],
    pantry_items: PantryItem[]
  ): Promise<void> => {
    const current_day = get_current_planner_day(start_date);
    const week_info = get_active_week_info(current_day);
    const week_plan = meal_plan.filter(dp => dp.day >= week_info.start_day && dp.day <= week_info.end_day);

    // 1. Gather all required ingredients from the active week menu
    const required: Record<string, { quantity: number; unit: string }> = {};

    week_plan.forEach(dayPlan => {
      const all_recipe_ids = [
        ...dayPlan.desayuno,
        ...dayPlan.comida,
        ...dayPlan.cena
      ].filter((id): id is number => id !== null);

      all_recipe_ids.forEach(recipeId => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe && recipe.ingredients) {
          recipe.ingredients.forEach(ing => {
            const key = ing.name.toLowerCase().trim();
            const norm = normalize_unit(ing.quantity, ing.unit);

            if (required[key]) {
              const storedNorm = normalize_unit(required[key].quantity, required[key].unit);
              if (storedNorm.baseUnit === norm.baseUnit) {
                required[key].quantity = storedNorm.value + norm.value;
                required[key].unit = storedNorm.baseUnit;
              } else {
                required[key].quantity += ing.quantity;
              }
            } else {
              required[key] = { quantity: norm.value, unit: norm.baseUnit };
            }
          });
        }
      });
    });

    // 2. Compare against pantry stock
    const needed_items: Array<{ name: string; quantity: number; unit: string }> = [];

    Object.keys(required).forEach(key => {
      const req = required[key];
      const stock = pantry_items
        .filter(p => p.ingredient_name.toLowerCase().trim() === key)
        .reduce((sum, p) => sum + p.quantity, 0);

      if (stock < req.quantity) {
        const missing = req.quantity - stock;
        // Search original name casing from recipes
        let display_name = key;
        for (const dayPlan of week_plan) {
          const all_ids = [...dayPlan.desayuno, ...dayPlan.comida, ...dayPlan.cena];
          for (const rid of all_ids) {
            if (rid !== null) {
              const r = recipes.find(rec => rec.id === rid);
              const found_ing = r?.ingredients?.find(i => i.name.toLowerCase().trim() === key);
              if (found_ing) {
                display_name = found_ing.name;
                break;
              }
            }
          }
        }
        needed_items.push({
          name: display_name,
          quantity: Number(missing.toFixed(1)),
          unit: req.unit
        });
      }
    });

    // Keep manual items
    const manual_items = shopping_items.filter(item => item.manual);

    const supabase = get_supabase_client();
    const userId = user?.id;
    if (supabase && (profile?.active_family_id || userId)) {
      try {
        // Delete auto-calculated items
        let deleteQuery = supabase.from('shopping_list').delete().eq('manual', false);
        if (profile?.active_family_id) {
          deleteQuery = deleteQuery.eq('family_id', profile.active_family_id);
        } else {
          deleteQuery = deleteQuery.eq('user_id', userId).is('family_id', null);
        }
        await deleteQuery;

        const inserts = needed_items.map(item => {
          const row: any = {
            ingredient_name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            purchased: false,
            manual: false
          };
          if (profile?.active_family_id) {
            row.family_id = profile.active_family_id;
          } else {
            row.user_id = userId;
          }
          return row;
        });

        if (inserts.length > 0) {
          const { data, error } = await supabase
            .from('shopping_list')
            .insert(inserts)
            .select();

          if (!error && data) {
            const mappedDb = data.map((item: any) => ({
              id: item.id,
              ingredient_name: item.ingredient_name,
              quantity: Number(item.quantity),
              unit: item.unit,
              purchased: item.purchased,
              manual: false
            }));
            set_shopping_items([...manual_items, ...mappedDb]);
          }
        } else {
          set_shopping_items(manual_items);
        }

        // Notify the whole family that the shopping list was updated
        if (profile?.active_family_id) {
          await notify_all_family_members(
            profile.active_family_id,
            'Lista de Compra Actualizada 🛒',
            'Se ha recalculado la lista de la compra según el menú actual.'
          );
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Local fallback
      const mappedLocal = needed_items.map((item, idx) => ({
        id: idx + 1000,
        ingredient_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        purchased: false,
        manual: false
      }));
      set_shopping_items([...manual_items, ...mappedLocal]);
    }

    trigger_push("Lista recalculada 🛒", "Se han calculado los ingredientes faltantes según tu plan.");
  };

  const handle_toggle_purchase = async (index: number): Promise<void> => {
    const item = shopping_items[index];
    if (!item) return;

    const new_purchased = !item.purchased;

    const supabase = get_supabase_client();
    if (supabase && profile?.active_family_id) {

      try {
        const { error } = await supabase
          .from('shopping_list')
          .update({ purchased: new_purchased })
          .eq('id', item.id);

        if (!error) {
          set_shopping_items(prev => prev.map((it, idx) => 
            idx === index ? { ...it, purchased: new_purchased } : it
          ));
          if (new_purchased) {
            await handle_add_pantry(item.ingredient_name, item.quantity, item.unit);
            if (profile?.active_family_id) {
              await notify_all_family_members(
                profile.active_family_id,
                'Artículo Comprado 🛒',
                `Se ha comprado "${item.ingredient_name}" (${item.quantity} ${item.unit}) y se ha añadido a la despensa.`
              );
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      set_shopping_items(prev => prev.map((it, idx) => 
        idx === index ? { ...it, purchased: new_purchased } : it
      ));
      if (new_purchased) {
        await handle_add_pantry(item.ingredient_name, item.quantity, item.unit);
      }
    }
  };

  const handle_add_custom_shopping_item = async (
    name: string,
    quantity: number,
    unit: string
  ): Promise<void> => {
    if (!name.trim()) return;

    const supabase = get_supabase_client();
    const userId = user?.id;
    if (supabase && (profile?.active_family_id || userId)) {
      try {
        const insertRow: any = {
          ingredient_name: name.trim(),
          quantity,
          unit,
          purchased: false,
          manual: true
        };
        if (profile?.active_family_id) {
          insertRow.family_id = profile.active_family_id;
        } else {
          insertRow.user_id = userId;
        }

        const { data, error } = await supabase
          .from('shopping_list')
          .insert([insertRow])
          .select()
          .single();

        if (!error && data) {
          set_shopping_items(prev => [...prev, {
            id: data.id,
            ingredient_name: data.ingredient_name,
            quantity: Number(data.quantity),
            unit: data.unit,
            purchased: data.purchased,
            manual: true
          }]);
          trigger_push('Añadido a la lista 📝', `${name} se ha añadido a tu lista de compra.`);
          // Notify the rest of the family
          if (profile?.active_family_id) {
            await notify_all_family_members(
              profile.active_family_id,
              'Nuevo Artículo en la Compra 🛒',
              `Se ha añadido "${name}" a la lista de la compra familiar.`
            );
          }
        } else if (error) {
          // fallback if manual column doesn't exist
          const fallbackRow: any = {
            ingredient_name: name.trim(),
            quantity,
            unit,
            purchased: false
          };
          if (profile?.active_family_id) {
            fallbackRow.family_id = profile.active_family_id;
          } else {
            fallbackRow.user_id = userId;
          }

          const { data: fallbackData, error: fallbackError } = await supabase
            .from('shopping_list')
            .insert([fallbackRow])
            .select()
            .single();

          if (!fallbackError && fallbackData) {
            set_shopping_items(prev => [...prev, {
              id: fallbackData.id,
              ingredient_name: fallbackData.ingredient_name,
              quantity: Number(fallbackData.quantity),
              unit: fallbackData.unit,
              purchased: fallbackData.purchased,
              manual: true
            }]);
            trigger_push("Añadido a la lista 📝", `${name} se ha añadido a tu lista de compra.`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Local fallback
      set_shopping_items(prev => [...prev, {
        id: Date.now(),
        ingredient_name: name.trim(),
        quantity,
        unit,
        purchased: false,
        manual: true
      }]);
      trigger_push("Añadido a la lista 📝", `${name} se ha añadido localmente.`);
    }
  };

  const load_shopping_data = async (familyId: string | null, userId?: string | null): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      let query = supabase.from('shopping_list').select('*');
      if (familyId) {
        query = query.eq('family_id', familyId);
      } else if (userId) {
        query = query.eq('user_id', userId).is('family_id', null);
      } else {
        return;
      }

      const { data, error } = await query;

      if (!error && data) {
        set_shopping_items(data.map((item: any) => ({
          id: item.id,
          ingredient_name: item.ingredient_name,
          quantity: Number(item.quantity),
          unit: item.unit,
          purchased: item.purchased,
          manual: item.manual ?? false
        })));
      }
    } catch (err) {
      console.error('Error loading shopping list:', err);
    }
  };

  return {
    handle_recalculate_shopping,
    handle_toggle_purchase,
    handle_add_custom_shopping_item,
    load_shopping_data
  };
};
