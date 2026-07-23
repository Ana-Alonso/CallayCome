import { useState, useEffect, useCallback } from 'react';
import type { IngredientMapping, Profile, Recipe } from '../types';
import { get_supabase_client } from '../services/supabase_client';
import type { User } from '@supabase/supabase-js';
import { calculate_ingredient_cost } from '../utils/product_parser';

interface UseIngredientMappingsParams {
  profile: Profile | null;
  user: User | null;
  trigger_push: (title: string, message: string) => void;
}

export const useIngredientMappings = ({
  profile,
  user,
  trigger_push
}: UseIngredientMappingsParams) => {
  const [mappings, set_mappings] = useState<Record<string, IngredientMapping>>({});

  const load_mappings = useCallback(async (): Promise<void> => {
    const supabase = get_supabase_client();
    const userId = user?.id;
    
    if (supabase && (profile?.active_family_id || userId)) {
      try {
        let query = supabase.from('ingredient_mappings').select('*');
        if (profile?.active_family_id) {
          query = query.eq('family_id', profile.active_family_id);
        } else {
          query = query.eq('user_id', userId).is('family_id', null);
        }
        
        const { data, error } = await query;
        if (!error && data) {
          const mapRecord: Record<string, IngredientMapping> = {};
          data.forEach((row: any) => {
            const key = row.ingredient_name.toLowerCase().trim();
            mapRecord[key] = {
              id: row.id,
              ingredient_name: row.ingredient_name,
              product_name: row.product_name,
              price: Number(row.price),
              package_qty: Number(row.package_qty),
              package_unit: row.package_unit,
              supermarket_id: row.supermarket_id,
              reference_id: row.reference_id
            };
          });
          set_mappings(mapRecord);
          // Sync cache locally
          localStorage.setItem('local_ingredient_mappings', JSON.stringify(mapRecord));
        } else {
          console.warn('Error loading ingredient mappings from Supabase, loading from cache:', error?.message);
          load_local_mappings();
        }
      } catch (err) {
        console.error('Catch error loading mappings:', err);
        load_local_mappings();
      }
    } else {
      load_local_mappings();
    }
  }, [profile?.active_family_id, user?.id]);

  const load_local_mappings = () => {
    const local = localStorage.getItem('local_ingredient_mappings');
    if (local) {
      try {
        set_mappings(JSON.parse(local));
      } catch (e) {
        set_mappings({});
      }
    } else {
      set_mappings({});
    }
  };

  useEffect(() => {
    load_mappings();
  }, [load_mappings]);

  const handle_save_mapping = async (
    mapping: Omit<IngredientMapping, 'id'>
  ): Promise<void> => {
    const key = mapping.ingredient_name.toLowerCase().trim();
    const supabase = get_supabase_client();
    const userId = user?.id;

    const existingId = mappings[key]?.id;

    if (supabase && (profile?.active_family_id || userId)) {
      try {
        const payload: any = {
          ingredient_name: mapping.ingredient_name.trim(),
          product_name: mapping.product_name.trim(),
          price: mapping.price,
          package_qty: mapping.package_qty,
          package_unit: mapping.package_unit,
          supermarket_id: mapping.supermarket_id,
          reference_id: mapping.reference_id || null
        };

        if (profile?.active_family_id) {
          payload.family_id = profile.active_family_id;
        } else {
          payload.user_id = userId;
        }

        let result;
        if (existingId) {
          // Update
          result = await supabase
            .from('ingredient_mappings')
            .update(payload)
            .eq('id', existingId)
            .select()
            .single();
        } else {
          // Insert
          // Check for conflicts to be safe
          let selectQuery = supabase.from('ingredient_mappings').select('id');
          if (profile?.active_family_id) {
            selectQuery = selectQuery.eq('family_id', profile.active_family_id).eq('ingredient_name', payload.ingredient_name);
          } else {
            selectQuery = selectQuery.eq('user_id', userId).is('family_id', null).eq('ingredient_name', payload.ingredient_name);
          }
          const { data: conflictData } = await selectQuery;
          if (conflictData && conflictData.length > 0) {
            result = await supabase
              .from('ingredient_mappings')
              .update(payload)
              .eq('id', conflictData[0].id)
              .select()
              .single();
          } else {
            result = await supabase
              .from('ingredient_mappings')
              .insert([payload])
              .select()
              .single();
          }
        }

        const { data, error } = result;

        if (!error && data) {
          const newMapping: IngredientMapping = {
            id: data.id,
            ingredient_name: data.ingredient_name,
            product_name: data.product_name,
            price: Number(data.price),
            package_qty: Number(data.package_qty),
            package_unit: data.package_unit,
            supermarket_id: data.supermarket_id,
            reference_id: data.reference_id
          };
          
          set_mappings(prev => {
            const next = { ...prev, [key]: newMapping };
            localStorage.setItem('local_ingredient_mappings', JSON.stringify(next));
            return next;
          });
          trigger_push('Ingrediente Mapeado 🛒', `Precios unificados para: ${mapping.ingredient_name}`);
        } else {
          console.error('Error saving mapping to Supabase:', error?.message);
          save_local_mapping(mapping);
        }
      } catch (err: any) {
        console.error('Catch saving mapping:', err);
        save_local_mapping(mapping);
      }
    } else {
      save_local_mapping(mapping);
    }
  };

  const save_local_mapping = (mapping: Omit<IngredientMapping, 'id'>) => {
    const key = mapping.ingredient_name.toLowerCase().trim();
    const newMapping: IngredientMapping = {
      id: mappings[key]?.id || Date.now(),
      ...mapping
    };
    set_mappings(prev => {
      const next = { ...prev, [key]: newMapping };
      localStorage.setItem('local_ingredient_mappings', JSON.stringify(next));
      return next;
    });
    trigger_push('Ingrediente Guardado 🛒', `${mapping.ingredient_name} guardado localmente.`);
  };

  const handle_delete_mapping = async (ingredientName: string): Promise<void> => {
    const key = ingredientName.toLowerCase().trim();
    const existing = mappings[key];
    if (!existing) return;

    const supabase = get_supabase_client();
    if (supabase && existing.id) {
      try {
        const { error } = await supabase
          .from('ingredient_mappings')
          .delete()
          .eq('id', existing.id);

        if (!error) {
          set_mappings(prev => {
            const next = { ...prev };
            delete next[key];
            localStorage.setItem('local_ingredient_mappings', JSON.stringify(next));
            return next;
          });
          trigger_push('Mapeo Eliminado 🗑️', `Se ha desvinculado el ingrediente: ${ingredientName}`);
        } else {
          console.error('Error deleting mapping from Supabase:', error.message);
          delete_local_mapping(key);
        }
      } catch (err) {
        console.error('Catch deleting mapping:', err);
        delete_local_mapping(key);
      }
    } else {
      delete_local_mapping(key);
    }
  };

  const delete_local_mapping = (key: string) => {
    set_mappings(prev => {
      const next = { ...prev };
      delete next[key];
      localStorage.setItem('local_ingredient_mappings', JSON.stringify(next));
      return next;
    });
  };

  /**
   * Helper to calculate the total cost of a recipe based on mappings.
   */
  const calculate_recipe_cost = useCallback((recipe: Recipe, _preferredSupermarket?: string): number => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return 0;
    
    let total = 0;
    recipe.ingredients.forEach(ing => {
      const key = ing.name.toLowerCase().trim();
      const mapping = mappings[key];
      if (mapping) {
        total += calculate_ingredient_cost(
          ing.quantity,
          ing.unit,
          ing.name,
          mapping.package_qty,
          mapping.package_unit,
          mapping.price
        );
      } else {
        // Fallback: estimate 0.30€ for cheap price type, 1.20€ for normal/cara
        const fallbackPrice = recipe.price === 'economica' ? 0.30 : 1.20;
        total += fallbackPrice;
      }
    });

    return Number(total.toFixed(2));
  }, [mappings]);

  return {
    mappings,
    load_mappings,
    handle_save_mapping,
    handle_delete_mapping,
    calculate_recipe_cost
  };
};
