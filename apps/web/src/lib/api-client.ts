import type { ApiResult } from "./types";

// ─── Configuration ──────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface RequestContext {
  tenantId: string;
  userId?: string;
  token?: string;
}

// ─── Core Fetch Wrapper ─────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit & { ctx?: RequestContext } = {},
): Promise<ApiResult<T>> {
  const { ctx, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  if (ctx?.tenantId) headers.set("x-tenant-id", ctx.tenantId);
  if (ctx?.userId) headers.set("x-user-id", ctx.userId);
  if (ctx?.token) headers.set("Authorization", `Bearer ${ctx.token}`);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return {
        ok: false,
        error: {
          code: body.code ?? "API_ERROR",
          message: body.message ?? response.statusText,
          statusCode: response.status,
          fields: body.fields,
        },
      };
    }

    const data = (await response.json()) as T;
    return { ok: true, value: data };
  } catch (cause) {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: cause instanceof Error ? cause.message : "Network request failed",
        statusCode: 0,
      },
    };
  }
}

// ─── Typed HTTP Methods ─────────────────────────────────────────────────────

export function createApiClient(ctx: RequestContext) {
  return {
    get<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>> {
      const url = params
        ? `${path}?${new URLSearchParams(params).toString()}`
        : path;
      return apiFetch<T>(url, { method: "GET", ctx });
    },

    post<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
      return apiFetch<T>(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
        ctx,
      });
    },

    put<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
      return apiFetch<T>(path, {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
        ctx,
      });
    },

    patch<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
      return apiFetch<T>(path, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
        ctx,
      });
    },

    delete<T>(path: string): Promise<ApiResult<T>> {
      return apiFetch<T>(path, { method: "DELETE", ctx });
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
