import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { createApiClient, isUnauthorized, isForbidden, isServerError } from '@/lib/api-client';

const ctx = { tenantId: 't-001', userId: 'u-001', token: 'test-token' };

describe('createApiClient', () => {
  describe('get', () => {
    it('makes a GET request and returns ok result', async () => {
      server.use(
        http.get('http://localhost:3001/test', () => {
          return HttpResponse.json({ message: 'hello' });
        })
      );

      const client = createApiClient(ctx);
      const result = await client.get<{ message: string }>('/test');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.message).toBe('hello');
      }
    });

    it('appends query params to GET request', async () => {
      server.use(
        http.get('http://localhost:3001/search', ({ request }) => {
          const url = new URL(request.url);
          return HttpResponse.json({ q: url.searchParams.get('q') });
        })
      );

      const client = createApiClient(ctx);
      const result = await client.get<{ q: string }>('/search', { q: 'test' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.q).toBe('test');
      }
    });

    it('sets tenant and auth headers', async () => {
      let capturedHeaders: Record<string, string | null> = {};
      server.use(
        http.get('http://localhost:3001/auth-check', ({ request }) => {
          capturedHeaders = {
            tenantId: request.headers.get('x-tenant-id'),
            authorization: request.headers.get('authorization'),
          };
          return HttpResponse.json({});
        })
      );

      const client = createApiClient(ctx);
      await client.get('/auth-check');

      expect(capturedHeaders.tenantId).toBe('t-001');
      expect(capturedHeaders.authorization).toBe('Bearer test-token');
    });
  });

  describe('post', () => {
    it('makes a POST request with JSON body', async () => {
      let capturedBody: unknown;
      server.use(
        http.post('http://localhost:3001/items', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ id: 'item-001' });
        })
      );

      const client = createApiClient(ctx);
      const result = await client.post<{ id: string }>('/items', { name: 'Widget' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('item-001');
      }
      expect(capturedBody).toEqual({ name: 'Widget' });
    });
  });

  describe('put', () => {
    it('makes a PUT request with JSON body', async () => {
      server.use(
        http.put('http://localhost:3001/items/1', () => {
          return HttpResponse.json({ updated: true });
        })
      );

      const client = createApiClient(ctx);
      const result = await client.put<{ updated: boolean }>('/items/1', { name: 'Updated' });

      expect(result.ok).toBe(true);
    });
  });

  describe('patch', () => {
    it('makes a PATCH request with JSON body', async () => {
      server.use(
        http.patch('http://localhost:3001/items/1', () => {
          return HttpResponse.json({ patched: true });
        })
      );

      const client = createApiClient(ctx);
      const result = await client.patch<{ patched: boolean }>('/items/1', { status: 'active' });

      expect(result.ok).toBe(true);
    });
  });

  describe('delete', () => {
    it('makes a DELETE request', async () => {
      server.use(
        http.delete('http://localhost:3001/items/1', () => {
          return HttpResponse.json({ deleted: true });
        })
      );

      const client = createApiClient(ctx);
      const result = await client.delete<{ deleted: boolean }>('/items/1');

      expect(result.ok).toBe(true);
    });
  });

  describe('error handling', () => {
    it('returns ApiError for 4xx responses', async () => {
      server.use(
        http.get('http://localhost:3001/not-found', () => {
          return HttpResponse.json(
            { code: 'NOT_FOUND', message: 'Resource not found' },
            { status: 404 }
          );
        })
      );

      const client = createApiClient(ctx);
      const result = await client.get('/not-found');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.message).toBe('Resource not found');
        expect(result.error.statusCode).toBe(404);
      }
    });

    it('returns ApiError for 500 responses', async () => {
      server.use(
        http.get('http://localhost:3001/fail', () => {
          return HttpResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Server error' },
            { status: 500 }
          );
        })
      );

      const client = createApiClient(ctx);
      const result = await client.get('/fail');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.statusCode).toBe(500);
      }
    });

    it('returns NETWORK_ERROR on fetch failure', async () => {
      server.use(
        http.get('http://localhost:3001/crash', () => {
          return HttpResponse.error();
        })
      );

      const client = createApiClient(ctx);
      const result = await client.get('/crash');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.statusCode).toBe(0);
      }
    });

    it('handles non-JSON error bodies gracefully', async () => {
      server.use(
        http.get('http://localhost:3001/bad-json', () => {
          return new HttpResponse('not json', { status: 400 });
        })
      );

      const client = createApiClient(ctx);
      const result = await client.get('/bad-json');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('API_ERROR');
        expect(result.error.statusCode).toBe(400);
      }
    });
  });
});

describe('error type helpers', () => {
  it('isUnauthorized detects 401', () => {
    const result = { ok: false as const, error: { code: 'AUTH', message: '', statusCode: 401 } };
    expect(isUnauthorized(result)).toBe(true);
    expect(isForbidden(result)).toBe(false);
    expect(isServerError(result)).toBe(false);
  });

  it('isForbidden detects 403', () => {
    const result = {
      ok: false as const,
      error: { code: 'FORBIDDEN', message: '', statusCode: 403 },
    };
    expect(isForbidden(result)).toBe(true);
    expect(isUnauthorized(result)).toBe(false);
  });

  it('isServerError detects 500+', () => {
    const result500 = { ok: false as const, error: { code: 'ERR', message: '', statusCode: 500 } };
    const result502 = { ok: false as const, error: { code: 'ERR', message: '', statusCode: 502 } };
    expect(isServerError(result500)).toBe(true);
    expect(isServerError(result502)).toBe(true);
  });

  it('helpers return false for ok results', () => {
    const result = { ok: true as const, value: {} };
    expect(isUnauthorized(result)).toBe(false);
    expect(isForbidden(result)).toBe(false);
    expect(isServerError(result)).toBe(false);
  });
});
