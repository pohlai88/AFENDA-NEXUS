import * as Sentry from '@sentry/nextjs';
import { nanoid } from 'nanoid';

// ─── Correlation ID ──────────────────────────────────────────────────────────

export function generateCorrelationId(): string {
  return `err_${nanoid(12)}`;
}

let currentCorrelationId: string | null = null;

export function getCorrelationId(): string {
  if (!currentCorrelationId) {
    currentCorrelationId = generateCorrelationId();
  }
  return currentCorrelationId;
}

export function setCorrelationId(id: string): void {
  currentCorrelationId = id;
}

export function clearCorrelationId(): void {
  currentCorrelationId = null;
}

// ─── Error Context ───────────────────────────────────────────────────────────

export interface ErrorContext {
  correlationId: string;
  component?: string;
  action?: string;
  userId?: string;
  tenantId?: string;
  url?: string;
  timestamp: string;
  extra?: Record<string, unknown>;
}

export function buildErrorContext(
  partial: Partial<Omit<ErrorContext, 'correlationId' | 'timestamp'>> = {}
): ErrorContext {
  return {
    correlationId: getCorrelationId(),
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    ...partial,
  };
}

// ─── Error Reporting ─────────────────────────────────────────────────────────

export function reportError(
  error: Error,
  context?: Partial<Omit<ErrorContext, 'correlationId' | 'timestamp'>>
): string {
  const errorContext = buildErrorContext(context);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Report]', {
      error: error.message,
      stack: error.stack,
      context: errorContext,
    });
  }

  // Report to Sentry
  Sentry.withScope((scope) => {
    scope.setTag('correlation_id', errorContext.correlationId);
    scope.setTag('component', errorContext.component);
    scope.setTag('action', errorContext.action);

    if (errorContext.userId) {
      scope.setUser({ id: errorContext.userId });
    }

    if (errorContext.tenantId) {
      scope.setTag('tenant_id', errorContext.tenantId);
    }

    scope.setContext('error_context', errorContext as unknown as Record<string, unknown>);

    if (errorContext.extra) {
      scope.setExtras(errorContext.extra);
    }

    Sentry.captureException(error);
  });

  return errorContext.correlationId;
}

/** Wrapper for Sentry.captureException - use reportError for full context, or this for direct capture */
export function captureException(
  error: unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, unknown> }
): string | undefined {
  if (context) {
    Sentry.withScope((scope) => {
      if (context.tags) {
        Object.entries(context.tags).forEach(([key, value]) => scope.setTag(key, value));
      }
      if (context.extra) {
        scope.setExtras(context.extra);
      }
      return Sentry.captureException(error);
    });
  }
  return Sentry.captureException(error);
}

/** Wrapper for Sentry.addBreadcrumb */
export function addBreadcrumb(breadcrumb: {
  category?: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}): void {
  Sentry.addBreadcrumb(breadcrumb);
}

// ─── Action Error Handler ────────────────────────────────────────────────────

export interface ActionError {
  message: string;
  correlationId: string;
  code?: string;
}

export function createActionError(
  message: string,
  options?: { code?: string; context?: Partial<ErrorContext> }
): ActionError {
  const error = new Error(message);
  const correlationId = reportError(error, {
    action: options?.context?.action,
    ...options?.context,
  });

  return {
    message,
    correlationId,
    code: options?.code,
  };
}

// ─── Error Type Checkers ─────────────────────────────────────────────────────

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'NetworkError'
    );
  }
  return false;
}

export function isValidationError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === 'VALIDATION_ERROR';
  }
  return false;
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('unauthorized') ||
      error.message.includes('authentication') ||
      error.message.includes('401')
    );
  }
  return false;
}

// ─── User-Friendly Error Messages ────────────────────────────────────────────

export function getUserFriendlyMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  if (isAuthError(error)) {
    return 'Your session has expired. Please log in again to continue.';
  }

  if (error instanceof Error) {
    // Don't expose internal error details to users
    if (process.env.NODE_ENV === 'production') {
      return 'An unexpected error occurred. Our team has been notified.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
