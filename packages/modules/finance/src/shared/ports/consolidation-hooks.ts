/**
 * Cross-slice hooks for group consolidation.
 * Hub's consolidation service uses FX translation and IC elimination
 * via shared instead of importing directly from those slices.
 */
export { translateTrialBalance } from '../../slices/fx/calculators/fx-translation.js';
export type {
  TranslationRates,
  TrialBalanceEntry,
  TranslatedEntry,
  TranslationResult,
} from '../../slices/fx/calculators/fx-translation.js';
export { computeEliminations } from '../../slices/ic/calculators/ic-elimination.js';
export type {
  EliminationEntry,
  IntercompanyBalance,
} from '../../slices/ic/calculators/ic-elimination.js';
