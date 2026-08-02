import React, { useState, useEffect } from 'react';

type ConsentChoice = 'all' | 'essential' | null;

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const STORAGE_KEY = 'calla_y_come_cookie_consent';

export function getCookieConsent(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as CookiePreferences;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.analytics === true;
}

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = getCookieConsent();
    if (!stored) {
      // Pequeño retraso para que no bloquee el render inicial
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (choice: ConsentChoice) => {
    let prefs: CookiePreferences;
    if (choice === 'all') {
      prefs = { essential: true, analytics: true, marketing: true };
    } else {
      prefs = { essential: true, analytics: false, marketing: false };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setVisible(false);
  };

  const saveCustomPreferences = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay semitransparente */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 9998,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Banner principal */}
      <div
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-modal="true"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          padding: '24px',
          color: '#fff',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Cabecera */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '28px' }}>🍪</span>
            <div>
              <h2
                id="cookie-banner-title"
                style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}
              >
                Usamos cookies
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                Usamos cookies esenciales para que la aplicación funcione. Con tu permiso, también podríamos usar
                cookies analíticas para mejorar la experiencia. Consulta nuestra{' '}
                <a href="/cookies" style={{ color: '#4ade80', textDecoration: 'underline' }}>
                  Política de Cookies
                </a>{' '}
                y nuestra{' '}
                <a href="/privacy" style={{ color: '#4ade80', textDecoration: 'underline' }}>
                  Política de Privacidad
                </a>
                .
              </p>
            </div>
          </div>

          {/* Detalles de cookies (opcional) */}
          {showDetails && (
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Esenciales */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'not-allowed' }}>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    style={{ width: '18px', height: '18px', accentColor: '#4ade80' }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px' }}>Cookies esenciales</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      Necesarias para la autenticación y funcionamiento básico. No se pueden desactivar.
                    </p>
                  </div>
                </label>

                {/* Analíticas */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: '#4ade80' }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px' }}>Cookies analíticas</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      Nos ayudan a entender cómo usas la app para mejorarla. No rastrean tu identidad.
                    </p>
                  </div>
                </label>

                {/* Marketing */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(p => ({ ...p, marketing: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: '#4ade80' }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px' }}>Cookies de marketing</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      Actualmente no utilizamos cookies de marketing. Esta opción está disponible para el futuro.
                    </p>
                  </div>
                </label>
              </div>

              <button
                onClick={saveCustomPreferences}
                id="cookie-save-preferences-btn"
                style={{
                  marginTop: '14px',
                  padding: '10px 20px',
                  background: 'rgba(74,222,128,0.2)',
                  border: '1px solid #4ade80',
                  borderRadius: '8px',
                  color: '#4ade80',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Guardar mis preferencias
              </button>
            </div>
          )}

          {/* Botones principales */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button
              id="cookie-accept-all-btn"
              onClick={() => saveConsent('all')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                border: 'none',
                borderRadius: '10px',
                color: '#000',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(74,222,128,0.3)',
              }}
            >
              Aceptar todas
            </button>

            <button
              id="cookie-essential-only-btn"
              onClick={() => saveConsent('essential')}
              style={{
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Solo esenciales
            </button>

            <button
              id="cookie-manage-btn"
              onClick={() => setShowDetails(v => !v)}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '10px',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {showDetails ? 'Ocultar opciones' : 'Gestionar preferencias'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
