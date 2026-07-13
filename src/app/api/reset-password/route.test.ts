import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST as requestReset } from './route';
import { POST as confirmReset } from './confirm/route';

function makeRequest(path: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('password reset api routes', () => {
  const originalApiBaseUrl = process.env.BBNL_API_BASE_URL;

  afterEach(() => {
    process.env.BBNL_API_BASE_URL = originalApiBaseUrl;
    vi.unstubAllGlobals();
  });

  it('requests customer reset links through the Laravel customer API endpoint', async () => {
    process.env.BBNL_API_BASE_URL = 'https://backend.test';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'We have emailed your password reset link.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await requestReset(makeRequest('/api/reset-password', {
      email: 'customer@example.com',
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('We have emailed your password reset link.');
    expect(fetchMock).toHaveBeenCalledWith('https://backend.test/api/reset/password', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'customer@example.com' }),
    }));
  });

  it('validates email before requesting a reset link', async () => {
    process.env.BBNL_API_BASE_URL = 'https://backend.test';
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await requestReset(makeRequest('/api/reset-password', {
      email: 'not-an-email',
    }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.errors.email[0]).toBe('Please enter a valid email address.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('submits customer reset tokens to the Laravel customer confirm endpoint', async () => {
    process.env.BBNL_API_BASE_URL = 'https://backend.test/';
    const payload = {
      token: 'secret-token',
      email: 'customer@example.com',
      password: 'new-password',
      password_confirmation: 'new-password',
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Your password has been reset.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await confirmReset(makeRequest('/api/reset-password/confirm', payload));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('Your password has been reset.');
    expect(fetchMock).toHaveBeenCalledWith('https://backend.test/api/reset/password/confirm', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  });
});
