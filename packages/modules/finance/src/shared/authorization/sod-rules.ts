/**
 * GAP-A1: Segregation of Duties (SoD) conflict ruleset.
 *
 * Pure data — no I/O, no repo imports, no side effects.
 * entityType is mandatory to prevent cross-entity ID collisions.
 *
 * Consumed by RbacAuthorizationPolicy.checkSoD() at runtime.
 */
import type { FinancePermission } from '../ports/authorization.js';

export interface SoDRule {
  readonly entityType: 'journal' | 'fiscalPeriod' | 'icTransfer' | 'budgetControl';
  readonly action: FinancePermission;
  readonly conflictsWith: FinancePermission;
  readonly description: string;
}

export const FINANCE_SOD_RULES: readonly SoDRule[] = [
  {
    entityType: 'journal',
    action: 'journal:create',
    conflictsWith: 'journal:post',
    description: 'Maker-checker: creator cannot post',
  },
  {
    entityType: 'journal',
    action: 'journal:post',
    conflictsWith: 'journal:reverse',
    description: 'Poster cannot reverse own posting',
  },
  {
    entityType: 'fiscalPeriod',
    action: 'period:close',
    conflictsWith: 'period:reopen',
    description: 'Closer cannot reopen same period',
  },
  {
    entityType: 'budgetControl',
    action: 'budget:write',
    conflictsWith: 'journal:post',
    description: 'Budget setter cannot post journals in same period (spending control SoD)',
  },
];
