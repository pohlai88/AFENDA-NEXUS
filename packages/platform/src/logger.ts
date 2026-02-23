/**
 * Structured JSON logger wrapping pino.
 * Always includes tenant_id, trace_id, level.
 *
 * - Development: colorized human-readable output via pino-pretty transport
 * - Production: structured JSON for log aggregation services
 * - Redacts sensitive fields (authorization, password, token, secret, cookie, apiKey)
 * - Standard error serializer for proper stack traces & cause chains
 * - AsyncLocalStorage mixin for automatic correlationId/tenantId/requestId injection
 * - Request/response serializers for structured HTTP logging
 */
import { AsyncLocalStorage } from "node:async_hooks";
import pino from "pino";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface Logger {
  trace(msg: string, ctx?: Record<string, unknown>): void;
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
  fatal(msg: string, ctx?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
  isLevelEnabled(level: LogLevel): boolean;
}

/* ------------------------------------------------------------------ */
/*  Request context — AsyncLocalStorage for automatic log enrichment   */
/* ------------------------------------------------------------------ */

export interface RequestContext {
  correlationId: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
}

const requestContextStore = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return requestContextStore.run(ctx, fn);
}

export function getContext(): RequestContext | undefined {
  return requestContextStore.getStore();
}

/* ------------------------------------------------------------------ */
/*  Redaction — deeper paths for nested objects                       */
/* ------------------------------------------------------------------ */

const REDACT_PATHS = [
  "authorization",
  "password",
  "secret",
  "token",
  "cookie",
  "apiKey",
  "*.authorization",
  "*.password",
  "*.secret",
  "*.token",
  "*.cookie",
  "*.apiKey",
  "req.headers.authorization",
  "req.headers.cookie",
  "body.password",
  "body.secret",
  "body.token",
];

/* ------------------------------------------------------------------ */
/*  Serializers — request, response, error with cause chain           */
/* ------------------------------------------------------------------ */

function serializeReq(req: Record<string, unknown>): Record<string, unknown> {
  const headers = (req.headers ?? {}) as Record<string, unknown>;
  return {
    method: req.method,
    url: req.url,
    headers: {
      host: headers.host,
      "user-agent": headers["user-agent"],
      "content-type": headers["content-type"],
      "x-correlation-id": headers["x-correlation-id"],
    },
  };
}

function serializeRes(res: Record<string, unknown>): Record<string, unknown> {
  return {
    statusCode: res.statusCode,
  };
}

/* ------------------------------------------------------------------ */
/*  Wrapper — thin adapter keeping Logger interface stable             */
/* ------------------------------------------------------------------ */

function wrapPino(p: pino.Logger): Logger {
  return {
    trace(msg, ctx) {
      if (ctx) p.trace(ctx, msg); else p.trace(msg);
    },
    debug(msg, ctx) {
      if (ctx) p.debug(ctx, msg); else p.debug(msg);
    },
    info(msg, ctx) {
      if (ctx) p.info(ctx, msg); else p.info(msg);
    },
    warn(msg, ctx) {
      if (ctx) p.warn(ctx, msg); else p.warn(msg);
    },
    error(msg, ctx) {
      if (ctx) p.error(ctx, msg); else p.error(msg);
    },
    fatal(msg, ctx) {
      if (ctx) p.fatal(ctx, msg); else p.fatal(msg);
    },
    child(bindings) {
      return wrapPino(p.child(bindings));
    },
    isLevelEnabled(level) {
      return p.isLevelEnabled(level);
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Factory                                                           */
/* ------------------------------------------------------------------ */

export interface CreateLoggerOptions {
  level?: LogLevel;
  service?: string;
  tenantId?: string;
  traceId?: string;
  redact?: string[];
}

export function createLogger(opts?: CreateLoggerOptions): Logger {
  const isDev = process.env.NODE_ENV !== "production";
  const envLevel = process.env.LOG_LEVEL?.trim() || undefined;
  const level: LogLevel =
    (envLevel as LogLevel | undefined) ?? opts?.level ?? "info";

  const base: Record<string, unknown> = {
    pid: process.pid,
  };
  if (opts?.service) base.service = opts.service;
  if (opts?.tenantId) base.tenant_id = opts.tenantId;
  if (opts?.traceId) base.trace_id = opts.traceId;

  const transport: pino.TransportSingleOptions | undefined = isDev
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
    : undefined;

  const p = pino({
    level,
    base,
    redact: [...REDACT_PATHS, ...(opts?.redact ?? [])],
    serializers: {
      err: pino.stdSerializers.err,
      req: serializeReq,
      res: serializeRes,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    mixin() {
      const ctx = requestContextStore.getStore();
      if (!ctx) return {};
      const merged: Record<string, unknown> = {
        correlation_id: ctx.correlationId,
      };
      if (ctx.tenantId) merged.tenant_id = ctx.tenantId;
      if (ctx.userId) merged.user_id = ctx.userId;
      if (ctx.requestId) merged.request_id = ctx.requestId;
      return merged;
    },
    ...(transport ? { transport } : {}),
  });

  return wrapPino(p);
}
