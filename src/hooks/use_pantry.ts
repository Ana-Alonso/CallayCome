import type { PantryItem, Recipe, Profile } from '../types';
import { get_supabase_client } from '../services/supabase_client';

interface UsePantryParams {
  pantry_items: PantryItem[];
  set_pantry_items: React.Dispatch<React.SetStateAction<PantryItem[]>>;
  profile: Profile | null;
  supabase_connected: boolean;
  trigger_push: (title: string, message: string) => void;
}

export const use_pantry = ({
  pantry_items,
  set_pantry_items,
  profile,
  supabase_connected,
  trigger_push
}: UsePantryParams) => {

  const handle_add_pantry = async (name: string, qty: number, unit: string): Promise<void> => {
    if (!name.trim()) return;

    const existing_index = pantry_items.findIndex(
      item => item.ingredient_name.toLowerCase() === name.trim().toLowerCase()
    );

    if (supabase_connected && profile?.active_family_id) {
      const supabase = get_supabase_client();
      if (!supabase) return;

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
          const { data, error } = await supabase
            .from('pantry')
            .insert([{
              family_id: profile.active_family_id,
              ingredient_name: name.trim(),
              quantity: qty,
              unit
            }])
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
    if (supabase_connected && profile?.active_family_id) {
      const supabase = get_supabase_client();
      if (!supabase) return;

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

  const load_pantry_data = async (familyId: string): Promise<void> => {
    if (!supabase_connected) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('pantry')
        .select('*')
        .eq('family_id', familyId);

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
    get_pantry_match_info,
    load_pantry_data
  };
};
