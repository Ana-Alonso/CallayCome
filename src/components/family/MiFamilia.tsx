import { useState } from 'react';
import { Users, PlusCircle, Check, X, LogOut, Copy, CheckCircle2, ChefHat } from 'lucide-react';
import { Auth } from '../auth/Auth';
import { Boton } from '../common/Boton';
import { CampoTexto } from '../common/CampoTexto';
import { 
  PageContainer, 
  CardContainer, 
  TitleH2, 
  TextMuted, 
  Spacer, 
  FormGroup, 
  FormLabel,
  PantryInputGrid,
  FlexRow,
  StatusBadge,
  PantryItemContainer,
  PantryItemName,
  PantryItemQty
} from '../common';
import type { FamilyMember, RecipeSuggestion, Profile } from '../../types';
import type { User } from '@supabase/supabase-js';

interface MiFamiliaProps {
  user: User | null;
  profile: Profile | null;
  my_families: FamilyMember[];
  suggestions: RecipeSuggestion[];
  current_role: 'cocinitas' | 'miembro' | null;
  handle_login: (email: string, pass: string) => Promise<boolean>;
  handle_signup: (email: string, pass: string) => Promise<boolean>;
  handle_logout: () => Promise<void>;
  handle_create_family: (name: string) => Promise<string | null>;
  handle_join_family: (invite_code: string) => Promise<void>;
  handle_switch_family: (family_id: string | null) => Promise<void>;
  handle_leave_family: (family_id: string) => Promise<void>;
  handle_approve_suggestion: (id: number) => Promise<void>;
  handle_reject_suggestion: (id: number) => Promise<void>;
}

export const MiFamilia = ({
  user,
  profile,
  my_families,
  suggestions,
  current_role,
  handle_login,
  handle_signup,
  handle_logout,
  handle_create_family,
  handle_join_family,
  handle_switch_family,
  handle_leave_family,
  handle_approve_suggestion,
  handle_reject_suggestion
}: MiFamiliaProps) => {
  const [familyName, setFamilyName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [new_family_code, set_new_family_code] = useState<string | null>(null);
  const [new_family_name, set_new_family_name] = useState<string>('');
  const [code_copied, set_code_copied] = useState<boolean>(false);
  const [leaving_family_id, set_leaving_family_id] = useState<string | null>(null);

  if (!user) {
    return (
      <Auth
        on_login={handle_login}
        on_signup={handle_signup}
        on_success={() => {}}
      />
    );
  }

  const handle_create_submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!familyName.trim()) return;
    setLoading(true);
    const name = familyName.trim();
    const code = await handle_create_family(name);
    setLoading(false);
    if (code) {
      set_new_family_name(name);
      set_new_family_code(code);
      setFamilyName('');
    }
  };

  const handle_join_submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    await handle_join_family(inviteCode.trim());
    setLoading(false);
    setInviteCode('');
  };

  const handle_copy_code = async (): Promise<void> => {
    if (!new_family_code) return;
    try {
      await navigator.clipboard.writeText(new_family_code);
      set_code_copied(true);
      setTimeout(() => set_code_copied(false), 2500);
    } catch {
      set_code_copied(false);
    }
  };

  const handle_leave_click = async (family_id: string, role: 'cocinitas' | 'miembro'): Promise<void> => {
    const confirm_message = role === 'cocinitas'
      ? "Vas a abandonar esta unidad como 'El Cocinitas'. Si no hay reemplazo, la unidad puede disolverse. ¿Continuar?"
      : "¿Seguro que quieres abandonar esta unidad familiar?";

    if (!window.confirm(confirm_message)) {
      return;
    }

    set_leaving_family_id(family_id);
    await handle_leave_family(family_id);
    set_leaving_family_id(null);
  };

  if (new_family_code) {
    return (
      <PageContainer>
        <Spacer height={8} />
        <CardContainer style={{ textAlign: 'center', padding: '32px 24px' }}>
          <ChefHat size={48} style={{ color: '#f26841', marginBottom: 16 }} />
          <TitleH2>¡Familia "{new_family_name}" creada! 🏠</TitleH2>
          <Spacer height={8} />
          <TextMuted>
            Eres <strong style={{ color: '#f26841' }}>El Cocinitas 🍳</strong> de esta unidad familiar.
            Comparte este código con el resto de miembros para que puedan unirse:
          </TextMuted>

          <Spacer height={20} />

          <div
            onClick={handle_copy_code}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              backgroundColor: 'rgba(242,104,65,0.1)',
              border: '2px dashed rgba(242,104,65,0.5)',
              borderRadius: 16,
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: 8, color: '#f26841', fontFamily: 'monospace' }}>
              {new_family_code}
            </span>
            {code_copied
              ? <CheckCircle2 size={24} style={{ color: '#66bb6a' }} />
              : <Copy size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
            }
          </div>

          <Spacer height={8} />
          <TextMuted style={{ fontSize: 12 }}>
            {code_copied ? '✅ Código copiado al portapapeles' : 'Pulsa para copiar el código'}
          </TextMuted>

          <Spacer height={24} />

          <Boton
            texto="Entendido, volver a Familia"
            clase_css="full-width"
            on_click={() => set_new_family_code(null)}
          />
        </CardContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <TitleH2>Mi Familia 🏠</TitleH2>
      <TextMuted style={{ fontSize: 13 }}>Usuario: {profile?.email || user.email}</TextMuted>

      <Spacer height={16} />

      <TitleH2 style={{ fontSize: 17 }}>Mis Unidades Familiares</TitleH2>
      <TextMuted style={{ fontSize: 13 }}>Perteneces a las siguientes familias (máximo 2):</TextMuted>
      <Spacer height={8} />

      {my_families.length === 0 ? (
        <CardContainer>
          <TextMuted style={{ textAlign: 'center', padding: '12px 0', fontSize: 13 }}>
            No formas parte de ninguna unidad familiar. Tu planificación es local.
          </TextMuted>
        </CardContainer>
      ) : (
        <PantryInputGrid style={{ gridTemplateColumns: '1fr', gap: 10 }}>
          {my_families.map(fam => {
            const isActive = profile?.active_family_id === fam.family_id;
            return (
              <CardContainer key={fam.family_id} style={{ borderColor: isActive ? '#f26841' : '#32323e' }}>
                <FlexRow style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <TitleH2 style={{ fontSize: 16, marginBottom: 4 }}>{fam.family_name}</TitleH2>
                    <TextMuted style={{ fontSize: 12 }}>
                      Rol: <strong style={{ color: fam.role === 'cocinitas' ? '#f26841' : '#90caf9' }}>
                        {fam.role === 'cocinitas' ? 'El Cocinitas 🍳' : 'Miembro 🍽️'}
                      </strong>
                    </TextMuted>
                    {fam.role === 'cocinitas' && (
                      <TextMuted style={{ fontSize: 12, marginTop: 4 }}>
                        Código de invitación:{' '}
                        <strong style={{ fontFamily: 'monospace', letterSpacing: 3, color: '#f26841' }}>
                          {fam.invite_code}
                        </strong>
                      </TextMuted>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    {isActive ? (
                      <StatusBadge sx={{ backgroundColor: 'rgba(76,175,80,0.15)', borderColor: 'rgba(76,175,80,0.4)', color: '#81c784', fontSize: 11 }}>
                        Activa
                      </StatusBadge>
                    ) : (
                      <Boton
                        texto="Activar"
                        clase_css="btn-sm"
                        on_click={() => handle_switch_family(fam.family_id)}
                      />
                    )}
                    <Boton
                      texto={leaving_family_id === fam.family_id ? 'Abandonando...' : 'Abandonar'}
                      clase_css="btn-sm"
                      variante="outlined"
                      color="error"
                      deshabilitado={leaving_family_id === fam.family_id}
                      on_click={() => handle_leave_click(fam.family_id, fam.role)}
                    />
                  </div>
                </FlexRow>
              </CardContainer>
            );
          })}
        </PantryInputGrid>
      )}

      {my_families.length > 0 && profile?.active_family_id && (
        <>
          <Spacer height={10} />
          <Boton
            texto="Desactivar Familia Activa (Modo Local)"
            variante="outlined"
            color="inherit"
            clase_css="full-width btn-sm"
            on_click={() => handle_switch_family(null)}
          />
        </>
      )}

      {my_families.length < 2 && (
        <>
          <Spacer height={20} />
          <TitleH2 style={{ fontSize: 17 }}>Añadir Familia</TitleH2>
          <Spacer height={8} />
          <PantryInputGrid style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <CardContainer component="form" onSubmit={handle_create_submit}>
              <FormGroup>
                <FormLabel>Crear Familia</FormLabel>
                <CampoTexto
                  etiqueta=""
                  valor={familyName}
                  on_change={setFamilyName}
                  marcador_posicion="Nombre de familia"
                  requerido
                />
              </FormGroup>
              <Spacer height={8} />
              <Boton
                texto={loading ? 'Creando...' : 'Crear y ser El Cocinitas'}
                tipo="submit"
                icono={<PlusCircle size={16} />}
                clase_css="full-width btn-sm"
                deshabilitado={loading}
              />
            </CardContainer>

            <CardContainer component="form" onSubmit={handle_join_submit}>
              <FormGroup>
                <FormLabel>Unirse con Código</FormLabel>
                <CampoTexto
                  etiqueta=""
                  valor={inviteCode}
                  on_change={setInviteCode}
                  marcador_posicion="Código de 6 dígitos"
                  requerido
                />
              </FormGroup>
              <Spacer height={8} />
              <Boton
                texto={loading ? 'Uniéndose...' : 'Unirse como Miembro'}
                tipo="submit"
                icono={<Users size={16} />}
                clase_css="full-width btn-sm"
                variante="outlined"
                deshabilitado={loading}
              />
            </CardContainer>
          </PantryInputGrid>
        </>
      )}

      {profile?.active_family_id && current_role === 'cocinitas' && suggestions.length > 0 && (
        <>
          <Spacer height={20} />
          <TitleH2 style={{ fontSize: 17 }}>Propuestas de Cambio Pendientes</TitleH2>
          <TextMuted style={{ fontSize: 13 }}>Como "El Cocinitas", aprueba o rechaza estas sugerencias:</TextMuted>
          <Spacer height={8} />
          <PantryInputGrid style={{ gridTemplateColumns: '1fr', gap: 10 }}>
            {suggestions.map(s => (
              <PantryItemContainer key={s.id}>
                <FlexRow>
                  <PantryItemName>Día {s.day} ({s.meal_type.toUpperCase()})</PantryItemName>
                  <PantryItemQty>{s.recipe_name}</PantryItemQty>
                </FlexRow>
                <TextMuted style={{ fontSize: 12, marginTop: 4 }}>Sugerido por: {s.user_display_name}</TextMuted>
                <FlexRow style={{ marginTop: 8, gap: 8 }}>
                  <Boton
                    texto="Aprobar"
                    color="success"
                    clase_css="btn-sm"
                    icono={<Check size={14} />}
                    on_click={() => handle_approve_suggestion(s.id)}
                  />
                  <Boton
                    texto="Rechazar"
                    color="error"
                    clase_css="btn-sm"
                    icono={<X size={14} />}
                    on_click={() => handle_reject_suggestion(s.id)}
                  />
                </FlexRow>
              </PantryItemContainer>
            ))}
          </PantryInputGrid>
        </>
      )}

      <Spacer height={24} />

      <Boton
        texto="Cerrar Sesión"
        color="error"
        clase_css="full-width"
        icono={<LogOut size={18} />}
        on_click={handle_logout}
      />
    </PageContainer>
  );
};
