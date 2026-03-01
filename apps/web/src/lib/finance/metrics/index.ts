/**
 * Finance Metrics Module
 * Canonical source of truth for all financial metric definitions
 * 
 * Key principle: Frontend NEVER computes business logic
 * All calculations happen in the metrics layer or API
 */

export * from './metric-id';
export * from './metric-registry';
export * from './metric-lineage';
export * from './metric-computer';
export type { DrilldownTarget } from './metric-registry';
