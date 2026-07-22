import { LogIn, Mail, Lock } from 'lucide-react';
import { useState } from 'react';
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
} from '../common';

interface AuthProps {
  on_login: (email: string, pass: string) => Promise<boolean>;
  on_signup: (email: string, pass: string) => Promise<boolean>;
  on_success: () => void;
}

export const Auth = ({ on_login, on_success }: AuthProps) => {
  const [email, set_email] = useState<string>('');
  const [password, set_password] = useState<string>('');
  const [loading, set_loading] = useState<boolean>(false);

  const handle_submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    set_loading(true);
    try {
      const ok = await on_login(email.trim(), password);
      if (ok) {
        set_email('');
        set_password('');
        on_success();
      }
    } catch (err) {
      console.error(err);
    } finally {
      set_loading(false);
    }
  };

  return (
    <PageContainer>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f26841, #e84393)',
          marginBottom: 16,
          fontSize: 28,
        }}>
          🍳
        </div>
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
          marginBottom: 18,
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
            marcador_posicion="Tu contraseña"
            requerido
          />
        </FormGroup>

        <Spacer height={10} />

        <Boton
          texto={loading ? 'Accediendo...' : 'Iniciar Sesión'}
          tipo="submit"
          icono={<LogIn size={18} />}
          clase_css="full-width"
          deshabilitado={loading}
        />

        <Spacer height={20} />

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Mail size={13} style={{ color: 'var(--color-text-muted, #888)' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted, #888)' }}>
              ¿Necesitas acceso?{' '}
              <a
                href="mailto:alonsogomezana03@gmail.com"
                style={{ color: 'var(--color-primary, #f26841)', fontWeight: 500 }}
              >
                Solicita una invitación
              </a>
            </span>
          </div>
        </div>
      </CardContainer>
    </PageContainer>
  );
};
