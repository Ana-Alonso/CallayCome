import type { FamilyMember } from '../types';
import type { User } from '@supabase/supabase-js';
import { get_supabase_client } from '../services/supabase_client';

interface UseFamilyParams {
  user: User | null;
  my_families: FamilyMember[];
  trigger_push: (title: string, message: string) => void;
  load_user_profile: (userId: string) => Promise<void>;
}

export const useFamily = ({
  user,
  my_families,
  trigger_push,
  load_user_profile
}: UseFamilyParams) => {

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
      console.error('family notify_all error:', err);
    }
  };

  const handle_create_family = async (name: string): Promise<string | null> => {
    if (!user) return null;
    if (my_families.length >= 2) {
      trigger_push("Límite alcanzado", "No puedes tener más de 2 unidades familiares.");
      return null;
    }

    const supabase = get_supabase_client();
    if (!supabase) return null;

    try {
      // 1. Create family unit
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: family, error: fErr } = await supabase
        .from('family_units')
        .insert([{ name, invite_code: inviteCode }])
        .select()
        .single();

      if (fErr || !family) {
        trigger_push("Error", "No se pudo crear la unidad familiar.");
        return null;
      }

      // 2. Add creator as 'cocinitas'
      const { error: mErr } = await supabase
        .from('family_members')
        .insert([{
          family_id: family.id,
          user_id: user.id,
          role: 'cocinitas'
        }]);

      if (mErr) {
        trigger_push("Error", "No se pudo asociar la unidad familiar.");
        return null;
      }

      // 3. Mark as active family
      await supabase
        .from('profiles')
        .update({ active_family_id: family.id })
        .eq('id', user.id);

      trigger_push("Familia Creada 🏠", `Te has unido como 'El Cocinitas'. Código de invitación: ${inviteCode}`);
      await load_user_profile(user.id);
      return family.id;
    } catch (err: any) {
      trigger_push("Error", err.message || "No se pudo crear la familia.");
      return null;
    }
  };

  const handle_join_family = async (inviteCode: string): Promise<boolean> => {
    if (!user) return false;
    if (my_families.length >= 2) {
      trigger_push("Límite alcanzado", "No puedes tener más de 2 unidades familiares.");
      return false;
    }

    const supabase = get_supabase_client();
    if (!supabase) return false;

    try {
      const clean_code = inviteCode.trim().toUpperCase();

      // Find family
      const { data: family, error: fErr } = await supabase
        .from('family_units')
        .select('*')
        .eq('invite_code', clean_code)
        .single();

      if (fErr || !family) {
        trigger_push("Código Inválido ❌", "No se encontró ninguna familia con ese código.");
        return false;
      }

      // Check if already a member
      const already = my_families.some(f => f.family_id === family.id);
      if (already) {
        trigger_push("Ya eres miembro", "Ya perteneces a esta unidad familiar.");
        return false;
      }

      // Add as member
      const { error: mErr } = await supabase
        .from('family_members')
        .insert([{
          family_id: family.id,
          user_id: user.id,
          role: 'miembro'
        }]);

      if (mErr) {
        trigger_push("Error de Asociación ❌", "No pudimos agregarte a la unidad familiar.");
        return false;
      }

      // Set active
      await supabase
        .from('profiles')
        .update({ active_family_id: family.id })
        .eq('id', user.id);

      trigger_push("¡Bienvenido/a! 🏠", `Te has unido a la familia '${family.name}'.`);
      await notify_all_family_members(
        family.id,
        "Nuevo Miembro 🚪",
        `${user.email?.split('@')[0]} se ha unido a la familia.`
      );
      await load_user_profile(user.id);
      return true;
    } catch (err: any) {
      trigger_push("Error", err.message || "No se pudo unir a la familia.");
      return false;
    }
  };

  const handle_switch_family = async (familyId: string | null): Promise<void> => {
    if (!user) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active_family_id: familyId })
        .eq('id', user.id);

      if (!error) {
        trigger_push("Familia Cambiada 🏠", "Cargando datos de la nueva familia...");
        await load_user_profile(user.id);
      }
    } catch (err: any) {
      trigger_push("Error", err.message || "No se pudo cambiar de familia.");
    }
  };

  const handle_leave_family = async (familyId: string): Promise<void> => {
    if (!user) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const membership = my_families.find(f => f.family_id === familyId);
      if (!membership) return;

      if (membership.role === 'cocinitas') {
        // Disolve family if Cocinitas leaves
        await supabase
          .from('family_units')
          .delete()
          .eq('id', familyId);

        trigger_push("Familia Disuelta 🗑️", "Has abandonado y disuelto tu unidad familiar.");
      } else {
        await notify_all_family_members(
          familyId,
          "Miembro ha salido 🚪",
          `${user.email?.split('@')[0]} ha abandonado la familia.`
        );

        // Just remove membership
        await supabase
          .from('family_members')
          .delete()
          .eq('family_id', familyId)
          .eq('user_id', user.id);

        trigger_push("Has salido de la familia 🚪", "Ya no formas parte de la unidad familiar.");
      }

      // Update active family
      const next_family = my_families.find(f => f.family_id !== familyId);
      await supabase
        .from('profiles')
        .update({ active_family_id: next_family?.family_id || null })
        .eq('id', user.id);

      await load_user_profile(user.id);
    } catch (err: any) {
      trigger_push("Error", err.message || "No se pudo salir de la familia.");
    }
  };

  const handle_transfer_role = async (familyId: string, newCocinitasUserId: string): Promise<void> => {
    if (!user) return;
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      // 1. Demote old cocinitas to member
      await supabase
        .from('family_members')
        .update({ role: 'miembro' })
        .eq('family_id', familyId)
        .eq('user_id', user.id);

      // 2. Promote new user to cocinitas
      await supabase
        .from('family_members')
        .update({ role: 'cocinitas' })
        .eq('family_id', familyId)
        .eq('user_id', newCocinitasUserId);

      trigger_push("Rol Transferido 🍳", "Has transferido el rol de 'El Cocinitas' a otro miembro.");
      await notify_all_family_members(
        familyId,
        "Cambio de Cocinitas 🍳",
        "Se ha transferido el rol de El Cocinitas a otro miembro."
      );
      await load_user_profile(user.id);
    } catch (err: any) {
      trigger_push("Error", err.message || "No se pudo transferir el rol.");
    }
  };

  const get_family_members = async (familyId: string): Promise<any[]> => {
    const supabase = get_supabase_client();
    if (!supabase) return [];

    try {
      const { data } = await supabase
        .from('family_members')
        .select(`
          user_id,
          role,
          profiles (
            display_name,
            email
          )
        `)
        .eq('family_id', familyId);

      if (data) {
        return data.map((m: any) => ({
          user_id: m.user_id,
          role: m.role,
          display_name: m.profiles?.display_name || m.profiles?.email?.split('@')[0] || 'Miembro',
          email: m.profiles?.email || ''
        }));
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  const get_family_complaints = async (familyId: string): Promise<Record<string, number>> => {
    const supabase = get_supabase_client();
    if (!supabase) return {};

    try {
      const map: Record<string, number> = {};

      // 1. Votos 'dislike' de sugerencias
      const { data: suggestions } = await supabase
        .from('recipe_suggestions')
        .select('id')
        .eq('family_id', familyId);

      if (suggestions && suggestions.length > 0) {
        const ids = suggestions.map(s => s.id);
        const { data: votes } = await supabase
          .from('recipe_suggestion_votes')
          .select('user_id, vote')
          .in('suggestion_id', ids)
          .eq('vote', 'dislike');

        if (votes) {
          votes.forEach((v: any) => {
            map[v.user_id] = (map[v.user_id] || 0) + 1;
          });
        }
      }

      // 2. Sugerencias rechazadas por El Cocinitas
      const { data: rejected } = await supabase
        .from('recipe_suggestions')
        .select('suggested_by')
        .eq('family_id', familyId)
        .eq('status', 'rechazado');

      if (rejected) {
        rejected.forEach((s: any) => {
          if (s.suggested_by) {
            map[s.suggested_by] = (map[s.suggested_by] || 0) + 1;
          }
        });
      }

      return map;
    } catch (err) {
      console.error(err);
    }
    return {};
  };

  return {
    handle_create_family,
    handle_join_family,
    handle_switch_family,
    handle_leave_family,
    handle_transfer_role,
    get_family_members,
    get_family_complaints
  };
};
