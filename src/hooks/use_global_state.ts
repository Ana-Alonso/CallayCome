import { useState, useEffect, useRef } from 'react';
import type { 
  PantryItem, 
  ShoppingItem, 
  MealPlanDay, 
  ToastMessage,
  Profile,
  FamilyMember,
  RecipeSuggestion,
  CookRecipeConfig
} from '../types';
import type { User } from '@supabase/supabase-js';
import { 
  get_supabase_client, 
  is_supabase_configured 
} from '../services/supabase_client';
import { NotificationService } from '../services/notification';

import { use_auth } from './use_auth';
import { use_recipes } from './use_recipes';
import { use_pantry } from './use_pantry';
import { use_shopping } from './use_shopping';
import { use_planner } from './use_planner';
import { use_family } from './use_family';
import { use_suggestions } from './use_suggestions';
import { create_empty_day_plan, normalize_day_plan } from '../utils/planner_helpers';

type MealType = 'desayuno' | 'comida' | 'cena';

export const use_global_state = () => {
  // --- Master State variables (State Lifting) ---
  const [active_tab, set_active_tab] = useState<'plan' | 'despensa' | 'compra' | 'recetas' | 'familia'>('plan');
  const [pantry_items, set_pantry_items] = useState<PantryItem[]>([]);
  const [shopping_items, set_shopping_items] = useState<ShoppingItem[]>([]);
  const [meal_plan, set_meal_plan] = useState<MealPlanDay[]>([]);
  const [toast_messages, set_toast_messages] = useState<ToastMessage[]>([]);
  const [supabase_connected, set_supabase_connected] = useState<boolean>(false);

  const [user, set_user] = useState<User | null>(null);
  const [profile, set_profile] = useState<Profile | null>(null);
  const [my_families, set_my_families] = useState<FamilyMember[]>([]);
  const [suggestions, set_suggestions] = useState<RecipeSuggestion[]>([]);
  const [auth_loading, set_auth_loading] = useState<boolean>(true);
  const [assigning_meal, set_assigning_meal] = useState<{ day: number; type: MealType; slot_index: number } | null>(null);
  const [start_date, set_start_date] = useState<string | null>(null);

  // Live refs — always point to the latest state even inside stale closures
  const meal_plan_ref = useRef<MealPlanDay[]>(meal_plan);
  const pantry_items_ref = useRef<PantryItem[]>(pantry_items);
  const recipes_ref = useRef<any[]>([]);

  useEffect(() => { meal_plan_ref.current = meal_plan; }, [meal_plan]);
  useEffect(() => { pantry_items_ref.current = pantry_items; }, [pantry_items]);

  // --- Common Helper Functions ---
  const trigger_push = (title: string, message: string): void => {
    NotificationService.send_notification(title, message);
  };

  // --- Local Storage fallback sync loaders ---
  const load_local_data = (): void => {
    const local_pantry = localStorage.getItem('local_pantry');
    const local_shopping = localStorage.getItem('local_shopping');
    const local_plan = localStorage.getItem('local_plan');
    const local_start_date = localStorage.getItem('calla_y_come_start_date');
    set_start_date(local_start_date || null);

    if (local_pantry) {
      set_pantry_items(JSON.parse(local_pantry));
    } else {
      set_pantry_items([]);
    }
    if (local_shopping) {
      set_shopping_items(JSON.parse(local_shopping));
    } else {
      set_shopping_items([]);
    }
    if (local_plan) {
      try {
        const parsed = JSON.parse(local_plan);
        if (Array.isArray(parsed)) {
          const normalized = Array.from({ length: 30 }, (_, i) => {
            const dayNum = i + 1;
            const found = parsed.find((p: any) => p?.day === dayNum);
            return normalize_day_plan(found, dayNum);
          });
          set_meal_plan(normalized);
        } else {
          set_meal_plan(Array.from({ length: 30 }, (_, i) => create_empty_day_plan(i + 1)));
        }
      } catch {
        set_meal_plan(Array.from({ length: 30 }, (_, i) => create_empty_day_plan(i + 1)));
      }
    } else {
      const empty_plan: MealPlanDay[] = Array.from({ length: 30 }, (_, i) => create_empty_day_plan(i + 1));
      set_meal_plan(empty_plan);
    }
  };

  const load_family_data = async (familyId: string): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      let family_exists: any = null;
      let start_date_val: string | null = null;

      const { data: dataWithDate, error: errorWithDate } = await supabase
        .from('family_units')
        .select('id, start_date')
        .eq('id', familyId)
        .single();

      if (errorWithDate) {
        const { data: dataJustId } = await supabase
          .from('family_units')
          .select('id')
          .eq('id', familyId)
          .single();
        if (dataJustId) {
          family_exists = dataJustId;
        }
      } else {
        family_exists = dataWithDate;
        start_date_val = dataWithDate?.start_date || null;
      }

      if (!family_exists) {
        trigger_push(
          "Unidad Familiar Disuelta",
          "La unidad familiar ya no existe. Es posible que 'El Cocinitas' haya eliminado su cuenta."
        );
        if (user) {
          await auth.load_user_profile(user.id);
        } else {
          load_local_data();
        }
        return;
      }

      if (start_date_val) {
        set_start_date(start_date_val);
      } else {
        const local_start_date = localStorage.getItem('calla_y_come_start_date');
        set_start_date(local_start_date || null);
      }

      // Delegate queries to sub-hooks in parallel
      await Promise.all([
        pantry.load_pantry_data(familyId),
        shopping.load_shopping_data(familyId),
        planner.load_planner_data(familyId),
        suggestions_handler.load_suggestions_data(familyId, user?.id)
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Sub-hooks Instantiations ---
  const auth = use_auth({
    set_profile,
    set_my_families,
    trigger_push,
    load_family_data,
    load_local_data
  });

  const recipes_handler = use_recipes({
    supabase_connected,
    trigger_push
  });

  // Keep recipes ref in sync
  useEffect(() => { recipes_ref.current = recipes_handler.recipes; }, [recipes_handler.recipes]);

  const pantry = use_pantry({
    pantry_items,
    set_pantry_items,
    profile,
    supabase_connected,
    trigger_push
  });

  const shopping = use_shopping({
    shopping_items,
    set_shopping_items,
    profile,
    user_id: user?.id ?? null,
    supabase_connected,
    trigger_push
  });

  const planner = use_planner({
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
    get_pantry_match_info: pantry.get_pantry_match_info,
    get_filtered_recipes: recipes_handler.get_filtered_recipes
  });

  const family = use_family({
    user,
    my_families,
    trigger_push,
    load_user_profile: auth.load_user_profile
  });

  const suggestions_handler = use_suggestions({
    user,
    profile,
    trigger_push,
    load_family_data,
    set_suggestions,
    recipes: recipes_handler.recipes
  });

  // --- Sync Effects ---
  useEffect(() => {
    NotificationService.request_permission();

    const handle_notification = (e: Event): void => {
      const custom_event = e as CustomEvent<{ title: string; body: string }>;
      const new_toast: ToastMessage = {
        id: Date.now() + Math.random(),
        title: custom_event.detail.title,
        body: custom_event.detail.body
      };
      set_toast_messages(prev => [...prev, new_toast]);
      setTimeout(() => {
        set_toast_messages(prev => prev.filter(t => t.id !== new_toast.id));
      }, 4000);
    };

    window.addEventListener('in-app-notification', handle_notification);
    return () => window.removeEventListener('in-app-notification', handle_notification);
  }, []);

  useEffect(() => {
    if (!profile?.active_family_id) {
      localStorage.setItem('local_pantry', JSON.stringify(pantry_items));
    }
  }, [pantry_items, profile?.active_family_id]);

  useEffect(() => {
    if (!profile?.active_family_id) {
      localStorage.setItem('local_shopping', JSON.stringify(shopping_items));
    }
  }, [shopping_items, profile?.active_family_id]);

  useEffect(() => {
    if (!profile?.active_family_id) {
      localStorage.setItem('local_plan', JSON.stringify(meal_plan));
    }
  }, [meal_plan, profile?.active_family_id]);

  useEffect(() => {
    const is_configured = is_supabase_configured();
    set_supabase_connected(is_configured);

    if (!is_configured) {
      load_local_data();
      set_auth_loading(false);
      return;
    }

    recipes_handler.load_recipes();

    const supabase = get_supabase_client();
    if (!supabase) {
      load_local_data();
      set_auth_loading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        set_user(session.user);
        auth.load_user_profile(session.user.id).finally(() => {
          set_auth_loading(false);
        });
      } else {
        load_local_data();
        set_auth_loading(false);
      }
    }).catch(() => {
      load_local_data();
      set_auth_loading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        set_user(session.user);
        auth.load_user_profile(session.user.id);
      } else {
        set_user(null);
        set_profile(null);
        set_my_families([]);
        set_suggestions([]);
        load_local_data();
        set_auth_loading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase_connected || !user || !profile?.active_family_id) {
      return;
    }

    const supabase = get_supabase_client();
    if (!supabase) return;

    // 1. Canal de notificaciones en tiempo real para el usuario actual
    const notifications_channel = supabase
      .channel(`notif_${user.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_notifications',
          filter: `recipient_user_id=eq.${user.id}`
        },
        (payload: any) => {
          const new_notif = payload.new;
          if (new_notif) {
            trigger_push(new_notif.title, new_notif.body);
          }
        }
      )
      .subscribe();

    // 2. Canal de recarga en tiempo real para datos de la familia activa (Hot Reload)
    const family_data_channel = supabase
      .channel(`family_${profile.active_family_id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_plans',
          filter: `family_id=eq.${profile.active_family_id}`
        },
        () => {
          load_family_data(profile.active_family_id!);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipe_suggestions',
          filter: `family_id=eq.${profile.active_family_id}`
        },
        () => {
          load_family_data(profile.active_family_id!);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipe_suggestion_votes'
        },
        () => {
          load_family_data(profile.active_family_id!);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'family_units',
          filter: `id=eq.${profile.active_family_id}`
        },
        () => {
          load_family_data(profile.active_family_id!);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pantry',
          filter: `family_id=eq.${profile.active_family_id}`
        },
        () => {
          load_family_data(profile.active_family_id!);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list',
          filter: `family_id=eq.${profile.active_family_id}`
        },
        () => {
          load_family_data(profile.active_family_id!);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifications_channel);
      supabase.removeChannel(family_data_channel);
    };
  }, [supabase_connected, user?.id, profile?.active_family_id]);

  const get_current_role = (): 'cocinitas' | 'miembro' | null => {
    if (!profile?.active_family_id) return null;
    const membership = my_families.find(f => f.family_id === profile.active_family_id);
    return membership ? membership.role : null;
  };

  const handle_open_assign_meal = (day: number, type: MealType, slot_index: number): void => {
    set_assigning_meal({ day, type, slot_index });
  };

  const handle_assign_recipe = async (recipe_id: number): Promise<void> => {
    if (!assigning_meal) return;
    const { day, type, slot_index } = assigning_meal;
    const role = get_current_role();
    if (profile?.active_family_id && role === 'miembro') {
      await suggestions_handler.handle_suggest_recipe(day, type, recipe_id);
      set_assigning_meal(null);
      return;
    }
    await planner.handle_assign_recipe(day, type, slot_index, recipe_id);
    set_assigning_meal(null);
  };

  return {
    active_tab,
    set_active_tab,
    recipes: recipes_handler.recipes,
    pantry_items,
    shopping_items,
    meal_plan,
    toast_messages,
    user,
    profile,
    my_families,
    suggestions,
    current_role: get_current_role(),
    auth_loading,
    is_filter_modal_open: recipes_handler.is_filter_modal_open,
    set_is_filter_modal_open: recipes_handler.set_is_filter_modal_open,
    active_filters: recipes_handler.active_filters,
    set_filters: recipes_handler.set_filters,
    assigning_meal,
    set_assigning_meal,
    recipe_search: recipes_handler.recipe_search,
    set_recipe_search: recipes_handler.set_recipe_search,
    trigger_push,
    get_pantry_match_info: pantry.get_pantry_match_info,
    handle_auto_generate_plan: () => planner.handle_auto_generate_plan(recipes_handler.recipes),
    handle_recalculate_shopping: () => shopping.handle_recalculate_shopping(
      meal_plan_ref.current,
      recipes_ref.current,
      pantry_items_ref.current
    ),
    handle_clear_plan: planner.handle_clear_plan,
    handle_add_pantry: pantry.handle_add_pantry,
    handle_delete_pantry_item: pantry.handle_delete_pantry_item,
    handle_toggle_purchase: shopping.handle_toggle_purchase,
    toggle_allergy: recipes_handler.toggle_allergy,
    toggle_diet: recipes_handler.toggle_diet,
    handle_open_assign_meal,
    handle_add_meal_slot: planner.handle_add_meal_slot,
    handle_remove_meal_slot: planner.handle_remove_meal_slot,
    handle_move_meal_slot: planner.handle_move_meal_slot,
    handle_assign_recipe,
    handle_remove_assigned_recipe: planner.handle_remove_assigned_recipe,
    get_selectable_recipes: () => recipes_handler.get_selectable_recipes(assigning_meal, pantry.get_pantry_match_info),
    handle_add_recipe: recipes_handler.handle_add_recipe,
    handle_login: auth.handle_login,
    handle_signup: auth.handle_signup,
    handle_logout: auth.handle_logout,
    handle_create_family: family.handle_create_family,
    handle_join_family: async (inviteCode: string) => { await family.handle_join_family(inviteCode); },
    handle_switch_family: family.handle_switch_family,
    handle_leave_family: family.handle_leave_family,
    handle_transfer_role: family.handle_transfer_role,
    get_family_members: family.get_family_members,
    get_family_complaints: family.get_family_complaints,
    handle_approve_suggestion: suggestions_handler.handle_approve_suggestion,
    handle_reject_suggestion: suggestions_handler.handle_reject_suggestion,
    handle_suggest_recipe: (day: number, type: MealType, recipeId: number) => suggestions_handler.handle_suggest_recipe(day, type, recipeId),
    handle_vote_suggestion: suggestions_handler.handle_vote_suggestion,
    start_date,
    handle_change_start_date: planner.handle_change_start_date,
    handle_cook_day: (day: number, configs: CookRecipeConfig[]) => planner.handle_cook_day(day, configs, recipes_ref.current),
    get_panic_recipe: planner.get_panic_recipe,
    get_nfc_payload: () => planner.get_nfc_payload(recipes_handler.recipes),
    handle_add_custom_shopping_item: shopping.handle_add_custom_shopping_item
  };
};
