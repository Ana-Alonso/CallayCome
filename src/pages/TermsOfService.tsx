import React from 'react';

const SECTION_STYLE: React.CSSProperties = { marginBottom: '2rem' };
const H2_STYLE: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4ade80' };
const P_STYLE: React.CSSProperties = { lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', marginBottom: '0.75rem' };
const LI_STYLE: React.CSSProperties = { lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', marginBottom: '0.4rem' };

const TermsOfService: React.FC = () => {
  const lastUpdated = '2 de agosto de 2026';
  const contactEmail = 'contacto@callaycome.es';
  const appName = 'Calla y Come FIT';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff',
        fontFamily: "'Inter', sans-serif",
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '48px' }}>📋</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '12px', color: '#fff' }}>
            Términos de Servicio
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            Última actualización: {lastUpdated}
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <p style={P_STYLE}>
            Bienvenido/a a <strong>{appName}</strong>. Al acceder y utilizar esta aplicación, aceptas quedar
            vinculado/a por los presentes Términos de Servicio. Si no estás de acuerdo con alguno de ellos,
            te rogamos que no utilices la aplicación.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>1. Descripción del Servicio</h2>
          <p style={P_STYLE}>
            {appName} es una aplicación de planificación nutricional y fitness que permite a los usuarios:
            planificar menús semanales/mensuales, gestionar la despensa y lista de la compra, registrar
            actividades físicas, calcular macronutrientes y calorías, y sincronizar datos con dispositivos
            wearables compatibles.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>2. Uso Aceptable</h2>
          <p style={P_STYLE}>Aceptas usar la aplicación únicamente para fines lícitos y de conformidad con estos términos. Queda prohibido:</p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li style={LI_STYLE}>Usar la aplicación para actividades ilegales o que perjudiquen a terceros.</li>
            <li style={LI_STYLE}>Intentar acceder sin autorización a sistemas, datos o cuentas de otros usuarios.</li>
            <li style={LI_STYLE}>Realizar ataques de denegación de servicio, scrapers automatizados o abusar de las APIs.</li>
            <li style={LI_STYLE}>Publicar contenido falso, difamatorio, obsceno o que infrinja derechos de terceros.</li>
            <li style={LI_STYLE}>Revertir la ingeniería, descompilar o desensamblar el software de la aplicación.</li>
          </ul>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>3. Cuenta de Usuario</h2>
          <p style={P_STYLE}>
            Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las
            actividades que se realicen bajo tu cuenta. Notifícanos inmediatamente si sospechas un acceso
            no autorizado a{' '}
            <a href={`mailto:${contactEmail}`} style={{ color: '#4ade80' }}>{contactEmail}</a>.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>4. Información Nutricional y de Salud</h2>
          <p style={P_STYLE}>
            <strong>Aviso importante:</strong> La información nutricional, los cálculos calóricos y las
            recomendaciones de macronutrientes proporcionados por {appName} son <strong>orientativos</strong> y
            no constituyen asesoramiento médico profesional. Consulta siempre con un médico, nutricionista
            o dietista antes de realizar cambios significativos en tu alimentación o rutina de ejercicio,
            especialmente si tienes condiciones médicas preexistentes.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>5. Propiedad Intelectual</h2>
          <p style={P_STYLE}>
            El código fuente, diseño, logotipos y contenido de {appName} son propiedad de Ana Alonso — Calla y Come,
            protegidos por las leyes de propiedad intelectual. Las recetas incluidas en la aplicación se
            proporcionan para uso personal y no comercial.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>6. Disponibilidad del Servicio</h2>
          <p style={P_STYLE}>
            Nos esforzamos por mantener la aplicación disponible de forma continua, pero no garantizamos una
            disponibilidad ininterrumpida. Podemos suspender temporalmente el acceso por mantenimiento,
            actualizaciones o causas de fuerza mayor.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>7. Limitación de Responsabilidad</h2>
          <p style={P_STYLE}>
            En la máxima medida permitida por la ley aplicable, {appName} no será responsable de daños
            indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de
            uso de la aplicación. Nuestra responsabilidad máxima estará limitada al importe que hayas
            pagado por el servicio en los últimos 12 meses (actualmente 0€, ya que el servicio es gratuito).
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>8. Privacidad</h2>
          <p style={P_STYLE}>
            El tratamiento de tus datos personales se rige por nuestra{' '}
            <a href="/privacy" style={{ color: '#4ade80' }}>Política de Privacidad</a>, que forma parte
            integrante de estos Términos de Servicio.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>9. Modificación de los Términos</h2>
          <p style={P_STYLE}>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
            significativos serán notificados dentro de la aplicación. El uso continuado de la aplicación
            tras la publicación de cambios implica la aceptación de los mismos.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>10. Legislación Aplicable y Jurisdicción</h2>
          <p style={P_STYLE}>
            Estos términos se rigen por la legislación española. Para cualquier disputa, las partes se
            someten a la jurisdicción de los Juzgados y Tribunales de España, sin perjuicio de los
            derechos que la normativa europea de consumidores te reconozca.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>11. Contacto</h2>
          <p style={P_STYLE}>
            Si tienes alguna pregunta sobre estos Términos de Servicio, puedes contactarnos en:{' '}
            <a href={`mailto:${contactEmail}`} style={{ color: '#4ade80' }}>{contactEmail}</a>
          </p>
        </div>

        <div
          style={{
            marginTop: '3rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <a href="/privacy" style={{ color: '#4ade80', fontSize: '14px' }}>Política de Privacidad</a>
          <a href="/cookies" style={{ color: '#4ade80', fontSize: '14px' }}>Política de Cookies</a>
          <a href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>← Volver a la app</a>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
