import { useState } from 'react';
import { Home, Users, PlusCircle, Check, X, LogOut } from 'lucide-react';
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
  handle_create_family: (name: string) => Promise<void>;
  handle_join_family: (invite_code: string) => Promise<void>;
  handle_switch_family: (family_id: string | null) => Promise<void>;
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
  handle_approve_suggestion,
  handle_reject_suggestion
}: MiFamiliaProps) => {
  const [familyName, setFamilyName] = useState<string>('');
  const [inviteCode, setInviteCode] = useState<string>('');

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
    await handle_create_family(familyName.trim());
    setFamilyName('');
  };

  const handle_join_submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    await handle_join_family(inviteCode.trim());
    setInviteCode('');
  };

  return (
    <PageContainer>
      <TitleH2>Mi Familia 🏠</TitleH2>
      <TextMuted>Usuario: {profile?.email || user.email}</TextMuted>

      <Spacer height={16} />

      <TitleH2 style={{ fontSize: 18 }}>Mis Unidades Familiares</TitleH2>
      <TextMuted>Perteneces a las siguientes familias (máximo 2):</TextMuted>
      <Spacer height={8} />

      {my_families.length === 0 ? (
        <CardContainer>
          <TextMuted style={{ textAlign: 'center', padding: '12px 0' }}>
            No formas parte de ninguna unidad familiar. Tu planificación es local.
          </TextMuted>
        </CardContainer>
      ) : (
        <PantryInputGrid style={{ gridTemplateColumns: '1fr', gap: 10 }}>
          {my_families.map(fam => {
            const isActive = profile?.active_family_id === fam.family_id;
            return (
              <CardContainer key={fam.family_id} style={{ borderColor: isActive ? '#f26841' : '#32323e' }}>
                <FlexRow style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <TitleH2 style={{ fontSize: 16 }}>{fam.family_name}</TitleH2>
                    <TextMuted style={{ fontSize: 12 }}>Rol: <strong>{fam.role === 'cocinitas' ? 'El Cocinitas 🍳' : 'Miembro 🍽️'}</strong></TextMuted>
                    <TextMuted style={{ fontSize: 12 }}>Código invitación: <strong>{fam.invite_code}</strong></TextMuted>
                  </div>
                  {isActive ? (
                    <StatusBadge status="completed">Activa</StatusBadge>
                  ) : (
                    <Boton
                      texto="Activar"
                      clase_css="btn-sm"
                      on_click={() => handle_switch_family(fam.family_id)}
                    />
                  )}
                </FlexRow>
              </CardContainer>
            );
          })}
        </PantryInputGrid>
      )}

      {my_families.length > 0 && profile?.active_family_id && (
        <Spacer height={10} />
      )}
      {my_families.length > 0 && profile?.active_family_id && (
        <Boton
          texto="Desactivar Familia Activa (Modo Local)"
          variante="outlined"
          color="inherit"
          clase_css="full-width btn-sm"
          on_click={() => handle_switch_family(null)}
        />
      )}

      {my_families.length < 2 && (
        <>
          <Spacer height={20} />
          <TitleH2 style={{ fontSize: 18 }}>Añadir Familia</TitleH2>
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
              <Boton
                texto="Crear"
                tipo="submit"
                icono={<PlusCircle size={16} />}
                clase_css="full-width btn-sm"
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
              <Boton
                texto="Unirse"
                tipo="submit"
                icono={<Users size={16} />}
                clase_css="full-width btn-sm"
              />
            </CardContainer>
          </PantryInputGrid>
        </>
      )}

      {profile?.active_family_id && current_role === 'cocinitas' && (
        <>
          <Spacer height={20} />
          <TitleH2 style={{ fontSize: 18 }}>Propuestas de Cambio Pendientes</TitleH2>
          <TextMuted>Como "El Cocinitas", debes decidir si apruebas o rechazas estas sugerencias:</TextMuted>
          <Spacer height={8} />

          {suggestions.length === 0 ? (
            <CardContainer>
              <TextMuted style={{ textAlign: 'center', padding: '12px 0' }}>
                No hay sugerencias pendientes en tu familia.
              </TextMuted>
            </CardContainer>
          ) : (
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
          )}
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
