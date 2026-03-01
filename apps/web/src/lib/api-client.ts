import type { ApiResult } from './types';
import { captureException, addBreadcrumb } from './error-reporting';

// ─── Configuration ──────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 10_000;

interface RequestContext {
  tenantId: string;
  userId?: string;
  token?: string;
}

// ─── Retry Helpers ──────────────────────────────────────────────────────────

function isRetryable(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function getRetryDelay(attempt: number, retryAfterHeader?: string | null): number {
  // Respect Retry-After header if present (seconds).
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1_000, MAX_DELAY_MS);
    }
  }

  // Exponential backoff with jitter: base * 2^attempt + random jitter.
  const delay = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
  const jitter = delay * 0.2 * Math.random();
  return delay + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Core Fetch Wrapper ─────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit & { ctx?: RequestContext } = {}
): Promise<ApiResult<T>> {
  const { ctx, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  // G9/G-KRN-05: x-tenant-id and x-user-id are LEGACY headers.
  // req.authUser (from Bearer token) is the sole SoT for identity.
  // These headers are kept temporarily for backward compat with older middleware
  // that reads them before the auth plugin runs. Do NOT add new header-based identity.
  if (ctx?.tenantId) headers.set('x-tenant-id', ctx.tenantId);
  if (ctx?.userId) headers.set('x-user-id', ctx.userId);
  if (ctx?.token) headers.set('Authorization', `Bearer ${ctx.token}`);

  let lastError: ApiResult<T> | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        // Retry on transient errors (429, 502, 503, 504).
        if (isRetryable(response.status) && attempt < MAX_RETRIES) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = getRetryDelay(attempt, retryAfter);

          addBreadcrumb({
            category: 'api',
            message: `Retry ${attempt + 1}/${MAX_RETRIES} for ${path} (${response.status})`,
            level: 'warning',
            data: { status: response.status, delay },
          });

          await sleep(delay);
          continue;
        }

        const body = await response.json().catch(() => ({}));
        return {
          ok: false,
          error: {
            code: body.code ?? 'API_ERROR',
            message: body.message ?? response.statusText,
            statusCode: response.status,
            fields: body.fields,
          },
        };
      }

      const data = (await response.json()) as T;
      return { ok: true, value: data };
    } catch (cause) {
      lastError = {
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: cause instanceof Error ? cause.message : 'Network request failed',
          statusCode: 0,
        },
      };

      // Retry network errors (e.g., DNS failure, timeout).
      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);

        addBreadcrumb({
          category: 'api',
          message: `Retry ${attempt + 1}/${MAX_RETRIES} for ${path} (network error)`,
          level: 'warning',
          data: { error: lastError.error.message, delay },
        });

        await sleep(delay);
        continue;
      }

      captureException(cause, {
        tags: { module: 'api-client', path },
        extra: { attempt, method: fetchOptions.method },
      });
    }
  }

  return lastError!;
}

// ─── Typed HTTP Methods ─────────────────────────────────────────────────────

export function createApiClient(ctx: RequestContext) {
  return {
    get<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>> {
      const url = params ? `${path}?${new URLSearchParams(params).toString()}` : path;
      return apiFetch<T>(url, { method: 'GET', ctx });
    },

    post<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
      return apiFetch<T>(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
        ctx,
      });
    },

    put<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
      return apiFetch<T>(path, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
        ctx,
      });
    },

    patch<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
      return apiFetch<T>(path, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
        ctx,
      });
    },

    delete<T>(path: string): Promise<ApiResult<T>> {
      return apiFetch<T>(path, { method: 'DELETE', ctx });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

// ─── Error Handling Helpers ──────────────────────────────────────────────────

export function isUnauthorized(result: ApiResult<unknown>): boolean {
  return !result.ok && result.error.statusCode === 401;
}

export function isForbidden(result: ApiResult<unknown>): boolean {
  return !result.ok && result.error.statusCode === 403;
}

export function isServerError(result: ApiResult<unknown>): boolean {
  return !result.ok && result.error.statusCode >= 500;
}
