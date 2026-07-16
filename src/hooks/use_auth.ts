import type { Profile, FamilyMember } from '../types';
import { get_supabase_client } from '../services/supabase_client';

interface UseAuthParams {
  set_profile: (profile: Profile | null) => void;
  set_my_families: (families: FamilyMember[]) => void;
  trigger_push: (title: string, message: string) => void;
  load_family_data: (familyId: string) => Promise<void>;
  load_local_data: () => void;
}

export const use_auth = ({
  set_profile,
  set_my_families,
  trigger_push,
  load_family_data,
  load_local_data
}: UseAuthParams) => {

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
      } else {
        load_local_data();
      }
    } catch (err) {
      console.error(err);
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
    trigger_push("Sesión cerrada", "Has cerrado sesión.");
  };

  return {
    load_user_families,
    load_user_profile,
    handle_login,
    handle_signup,
    handle_logout
  };
};
