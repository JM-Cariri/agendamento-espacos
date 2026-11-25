import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from './client.js';

afterEach(() => vi.restoreAllMocks());

describe('API client', () => {
  it('uses relative API URLs and cookie credentials without setting or exposing auth tokens', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"user":{"id":4}}', { status: 200 }));
    await request('/auth/login', { method: 'POST', body: { email: 'user@example.test', password: 'secret' } });
    const [, options] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/login');
    expect(options.credentials).toBe('include');
    expect(options.headers.Origin).toBeUndefined();
    expect(JSON.parse(options.body)).toEqual({ email: 'user@example.test', password: 'secret' });
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('returns actionable server errors and details', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: 'Conflito de horário.', details: ['Escolha outro slot.'] }), { status: 409 }));
    await expect(request('/reservas', { method: 'POST', body: {} })).rejects.toMatchObject({
      name: 'ApiError', status: 409, message: 'Conflito de horário.', details: ['Escolha outro slot.'],
    });
    expect(ApiError).toBeDefined();
  });
});
