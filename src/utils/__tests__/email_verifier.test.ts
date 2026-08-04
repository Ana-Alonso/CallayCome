import { describe, it, expect } from 'vitest';
import { validateEmailSecurity } from '../email_verifier';

describe('Email Verifier Security - LCDLA', () => {
  it('should accept valid standard email addresses', () => {
    const res = validateEmailSecurity('usuario.ejemplo@gmail.com');
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
    expect(res.normalizedEmail).toBe('usuarioejemplo@gmail.com');
  });

  it('should reject invalid email syntax', () => {
    const res = validateEmailSecurity('correo-invalido-sin-arroba');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('formato');
  });

  it('should reject disposable/temporary email domains', () => {
    const res = validateEmailSecurity('pruebas@mailinator.com');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('temporales o desechables');
  });

  it('should reject plus addressing alias emails (e.g. user+alias@gmail.com)', () => {
    const res = validateEmailSecurity('ana.gomez+multicuenta1@gmail.com');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('alias');
  });

  it('should handle empty or non-string input gracefully', () => {
    const res = validateEmailSecurity('');
    expect(res.isValid).toBe(false);
  });
});
