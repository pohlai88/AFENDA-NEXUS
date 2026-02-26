'use server';

import type {
  BankAccount,
  BankStatement,
  BankTransaction,
  GLTransaction,
  MatchSuggestion,
  ReconciliationSession,
} from '../types';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockBankAccounts: BankAccount[] = [
  {
    id: 'ba-1',
    name: 'Operating Account',
    accountNumber: '****4521',
    accountType: 'checking',
    bankName: 'Chase Bank',
    currency: 'USD',
    currentBalance: 245678.92,
    availableBalance: 243128.92,
    lastReconciledDate: new Date('2026-01-31'),
    lastReconciledBalance: 198234.56,
    glAccountId: 'gl-1001',
    glAccountCode: '1001',
    status: 'active',
    isDefault: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2026-02-25'),
  },
  {
    id: 'ba-2',
    name: 'Payroll Account',
    accountNumber: '****7832',
    accountType: 'checking',
    bankName: 'Chase Bank',
    currency: 'USD',
    currentBalance: 125000.0,
    availableBalance: 125000.0,
    lastReconciledDate: new Date('2026-01-31'),
    lastReconciledBalance: 125000.0,
    glAccountId: 'gl-1002',
    glAccountCode: '1002',
    status: 'active',
    isDefault: false,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id: 'ba-3',
    name: 'Savings Reserve',
    accountNumber: '****9456',
    accountType: 'savings',
    bankName: 'Bank of America',
    currency: 'USD',
    currentBalance: 500000.0,
    availableBalance: 500000.0,
    lastReconciledDate: new Date('2026-01-31'),
    lastReconciledBalance: 495000.0,
    glAccountId: 'gl-1010',
    glAccountCode: '1010',
    status: 'active',
    isDefault: false,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2026-02-15'),
  },
];

const mockStatements: BankStatement[] = [
  {
    id: 'stmt-1',
    bankAccountId: 'ba-1',
    bankAccountName: 'Operating Account',
    statementDate: new Date('2026-02-28'),
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-02-28'),
    openingBalance: 198234.56,
    closingBalance: 245678.92,
    currency: 'USD',
    source: 'ofx',
    status: 'in_progress',
    transactionCount: 156,
    matchedCount: 134,
    unmatchedCount: 22,
    reconciledAt: null,
    reconciledBy: null,
    importedAt: new Date('2026-02-25'),
    fileName: 'chase_feb_2026.ofx',
  },
  {
    id: 'stmt-2',
    bankAccountId: 'ba-1',
    bankAccountName: 'Operating Account',
    statementDate: new Date('2026-01-31'),
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    openingBalance: 178450.23,
    closingBalance: 198234.56,
    currency: 'USD',
    source: 'ofx',
    status: 'reconciled',
    transactionCount: 142,
    matchedCount: 142,
    unmatchedCount: 0,
    reconciledAt: new Date('2026-02-05'),
    reconciledBy: 'John Smith',
    importedAt: new Date('2026-02-01'),
    fileName: 'chase_jan_2026.ofx',
  },
  {
    id: 'stmt-3',
    bankAccountId: 'ba-2',
    bankAccountName: 'Payroll Account',
    statementDate: new Date('2026-02-28'),
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-02-28'),
    openingBalance: 125000.0,
    closingBalance: 125000.0,
    currency: 'USD',
    source: 'manual',
    status: 'pending',
    transactionCount: 12,
    matchedCount: 0,
    unmatchedCount: 12,
    reconciledAt: null,
    reconciledBy: null,
    importedAt: new Date('2026-02-26'),
    fileName: null,
  },
];

const mockTransactions: BankTransaction[] = [
  {
    id: 'txn-1',
    statementId: 'stmt-1',
    bankAccountId: 'ba-1',
    transactionDate: new Date('2026-02-25'),
    valueDate: new Date('2026-02-25'),
    description: 'WIRE TRANSFER - CUSTOMER PAYMENT',
    reference: 'WT-2026-0892',
    type: 'credit',
    amount: 45000.0,
    currency: 'USD',
    runningBalance: 245678.92,
    matchStatus: 'unmatched',
    matchedJournalIds: [],
    createdJournalId: null,
    payeeId: 'cust-123',
    payeeName: 'Acme Corporation',
    category: null,
    memo: null,
  },
  {
    id: 'txn-2',
    statementId: 'stmt-1',
    bankAccountId: 'ba-1',
    transactionDate: new Date('2026-02-24'),
    valueDate: new Date('2026-02-24'),
    description: 'ACH PAYMENT - VENDOR INVOICE',
    reference: 'ACH-567834',
    type: 'debit',
    amount: 12500.0,
    currency: 'USD',
    runningBalance: 200678.92,
    matchStatus: 'matched',
    matchedJournalIds: ['jnl-456'],
    createdJournalId: null,
    payeeId: 'vend-456',
    payeeName: 'Office Supplies Inc',
    category: 'Vendor Payment',
    memo: null,
  },
  {
    id: 'txn-3',
    statementId: 'stmt-1',
    bankAccountId: 'ba-1',
    transactionDate: new Date('2026-02-23'),
    valueDate: new Date('2026-02-23'),
    description: 'BANK SERVICE CHARGE',
    reference: 'FEE-FEB',
    type: 'debit',
    amount: 45.0,
    currency: 'USD',
    runningBalance: 213178.92,
    matchStatus: 'unmatched',
    matchedJournalIds: [],
    createdJournalId: null,
    payeeId: null,
    payeeName: null,
    category: 'Bank Fees',
    memo: 'Monthly maintenance fee',
  },
  {
    id: 'txn-4',
    statementId: 'stmt-1',
    bankAccountId: 'ba-1',
    transactionDate: new Date('2026-02-22'),
    valueDate: new Date('2026-02-22'),
    description: 'CHECK #4521 - RENT PAYMENT',
    reference: 'CHK-4521',
    type: 'debit',
    amount: 8500.0,
    currency: 'USD',
    runningBalance: 213223.92,
    matchStatus: 'matched',
    matchedJournalIds: ['jnl-789'],
    createdJournalId: null,
    payeeId: 'vend-789',
    payeeName: 'Building Management LLC',
    category: 'Rent',
    memo: null,
  },
  {
    id: 'txn-5',
    statementId: 'stmt-1',
    bankAccountId: 'ba-1',
    transactionDate: new Date('2026-02-21'),
    valueDate: new Date('2026-02-21'),
    description: 'DEPOSIT - CUSTOMER PAYMENT',
    reference: 'DEP-8923',
    type: 'credit',
    amount: 28750.0,
    currency: 'USD',
    runningBalance: 221723.92,
    matchStatus: 'partially_matched',
    matchedJournalIds: ['jnl-890'],
    createdJournalId: null,
    payeeId: 'cust-234',
    payeeName: 'Tech Solutions Ltd',
    category: null,
    memo: 'Partial payment - remaining 5000',
  },
];

const mockGLTransactions: GLTransaction[] = [
  {
    id: 'gl-txn-1',
    journalId: 'jnl-999',
    journalNumber: 'JE-2026-0423',
    accountId: 'gl-1001',
    accountCode: '1001',
    date: new Date('2026-02-25'),
    description: 'Customer payment - Acme Corp Invoice 1234',
    reference: 'INV-1234',
    debit: 45000.0,
    credit: 0,
    amount: 45000.0,
    isReconciled: false,
    reconciledStatementId: null,
    source: 'AR Receipt',
    sourceId: 'rcpt-567',
  },
  {
    id: 'gl-txn-2',
    journalId: 'jnl-998',
    journalNumber: 'JE-2026-0422',
    accountId: 'gl-1001',
    accountCode: '1001',
    date: new Date('2026-02-23'),
    description: 'Bank service fees - February',
    reference: 'BSF-FEB',
    debit: 0,
    credit: 45.0,
    amount: -45.0,
    isReconciled: false,
    reconciledStatementId: null,
    source: 'Manual',
    sourceId: null,
  },
];

const mockSuggestions: MatchSuggestion[] = [
  {
    id: 'sug-1',
    bankTransactionId: 'txn-1',
    glTransactionIds: ['gl-txn-1'],
    confidence: 'high',
    matchReason: 'Amount matches exactly, similar description (Acme)',
    amountDifference: 0,
  },
  {
    id: 'sug-2',
    bankTransactionId: 'txn-3',
    glTransactionIds: ['gl-txn-2'],
    confidence: 'high',
    matchReason: 'Amount matches exactly, both reference bank fees',
    amountDifference: 0,
  },
];

// ─── Query Functions ─────────────────────────────────────────────────────────

export async function getBankAccounts(): Promise<
  { ok: true; data: BankAccount[] } | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true, data: mockBankAccounts };
}

export async function getBankAccountById(
  id: string
): Promise<{ ok: true; data: BankAccount } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const account = mockBankAccounts.find((a) => a.id === id);
  if (!account) return { ok: false, error: 'Bank account not found' };
  return { ok: true, data: account };
}

export async function getBankStatements(params?: {
  bankAccountId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}): Promise<
  | {
      ok: true;
      data: BankStatement[];
      pagination: { page: number; perPage: number; total: number; totalPages: number };
    }
  | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 400));

  let filtered = [...mockStatements];

  if (params?.bankAccountId) {
    filtered = filtered.filter((s) => s.bankAccountId === params.bankAccountId);
  }

  if (params?.status) {
    filtered = filtered.filter((s) => s.status === params.status);
  }

  const page = params?.page ?? 1;
  const perPage = params?.perPage ?? 20;
  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const paginatedData = filtered.slice(start, start + perPage);

  return {
    ok: true,
    data: paginatedData,
    pagination: { page, perPage, total, totalPages },
  };
}

export async function getBankStatementById(
  id: string
): Promise<{ ok: true; data: BankStatement } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const statement = mockStatements.find((s) => s.id === id);
  if (!statement) return { ok: false, error: 'Statement not found' };
  return { ok: true, data: statement };
}

export async function getBankTransactions(params: {
  statementId: string;
  matchStatus?: string;
  type?: string;
  search?: string;
}): Promise<{ ok: true; data: BankTransaction[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 350));

  let filtered = mockTransactions.filter((t) => t.statementId === params.statementId);

  if (params.matchStatus) {
    filtered = filtered.filter((t) => t.matchStatus === params.matchStatus);
  }

  if (params.type) {
    filtered = filtered.filter((t) => t.type === params.type);
  }

  if (params.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.description.toLowerCase().includes(search) ||
        t.reference.toLowerCase().includes(search) ||
        t.payeeName?.toLowerCase().includes(search)
    );
  }

  return { ok: true, data: filtered };
}

export async function getGLTransactions(params: {
  bankAccountId: string;
  fromDate?: Date;
  toDate?: Date;
  unreconciledOnly?: boolean;
}): Promise<{ ok: true; data: GLTransaction[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 300));

  let filtered = [...mockGLTransactions];

  if (params.unreconciledOnly) {
    filtered = filtered.filter((t) => !t.isReconciled);
  }

  return { ok: true, data: filtered };
}

export async function getMatchSuggestions(params: {
  statementId: string;
  bankTransactionId?: string;
}): Promise<{ ok: true; data: MatchSuggestion[] } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 500));

  let filtered = [...mockSuggestions];

  if (params.bankTransactionId) {
    filtered = filtered.filter((s) => s.bankTransactionId === params.bankTransactionId);
  }

  return { ok: true, data: filtered };
}

export async function getReconciliationSession(
  statementId: string
): Promise<{ ok: true; data: ReconciliationSession } | { ok: false; error: string }> {
  await new Promise((r) => setTimeout(r, 200));

  const statement = mockStatements.find((s) => s.id === statementId);
  if (!statement) return { ok: false, error: 'Statement not found' };

  const session: ReconciliationSession = {
    id: `recon-${statementId}`,
    statementId,
    bankAccountId: statement.bankAccountId,
    status: statement.status === 'reconciled' ? 'completed' : 'in_progress',
    openingBalanceBook: 198234.56,
    closingBalanceBook: 245300.0,
    openingBalanceStatement: statement.openingBalance,
    closingBalanceStatement: statement.closingBalance,
    difference: statement.closingBalance - 245300.0,
    totalMatched: statement.matchedCount,
    totalUnmatched: statement.unmatchedCount,
    totalCreated: 0,
    totalExcluded: 0,
    startedAt: new Date('2026-02-25'),
    startedBy: 'John Smith',
    completedAt: statement.reconciledAt,
    completedBy: statement.reconciledBy,
  };

  return { ok: true, data: session };
}

export async function getReconciliationStats(bankAccountId?: string): Promise<
  | {
      ok: true;
      data: {
        pendingStatements: number;
        inProgressStatements: number;
        unreconciledDays: number;
        lastReconciledDate: Date | null;
        totalUnmatchedItems: number;
      };
    }
  | { ok: false; error: string }
> {
  await new Promise((r) => setTimeout(r, 200));

  return {
    ok: true,
    data: {
      pendingStatements: 1,
      inProgressStatements: 1,
      unreconciledDays: 25,
      lastReconciledDate: new Date('2026-01-31'),
      totalUnmatchedItems: 34,
    },
  };
}
