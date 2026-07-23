import type { PantryItem, Recipe, Profile } from '../types';
import { get_supabase_client } from '../services/supabase_client';
import type { User } from '@supabase/supabase-js';

interface UsePantryParams {
  pantry_items: PantryItem[];
  set_pantry_items: React.Dispatch<React.SetStateAction<PantryItem[]>>;
  profile: Profile | null;
  trigger_push: (title: string, message: string) => void;
  user: User | null;
}

export const usePantry = ({
  pantry_items,
  set_pantry_items,
  profile,
  trigger_push,
  user
}: UsePantryParams) => {

  const handle_add_pantry = async (name: string, qty: number, unit: string): Promise<void> => {
    if (!name.trim()) return;

    const existing_index = pantry_items.findIndex(
      item => item.ingredient_name.toLowerCase() === name.trim().toLowerCase()
    );

    const supabase = get_supabase_client();
    const userId = user?.id;
    if (supabase && (profile?.active_family_id || userId)) {
      try {
        if (existing_index !== -1) {
          const item = pantry_items[existing_index];
          const new_qty = item.quantity + qty;
          const { error } = await supabase
            .from('pantry')
            .update({ quantity: new_qty, unit })
            .eq('id', item.id);

          if (!error) {
            set_pantry_items(prev => prev.map((it, idx) => 
              idx === existing_index ? { ...it, quantity: new_qty, unit } : it
            ));
            trigger_push("Despensa actualizada 🍎", `Se ha sumado la cantidad a: ${name}`);
          }
        } else {
          const insertRow: any = {
            ingredient_name: name.trim(),
            quantity: qty,
            unit
          };
          if (profile?.active_family_id) {
            insertRow.family_id = profile.active_family_id;
          } else {
            insertRow.user_id = userId;
          }

          const { data, error } = await supabase
            .from('pantry')
            .insert([insertRow])
            .select()
            .single();

          if (!error && data) {
            set_pantry_items(prev => [...prev, {
              id: data.id,
              ingredient_name: data.ingredient_name,
              quantity: Number(data.quantity),
              unit: data.unit
            }]);
            trigger_push("Añadido a la despensa 🍏", `${name} se ha añadido correctamente.`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Local fallback
      if (existing_index !== -1) {
        set_pantry_items(prev => prev.map((it, idx) => 
          idx === existing_index ? { ...it, quantity: it.quantity + qty, unit } : it
        ));
      } else {
        set_pantry_items(prev => [...prev, {
          id: Date.now(),
          ingredient_name: name.trim(),
          quantity: qty,
          unit
        }]);
      }
      trigger_push("Añadido a la despensa 🍏", `${name} se ha añadido localmente.`);
    }
  };

  const handle_delete_pantry_item = async (itemId: number): Promise<void> => {
    const supabase = get_supabase_client();
    const userId = user?.id;
    if (supabase && (profile?.active_family_id || userId)) {
      try {
        const { error } = await supabase.from('pantry').delete().eq('id', itemId);
        if (!error) {
          set_pantry_items(prev => prev.filter(item => item.id !== itemId));
          trigger_push("Eliminado de la despensa 🗑️", "El ingrediente ha sido eliminado.");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      set_pantry_items(prev => prev.filter(item => item.id !== itemId));
      trigger_push("Eliminado de la despensa 🗑️", "El ingrediente ha sido eliminado localmente.");
    }
  };

  const handle_update_pantry_qty = async (itemId: number, newQty: number): Promise<void> => {
    if (newQty <= 0) {
      await handle_delete_pantry_item(itemId);
      return;
    }

    const supabase = get_supabase_client();
    const userId = user?.id;
    if (supabase && (profile?.active_family_id || userId)) {
      try {
        const { error } = await supabase
          .from('pantry')
          .update({ quantity: newQty })
          .eq('id', itemId);
        if (!error) {
          set_pantry_items(prev => prev.map(item => 
            item.id === itemId ? { ...item, quantity: newQty } : item
          ));
          trigger_push("Despensa actualizada 🍎", "La cantidad del ingrediente ha sido modificada.");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      set_pantry_items(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQty } : item
      ));
      trigger_push("Despensa actualizada 🍎", "La cantidad ha sido modificada localmente.");
    }
  };

  const get_pantry_match_info = (recipe: Recipe): { matches: number; total: number; pct: number } => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return { matches: 0, total: 0, pct: 0 };
    }

    let matches = 0;
    recipe.ingredients.forEach(req => {
      const matched = pantry_items.find(
        p => p.ingredient_name.toLowerCase() === req.name.toLowerCase() && p.quantity >= req.quantity
      );
      if (matched) {
        matches++;
      }
    });

    const pct = Math.round((matches / recipe.ingredients.length) * 100);
    return { matches, total: recipe.ingredients.length, pct };
  };

  const load_pantry_data = async (familyId: string | null, userId?: string | null): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      let query = supabase.from('pantry').select('*');
      if (familyId) {
        query = query.eq('family_id', familyId);
      } else if (userId) {
        query = query.eq('user_id', userId).is('family_id', null);
      } else {
        return;
      }

      const { data, error } = await query;

      if (!error && data) {
        set_pantry_items(data.map((item: any) => ({
          id: item.id,
          ingredient_name: item.ingredient_name,
          quantity: Number(item.quantity),
          unit: item.unit
        })));
      }
    } catch (err) {
      console.error('Error loading pantry:', err);
    }
  };

  return {
    handle_add_pantry,
    handle_delete_pantry_item,
    handle_update_pantry_qty,
    get_pantry_match_info,
    load_pantry_data
  };
};
