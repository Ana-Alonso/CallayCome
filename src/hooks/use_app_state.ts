import { useState, useEffect } from 'react';
import type { 
  Recipe, 
  PantryItem, 
  ShoppingItem, 
  MealPlanDay, 
  FilterState, 
  ToastMessage,
  Profile,
  FamilyUnit,
  FamilyMember,
  RecipeSuggestion
} from '../types';
import type { User } from '@supabase/supabase-js';
import local_recipes from '../recipesData.json';
import { 
  get_supabase_client, 
  is_supabase_configured 
} from '../services/supabase_client';
import { NotificationService } from '../services/notification';

export const use_app_state = () => {
  const [active_tab, set_active_tab] = useState<'plan' | 'despensa' | 'compra' | 'recetas' | 'familia'>('plan');
  const [recipes, set_recipes] = useState<Recipe[]>(local_recipes as Recipe[]);
  const [pantry_items, set_pantry_items] = useState<PantryItem[]>([]);
  const [shopping_items, set_shopping_items] = useState<ShoppingItem[]>([]);
  const [meal_plan, set_meal_plan] = useState<MealPlanDay[]>([]);
  const [toast_messages, set_toast_messages] = useState<ToastMessage[]>([]);
  const [supabase_connected, set_supabase_connected] = useState<boolean>(false);

  const [user, set_user] = useState<User | null>(null);
  const [profile, set_profile] = useState<Profile | null>(null);
  const [my_families, set_my_families] = useState<FamilyMember[]>([]);
  const [suggestions, set_suggestions] = useState<RecipeSuggestion[]>([]);
  
  const [is_filter_modal_open, set_is_filter_modal_open] = useState<boolean>(false);
  const [active_filters, set_filters] = useState<FilterState>({
    ingredients_count: 'all',
    allergies: [],
    diets: [],
    price: 'all',
    difficulty: 'all',
    health: 'all'
  });

  const [assigning_meal, set_assigning_meal] = useState<{ day: number; type: 'desayuno' | 'comida' | 'cena' } | null>(null);
  const [recipe_search, set_recipe_search] = useState<string>('');

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

    return () => {
      window.removeEventListener('in-app-notification', handle_notification);
    };
  }, []);

  const load_local_data = (): void => {
    const local_pantry = localStorage.getItem('local_pantry');
    const local_shopping = localStorage.getItem('local_shopping');
    const local_plan = localStorage.getItem('local_plan');

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
      set_meal_plan(JSON.parse(local_plan));
    } else {
      const empty_plan: MealPlanDay[] = Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        desayuno: null,
        comida: null,
        cena: null
      }));
      set_meal_plan(empty_plan);
    }
  };

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

  const load_recipes = async (): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) {
      set_recipes(local_recipes as Recipe[]);
      return;
    }
    try {
      const { data: db_recipes, error } = await supabase.from('recipes').select('*');
      if (!error && db_recipes) {
        if (db_recipes.length === 0) {
          for (const r of local_recipes) {
            await supabase.from('recipes').insert([{ recipe_data: r }]);
          }
          const { data: refreshed } = await supabase.from('recipes').select('*');
          if (refreshed) {
            set_recipes(refreshed.map((row: any) => ({ id: row.id, ...row.recipe_data })));
          }
        } else {
          set_recipes(db_recipes.map((row: any) => ({ id: row.id, ...row.recipe_data })));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const load_user_profile = async (userId: string): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (prof) {
        set_profile(prof as Profile);
        await load_user_families(userId);
        if (prof.active_family_id) {
          await load_family_data(prof.active_family_id);
        } else {
          load_local_data();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const load_user_families = async (userId: string): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const { data: memberships } = await supabase
        .from('family_members')
        .select(`
          family_id,
          user_id,
          role,
          family_units (
            name,
            invite_code
          )
        `)
        .eq('user_id', userId);

      if (memberships) {
        const mapped = memberships.map((m: any) => ({
          family_id: m.family_id,
          user_id: m.user_id,
          role: m.role as 'cocinitas' | 'miembro',
          family_name: m.family_units?.name || 'Familia',
          invite_code: m.family_units?.invite_code || ''
        }));
        set_my_families(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const load_family_data = async (familyId: string): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const { data: pItems } = await supabase
        .from('pantry')
        .select('*')
        .eq('family_id', familyId);
      if (pItems) {
        set_pantry_items(pItems.map(item => ({
          id: item.id,
          ingredient_name: item.ingredient_name,
          quantity: Number(item.quantity),
          unit: item.unit
        })));
      }

      const { data: sItems } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('family_id', familyId);
      if (sItems) {
        set_shopping_items(sItems.map(item => ({
          id: item.id,
          ingredient_name: item.ingredient_name,
          quantity: Number(item.quantity),
          unit: item.unit,
          purchased: item.purchased
        })));
      }

      const { data: plan } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('family_id', familyId);
      if (plan) {
        const mappedPlan = Array.from({ length: 30 }, (_, i) => {
          const dayNum = i + 1;
          const found = plan.find(p => p.day === dayNum);
          return {
            day: dayNum,
            desayuno: found ? found.desayuno : null,
            comida: found ? found.comida : null,
            cena: found ? found.cena : null
          };
        });
        set_meal_plan(mappedPlan);
      } else {
        set_meal_plan([]);
      }

      const { data: suggs } = await supabase
        .from('recipe_suggestions')
        .select(`
          id,
          family_id,
          day,
          meal_type,
          suggested_recipe_id,
          suggested_by,
          status,
          profiles (
            display_name
          ),
          recipes (
            recipe_data
          )
        `)
        .eq('family_id', familyId)
        .eq('status', 'pendiente');

      if (suggs) {
        const mappedSuggs = suggs.map((s: any) => ({
          id: s.id,
          family_id: s.family_id,
          day: s.day,
          meal_type: s.meal_type as 'desayuno' | 'comida' | 'cena',
          suggested_recipe_id: s.suggested_recipe_id,
          suggested_by: s.suggested_by,
          status: s.status as 'pendiente' | 'aprobado' | 'rechazado',
          user_display_name: s.profiles?.display_name || 'Miembro',
          recipe_name: s.recipes?.recipe_data?.name || 'Receta'
        }));
        set_suggestions(mappedSuggs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const is_configured = is_supabase_configured();
    set_supabase_connected(is_configured);

    if (is_configured) {
      load_recipes();
      const supabase = get_supabase_client();
      if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            set_user(session.user);
            load_user_profile(session.user.id);
          } else {
            load_local_data();
          }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) {
            set_user(session.user);
            load_user_profile(session.user.id);
          } else {
            set_user(null);
            set_profile(null);
            set_my_families([]);
            set_suggestions([]);
            load_local_data();
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      }
    } else {
      load_local_data();
    }
  }, [supabase_connected]);;



  const trigger_push = (title: string, message: string): void => {
    NotificationService.send_notification(title, message);
  };

  const get_pantry_match_info = (recipe: Recipe) => {
    let matches = 0;
    const total = recipe.ingredients.length;

    recipe.ingredients.forEach(req_ing => {
      const pantry_item = pantry_items.find(p => p.ingredient_name.toLowerCase() === req_ing.name.toLowerCase());
      if (pantry_item && pantry_item.quantity >= req_ing.quantity) {
        matches++;
      }
    });

    return { matches, total, pct: total > 0 ? (matches / total) * 100 : 100 };
  };

  const get_filtered_recipes = (): Recipe[] => {
    return recipes.filter(recipe => {
      const has_allergen_conflict = active_filters.allergies.some(allergen => 
        recipe.allergens.map(a => a.toLowerCase()).includes(allergen.toLowerCase())
      );
      if (has_allergen_conflict) {
        return false;
      }

      if (active_filters.diets.length > 0) {
        const matches_diets = active_filters.diets.every(diet => {
          if (diet === 'vegano') {
            return recipe.diet_type === 'vegano';
          }
          if (diet === 'vegetariano') {
            return recipe.diet_type === 'vegetariano' || recipe.diet_type === 'vegano';
          }
          return recipe.diet_type === diet;
        });
        if (!matches_diets) {
          return false;
        }
      }

      if (active_filters.price !== 'all' && recipe.price !== active_filters.price) {
        return false;
      }

      if (active_filters.difficulty !== 'all' && recipe.difficulty !== active_filters.difficulty) {
        return false;
      }

      if (active_filters.health !== 'all' && recipe.health !== active_filters.health) {
        return false;
      }

      const total_ing = recipe.ingredients.length;
      if (active_filters.ingredients_count === 'few' && total_ing > 5) {
        return false;
      }
      if (active_filters.ingredients_count === 'many' && total_ing <= 5) {
        return false;
      }

      return true;
    });
  };

  const handle_auto_generate_plan = (): void => {
    const available_recipes = get_filtered_recipes();
    
    if (available_recipes.length === 0) {
      trigger_push(
        "Generador de Menú",
        "⚠️ No hay recetas disponibles con los filtros actuales. Ajusta los filtros."
      );
      return;
    }

    const updated_plan = meal_plan.map(day_plan => {
      const get_best_candidate = (meal_type: 'desayuno' | 'comida' | 'cena'): number | null => {
        const meal_candidates = available_recipes.filter(r => r.meal_type === meal_type);
        if (meal_candidates.length === 0) {
          const fallback_candidates = recipes.filter(r => r.meal_type === meal_type);
          if (fallback_candidates.length === 0) {
            return null;
          }
          return fallback_candidates[Math.floor(Math.random() * fallback_candidates.length)].id;
        }

        const sorted = [...meal_candidates].map(recipe => ({
          recipe,
          score: get_pantry_match_info(recipe).pct
        })).sort((a, b) => b.score - a.score);

        const top_slice = sorted.slice(0, Math.min(3, sorted.length));
        const picked = top_slice[Math.floor(Math.random() * top_slice.length)];
        return picked.recipe.id;
      };

      return {
        day: day_plan.day,
        desayuno: get_best_candidate('desayuno'),
        comida: get_best_candidate('comida'),
        cena: get_best_candidate('cena')
      };
    });

    set_meal_plan(updated_plan);
    trigger_push(
      "¡Plan de 30 Días Creado!",
      "Hemos optimizado tu menú del mes priorizando las recetas con ingredientes que ya tienes en la despensa."
    );

    calculate_missing_ingredients(updated_plan);
  };

  const calculate_missing_ingredients = (plan_to_use: MealPlanDay[]): void => {
    const needed: { [key: string]: { quantity: number; unit: string } } = {};

    plan_to_use.forEach(day => {
      const active_ids = [day.desayuno, day.comida, day.cena].filter(id => id !== null) as number[];
      
      active_ids.forEach(id => {
        const recipe = recipes.find(r => r.id === id);
        if (recipe) {
          recipe.ingredients.forEach(ing => {
            const key = ing.name.toLowerCase().trim();
            if (needed[key]) {
              needed[key].quantity += ing.quantity;
            } else {
              needed[key] = { quantity: ing.quantity, unit: ing.unit };
            }
          });
        }
      });
    });

    const final_shopping: ShoppingItem[] = [];

    Object.keys(needed).forEach(key => {
      const req = needed[key];
      const pantry_item = pantry_items.find(p => p.ingredient_name.toLowerCase().trim() === key);
      
      const in_pantry_qty = pantry_item ? pantry_item.quantity : 0;
      const missing_qty = req.quantity - in_pantry_qty;

      if (missing_qty > 0) {
        final_shopping.push({
          ingredient_name: key.charAt(0).toUpperCase() + key.slice(1),
          quantity: Number(missing_qty.toFixed(1)),
          unit: req.unit,
          purchased: false
        });
      }
    });

    set_shopping_items(final_shopping);

    if (supabase_connected) {
      sync_shopping_list_to_supabase(final_shopping);
    }

    if (final_shopping.length > 0) {
      trigger_push(
        "Lista de la Compra",
        `🛒 Se han calculado ingredientes faltantes. Se añadieron ${final_shopping.length} artículos para comprar.`
      );
    } else {
      trigger_push(
        "Lista de la Compra",
        "🎉 ¡Qué suerte! Tienes todos los ingredientes necesarios en tu despensa."
      );
    }
  };

  const sync_shopping_list_to_supabase = async (list: ShoppingItem[]): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) {
      return;
    }
    try {
      if (profile?.active_family_id) {
        await supabase.from('shopping_list').delete().eq('family_id', profile.active_family_id);
        const rows = list.map(item => ({
          ingredient_name: item.ingredient_name,
          quantity: item.quantity,
          unit: item.unit,
          purchased: false,
          family_id: profile.active_family_id
        }));
        await supabase.from('shopping_list').insert(rows);
      } else {
        await supabase.from('shopping_list').delete().neq('id', 0);
        for (const item of list) {
          await supabase.from('shopping_list').insert([{
            ingredient_name: item.ingredient_name,
            quantity: item.quantity,
            unit: item.unit,
            purchased: false
          }]);
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handle_recalculate_shopping = (): void => {
    calculate_missing_ingredients(meal_plan);
  };

  const handle_clear_plan = (): void => {
    const cleared = meal_plan.map(d => ({ ...d, desayuno: null, comida: null, cena: null }));
    set_meal_plan(cleared);
    set_shopping_items([]);
    if (supabase_connected) {
      sync_shopping_list_to_supabase([]);
    }
    trigger_push("Plan Vaciado", "Se ha restablecido la planificación mensual.");
  };

  const handle_add_pantry = async (name: string, qty: number, unit: string): Promise<void> => {
    const formatted_name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().trim();
    const existing_index = pantry_items.findIndex(p => p.ingredient_name.toLowerCase() === formatted_name.toLowerCase());
    let updated_pantry = [...pantry_items];

    if (existing_index > -1) {
      updated_pantry[existing_index].quantity += qty;
      if (supabase_connected) {
        const supabase = get_supabase_client();
        if (supabase && updated_pantry[existing_index].id) {
          await supabase
            .from('pantry')
            .update({ quantity: updated_pantry[existing_index].quantity })
            .eq('id', updated_pantry[existing_index].id);
        }
      }
    } else {
      const new_item: PantryItem = {
        ingredient_name: formatted_name,
        quantity: qty,
        unit: unit
      };

      if (supabase_connected) {
        const supabase = get_supabase_client();
        if (supabase) {
          const { data } = await supabase
            .from('pantry')
            .insert([{ ingredient_name: formatted_name, quantity: qty, unit: unit }])
            .select();
          if (data && data[0]) {
            new_item.id = data[0].id;
          }
        }
      }
      updated_pantry.push(new_item);
    }

    set_pantry_items(updated_pantry);
    trigger_push("Despensa Actualizada", `Añadido ${qty}${unit} de ${formatted_name}.`);
  };

  const handle_delete_pantry_item = async (index: number): Promise<void> => {
    const item = pantry_items[index];
    const updated = pantry_items.filter((_, i) => i !== index);
    set_pantry_items(updated);

    if (supabase_connected && item.id) {
      const supabase = get_supabase_client();
      if (supabase) {
        await supabase.from('pantry').delete().eq('id', item.id);
      }
    }
  };

  const handle_toggle_purchase = async (index: number): Promise<void> => {
    const updated_shopping = [...shopping_items];
    const item = updated_shopping[index];
    const was_purchased = item.purchased;
    item.purchased = !was_purchased;
    set_shopping_items(updated_shopping);

    if (supabase_connected && item.id) {
      const supabase = get_supabase_client();
      if (supabase) {
        await supabase.from('shopping_list').update({ purchased: item.purchased }).eq('id', item.id);
      }
    }

    if (!was_purchased) {
      const formatted_name = item.ingredient_name.charAt(0).toUpperCase() + item.ingredient_name.slice(1).toLowerCase().trim();
      const existing_index = pantry_items.findIndex(p => p.ingredient_name.toLowerCase() === formatted_name.toLowerCase());
      let updated_pantry = [...pantry_items];

      if (existing_index > -1) {
        updated_pantry[existing_index].quantity += item.quantity;
        if (supabase_connected) {
          const supabase = get_supabase_client();
          if (supabase && updated_pantry[existing_index].id) {
            await supabase
              .from('pantry')
              .update({ quantity: updated_pantry[existing_index].quantity })
              .eq('id', updated_pantry[existing_index].id);
          }
        }
      } else {
        const new_item: PantryItem = {
          ingredient_name: formatted_name,
          quantity: item.quantity,
          unit: item.unit
        };

        if (supabase_connected) {
          const supabase = get_supabase_client();
          if (supabase) {
            const { data } = await supabase
              .from('pantry')
              .insert([{ ingredient_name: formatted_name, quantity: item.quantity, unit: item.unit }])
              .select();
            if (data && data[0]) {
              new_item.id = data[0].id;
            }
          }
        }
        updated_pantry.push(new_item);
      }

      set_pantry_items(updated_pantry);
      trigger_push(
        "Compra Registrada", 
        `✅ Comprado ${item.quantity}${item.unit} de ${item.ingredient_name}. ¡Añadido a la despensa!`
      );

      setTimeout(async () => {
        set_shopping_items(prev => {
          const list = prev.filter((_, i) => i !== index);
          if (supabase_connected) {
            const supabase = get_supabase_client();
            if (supabase && item.id) {
              supabase.from('shopping_list').delete().eq('id', item.id);
            }
          }
          if (list.length === 0) {
            trigger_push("Lista de la Compra Completa", "¡Has comprado todos los ingredientes de la lista! Tu despensa está lista para cocinar.");
          }
          return list;
        });
      }, 1000);
    }
  };

  const toggle_allergy = (allergy: string): void => {
    set_filters(prev => {
      const active = prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy];
      return { ...prev, allergies: active };
    });
  };

  const toggle_diet = (diet: string): void => {
    set_filters(prev => {
      const active = prev.diets.includes(diet)
        ? prev.diets.filter(d => d !== diet)
        : [...prev.diets, diet];
      return { ...prev, diets: active };
    });
  };

  const handle_open_assign_meal = (day: number, type: 'desayuno' | 'comida' | 'cena'): void => {
    set_assigning_meal({ day, type });
    set_recipe_search('');
  };

  const get_current_role = (): 'cocinitas' | 'miembro' | null => {
    if (!profile?.active_family_id) return null;
    const membership = my_families.find(f => f.family_id === profile.active_family_id);
    return membership ? membership.role : null;
  };

  const handle_login = async (email: string, pass: string): Promise<boolean> => {
    const supabase = get_supabase_client();
    if (!supabase) return false;
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      trigger_push("Error de Acceso", error.message);
      return false;
    }
    trigger_push("¡Bienvenido/a!", "Sesión iniciada con éxito.");
    return true;
  };

  const handle_signup = async (email: string, pass: string): Promise<boolean> => {
    const supabase = get_supabase_client();
    if (!supabase) return false;
    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) {
      trigger_push("Error de Registro", error.message);
      return false;
    }
    trigger_push("Registro exitoso", "Tu cuenta ha sido creada.");
    return true;
  };

  const handle_logout = async (): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;
    await supabase.auth.signOut();
    trigger_push("Sesión cerrada", "Has cerrado sesión.");
  };

  const handle_create_family = async (name: string): Promise<void> => {
    if (!user) return;
    if (my_families.length >= 2) {
      trigger_push("Límite alcanzado", "No puedes tener más de 2 unidades familiares.");
      return;
    }

    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const invite_code = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: family, error: fErr } = await supabase
        .from('family_units')
        .insert([{ name, invite_code }])
        .select()
        .single();

      if (fErr || !family) {
        throw new Error(fErr?.message || "Error al crear la familia");
      }

      await supabase
        .from('family_members')
        .insert([{ family_id: family.id, user_id: user.id, role: 'cocinitas' }]);

      await supabase
        .from('profiles')
        .update({ active_family_id: family.id })
        .eq('id', user.id);

      trigger_push("Familia Creada 🏠", `Creada la familia "${name}".`);
      await load_user_profile(user.id);
    } catch (err: any) {
      trigger_push("Error", err.message || "No se pudo crear la familia.");
    }
  };

  const handle_join_family = async (invite_code: string): Promise<void> => {
    if (!user) return;
    if (my_families.length >= 2) {
      trigger_push("Límite alcanzado", "No puedes unirte a más de 2 unidades familiares.");
      return;
    }

    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const { data: family, error: fErr } = await supabase
        .from('family_units')
        .select('*')
        .eq('invite_code', invite_code.trim())
        .single();

      if (fErr || !family) {
        trigger_push("Código Inválido", "No existe ninguna familia con ese código.");
        return;
      }

      const alreadyMember = my_families.some(f => f.family_id === family.id);
      if (alreadyMember) {
        trigger_push("Ya eres miembro", "Ya perteneces a esta unidad familiar.");
        return;
      }

      await supabase
        .from('family_members')
        .insert([{ family_id: family.id, user_id: user.id, role: 'miembro' }]);

      await supabase
        .from('profiles')
        .update({ active_family_id: family.id })
        .eq('id', user.id);

      trigger_push("Te has unido 🏠", `Te uniste a la familia "${family.name}".`);
      await load_user_profile(user.id);
    } catch (err: any) {
      trigger_push("Error", err.message || "No se pudo unir a la familia.");
    }
  };

  const handle_switch_family = async (family_id: string | null): Promise<void> => {
    if (!user) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      await supabase
        .from('profiles')
        .update({ active_family_id: family_id })
        .eq('id', user.id);

      trigger_push("Familia Cambiada", "Se ha actualizado tu familia activa.");
      await load_user_profile(user.id);
    } catch (err: any) {
      trigger_push("Error", err.message);
    }
  };

  const handle_suggest_recipe = async (day: number, meal_type: 'desayuno' | 'comida' | 'cena', recipe_id: number): Promise<void> => {
    if (!profile?.active_family_id || !user) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      await supabase
        .from('recipe_suggestions')
        .insert([{
          family_id: profile.active_family_id,
          day,
          meal_type,
          suggested_recipe_id: recipe_id,
          suggested_by: user.id,
          status: 'pendiente'
        }]);

      trigger_push("Sugerencia Enviada 🍳", "Se ha sugerido la receta a 'El Cocinitas'.");
      await load_family_data(profile.active_family_id);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handle_approve_suggestion = async (suggestion_id: number): Promise<void> => {
    if (!profile?.active_family_id) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const sugg = suggestions.find(s => s.id === suggestion_id);
      if (!sugg) return;

      await supabase
        .from('recipe_suggestions')
        .update({ status: 'aprobado' })
        .eq('id', suggestion_id);

      const updatedPlan = meal_plan.map(d => {
        if (d.day === sugg.day) {
          return {
            ...d,
            [sugg.meal_type]: sugg.suggested_recipe_id
          };
        }
        return d;
      });
      set_meal_plan(updatedPlan);

      const targetDay = updatedPlan.find(d => d.day === sugg.day);
      if (targetDay) {
        await supabase.from('meal_plans').upsert({
          family_id: profile.active_family_id,
          day: sugg.day,
          desayuno: targetDay.desayuno,
          comida: targetDay.comida,
          cena: targetDay.cena
        }, { onConflict: 'family_id,day' });
      }

      await supabase
        .from('recipe_suggestions')
        .update({ status: 'rechazado' })
        .eq('family_id', profile.active_family_id)
        .eq('day', sugg.day)
        .eq('meal_type', sugg.meal_type)
        .eq('status', 'pendiente');

      trigger_push("Sugerencia Aprobada", "El plato ha sido integrado al planning.");
      await load_family_data(profile.active_family_id);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handle_reject_suggestion = async (suggestion_id: number): Promise<void> => {
    if (!profile?.active_family_id) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      await supabase
        .from('recipe_suggestions')
        .update({ status: 'rechazado' })
        .eq('id', suggestion_id);

      trigger_push("Sugerencia Rechazada", "Se ha descartado la alternativa.");
      await load_family_data(profile.active_family_id);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handle_assign_recipe = async (recipe_id: number): Promise<void> => {
    if (!assigning_meal) {
      return;
    }
    const { day, type } = assigning_meal;
    
    const role = get_current_role();
    if (profile?.active_family_id && role === 'miembro') {
      await handle_suggest_recipe(day, type, recipe_id);
      set_assigning_meal(null);
      return;
    }

    const updated = meal_plan.map(d => {
      if (d.day === day) {
        return { ...d, [type]: recipe_id };
      }
      return d;
    });

    set_meal_plan(updated);
    set_assigning_meal(null);
    trigger_push("Menú Actualizado", `Día ${day}: Añadida receta para el/la ${type}.`);

    if (profile?.active_family_id) {
      const supabase = get_supabase_client();
      if (supabase) {
        const targetDay = updated.find(d => d.day === day);
        if (targetDay) {
          await supabase.from('meal_plans').upsert({
            family_id: profile.active_family_id,
            day,
            desayuno: targetDay.desayuno,
            comida: targetDay.comida,
            cena: targetDay.cena
          }, { onConflict: 'family_id,day' });
        }
      }
    }
  };

  const handle_remove_assigned_recipe = async (day: number, type: 'desayuno' | 'comida' | 'cena', e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();

    const role = get_current_role();
    if (profile?.active_family_id && role === 'miembro') {
      trigger_push("Acceso Denegado", "Solo 'El Cocinitas' puede modificar la planificación.");
      return;
    }

    const updated = meal_plan.map(d => {
      if (d.day === day) {
        return { ...d, [type]: null };
      }
      return d;
    });
    set_meal_plan(updated);
    trigger_push("Receta Removida", `Se quitó el plato asignado para el/la ${type} del día ${day}.`);

    if (profile?.active_family_id) {
      const supabase = get_supabase_client();
      if (supabase) {
        const targetDay = updated.find(d => d.day === day);
        if (targetDay) {
          await supabase.from('meal_plans').upsert({
            family_id: profile.active_family_id,
            day,
            desayuno: targetDay.desayuno,
            comida: targetDay.comida,
            cena: targetDay.cena
          }, { onConflict: 'family_id,day' });
        }
      }
    }
  };

  const get_selectable_recipes = () => {
    if (!assigning_meal) {
      return [];
    }
    const type = assigning_meal.type;

    return recipes
      .filter(r => r.meal_type === type)
      .filter(r => r.name.toLowerCase().includes(recipe_search.toLowerCase()))
      .map(recipe => {
        const match_info = get_pantry_match_info(recipe);
        return { recipe, match_info };
      })
      .sort((a, b) => b.match_info.pct - a.match_info.pct);
  };

  const handle_add_recipe = async (new_recipe_data: Omit<Recipe, 'id'>): Promise<void> => {
    const new_id = Date.now();
    const new_recipe: Recipe = {
      id: new_id,
      ...new_recipe_data
    };

    const updated_recipes = [...recipes, new_recipe];
    set_recipes(updated_recipes);

    if (supabase_connected) {
      const supabase = get_supabase_client();
      if (supabase) {
        try {
          await supabase.from('recipes').insert([{ recipe_data: new_recipe }]);
        } catch (err) {
          console.error(err);
        }
      }
    }

    trigger_push("Receta Guardada 👵", `Se ha añadido la receta "${new_recipe.name}" al recetario.`);
  };

  return {
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
    current_role: get_current_role(),
    is_filter_modal_open,
    set_is_filter_modal_open,
    active_filters,
    set_filters,
    assigning_meal,
    set_assigning_meal,
    recipe_search,
    set_recipe_search,
    trigger_push,
    get_pantry_match_info,
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
    handle_add_recipe,
    handle_login,
    handle_signup,
    handle_logout,
    handle_create_family,
    handle_join_family,
    handle_switch_family,
    handle_approve_suggestion,
    handle_reject_suggestion
  };
};
