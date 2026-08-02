import React from 'react';

const H2_STYLE: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', color: '#4ade80' };
const P_STYLE: React.CSSProperties = { lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', marginBottom: '0.75rem' };
const TH_STYLE: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', background: 'rgba(74,222,128,0.15)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' };
const TD_STYLE: React.CSSProperties = { padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', fontSize: '14px' };

const CookiePolicy: React.FC = () => {
  const lastUpdated = '2 de agosto de 2026';

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
          <span style={{ fontSize: '48px' }}>🍪</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '12px', color: '#fff' }}>
            Política de Cookies
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            Última actualización: {lastUpdated}
          </p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={H2_STYLE}>¿Qué son las cookies?</h2>
          <p style={P_STYLE}>
            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas una
            aplicación web. Se usan para que la aplicación recuerde tus preferencias, mantenerte conectado/a
            y mejorar tu experiencia de uso.
          </p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={H2_STYLE}>Cookies que utilizamos</h2>

          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={TH_STYLE}>Nombre / Clave</th>
                  <th style={TH_STYLE}>Tipo</th>
                  <th style={TH_STYLE}>Finalidad</th>
                  <th style={TH_STYLE}>Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={TD_STYLE}><code>sb-*-auth-token</code></td>
                  <td style={TD_STYLE}>Esencial</td>
                  <td style={TD_STYLE}>Token de sesión de Supabase Auth. Mantiene tu sesión activa.</td>
                  <td style={TD_STYLE}>Sesión / 1 hora</td>
                </tr>
                <tr>
                  <td style={TD_STYLE}><code>calla_y_come_cookie_consent</code></td>
                  <td style={TD_STYLE}>Esencial</td>
                  <td style={TD_STYLE}>Guarda tus preferencias de cookies para no mostrarte el banner en cada visita.</td>
                  <td style={TD_STYLE}>1 año</td>
                </tr>
                <tr>
                  <td style={TD_STYLE}><code>calla_y_come_start_date</code></td>
                  <td style={TD_STYLE}>Funcional</td>
                  <td style={TD_STYLE}>Recuerda la fecha de inicio del planificador de menús.</td>
                  <td style={TD_STYLE}>Persistente</td>
                </tr>
                <tr>
                  <td style={TD_STYLE}><code>fit_daily_metrics</code></td>
                  <td style={TD_STYLE}>Funcional</td>
                  <td style={TD_STYLE}>Almacena métricas diarias de agua y sueño para persistencia entre sesiones.</td>
                  <td style={TD_STYLE}>Persistente</td>
                </tr>
                <tr>
                  <td style={TD_STYLE}><code>supermarket_custom_macros</code></td>
                  <td style={TD_STYLE}>Funcional</td>
                  <td style={TD_STYLE}>Caché local de macronutrientes de productos para búsquedas más rápidas.</td>
                  <td style={TD_STYLE}>Persistente</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              background: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
              ✅ <strong>No utilizamos Google Analytics, Google Tag Manager, Facebook Pixel ni ninguna cookie
              de rastreo de terceros.</strong> Todos los datos se almacenan localmente en tu dispositivo o
              en nuestra base de datos segura (Supabase) bajo tu cuenta.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={H2_STYLE}>Almacenamiento local (localStorage)</h2>
          <p style={P_STYLE}>
            La aplicación usa <strong>localStorage</strong> del navegador para guardar preferencias y datos
            temporales. El localStorage no es una cookie en sentido estricto (no se envía al servidor en
            cada petición), pero cumple funciones similares. Los datos almacenados en localStorage:
          </p>
          <ul style={{ paddingLeft: '1.5rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
            <li>Permanecen en tu dispositivo hasta que los borres manualmente o uses la opción de "cerrar sesión".</li>
            <li>No son accesibles por otros sitios web (política de mismo origen).</li>
            <li>Puedes eliminarlos desde los ajustes de tu navegador (Herramientas → Borrar datos de navegación).</li>
          </ul>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={H2_STYLE}>Cómo gestionar o rechazar las cookies</h2>
          <p style={P_STYLE}>
            Puedes gestionar tus preferencias de cookies en cualquier momento usando el banner de cookies
            que aparece la primera vez que usas la aplicación, o contactándonos en{' '}
            <a href="mailto:privacidad@callaycome.es" style={{ color: '#4ade80' }}>privacidad@callaycome.es</a>.
          </p>
          <p style={P_STYLE}>
            También puedes configurar tu navegador para bloquear o eliminar cookies. Ten en cuenta que si
            deshabilitas las cookies esenciales (de sesión), no podrás iniciar sesión en la aplicación.
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
          <a href="/terms" style={{ color: '#4ade80', fontSize: '14px' }}>Términos de Servicio</a>
          <a href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>← Volver a la app</a>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
