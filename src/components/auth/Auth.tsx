import { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, Check, X, ShieldAlert } from 'lucide-react';
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
  const [error_msg, set_error_msg] = useState<string>('');
  const [awaiting_confirmation, set_awaiting_confirmation] = useState<boolean>(false);

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);
  const isPasswordSecure = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handle_submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    set_error_msg('');

    if (!is_login && !isPasswordSecure) {
      set_error_msg('La contraseña debe cumplir todos los requisitos de seguridad.');
      return;
    }

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
    } catch (err: any) {
      console.error(err);
      set_error_msg(err.message || 'Ocurrió un error inesperado.');
    } finally {
      set_loading(false);
    }
  };

  const render_requirement = (met: boolean, text: string) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: '11px',
      color: met ? '#48bb78' : '#e53e3e',
      transition: 'color 0.2s',
      marginBottom: 3
    }}>
      {met ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
      <span>{text}</span>
    </div>
  );

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
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f26841, #e84393)',
          marginBottom: 12,
          fontSize: 24,
        }}>
          🍳
        </div>
        <TitleH2>{is_login ? 'Acceso a Tu Cuenta' : 'Crea tu Cuenta'}</TitleH2>
        <Spacer height={6} />
        <TextMuted>
          {is_login
            ? 'Identifícate para sincronizar tu despensa y plan con tu familia.'
            : 'Regístrate para poder crear o unirte a unidades familiares.'}
        </TextMuted>
      </div>

      <CardContainer component="form" onSubmit={handle_submit}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(242, 104, 65, 0.08)',
          border: '1px solid rgba(242, 104, 65, 0.25)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 16,
        }}>
          <Lock size={14} style={{ color: '#f26841', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#f26841', lineHeight: 1.4 }}>
            Esta aplicación es privada. Si eres reclutador/a y quieres ver una demo,{' '}
            <a
              href="mailto:alonsogomezana03@gmail.com"
              style={{ color: '#f26841', fontWeight: 600 }}
            >
              contáctame
            </a>
            .
          </span>
        </div>

        {error_msg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(229, 62, 62, 0.08)',
            border: '1px solid rgba(229, 62, 62, 0.25)',
            borderRadius: 8,
            padding: '10px 12px',
            color: '#e53e3e',
            fontSize: '12px',
            marginBottom: 16
          }}>
            <ShieldAlert size={14} style={{ flexShrink: 0 }} />
            <span>{error_msg}</span>
          </div>
        )}

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
            marcador_posicion="Contraseña"
            requerido
          />
        </FormGroup>

        {!is_login && password.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 16
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted, #888)', marginBottom: 6 }}>Requisitos de seguridad:</div>
            {render_requirement(hasMinLength, 'Mínimo 8 caracteres')}
            {render_requirement(hasUpper, 'Al menos una letra mayúscula')}
            {render_requirement(hasLower, 'Al menos una letra minúscula')}
            {render_requirement(hasNumber, 'Al menos un número')}
            {render_requirement(hasSpecial, 'Al menos un carácter especial (@$!%*?&)')}
          </div>
        )}

        <Spacer height={6} />

        <Boton
          texto={loading ? 'Procesando...' : is_login ? 'Iniciar Sesión' : 'Registrarse'}
          tipo="submit"
          icono={is_login ? <LogIn size={18} /> : <UserPlus size={18} />}
          clase_css="full-width"
          deshabilitado={loading || (!is_login && !isPasswordSecure && password.length > 0)}
        />

        <Spacer height={12} />

        <FlexRow style={{ justifyContent: 'center' }}>
          <Boton
            texto={is_login ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
            on_click={() => {
              set_is_login(!is_login);
              set_password('');
              set_error_msg('');
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
