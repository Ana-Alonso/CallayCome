import { useState } from 'react';
import { LogIn, Mail, Lock, ShieldAlert, Check, X, KeyRound, ArrowLeft, UserPlus } from 'lucide-react';
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
import { get_supabase_client } from '../../services/supabase_client';
import { validateEmailSecurity, normalizeEmail } from '../../utils/email_verifier';

interface AuthProps {
  on_login: (email: string, pass: string) => Promise<boolean>;
  on_signup?: (email: string, pass: string) => Promise<boolean>;
  on_success: () => void;
}

interface PasswordRequirements {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

function checkPasswordRequirements(pass: string): PasswordRequirements {
  return {
    length: pass.length >= 8,
    uppercase: /[A-Z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass),
  };
}

function getStrengthLevel(reqs: PasswordRequirements): { label: string; color: string; percent: number } {
  const count = Object.values(reqs).filter(Boolean).length;
  if (count <= 1) return { label: 'Débil', color: '#e53e3e', percent: 25 };
  if (count <= 3) return { label: 'Media', color: '#dd6b20', percent: 65 };
  return { label: 'Fuerte', color: '#38a169', percent: 100 };
}

export const Auth = ({ on_login, on_signup, on_success }: AuthProps) => {
  const [mode, set_mode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, set_email] = useState<string>('');
  const [password, set_password] = useState<string>('');
  const [loading, set_loading] = useState<boolean>(false);
  const [error_msg, set_error_msg] = useState<string>('');
  const [success_msg, set_success_msg] = useState<string>('');

  const reqs = checkPasswordRequirements(password);
  const strength = getStrengthLevel(reqs);

  const handle_submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email.trim()) return;

    set_error_msg('');
    set_success_msg('');
    set_loading(true);

    try {
      if (mode === 'forgot') {
        const client = get_supabase_client();
        if (!client) throw new Error('Cliente Supabase no configurado.');
        const targetEmail = normalizeEmail(email.trim());
        const { error } = await client.auth.resetPasswordForEmail(targetEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        set_success_msg('Te hemos enviado un enlace para restablecer tu contraseña a tu correo electrónico.');
        return;
      }

      if (mode === 'signup' && on_signup) {
        const emailValidation = validateEmailSecurity(email.trim());
        if (!emailValidation.isValid) {
          throw new Error(emailValidation.error || 'El correo electrónico no es válido.');
        }

        if (!reqs.length || !reqs.uppercase || !reqs.number || !reqs.special) {
          throw new Error('La contraseña no cumple todos los requisitos de seguridad.');
        }
        const ok = await on_signup(emailValidation.normalizedEmail || email.trim(), password);
        if (ok) {
          set_email('');
          set_password('');
          on_success();
        }
        return;
      }

      // Default: login
      const ok = await on_login(email.trim(), password);
      if (ok) {
        set_email('');
        set_password('');
        on_success();
      }
    } catch (err: any) {
      console.error(err);
      set_error_msg(err.message || 'Ocurrió un error inesperado.');
    } finally {
      set_loading(false);
    }
  };

  return (
    <PageContainer>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img
          src="/logo.jpg"
          alt="La Cocina de la Abuela"
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            objectFit: 'cover',
            marginBottom: 16,
            boxShadow: '0 4px 20px rgba(242, 104, 65, 0.35)',
            border: '3px solid rgba(242, 104, 65, 0.3)',
          }}
        />
        <TitleH2>Calla y Come</TitleH2>
        <Spacer height={8} />
        <TextMuted>
          {mode === 'forgot'
            ? 'Recuperación de contraseña'
            : mode === 'signup'
            ? 'Crear nueva cuenta'
            : 'Acceso solo para miembros invitados'}
        </TextMuted>
      </div>

      <CardContainer component="form" onSubmit={handle_submit}>
        {mode !== 'forgot' && (
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
        )}

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

        {success_msg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(56, 161, 105, 0.08)',
            border: '1px solid rgba(56, 161, 105, 0.25)',
            borderRadius: 8,
            padding: '10px 12px',
            color: '#38a169',
            fontSize: '12px',
            marginBottom: 16
          }}>
            <Check size={14} style={{ flexShrink: 0 }} />
            <span>{success_msg}</span>
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

        {mode !== 'forgot' && (
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

            {/* Indicador de Fortaleza de Contraseña */}
            {password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#888' }}>Fortaleza:</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: strength.color }}>{strength.label}</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${strength.percent}%`, height: '100%', background: strength.color, transition: 'all 0.3s' }} />
                </div>

                {/* Requisitos detallados */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', marginTop: 8, fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: reqs.length ? '#38a169' : '#888' }}>
                    {reqs.length ? <Check size={12} /> : <X size={12} />} Mínimo 8 caracteres
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: reqs.uppercase ? '#38a169' : '#888' }}>
                    {reqs.uppercase ? <Check size={12} /> : <X size={12} />} Mayúscula
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: reqs.number ? '#38a169' : '#888' }}>
                    {reqs.number ? <Check size={12} /> : <X size={12} />} Número
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: reqs.special ? '#38a169' : '#888' }}>
                    {reqs.special ? <Check size={12} /> : <X size={12} />} Carácter especial
                  </div>
                </div>
              </div>
            )}
          </FormGroup>
        )}

        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => { set_mode('forgot'); set_error_msg(''); set_success_msg(''); }}
              style={{ background: 'none', border: 'none', color: '#f26841', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        <Spacer height={6} />

        <Boton
          texto={
            loading
              ? 'Procesando...'
              : mode === 'forgot'
              ? 'Enviar enlace de recuperación'
              : mode === 'signup'
              ? 'Crear Cuenta'
              : 'Iniciar Sesión'
          }
          tipo="submit"
          icono={
            mode === 'forgot' ? <KeyRound size={18} /> : mode === 'signup' ? <UserPlus size={18} /> : <LogIn size={18} />
          }
          clase_css="full-width"
          deshabilitado={loading}
        />

        <Spacer height={16} />

        {mode === 'forgot' ? (
          <FlexRow style={{ justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => { set_mode('login'); set_error_msg(''); set_success_msg(''); }}
              style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ArrowLeft size={14} /> Volver al inicio de sesión
            </button>
          </FlexRow>
        ) : (
          <FlexRow style={{ justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            <Mail size={13} style={{ color: 'var(--color-text-muted, #888)' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted, #888)' }}>
              ¿No tienes cuenta?{' '}
              {on_signup ? (
                <button
                  type="button"
                  onClick={() => set_mode(mode === 'login' ? 'signup' : 'login')}
                  style={{ background: 'none', border: 'none', color: '#f26841', fontWeight: 500, cursor: 'pointer', padding: 0 }}
                >
                  {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                </button>
              ) : (
                <a
                  href="mailto:alonsogomezana03@gmail.com"
                  style={{ color: 'var(--color-primary, #f26841)', fontWeight: 500 }}
                >
                  Solicita acceso por email
                </a>
              )}
            </span>
          </FlexRow>
        )}
      </CardContainer>
    </PageContainer>
  );
};
