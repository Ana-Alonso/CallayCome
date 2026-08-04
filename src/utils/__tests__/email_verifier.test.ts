import { describe, it, expect } from 'vitest';
import { validateEmailSecurity, normalizeEmail } from '../email_verifier';

describe('Email Verifier Security - LCDLA', () => {
  it('should normalize Gmail and Googlemail addresses by stripping dots and canonicalizing domain during login/signup', () => {
    expect(normalizeEmail('u.s.e.r.name@gmail.com')).toBe('username@gmail.com');
    expect(normalizeEmail('USER.Name@Gmail.Com ')).toBe('username@gmail.com');
    expect(normalizeEmail('ana.maria.gomez@googlemail.com')).toBe('anamariagomez@gmail.com');
  });

  it('should validate and normalize googlemail.com emails accurately', () => {
    const res = validateEmailSecurity('u.s.e.r@googlemail.com');
    expect(res.isValid).toBe(true);
    expect(res.normalizedEmail).toBe('user@gmail.com');
  });

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

  it('should reject disposable/temporary email domains and their subdomains', () => {
    const resExact = validateEmailSecurity('pruebas@mailinator.com');
    expect(resExact.isValid).toBe(false);
    expect(resExact.error).toContain('temporales o desechables');

    const resSubdomain = validateEmailSecurity('user@foo.mailinator.com');
    expect(resSubdomain.isValid).toBe(false);
    expect(resSubdomain.error).toContain('temporales o desechables');
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
