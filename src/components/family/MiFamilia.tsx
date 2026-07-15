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
  get_family_complaints
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
                      <div style={{ textAlign: 'right', minWidth: '150px' }}>
                        <span style={{ fontSize: 11, display: 'block', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Quejómetro:</span>
                        <span style={{ fontSize: 12, fontWeight: 'bold', color: rankColor }}>
                          {rank} ({complaints_count} queja{complaints_count !== 1 ? 's' : ''})
                        </span>
                      </div>
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
