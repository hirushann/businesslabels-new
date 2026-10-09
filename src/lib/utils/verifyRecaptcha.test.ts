import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { verifyRecaptcha } from './verifyRecaptcha';

describe('verifyRecaptcha', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('bypasses verification when SKIP_RECAPTCHA=true', async () => {
    process.env.SKIP_RECAPTCHA = 'true';
    const result = await verifyRecaptcha('dummy-token', 'contact_form');
    expect(result.success).toBe(true);
    expect(result.score).toBe(1);
    expect(result.action).toBe('contact_form');
  });

  it('bypasses verification failure in development mode when token fails', async () => {
    process.env.SKIP_RECAPTCHA = 'false';
    (process.env as any).NODE_ENV = 'development';
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({
        success: false,
        'error-codes': ['browser-error'],
      }),
    } as Response);

    const result = await verifyRecaptcha('invalid-token', 'contact_form');
    expect(result.success).toBe(true);
    expect(result.score).toBe(1);
  });

  it('fails in production mode when token is invalid', async () => {
    process.env.SKIP_RECAPTCHA = 'false';
    (process.env as any).NODE_ENV = 'production';
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({
        success: false,
        'error-codes': ['browser-error'],
      }),
    } as Response);

    const result = await verifyRecaptcha('invalid-token', 'contact_form');
    expect(result.success).toBe(false);
    expect(result.reason).toBe('reCAPTCHA token is invalid or expired.');
  });

  it('fails in production mode when score is below threshold', async () => {
    process.env.SKIP_RECAPTCHA = 'false';
    (process.env as any).NODE_ENV = 'production';
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({
        success: true,
        score: 0.3,
        action: 'contact_form',
      }),
    } as Response);

    const result = await verifyRecaptcha('valid-token', 'contact_form', 0.5);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('reCAPTCHA score too low. Possible bot activity.');
  });

  it('succeeds in production mode when score and action match', async () => {
    process.env.SKIP_RECAPTCHA = 'false';
    (process.env as any).NODE_ENV = 'production';
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret';

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({
        success: true,
        score: 0.9,
        action: 'contact_form',
      }),
    } as Response);

    const result = await verifyRecaptcha('valid-token', 'contact_form', 0.5);
    expect(result.success).toBe(true);
    expect(result.score).toBe(0.9);
    expect(result.action).toBe('contact_form');
  });
});
