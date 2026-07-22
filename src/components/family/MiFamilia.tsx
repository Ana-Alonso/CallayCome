import { useState, useEffect } from 'react';
import { Users, PlusCircle, Check, X, LogOut, Copy, CheckCircle2, ChefHat, ThumbsUp, ThumbsDown, ArrowRightLeft, AlertTriangle } from 'lucide-react';
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
  PantryItemName
} from '../common';
import type { FamilyMember, RecipeSuggestion, Profile } from '../../types';
import type { User } from '@supabase/supabase-js';

interface FamilyMemberInfo {
  user_id: string;
  role: string;
  display_name: string;
}

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
  handle_vote_suggestion: (id: number, vote: 'like' | 'dislike') => Promise<void>;
  handle_transfer_role: (family_id: string, new_cocinitas_user_id: string) => Promise<void>;
  get_family_members: (family_id: string) => Promise<FamilyMemberInfo[]>;
  get_family_complaints: (family_id: string) => Promise<Record<string, number>>;
  show_quejometro?: boolean;
  accessibility_options: { high_contrast: boolean; large_text: boolean; read_aloud: boolean };
  update_accessibility: (key: 'high_contrast' | 'large_text' | 'read_aloud', value: boolean) => void;
  speak: (text: string) => void;
  handle_delete_account: () => Promise<boolean>;
  handle_change_password: (email: string, oldPass: string, newPass: string) => Promise<boolean>;
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
  handle_reject_suggestion,
  handle_vote_suggestion,
  handle_transfer_role,
  get_family_members,
  get_family_complaints,
  show_quejometro = true,
  accessibility_options,
  update_accessibility,
  speak,
  handle_delete_account,
  handle_change_password
}: MiFamiliaProps) => {
  const [familyName, setFamilyName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [new_family_code, set_new_family_code] = useState<string | null>(null);
  const [new_family_name, set_new_family_name] = useState<string>('');
  const [code_copied, set_code_copied] = useState<boolean>(false);
  const [confirm_leave, set_confirm_leave] = useState<string | null>(null);
  const [show_transfer, set_show_transfer] = useState<string | null>(null);
  const [transfer_members, set_transfer_members] = useState<FamilyMemberInfo[]>([]);
  const [loading_members, set_loading_members] = useState<boolean>(false);

  const [active_family_members, set_active_family_members] = useState<FamilyMemberInfo[]>([]);
  const [quejometro, set_quejometro] = useState<Record<string, number>>({});
  const [loading_active_members, set_loading_active_members] = useState<boolean>(false);
  const [confirm_delete_account, set_confirm_delete_account] = useState<boolean>(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[@$!%*?&]/.test(newPassword);
  const isNewPasswordSecure = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Todos los campos son obligatorios.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Las nuevas contraseñas no coinciden.');
      return;
    }

    if (!isNewPasswordSecure) {
      setPasswordError('La nueva contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    setLoading(true);
    try {
      const ok = await handle_change_password(user?.email || '', oldPassword, newPassword);
      if (ok) {
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordSuccess(true);
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.active_family_id) {
      set_loading_active_members(true);
      Promise.all([
        get_family_members(profile.active_family_id),
        get_family_complaints(profile.active_family_id)
      ]).then(([members, complaints]) => {
        set_active_family_members(members);
        set_quejometro(complaints);
      }).catch(console.error).finally(() => {
        set_loading_active_members(false);
      });
    } else {
      set_active_family_members([]);
      set_quejometro({});
    }
  }, [profile?.active_family_id, suggestions]);

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

  const handle_copy_code = async (code: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code);
      set_code_copied(true);
      setTimeout(() => set_code_copied(false), 2500);
    } catch {
      set_code_copied(false);
    }
  };

  const on_leave_click = (family_id: string, role: string): void => {
    if (role === 'cocinitas') {
      set_confirm_leave(family_id);
    } else {
      handle_leave_family(family_id);
    }
  };

  const open_transfer_screen = async (family_id: string): Promise<void> => {
    set_loading_members(true);
    set_show_transfer(family_id);
    const members = await get_family_members(family_id);
    const others = members.filter(m => m.user_id !== user.id);
    set_transfer_members(others);
    set_loading_members(false);
  };

  const pending_suggestions = suggestions.filter(s => s.status === 'pendiente');

  // Family creation success screen
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
            onClick={() => handle_copy_code(new_family_code)}
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

  // Cocinitas dissolution confirm dialog
  if (confirm_leave) {
    return (
      <PageContainer>
        <Spacer height={8} />
        <CardContainer style={{ textAlign: 'center', padding: '32px 24px' }}>
          <AlertTriangle size={48} style={{ color: '#ef5350', marginBottom: 16 }} />
          <TitleH2>⚠️ Abandonar como Cocinitas</TitleH2>
          <Spacer height={12} />
          <TextMuted>
            Eres <strong style={{ color: '#f26841' }}>El Cocinitas</strong> de esta unidad familiar.
            Si la abandonas <strong>sin transferir el rol</strong>, la unidad familiar <strong style={{ color: '#ef5350' }}>se disolverá</strong> y
            todos los miembros pasarán a su otra unidad familiar (si la tienen) o a modo local.
          </TextMuted>

          <Spacer height={20} />

          <Boton
            texto="Transferir el rol primero"
            clase_css="full-width"
            icono={<ArrowRightLeft size={16} />}
            on_click={() => {
              const fid = confirm_leave;
              set_confirm_leave(null);
              open_transfer_screen(fid);
            }}
          />

          <Spacer height={10} />

          <Boton
            texto="Abandonar de todas formas (disolver)"
            clase_css="full-width"
            variante="outlined"
            color="error"
            icono={<AlertTriangle size={16} />}
            on_click={() => {
              handle_leave_family(confirm_leave);
              set_confirm_leave(null);
            }}
          />

          <Spacer height={10} />

          <Boton
            texto="Cancelar"
            clase_css="full-width"
            variante="text"
            on_click={() => set_confirm_leave(null)}
          />
        </CardContainer>
      </PageContainer>
    );
  }

  // Transfer role screen
  if (show_transfer) {
    return (
      <PageContainer>
        <Spacer height={8} />
        <TitleH2>Transferir rol de "El Cocinitas" 🍳</TitleH2>
        <TextMuted>Elige al miembro que será el nuevo Cocinitas de esta unidad familiar:</TextMuted>
        <Spacer height={12} />

        {loading_members ? (
          <CardContainer>
            <TextMuted style={{ textAlign: 'center', padding: '16px 0' }}>
              Cargando miembros...
            </TextMuted>
          </CardContainer>
        ) : transfer_members.length === 0 ? (
          <CardContainer>
            <TextMuted style={{ textAlign: 'center', padding: '16px 0' }}>
              No hay otros miembros en esta familia. Necesitas que alguien se una con el código de invitación antes de poder transferir el rol.
            </TextMuted>
          </CardContainer>
        ) : (
          <PantryInputGrid style={{ gridTemplateColumns: '1fr', gap: 10 }}>
            {transfer_members.map(m => (
              <CardContainer key={m.user_id}>
                <FlexRow style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <PantryItemName>{m.display_name}</PantryItemName>
                    <TextMuted style={{ fontSize: 11 }}>Rol actual: {m.role === 'cocinitas' ? 'El Cocinitas' : 'Miembro'}</TextMuted>
                  </div>
                  <Boton
                    texto="Hacer Cocinitas"
                    clase_css="btn-sm"
                    color="warning"
                    icono={<ChefHat size={14} />}
                    on_click={async () => {
                      await handle_transfer_role(show_transfer, m.user_id);
                      set_show_transfer(null);
                      set_transfer_members([]);
                    }}
                  />
                </FlexRow>
              </CardContainer>
            ))}
          </PantryInputGrid>
        )}

        <Spacer height={16} />
        <Boton
          texto="Volver"
          variante="outlined"
          clase_css="full-width"
          on_click={() => {
            set_show_transfer(null);
            set_transfer_members([]);
          }}
        />
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
                  <div style={{ flex: 1 }}>
                    <TitleH2 style={{ fontSize: 16, marginBottom: 4 }}>{fam.family_name}</TitleH2>
                    <TextMuted style={{ fontSize: 12 }}>
                      Rol: <strong style={{ color: fam.role === 'cocinitas' ? '#f26841' : '#90caf9' }}>
                        {fam.role === 'cocinitas' ? 'El Cocinitas 🍳' : 'Miembro 🍽️'}
                      </strong>
                    </TextMuted>
                    {fam.role === 'cocinitas' && fam.invite_code && (
                      <div
                        onClick={() => handle_copy_code(fam.invite_code!)}
                        style={{ cursor: 'pointer', marginTop: 4 }}
                      >
                        <TextMuted style={{ fontSize: 12 }}>
                          Código:{' '}
                          <strong style={{ fontFamily: 'monospace', letterSpacing: 3, color: '#f26841' }}>
                            {fam.invite_code}
                          </strong>
                          {' '}<Copy size={11} style={{ opacity: 0.5 }} />
                        </TextMuted>
                      </div>
                    )}
                  </div>
                  <FlexRow style={{ gap: 6, flexShrink: 0 }}>
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
                  </FlexRow>
                </FlexRow>

                <FlexRow style={{ marginTop: 10, gap: 8 }}>
                  {fam.role === 'cocinitas' && (
                    <Boton
                      texto="Transferir Rol"
                      variante="outlined"
                      color="warning"
                      clase_css="btn-sm"
                      icono={<ArrowRightLeft size={14} />}
                      on_click={() => open_transfer_screen(fam.family_id)}
                    />
                  )}
                  <Boton
                    texto="Abandonar"
                    variante="outlined"
                    color="error"
                    clase_css="btn-sm"
                    icono={<X size={14} />}
                    on_click={() => on_leave_click(fam.family_id, fam.role)}
                  />
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

      {profile?.active_family_id && (
        <>
          <Spacer height={20} />
          <TitleH2 style={{ fontSize: 17 }}>Miembros de la Familia Activa</TitleH2>
          <Spacer height={8} />
          {loading_active_members ? (
            <CardContainer>
              <TextMuted style={{ textAlign: 'center', padding: '12px 0' }}>
                Cargando miembros de la familia...
              </TextMuted>
            </CardContainer>
          ) : (
            <PantryInputGrid style={{ gridTemplateColumns: '1fr', gap: 10 }}>
              {active_family_members.map(m => {
                const complaints_count = quejometro[m.user_id] || 0;
                let rank = "😇 Santo del plato (Come lo que le eches)";
                let rankColor = "#81c784";
                if (complaints_count >= 1 && complaints_count <= 3) {
                  rank = "🍽️ Comensal estándar";
                  rankColor = "#90caf9";
                } else if (complaints_count > 3) {
                  rank = "🤬 El del piquito fino (Le toca fregar platos 🧼)";
                  rankColor = "#ef5350";
                }

                return (
                  <CardContainer key={m.user_id} style={{ padding: '12px 16px' }}>
                    <FlexRow style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <PantryItemName style={{ fontSize: 15 }}>
                          {m.display_name} {m.user_id === user.id ? '(Tú)' : ''}
                        </PantryItemName>
                        <TextMuted style={{ fontSize: 12, marginTop: 2 }}>
                          Rol: <strong>{m.role === 'cocinitas' ? 'El Cocinitas 🍳' : 'Miembro 🍽️'}</strong>
                        </TextMuted>
                      </div>
                      {show_quejometro && (
                        <div style={{ textAlign: 'right', minWidth: '150px' }}>
                          <span style={{ fontSize: 11, display: 'block', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Quejómetro:</span>
                          <span style={{ fontSize: 12, fontWeight: 'bold', color: rankColor }}>
                            {rank} ({complaints_count} queja{complaints_count !== 1 ? 's' : ''})
                          </span>
                        </div>
                      )}
                    </FlexRow>
                  </CardContainer>
                );
              })}
            </PantryInputGrid>
          )}
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

      {/* Suggestions section — visible to ALL roles */}
      {profile?.active_family_id && pending_suggestions.length > 0 && (
        <>
          <Spacer height={20} />
          <TitleH2 style={{ fontSize: 17 }}>
            Sugerencias de Cambio ({pending_suggestions.length})
          </TitleH2>
          <TextMuted style={{ fontSize: 13 }}>
            {current_role === 'cocinitas'
              ? 'Como "El Cocinitas", puedes aprobar o rechazar estas sugerencias.'
              : 'Vota las sugerencias. Solo "El Cocinitas" decide si se aprueban.'}
          </TextMuted>
          <Spacer height={8} />
          <PantryInputGrid style={{ gridTemplateColumns: '1fr', gap: 10 }}>
            {pending_suggestions.map(s => (
              <CardContainer key={s.id} style={{ padding: '16px' }}>
                <FlexRow style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <PantryItemName style={{ fontSize: 14 }}>
                      📅 Día {s.day} — {s.meal_type.charAt(0).toUpperCase() + s.meal_type.slice(1)}
                    </PantryItemName>
                    <TitleH2 style={{ fontSize: 15, margin: '4px 0' }}>
                      {s.recipe_name}
                    </TitleH2>
                    <TextMuted style={{ fontSize: 12 }}>
                      Propuesto por: {s.user_display_name}
                    </TextMuted>
                  </div>
                </FlexRow>

                {/* Vote counters */}
                <FlexRow style={{ marginTop: 12, gap: 16, alignItems: 'center' }}>
                  <FlexRow
                    style={{
                      gap: 6,
                      cursor: 'pointer',
                      padding: '4px 10px',
                      borderRadius: 8,
                      backgroundColor: s.my_vote === 'like' ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.05)',
                      border: s.my_vote === 'like' ? '1px solid rgba(76,175,80,0.5)' : '1px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handle_vote_suggestion(s.id, 'like')}
                  >
                    <ThumbsUp size={16} style={{ color: s.my_vote === 'like' ? '#66bb6a' : 'rgba(255,255,255,0.4)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: s.my_vote === 'like' ? '#66bb6a' : 'rgba(255,255,255,0.6)' }}>
                      {s.likes_count || 0}
                    </span>
                  </FlexRow>

                  <FlexRow
                    style={{
                      gap: 6,
                      cursor: 'pointer',
                      padding: '4px 10px',
                      borderRadius: 8,
                      backgroundColor: s.my_vote === 'dislike' ? 'rgba(239,83,80,0.2)' : 'rgba(255,255,255,0.05)',
                      border: s.my_vote === 'dislike' ? '1px solid rgba(239,83,80,0.5)' : '1px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handle_vote_suggestion(s.id, 'dislike')}
                  >
                    <ThumbsDown size={16} style={{ color: s.my_vote === 'dislike' ? '#ef5350' : 'rgba(255,255,255,0.4)' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: s.my_vote === 'dislike' ? '#ef5350' : 'rgba(255,255,255,0.6)' }}>
                      {s.dislikes_count || 0}
                    </span>
                  </FlexRow>
                </FlexRow>

                {/* Cocinitas-only approve/reject */}
                {current_role === 'cocinitas' && (
                  <FlexRow style={{ marginTop: 10, gap: 8 }}>
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
                      variante="outlined"
                      clase_css="btn-sm"
                      icono={<X size={14} />}
                      on_click={() => handle_reject_suggestion(s.id)}
                    />
                  </FlexRow>
                )}
              </CardContainer>
            ))}
          </PantryInputGrid>
        </>
      )}

      {user && (
        <>
          <CardContainer style={{ padding: '16px', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 'bold', display: 'block', marginBottom: 12 }}>
              👁️ Accesibilidad (Discapacidad Visual)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={accessibility_options.high_contrast}
                  onChange={(e) => {
                    update_accessibility('high_contrast', e.target.checked);
                    speak("Modo alto contraste " + (e.target.checked ? "activado" : "desactivado"));
                  }}
                  style={{ width: 18, height: 18 }}
                />
                <span>Modo Alto Contraste (Fondo negro y texto amarillo/blanco)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={accessibility_options.large_text}
                  onChange={(e) => {
                    update_accessibility('large_text', e.target.checked);
                    speak("Texto grande " + (e.target.checked ? "activado" : "desactivado"));
                  }}
                  style={{ width: 18, height: 18 }}
                />
                <span>Texto Grande (Aumentar tamaño de letra)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={accessibility_options.read_aloud}
                  onChange={(e) => {
                    update_accessibility('read_aloud', e.target.checked);
                    if (!e.target.checked) {
                      speak("Audio-guía desactivada.");
                    }
                  }}
                  style={{ width: 18, height: 18 }}
                />
                <span>Audio-guía (Leer en voz alta los elementos al hacer clic)</span>
              </label>
            </div>
          </CardContainer>

          <CardContainer style={{ padding: '16px', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 'bold', display: 'block', marginBottom: 12 }}>
              🔒 Cambiar Contraseña
            </span>
            <form onSubmit={handleChangePasswordSubmit}>
              {passwordError && (
                <div style={{ color: '#e53e3e', fontSize: 12, marginBottom: 12 }}>
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div style={{ color: '#48bb78', fontSize: 12, marginBottom: 12 }}>
                  ¡Contraseña actualizada con éxito!
                </div>
              )}
              <FormGroup>
                <FormLabel>Contraseña Actual</FormLabel>
                <CampoTexto
                  etiqueta=""
                  valor={oldPassword}
                  on_change={setOldPassword}
                  tipo="password"
                  marcador_posicion="Contraseña actual"
                  requerido
                />
              </FormGroup>
              <FormGroup>
                <FormLabel>Nueva Contraseña</FormLabel>
                <CampoTexto
                  etiqueta=""
                  valor={newPassword}
                  on_change={setNewPassword}
                  tipo="password"
                  marcador_posicion="Contraseña"
                  requerido
                />
              </FormGroup>
              {newPassword.length > 0 && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  marginBottom: 12
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#888', marginBottom: 4 }}>Nueva contraseña debe tener:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '10px', color: hasMinLength ? '#48bb78' : '#e53e3e' }}>
                    {hasMinLength ? '✓' : '✗'} Mínimo 8 caracteres
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '10px', color: hasUpper ? '#48bb78' : '#e53e3e' }}>
                    {hasUpper ? '✓' : '✗'} Al menos una mayúscula
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '10px', color: hasLower ? '#48bb78' : '#e53e3e' }}>
                    {hasLower ? '✓' : '✗'} Al menos una minúscula
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '10px', color: hasNumber ? '#48bb78' : '#e53e3e' }}>
                    {hasNumber ? '✓' : '✗'} Al menos un número
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '10px', color: hasSpecial ? '#48bb78' : '#e53e3e' }}>
                    {hasSpecial ? '✓' : '✗'} Al menos un carácter especial (@$!%*?&)
                  </div>
                </div>
              )}
              <Spacer height={6} />
              <FormGroup>
                <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                <CampoTexto
                  etiqueta=""
                  valor={confirmNewPassword}
                  on_change={setConfirmNewPassword}
                  tipo="password"
                  marcador_posicion="Confirmar nueva contraseña"
                  requerido
                />
              </FormGroup>
              <Boton
                texto="Actualizar Contraseña"
                tipo="submit"
                clase_css="full-width"
                deshabilitado={loading || (!isNewPasswordSecure && newPassword.length > 0)}
              />
            </form>
          </CardContainer>

          <CardContainer style={{ padding: '16px', marginBottom: 16, border: '1px solid rgba(239, 83, 80, 0.3)', backgroundColor: 'rgba(239, 83, 80, 0.04)' }}>
            <span style={{ fontSize: 14, fontWeight: 'bold', color: '#ef5350', display: 'block', marginBottom: 8 }}>
              ⚠️ Zona de Peligro
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginBottom: 12 }}>
              Al eliminar tu cuenta, se borrarán todos tus datos de planificación, despensa, lista de la compra y tu suscripción a unidades familiares de forma permanente.
            </span>
            {confirm_delete_account ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Boton
                  texto="Confirmar Eliminación Permanente"
                  color="error"
                  on_click={async () => {
                    setLoading(true);
                    await handle_delete_account();
                    setLoading(false);
                  }}
                  clase_css="full-width"
                />
                <Boton
                  texto="Cancelar"
                  color="primary"
                  variante="outlined"
                  on_click={() => set_confirm_delete_account(false)}
                />
              </div>
            ) : (
              <Boton
                texto="Eliminar mi Cuenta"
                color="error"
                variante="outlined"
                clase_css="full-width"
                on_click={() => set_confirm_delete_account(true)}
              />
            )}
          </CardContainer>
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
