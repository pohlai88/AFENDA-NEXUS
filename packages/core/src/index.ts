/**
 * @afenda/core — Domain primitives: IDs, money, time, Result, errors.
 *
 * Zero external dependencies. No DB, no HTTP, no framework imports.
 */

// ─── Branded Types ──────────────────────────────────────────────────────────

declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type TenantId = Brand<string, 'TenantId'>;
export type CompanyId = Brand<string, 'CompanyId'>;
export type UserId = Brand<string, 'UserId'>;
export type LedgerId = Brand<string, 'LedgerId'>;

export function tenantId(value: string): TenantId {
  return value as TenantId;
}

export function companyId(value: string): CompanyId {
  return value as CompanyId;
}

export function userId(value: string): UserId {
  return value as UserId;
}

export function ledgerId(value: string): LedgerId {
  return value as LedgerId;
}

// ─── Result Type ────────────────────────────────────────────────────────────

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super('NOT_FOUND', `${entity} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super('VALIDATION', message);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message);
    this.name = 'AuthorizationError';
  }
}

// ─── Pagination ──────────────────────────────────────────────────────

export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

// ─── Money ──────────────────────────────────────────────────────────────────

export interface Money {
  readonly amount: bigint;
  readonly currency: string;
  readonly scale: number;
}

export function money(amount: bigint, currency: string, scale = 2): Money {
  return { amount, currency, scale };
}

// ─── Date Utilities ─────────────────────────────────────────────────────────

export interface DateRange {
  readonly from: Date;
  readonly to: Date;
}

export function dateRange(from: Date, to: Date): DateRange {
  if (from > to) throw new AppError('INVALID_DATE_RANGE', 'from must be <= to');
  return { from, to };
}
