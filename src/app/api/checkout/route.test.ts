import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { CHECKOUT_RETURN_LOCALE_COOKIE } from '@/lib/i18n/config';

describe('checkout payment return locale', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('marks an English external payment flow for an English return URL', async () => {
    vi.stubEnv('BBNL_API_BASE_URL', 'https://api.example.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      payment_url: 'https://payments.example.test/checkout',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const { POST } = await import('./route');
    const response = await POST(new NextRequest('http://localhost/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: 'NEXT_LOCALE=en',
      },
      body: JSON.stringify({ payment_method: 'ideal' }),
    }));

    expect(response.cookies.get(CHECKOUT_RETURN_LOCALE_COOKIE)?.value).toBe('en');
  });
});
