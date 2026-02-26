/**
 * UI-only types. Domain types come from @afenda/contracts.
 * This file is for UI concerns that don't belong in shared contracts.
 */

// ─── API Client Types ───────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  fields?: Record<string, string>;
}

export type ApiResult<T> = { ok: true; value: T } | { ok: false; error: ApiError };

// ─── Command Receipt (returned by every mutation) ───────────────────────────

export interface CommandReceipt {
  commandId: string;
  idempotencyKey: string;
  resultRef: string;
  completedAt: string;
  auditRef?: string;
}

// ─── Pagination Response ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Tenant Context ─────────────────────────────────────────────────────────

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  companies: CompanyContext[];
  activeCompanyId: string;
  activePeriod?: PeriodContext;
}

export interface CompanyContext {
  id: string;
  name: string;
  baseCurrency: string;
}

export interface PeriodContext {
  id: string;
  name: string;
  year: number;
  period: number;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
}

// ─── Audit Entry ────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  action: string;
  userId: string;
  userName?: string;
  timestamp: string;
  details?: string;
  correlationId?: string;
}

// ─── Table Column Definition ────────────────────────────────────────────────

export interface ColumnDef<T> {
  key: keyof T & string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}
