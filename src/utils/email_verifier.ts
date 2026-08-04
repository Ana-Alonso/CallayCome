/**
 * Utilidades para verificación y validación de correo electrónico.
 * Previene multicuentas bloqueando correos temporales/desechables y alias con sub-direccionamiento.
 */

// Lista de dominios de correo desechable/temporal conocidos
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'yopmail.com',
  'guerrillamail.com',
  'tempmail.com',
  '10minutemail.com',
  'trashmail.com',
  'dispostable.com',
  'getnada.com',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.org',
  'tmpmail.net',
  'tmpmail.org',
  'disposable.com',
  'fakeinbox.com',
  'throwawaymail.com',
  'mytrashmail.com',
  'maildrop.cc',
  'crazymailing.com',
  'tmail.ws',
  'mohmal.com',
  '0815.ru',
  'boximail.com'
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  normalizedEmail?: string;
}

/**
 * Normaliza una dirección de correo electrónico (reemplaza puntos en Gmail, convierte a minúsculas y quita espacios).
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const cleanEmail = email.trim().toLowerCase();
  const parts = cleanEmail.split('@');
  if (parts.length !== 2) return cleanEmail;

  let [localPart, domain] = parts;
  let normalizedLocal = localPart;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    normalizedLocal = localPart.replace(/\./g, '');
    domain = 'gmail.com';
  }

  return `${normalizedLocal}@${domain}`;
}

/**
 * Valida un correo electrónico para registro de usuario.
 * @param email Correo electrónico a evaluar
 * @returns Resultado con booleano isValid y mensaje de error si aplica
 */
export function validateEmailSecurity(email: string): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'El correo electrónico es obligatorio.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Expresión regular estándar para formato de email RFC 5322 simplificado
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, error: 'El formato del correo electrónico no es válido.' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Formato de correo inválido.' };
  }

  const [localPart, domain] = parts;

  // 2. Bloquear dominios de correo desechables / temporales (coincidencia exacta o subdominios)
  const isDisposable = Array.from(DISPOSABLE_EMAIL_DOMAINS).some(
    d => domain === d || domain.endsWith(`.${d}`)
  );
  if (isDisposable) {
    return {
      isValid: false,
      error: 'No se permiten direcciones de correo temporales o desechables. Utiliza un correo real.'
    };
  }

  // 3. Bloquear alias de plus-addressing (ej. usuario+1@gmail.com) para evitar multicuentas
  if (localPart.includes('+')) {
    return {
      isValid: false,
      error: 'No se permiten alias de correo con el signo (+). Utiliza tu dirección principal.'
    };
  }

  const normalizedEmail = normalizeEmail(cleanEmail);

  return {
    isValid: true,
    normalizedEmail
  };
}
