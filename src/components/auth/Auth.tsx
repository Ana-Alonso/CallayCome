import { useState } from 'react';
import { LogIn, UserPlus, Mail } from 'lucide-react';
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
  FlexRow
} from '../common';

interface AuthProps {
  on_login: (email: string, pass: string) => Promise<boolean>;
  on_signup: (email: string, pass: string) => Promise<boolean>;
  on_success: () => void;
}

export const Auth = ({ on_login, on_signup, on_success }: AuthProps) => {
  const [is_login, set_is_login] = useState<boolean>(true);
  const [email, set_email] = useState<string>('');
  const [password, set_password] = useState<string>('');
  const [loading, set_loading] = useState<boolean>(false);
  const [awaiting_confirmation, set_awaiting_confirmation] = useState<boolean>(false);

  const handle_submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    set_loading(true);
    try {
      if (is_login) {
        const ok = await on_login(email.trim(), password);
        if (ok) {
          set_email('');
          set_password('');
          on_success();
        }
      } else {
        const ok = await on_signup(email.trim(), password);
        if (ok) {
          set_email('');
          set_password('');
          on_success();
        } else {
          set_awaiting_confirmation(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      set_loading(false);
    }
  };

  if (awaiting_confirmation) {
    return (
      <PageContainer>
        <CardContainer style={{ textAlign: 'center', padding: '32px 24px' }}>
          <Mail size={48} style={{ color: '#f26841', marginBottom: 16 }} />
          <TitleH2>Confirma tu correo</TitleH2>
          <Spacer height={12} />
          <TextMuted>
            Hemos enviado un enlace de confirmación a <strong>{email}</strong>.
            Haz clic en el enlace del correo para activar tu cuenta.
          </TextMuted>
          <Spacer height={16} />
          <TextMuted style={{ fontSize: 12, color: '#f26841' }}>
            ¿No llega el correo? El administrador puede desactivar la confirmación de email en
            Supabase → Authentication → Providers → Email → "Confirm email".
          </TextMuted>
          <Spacer height={20} />
          <Boton
            texto="Volver al inicio de sesión"
            variante="outlined"
            clase_css="full-width"
            on_click={() => {
              set_awaiting_confirmation(false);
              set_is_login(true);
            }}
          />
        </CardContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <TitleH2>{is_login ? 'Acceso a Tu Cuenta' : 'Crea tu Cuenta'}</TitleH2>
      <TextMuted>
        {is_login 
          ? 'Identifícate para sincronizar tu despensa y plan con tu familia.' 
          : 'Regístrate para poder crear o unirte a unidades familiares.'}
      </TextMuted>

      <Spacer height={10} />

      <CardContainer component="form" onSubmit={handle_submit}>
        <FormGroup>
          <FormLabel>Correo Electrónico</FormLabel>
          <CampoTexto
            etiqueta=""
            valor={email}
            on_change={set_email}
            tipo="email"
            marcador_posicion="ejemplo@correo.com"
            requerido
          />
        </FormGroup>

        <FormGroup>
          <FormLabel>Contraseña</FormLabel>
          <CampoTexto
            etiqueta=""
            valor={password}
            on_change={set_password}
            tipo="password"
            marcador_posicion="Mínimo 6 caracteres"
            requerido
          />
        </FormGroup>

        <Spacer height={10} />

        <Boton
          texto={loading ? 'Procesando...' : is_login ? 'Iniciar Sesión' : 'Registrarse'}
          tipo="submit"
          icono={is_login ? <LogIn size={18} /> : <UserPlus size={18} />}
          clase_css="full-width"
          deshabilitado={loading}
        />

        <Spacer height={12} />

        <FlexRow style={{ justifyContent: 'center' }}>
          <Boton
            texto={is_login ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
            on_click={() => {
              set_is_login(!is_login);
              set_awaiting_confirmation(false);
            }}
            variante="text"
            tipo="button"
            clase_css="btn-sm"
          />
        </FlexRow>
      </CardContainer>
    </PageContainer>
  );
};
