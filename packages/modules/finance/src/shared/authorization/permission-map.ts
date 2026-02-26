/**
 * GAP-A1: Locked mapping from FinancePermission → @afenda/authz resource × action.
 *
 * This is the ONLY place where FinancePermission strings are translated
 * to the @afenda/authz RBAC model. No per-route custom mapping allowed.
 *
 * Pure data — no I/O, no side effects.
 */
import type { Action } from '@afenda/authz';
import type { FinancePermission } from '../ports/authorization.js';

export interface PermissionMapping {
  readonly resource: string;
  readonly action: Action;
}

export const PERMISSION_MAP: Record<FinancePermission, PermissionMapping> = {
  'journal:create': { resource: 'journal', action: 'create' },
  'journal:post': { resource: 'journal', action: 'post' },
  'journal:reverse': { resource: 'journal', action: 'reverse' },
  'journal:void': { resource: 'journal', action: 'void' },
  'period:close': { resource: 'fiscalPeriod', action: 'close' },
  'period:lock': { resource: 'fiscalPeriod', action: 'update' },
  'period:reopen': { resource: 'fiscalPeriod', action: 'update' },
  'year:close': { resource: 'fiscalPeriod', action: 'close' },
  'ic:create': { resource: 'icTransfer', action: 'create' },
  'ic:settle': { resource: 'icTransfer', action: 'post' },
  'revenue:create': { resource: 'journal', action: 'create' },
  'revenue:recognize': { resource: 'journal', action: 'post' },
  'budget:write': { resource: 'budget', action: 'create' },
  'report:read': { resource: 'financialReport', action: 'read' },
  'fx:manage': { resource: 'settings', action: 'update' },
  'admin:all': { resource: 'settings', action: 'update' },
  'document:create': { resource: 'document', action: 'create' },
  'document:read': { resource: 'document', action: 'read' },
  'document:delete': { resource: 'document', action: 'delete' },
  'document:list': { resource: 'document', action: 'read' },
  'trialBalance:read': { resource: 'financialReport', action: 'read' },
} as const;
