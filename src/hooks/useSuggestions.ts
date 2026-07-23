import type { Profile, RecipeSuggestion, Recipe } from '../types';
import type { User } from '@supabase/supabase-js';
import { get_supabase_client } from '../services/supabase_client';

type MealType = 'desayuno' | 'comida' | 'cena';

interface UseSuggestionsParams {
  user: User | null;
  profile: Profile | null;
  trigger_push: (title: string, message: string) => void;
  load_family_data: (familyId: string) => Promise<void>;
  set_suggestions: React.Dispatch<React.SetStateAction<RecipeSuggestion[]>>;
  recipes: Recipe[];
}

export const useSuggestions = ({
  user,
  profile,
  trigger_push,
  load_family_data,
  set_suggestions,
  recipes
}: UseSuggestionsParams) => {

  const get_actor_display_name = (): string => {
    if (profile?.display_name && profile.display_name.trim().length > 0) {
      return profile.display_name.trim();
    }
    if (profile?.email && profile.email.trim().length > 0) {
      return profile.email.split('@')[0];
    }
    if (user?.email && user.email.trim().length > 0) {
      return user.email.split('@')[0];
    }
    return 'Alguien';
  };

  // Helper: insert a notification for every family member except one (the actor)
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
      console.error('notify_all_family_members error:', err);
    }
  };

  const handle_suggest_recipe = async (
    day: number,
    type: MealType,
    recipeId: number
  ): Promise<void> => {
    if (!user || !profile?.active_family_id) return;

    const supabase = get_supabase_client();
    if (!supabase) return;

    // Diagnostic: confirm which recipe ID we are inserting
    const chosen_recipe = recipes.find(r => r.id === recipeId);
    console.debug('[suggest] Inserting suggestion with recipe_id:', recipeId, '→ name:', chosen_recipe?.name ?? '(not found in local list)');

    try {
      const { error } = await supabase
        .from('recipe_suggestions')
        .insert([{
          family_id: profile.active_family_id,
          day,
          meal_type: type,
          suggested_recipe_id: recipeId,
          suggested_by: user.id,
          status: 'pendiente'
        }]);

      if (!error) {
        const actor = get_actor_display_name();
        const recipe_name = chosen_recipe?.name ?? 'una receta';
        // Notify the whole family (except the suggester) about the new proposal
        await notify_all_family_members(
          profile.active_family_id,
          'Nueva Sugerencia 📝',
          `${actor} ha propuesto "${recipe_name}" para el Día ${day} (${type}).`
        );
        trigger_push('Sugerencia Enviada 📝', `"${recipe_name}" propuesta para el Día ${day}.`);
        await load_family_data(profile.active_family_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handle_approve_suggestion = async (suggestionId: number): Promise<void> => {
    if (!profile?.active_family_id) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      // 1. Get suggestion details
      const { data: sugg, error: sErr } = await supabase
        .from('recipe_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (sErr || !sugg) return;

      // 2. Load current day plan
      const { data: currentDayPlan } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('family_id', profile.active_family_id)
        .eq('day', sugg.day)
        .single();

      // Determine new slot arrays
      const meal_type = sugg.meal_type as MealType;
      let new_slots: number[] = [sugg.suggested_recipe_id];
      if (currentDayPlan) {
        const key = `${meal_type}_slots` as const;
        const current_slots = (currentDayPlan[key] || [currentDayPlan[meal_type]]) as Array<number | null>;
        new_slots = current_slots.map((s, idx) => idx === 0 ? sugg.suggested_recipe_id : s).filter((s): s is number => s !== null);
        if (new_slots.length === 0) {
          new_slots = [sugg.suggested_recipe_id];
        }
      }

      // 3. Update meal plans
      if (currentDayPlan) {
        await supabase
          .from('meal_plans')
          .update({
            [meal_type]: sugg.suggested_recipe_id,
            [`${meal_type}_slots`]: new_slots
          })
          .eq('id', currentDayPlan.id);
      } else {
        await supabase
          .from('meal_plans')
          .insert([{
            family_id: profile.active_family_id,
            day: sugg.day,
            [meal_type]: sugg.suggested_recipe_id,
            [`${meal_type}_slots`]: new_slots
          }]);
      }

      // 4. Accept suggestion
      await supabase
        .from('recipe_suggestions')
        .update({ status: 'aprobado' })
        .eq('id', suggestionId);

      // 5. Notify the whole family that the menu was updated
      const actor = get_actor_display_name();
      await notify_all_family_members(
        profile.active_family_id,
        'Menú Actualizado ✅',
        `${actor} aprobó una sugerencia. El menú del Día ${sugg.day} ha cambiado.`
      );
      // Also notify the proposer directly (personalized message)
      await supabase
        .from('family_notifications')
        .insert([{
          family_id: profile.active_family_id,
          recipient_user_id: sugg.suggested_by,
          title: '¡Tu Sugerencia fue Aprobada! 🍳',
          body: `${actor} aprobó tu propuesta para el Día ${sugg.day}.`
        }]);

      trigger_push('Sugerencia Aprobada 👍', 'El menú se ha actualizado automáticamente.');
      await load_family_data(profile.active_family_id);
    } catch (err) {
      console.error(err);
    }
  };

  const handle_reject_suggestion = async (suggestionId: number): Promise<void> => {
    if (!profile?.active_family_id) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const { data: sugg, error: sErr } = await supabase
        .from('recipe_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (sErr || !sugg) return;

      // Reject suggestion
      await supabase
        .from('recipe_suggestions')
        .update({ status: 'rechazado' })
        .eq('id', suggestionId);

      // Notify the whole family that the suggestion was rejected
      const actor = get_actor_display_name();
      await notify_all_family_members(
        profile.active_family_id,
        'Sugerencia Rechazada ❌',
        `${actor} ha rechazado una sugerencia para el Día ${sugg.day}.`
      );

      // Also notify proposer directly
      await supabase
        .from('family_notifications')
        .insert([{
          family_id: profile.active_family_id,
          recipient_user_id: sugg.suggested_by,
          title: "Tu Sugerencia fue Rechazada ❌",
          body: `${actor} ha rechazado tu sugerencia para el Día ${sugg.day}.`
        }]);

      trigger_push("Sugerencia Rechazada ❌", "Sugerencia descartada correctamente.");
      await load_family_data(profile.active_family_id);
    } catch (err) {
      console.error(err);
    }
  };

  const handle_vote_suggestion = async (suggestionId: number, vote: 'like' | 'dislike'): Promise<void> => {
    if (!user || !profile?.active_family_id) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      // Check if vote already exists
      const { data: existing } = await supabase
        .from('recipe_suggestion_votes')
        .select('*')
        .eq('suggestion_id', suggestionId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        if (existing.vote === vote) {
          // Toggle off
          await supabase
            .from('recipe_suggestion_votes')
            .delete()
            .eq('id', existing.id);
        } else {
          // Switch vote
          await supabase
            .from('recipe_suggestion_votes')
            .update({ vote })
            .eq('id', existing.id);
        }
      } else {
        // Insert new vote
        await supabase
          .from('recipe_suggestion_votes')
          .insert([{
            suggestion_id: suggestionId,
            user_id: user.id,
            vote
          }]);
      }

      // Notify the whole family about the vote
      if (vote === 'like') {
        const { data: sugg } = await supabase
          .from('recipe_suggestions')
          .select('suggested_by, day, meal_type, suggested_recipe_id')
          .eq('id', suggestionId)
          .single();

        if (sugg) {
          const chosen_recipe = recipes.find(r => r.id === sugg.suggested_recipe_id);
          const recipe_name = chosen_recipe?.name ?? 'tu receta';
          const actor = get_actor_display_name();
          await notify_all_family_members(
            profile.active_family_id,
            'Voto en Sugerencia 👍',
            `${actor} ha votado a favor de la propuesta "${recipe_name}" para el Día ${sugg.day}.`
          );
        }
      }

      await load_family_data(profile.active_family_id);
    } catch (err) {
      console.error(err);
    }
  };

  const load_suggestions_data = async (familyId: string, userId: string | undefined): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
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
          profiles:profiles!recipe_suggestions_suggested_by_fkey (
            display_name
          ),
          recipes (
            name
          )
        `)
        .eq('family_id', familyId)
        .eq('status', 'pendiente');

      if (suggs) {
        const suggestion_ids: number[] = suggs.map((s: any) => Number(s.id));
        let votes_by_suggestion: Record<number, Array<{ user_id: string; vote: 'like' | 'dislike' }>> = {};

        if (suggestion_ids.length > 0) {
          const { data: votes, error: votes_error } = await supabase
            .from('recipe_suggestion_votes')
            .select('suggestion_id, user_id, vote')
            .in('suggestion_id', suggestion_ids);

          if (votes_error) {
            console.error(votes_error);
          } else {
            votes_by_suggestion = (votes || []).reduce((acc: Record<number, Array<{ user_id: string; vote: 'like' | 'dislike' }>>, v: any) => {
              const key = Number(v.suggestion_id);
              if (!acc[key]) {
                acc[key] = [];
              }
              acc[key].push({ user_id: v.user_id, vote: v.vote as 'like' | 'dislike' });
              return acc;
            }, {});
          }
        }

        const mappedSuggs = suggs.map((s: any) => {
          const recipe = recipes.find((r) => r.id === Number(s.suggested_recipe_id));
          if (!recipe) {
            console.warn(
              '[suggestions] Could not find recipe for id:', s.suggested_recipe_id,
              '— available ids:', recipes.map(r => r.id).slice(0, 10)
            );
          }
          return {
            votes: votes_by_suggestion[Number(s.id)] || [],
            id: s.id,
            family_id: s.family_id,
            day: s.day,
            meal_type: s.meal_type as 'desayuno' | 'comida' | 'cena',
            suggested_recipe_id: s.suggested_recipe_id,
            suggested_by: s.suggested_by,
            status: s.status as 'pendiente' | 'aprobado' | 'rechazado',
            user_display_name: s.profiles?.display_name || 'Miembro',
            recipe_name: (Array.isArray(s.recipes)
                  ? s.recipes[0]?.name
                  : s.recipes?.name) || recipe?.name || 'Receta',
            likes_count: (votes_by_suggestion[Number(s.id)] || []).filter(v => v.vote === 'like').length,
            dislikes_count: (votes_by_suggestion[Number(s.id)] || []).filter(v => v.vote === 'dislike').length,
            my_vote: ((votes_by_suggestion[Number(s.id)] || []).find(v => v.user_id === userId)?.vote || null) as 'like' | 'dislike' | null
          };
        });
        set_suggestions(mappedSuggs);
      } else {
        set_suggestions([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return {
    handle_suggest_recipe,
    handle_approve_suggestion,
    handle_reject_suggestion,
    handle_vote_suggestion,
    load_suggestions_data
  };
};
