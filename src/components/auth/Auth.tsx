import { useState } from 'react';
import { LogIn, Mail, Lock, ShieldAlert } from 'lucide-react';
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
  on_signup?: (email: string, pass: string) => Promise<boolean>;
  on_success: () => void;
}

export const Auth = ({ on_login, on_success }: AuthProps) => {
  const [email, set_email] = useState<string>('');
  const [password, set_password] = useState<string>('');
  const [loading, set_loading] = useState<boolean>(false);
  const [error_msg, set_error_msg] = useState<string>('');

  const handle_submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    set_error_msg('');
    set_loading(true);
    try {
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
        <TextMuted>Acceso solo para miembros invitados</TextMuted>
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
            Esta aplicación es privada y el registro es solo por invitación. Si eres reclutador/a y quieres ver una demo,{' '}
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

        <Spacer height={6} />

        <Boton
          texto={loading ? 'Procesando...' : 'Iniciar Sesión'}
          tipo="submit"
          icono={<LogIn size={18} />}
          clase_css="full-width"
          deshabilitado={loading}
        />

        <Spacer height={16} />

        <FlexRow style={{ justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <Mail size={13} style={{ color: 'var(--color-text-muted, #888)' }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted, #888)' }}>
            ¿No tienes cuenta?{' '}
            <a
              href="mailto:alonsogomezana03@gmail.com"
              style={{ color: 'var(--color-primary, #f26841)', fontWeight: 500 }}
            >
              Solicita acceso por email
            </a>
          </span>
        </FlexRow>
      </CardContainer>
    </PageContainer>
  );
};
