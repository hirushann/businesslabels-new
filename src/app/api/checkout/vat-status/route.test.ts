import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

describe('checkout VAT status proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('returns the backend canonical VAT decision', async () => {
    vi.stubEnv('BBNL_API_BASE_URL', 'https://api.example.test/');
    const backendResponse = {
      data: { vat_validation_status: 'valid', vat_shifted: true, tax_rate: 0 },
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(backendResponse));
    vi.stubGlobal('fetch', fetchMock);

    const { POST } = await import('./route');
    const requestBody = {
      billing_country: 'BE',
      vat_number: 'BE0123456789',
      shipping_country: 'DE',
    };
    const response = await POST(new NextRequest('http://localhost/api/checkout/vat-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }));

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/vat-status', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(requestBody),
      cache: 'no-store',
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(backendResponse);
  });

  it('fails closed to charged VAT when the backend is unavailable', async () => {
    vi.stubEnv('BBNL_API_BASE_URL', 'https://api.example.test');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { POST } = await import('./route');
    const response = await POST(new NextRequest('http://localhost/api/checkout/vat-status', {
      method: 'POST',
      body: JSON.stringify({ billing_country: 'BE', vat_number: 'BE0123456789', shipping_country: 'DE' }),
    }));

    expect(response.status).toBe(502);
  });
});
