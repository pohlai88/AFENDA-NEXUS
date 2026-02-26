// ─── Bank Account Types ──────────────────────────────────────────────────────

export type BankAccountType = 'checking' | 'savings' | 'money_market' | 'credit_card' | 'loan';
export type BankAccountStatus = 'active' | 'inactive' | 'closed';

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  accountType: BankAccountType;
  bankName: string;
  currency: string;
  currentBalance: number;
  availableBalance: number;
  lastReconciledDate: Date | null;
  lastReconciledBalance: number | null;
  glAccountId: string;
  glAccountCode: string;
  status: BankAccountStatus;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Bank Statement Types ────────────────────────────────────────────────────

export type StatementStatus = 'pending' | 'in_progress' | 'reconciled' | 'closed';
export type StatementSource = 'manual' | 'ofx' | 'csv' | 'api';

export interface BankStatement {
  id: string;
  bankAccountId: string;
  bankAccountName: string;
  statementDate: Date;
  startDate: Date;
  endDate: Date;
  openingBalance: number;
  closingBalance: number;
  currency: string;
  source: StatementSource;
  status: StatementStatus;
  transactionCount: number;
  matchedCount: number;
  unmatchedCount: number;
  reconciledAt: Date | null;
  reconciledBy: string | null;
  importedAt: Date;
  fileName: string | null;
}

// ─── Bank Transaction Types ──────────────────────────────────────────────────

export type TransactionType = 'credit' | 'debit';
export type MatchStatus = 'unmatched' | 'matched' | 'partially_matched' | 'created' | 'excluded';

export interface BankTransaction {
  id: string;
  statementId: string;
  bankAccountId: string;
  transactionDate: Date;
  valueDate: Date;
  description: string;
  reference: string;
  type: TransactionType;
  amount: number;
  currency: string;
  runningBalance: number;
  matchStatus: MatchStatus;
  matchedJournalIds: string[];
  createdJournalId: string | null;
  payeeId: string | null;
  payeeName: string | null;
  category: string | null;
  memo: string | null;
}

// ─── GL Transaction (for matching) ───────────────────────────────────────────

export interface GLTransaction {
  id: string;
  journalId: string;
  journalNumber: string;
  accountId: string;
  accountCode: string;
  date: Date;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  amount: number; // Positive for debit, negative for credit
  isReconciled: boolean;
  reconciledStatementId: string | null;
  source: string;
  sourceId: string | null;
}

// ─── Match Suggestion ────────────────────────────────────────────────────────

export type MatchConfidence = 'high' | 'medium' | 'low';

export interface MatchSuggestion {
  id: string;
  bankTransactionId: string;
  glTransactionIds: string[];
  confidence: MatchConfidence;
  matchReason: string;
  amountDifference: number;
}

// ─── Reconciliation Session ──────────────────────────────────────────────────

export type ReconciliationStatus = 'draft' | 'in_progress' | 'pending_approval' | 'completed';

export interface ReconciliationSession {
  id: string;
  statementId: string;
  bankAccountId: string;
  status: ReconciliationStatus;
  openingBalanceBook: number;
  closingBalanceBook: number;
  openingBalanceStatement: number;
  closingBalanceStatement: number;
  difference: number;
  totalMatched: number;
  totalUnmatched: number;
  totalCreated: number;
  totalExcluded: number;
  startedAt: Date;
  startedBy: string;
  completedAt: Date | null;
  completedBy: string | null;
}

// ─── Reconciliation Action ───────────────────────────────────────────────────

export type ReconciliationAction =
  | 'match'
  | 'unmatch'
  | 'create_journal'
  | 'exclude'
  | 'include';

// ─── Import Config ───────────────────────────────────────────────────────────

export interface StatementImportConfig {
  dateFormat: string;
  dateColumn: string;
  descriptionColumn: string;
  debitColumn: string;
  creditColumn: string;
  amountColumn?: string;
  balanceColumn?: string;
  referenceColumn?: string;
  hasHeader: boolean;
  skipRows: number;
  delimiter: string;
}

// ─── Status Config ───────────────────────────────────────────────────────────

export const statementStatusConfig: Record<StatementStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  reconciled: { label: 'Reconciled', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
};

export const matchStatusConfig: Record<MatchStatus, { label: string; color: string }> = {
  unmatched: { label: 'Unmatched', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  matched: { label: 'Matched', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  partially_matched: { label: 'Partial', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  created: { label: 'Created', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  excluded: { label: 'Excluded', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
};

export const matchConfidenceConfig: Record<MatchConfidence, { label: string; color: string }> = {
  high: { label: 'High', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  low: { label: 'Low', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};
