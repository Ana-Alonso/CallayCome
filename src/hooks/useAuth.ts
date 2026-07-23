import type { Profile, FamilyMember } from '../types';
import { get_supabase_client } from '../services/supabase_client';
import { supermarketSupabase } from '../services/supermarket_api';

interface UseAuthParams {
  set_profile: (profile: Profile | null) => void;
  set_my_families: (families: FamilyMember[]) => void;
  trigger_push: (title: string, message: string) => void;
  load_family_data: (familyId: string | null, startDateVal?: string | null, userId?: string) => Promise<void>;
  load_local_data: () => void;
}

export const useAuth = ({
  set_profile,
  set_my_families,
  trigger_push,
  load_family_data,
  load_local_data
}: UseAuthParams) => {

  const load_user_families = async (userId: string): Promise<any[]> => {
    const supabase = get_supabase_client();
    if (!supabase) return [];

    try {
      const { data: memberships, error: memError } = await supabase
        .from('family_members')
        .select(`
          family_id,
          user_id,
          role,
          family_units (
            name,
            invite_code,
            start_date
          )
        `)
        .eq('user_id', userId);

      if (memError) {
        console.error("memberships error:", memError);
        trigger_push("Error de Miembros DB", memError.message);
        return [];
      }

      if (memberships) {
        const mapped = memberships.map((m: any) => ({
          family_id: m.family_id,
          user_id: m.user_id,
          role: m.role as 'cocinitas' | 'miembro',
          family_name: m.family_units?.name || 'Familia',
          invite_code: m.family_units?.invite_code || '',
          start_date: m.family_units?.start_date || null
        }));
        set_my_families(mapped);
        return mapped;
      }
    } catch (err: any) {
      console.error(err);
      trigger_push("Error de Familias Catch", err.message || String(err));
    }
    return [];
  };

  const load_user_profile = async (userId: string): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;

    try {
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profError) {
        console.error("profile error:", profError);
        trigger_push("Error de Perfil DB", profError.message);
        load_local_data();
        return;
      }

      if (prof) {
        set_profile(prof as Profile);
        const families = await load_user_families(userId);
        
        let active_id = prof.active_family_id;
        // Auto-select the first family if active_family_id is null but user belongs to one or more families
        if (!active_id && families.length > 0) {
          active_id = families[0].family_id;
          await supabase
            .from('profiles')
            .update({ active_family_id: active_id })
            .eq('id', userId);
          
          set_profile({ ...(prof as Profile), active_family_id: active_id });
        }

        if (active_id) {
          const active_membership = families.find((f: any) => f.family_id === active_id);
          const start_date_val = active_membership?.start_date || null;
          await load_family_data(active_id, start_date_val, userId);
        } else {
          await load_family_data(null, null, userId);
        }
      } else {
        trigger_push("Perfil no encontrado", "No se encontró tu perfil en la base de datos.");
        load_local_data();
      }
    } catch (err: any) {
      console.error(err);
      trigger_push("Error de Perfil Catch", err.message || String(err));
      load_local_data();
    }
  };

  const handle_login = async (email: string, pass: string): Promise<boolean> => {
    const supabase = get_supabase_client();
    if (!supabase) return false;
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      trigger_push("Error de Acceso", error.message);
      return false;
    }
    
    // Log in to supermarketSupabase in parallel
    await supermarketSupabase.auth.signInWithPassword({ email, password: pass }).catch(e => {
      console.warn("Failed to log in to Supermarket database in parallel:", e);
    });

    trigger_push("¡Bienvenido/a!", "Sesión iniciada con éxito.");
    return true;
  };

  const handle_signup = async (email: string, pass: string): Promise<boolean> => {
    const supabase = get_supabase_client();
    if (!supabase) return false;
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) {
      trigger_push("Error de Registro", error.message);
      return false;
    }

    // Sign up to supermarketSupabase in parallel
    await supermarketSupabase.auth.signUp({ email, password: pass }).catch(e => {
      console.warn("Failed to sign up to Supermarket database in parallel:", e);
    });

    if (data.session === null && data.user) {
      trigger_push(
        "Revisa tu correo 📧",
        "Se ha enviado un enlace de confirmación. Si no llega, pide al administrador que desactive la confirmación de email en Supabase."
      );
      return false;
    }
    trigger_push("Registro exitoso 🎉", "Tu cuenta ha sido creada. ¡Bienvenido/a!");
    return true;
  };

  const handle_logout = async (): Promise<void> => {
    const supabase = get_supabase_client();
    if (!supabase) return;
    await supabase.auth.signOut();
    await supermarketSupabase.auth.signOut().catch(() => {});
    trigger_push("Sesión cerrada", "Has cerrado sesión.");
  };

  const handle_delete_account = async (userId: string): Promise<boolean> => {
    const supabase = get_supabase_client();
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) {
        trigger_push("Error al borrar cuenta", error.message);
        return false;
      }
      await supabase.auth.signOut();
      trigger_push("Cuenta Eliminada 🗑️", "Tu cuenta y tus datos han sido eliminados.");
      return true;
    } catch (err: any) {
      console.error(err);
      trigger_push("Error al borrar cuenta", err.message || String(err));
      return false;
    }
  };

  const handle_change_password = async (email: string, oldPass: string, newPass: string): Promise<boolean> => {
    const supabase = get_supabase_client();
    if (!supabase) return false;

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: oldPass });
    if (signInError) {
      trigger_push("Error", "La contraseña actual es incorrecta.");
      return false;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPass });
    if (updateError) {
      trigger_push("Error", `No se pudo actualizar la contraseña: ${updateError.message}`);
      return false;
    }

    await supermarketSupabase.auth.updateUser({ password: newPass }).catch(() => {});

    trigger_push("Contraseña Actualizada 🎉", "Tu contraseña ha sido actualizada con éxito.");
    return true;
  };

  return {
    load_user_families,
    load_user_profile,
    handle_login,
    handle_signup,
    handle_logout,
    handle_delete_account,
    handle_change_password
  };
};
