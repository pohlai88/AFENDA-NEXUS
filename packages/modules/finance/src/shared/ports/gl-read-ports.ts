/**
 * Cross-slice read ports for General Ledger data.
 * Slices that need to read GL balances, ledgers, or accounts
 * import from here instead of directly from the GL slice.
 */
export type { IGlBalanceRepo, BalanceUpsertLine } from '../../slices/gl/ports/gl-balance-repo.js';
export type { ILedgerRepo } from '../../slices/gl/ports/ledger-repo.js';
export type { IAccountRepo } from '../../slices/gl/ports/account-repo.js';
export type {
  TrialBalance,
  TrialBalanceRow,
  GlBalance,
} from '../../slices/gl/entities/gl-balance.js';
