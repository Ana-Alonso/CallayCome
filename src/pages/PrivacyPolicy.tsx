import React from 'react';

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: '2rem',
};

const H2_STYLE: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 700,
  marginBottom: '0.75rem',
  color: '#4ade80',
};

const P_STYLE: React.CSSProperties = {
  lineHeight: 1.7,
  color: 'rgba(255,255,255,0.85)',
  marginBottom: '0.75rem',
};

const LI_STYLE: React.CSSProperties = {
  lineHeight: 1.7,
  color: 'rgba(255,255,255,0.85)',
  marginBottom: '0.4rem',
};

const PrivacyPolicy: React.FC = () => {
  const lastUpdated = '2 de agosto de 2026';
  const contactEmail = 'privacidad@callaycome.es';
  const appName = 'Calla y Come FIT';
  const companyName = 'Ana Alonso — Calla y Come';

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
        {/* Cabecera */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '48px' }}>🔒</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '12px', color: '#fff' }}>
            Política de Privacidad
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            Última actualización: {lastUpdated}
          </p>
        </div>

        {/* Intro */}
        <div style={SECTION_STYLE}>
          <p style={P_STYLE}>
            En <strong>{appName}</strong> nos comprometemos a proteger y respetar tu privacidad. Esta política
            explica cómo recogemos, usamos y protegemos tus datos personales cuando utilizas nuestra aplicación,
            de conformidad con el Reglamento General de Protección de Datos (RGPD) de la Unión Europea y la
            Ley Orgánica de Protección de Datos y Garantía de los Derechos Digitales (LOPDGDD) de España.
          </p>
        </div>

        {/* 1. Responsable */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>1. Responsable del Tratamiento</h2>
          <p style={P_STYLE}>
            <strong>Identidad:</strong> {companyName}<br />
            <strong>Correo electrónico:</strong>{' '}
            <a href={`mailto:${contactEmail}`} style={{ color: '#4ade80' }}>{contactEmail}</a>
          </p>
        </div>

        {/* 2. Datos que recogemos */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>2. Datos que Recogemos</h2>
          <p style={P_STYLE}>Podemos recoger los siguientes datos personales:</p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li style={LI_STYLE}><strong>Datos de registro:</strong> correo electrónico y contraseña (gestionada de forma segura por Supabase Auth con encriptación bcrypt).</li>
            <li style={LI_STYLE}><strong>Datos de perfil:</strong> nombre, objetivos nutricionales, peso, altura, nivel de actividad física.</li>
            <li style={LI_STYLE}><strong>Datos de uso:</strong> planificación de menús, despensa, lista de la compra, registro de actividades físicas, registro de alimentos consumidos.</li>
            <li style={LI_STYLE}><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo y sistema operativo (solo para diagnóstico de errores).</li>
          </ul>
          <p style={P_STYLE}>
            <strong>No recogemos</strong> datos de pago, documentos de identidad, ni datos especialmente protegidos (salud clínica, origen étnico, etc.).
            Los datos biométricos (peso, IMC) se usan exclusivamente para calcular objetivos nutricionales y <strong>no se comparten con terceros</strong>.
          </p>
        </div>

        {/* 3. Finalidad */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>3. Finalidad del Tratamiento</h2>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li style={LI_STYLE}>Gestionar tu cuenta y autenticar tu acceso a la aplicación.</li>
            <li style={LI_STYLE}>Proporcionar las funcionalidades de planificación de menús, despensa y lista de la compra.</li>
            <li style={LI_STYLE}>Calcular tu gasto calórico, macronutrientes y objetivos fitness personalizados.</li>
            <li style={LI_STYLE}>Sincronizar datos entre dispositivos dentro de tu unidad familiar (si aplica).</li>
            <li style={LI_STYLE}>Mejorar la aplicación mediante análisis de uso anónimo (solo si has dado tu consentimiento).</li>
            <li style={LI_STYLE}>Enviarte notificaciones de la aplicación relacionadas con tu actividad (con tu consentimiento).</li>
          </ul>
        </div>

        {/* 4. Base jurídica */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>4. Base Jurídica del Tratamiento</h2>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li style={LI_STYLE}><strong>Ejecución de un contrato:</strong> necesario para prestarte el servicio (Art. 6.1.b RGPD).</li>
            <li style={LI_STYLE}><strong>Consentimiento:</strong> para cookies analíticas y notificaciones opcionales (Art. 6.1.a RGPD).</li>
            <li style={LI_STYLE}><strong>Interés legítimo:</strong> para seguridad y prevención de fraude (Art. 6.1.f RGPD).</li>
          </ul>
        </div>

        {/* 5. Conservación */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>5. Conservación de los Datos</h2>
          <p style={P_STYLE}>
            Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, todos los datos personales
            se eliminarán de nuestros servidores en un plazo máximo de <strong>30 días</strong>, salvo que la ley
            nos obligue a conservarlos durante más tiempo.
          </p>
        </div>

        {/* 6. Destinatarios */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>6. Destinatarios y Transferencias Internacionales</h2>
          <p style={P_STYLE}>
            Utilizamos los siguientes proveedores de servicios que pueden tratar datos personales:
          </p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li style={LI_STYLE}><strong>Supabase Inc. (EE. UU.):</strong> base de datos y autenticación. Transferencia amparada por las Cláusulas Contractuales Tipo de la UE.</li>
            <li style={LI_STYLE}><strong>Render (EE. UU.):</strong> hospedaje de la API de supermercados. Sin datos personales.</li>
          </ul>
          <p style={P_STYLE}>
            <strong>No vendemos ni cedemos</strong> tus datos personales a terceros con fines comerciales.
          </p>
        </div>

        {/* 7. Derechos */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>7. Tus Derechos</h2>
          <p style={P_STYLE}>De conformidad con el RGPD, tienes los siguientes derechos:</p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li style={LI_STYLE}><strong>Acceso:</strong> obtener confirmación de si tratamos tus datos y acceder a ellos.</li>
            <li style={LI_STYLE}><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li style={LI_STYLE}><strong>Supresión ("derecho al olvido"):</strong> solicitar la eliminación de tus datos.</li>
            <li style={LI_STYLE}><strong>Oposición:</strong> oponerte al tratamiento de tus datos para fines concretos.</li>
            <li style={LI_STYLE}><strong>Limitación:</strong> solicitar la restricción del tratamiento.</li>
            <li style={LI_STYLE}><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y legible por máquina.</li>
            <li style={LI_STYLE}><strong>Retirar el consentimiento:</strong> en cualquier momento, sin que afecte al tratamiento previo.</li>
          </ul>
          <p style={P_STYLE}>
            Para ejercer estos derechos, escríbenos a{' '}
            <a href={`mailto:${contactEmail}`} style={{ color: '#4ade80' }}>{contactEmail}</a>.
            También puedes presentar una reclamación ante la{' '}
            <a
              href="https://www.aepd.es"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4ade80' }}
            >
              Agencia Española de Protección de Datos (AEPD)
            </a>.
          </p>
        </div>

        {/* 8. Seguridad */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>8. Seguridad de los Datos</h2>
          <p style={P_STYLE}>
            Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos:
          </p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li style={LI_STYLE}>Contraseñas almacenadas con hash bcrypt (nunca en texto plano).</li>
            <li style={LI_STYLE}>Row Level Security (RLS) en la base de datos: ningún usuario puede acceder a datos de otros.</li>
            <li style={LI_STYLE}>Comunicaciones cifradas mediante HTTPS/TLS.</li>
            <li style={LI_STYLE}>Rate limiting en las APIs para prevenir abusos.</li>
          </ul>
        </div>

        {/* 9. Cookies */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>9. Cookies</h2>
          <p style={P_STYLE}>
            Utilizamos cookies y tecnologías similares. Consulta nuestra{' '}
            <a href="/cookies" style={{ color: '#4ade80' }}>Política de Cookies</a> para más información.
          </p>
        </div>

        {/* 10. Menores */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>10. Menores de Edad</h2>
          <p style={P_STYLE}>
            Esta aplicación no está dirigida a menores de 16 años. No recogemos conscientemente datos de menores.
            Si crees que un menor nos ha proporcionado datos, contáctanos para eliminarlos.
          </p>
        </div>

        {/* 11. Cambios */}
        <div style={SECTION_STYLE}>
          <h2 style={H2_STYLE}>11. Cambios en esta Política</h2>
          <p style={P_STYLE}>
            Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios significativos dentro
            de la aplicación. La fecha de "última actualización" al inicio de esta página indica cuándo se
            realizó la última revisión.
          </p>
        </div>

        {/* Footer */}
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
          <a href="/terms" style={{ color: '#4ade80', fontSize: '14px' }}>Términos de Servicio</a>
          <a href="/cookies" style={{ color: '#4ade80', fontSize: '14px' }}>Política de Cookies</a>
          <a href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>← Volver a la app</a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
