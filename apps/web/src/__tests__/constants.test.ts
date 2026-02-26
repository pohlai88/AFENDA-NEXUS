import {
  routes,
  statusConfig,
  getStatusConfig,
  currencyConfig,
  navigationConfig,
} from '@/lib/constants';

describe('routes', () => {
  it('contains all top-level route paths', () => {
    expect(routes.home).toBe('/');
    expect(routes.login).toBe('/login');
    expect(routes.dashboard).toBe('/');
    expect(routes.settings).toBe('/settings');
  });

  it('contains S0–S4 finance routes', () => {
    expect(routes.finance.journals).toBe('/finance/journals');
    expect(routes.finance.journalNew).toBe('/finance/journals/new');
    expect(routes.finance.trialBalance).toBe('/finance/trial-balance');
    expect(routes.finance.accounts).toBe('/finance/accounts');
    expect(routes.finance.periods).toBe('/finance/periods');
    expect(routes.finance.reports).toBe('/finance/reports');
    expect(routes.finance.balanceSheet).toBe('/finance/reports/balance-sheet');
    expect(routes.finance.incomeStatement).toBe('/finance/reports/income-statement');
    expect(routes.finance.cashFlow).toBe('/finance/reports/cash-flow');
  });

  it('contains S5 finance routes', () => {
    expect(routes.finance.ledgers).toBe('/finance/ledgers');
    expect(routes.finance.icTransactions).toBe('/finance/intercompany');
    expect(routes.finance.icTransactionNew).toBe('/finance/intercompany/new');
    expect(routes.finance.recurring).toBe('/finance/recurring');
    expect(routes.finance.fxRates).toBe('/finance/fx-rates');
    expect(routes.finance.budgetVariance).toBe('/finance/reports/budget-variance');
    expect(routes.finance.icAging).toBe('/finance/reports/ic-aging');
  });

  it('generates dynamic journal detail route', () => {
    expect(routes.finance.journalDetail('j-001')).toBe('/finance/journals/j-001');
  });

  it('generates dynamic IC transaction detail route', () => {
    expect(routes.finance.icTransactionDetail('ic-001')).toBe('/finance/intercompany/ic-001');
  });
});

describe('statusConfig', () => {
  it('maps DRAFT to secondary variant', () => {
    expect(statusConfig.DRAFT).toEqual({ variant: 'secondary', label: 'Draft' });
  });

  it('maps POSTED to default variant', () => {
    expect(statusConfig.POSTED).toEqual({ variant: 'default', label: 'Posted' });
  });

  it('maps VOIDED to destructive variant', () => {
    expect(statusConfig.VOIDED).toEqual({ variant: 'destructive', label: 'Voided' });
  });

  it('maps IC statuses (PENDING, PAIRED, RECONCILED)', () => {
    expect(statusConfig.PENDING).toEqual({ variant: 'outline', label: 'Pending' });
    expect(statusConfig.PAIRED).toEqual({ variant: 'default', label: 'Paired' });
    expect(statusConfig.RECONCILED).toEqual({ variant: 'default', label: 'Reconciled' });
  });

  it('covers all expected statuses', () => {
    const expected = [
      'DRAFT',
      'POSTED',
      'REVERSED',
      'VOIDED',
      'PENDING_APPROVAL',
      'APPROVED',
      'PAID',
      'PARTIALLY_PAID',
      'CANCELLED',
      'WRITTEN_OFF',
      'OPEN',
      'CLOSED',
      'LOCKED',
      'PENDING',
      'PAIRED',
      'RECONCILED',
    ];
    for (const s of expected) {
      expect(statusConfig[s]).toBeDefined();
    }
  });
});

describe('getStatusConfig', () => {
  it('returns config for known status', () => {
    expect(getStatusConfig('DRAFT')).toEqual({ variant: 'secondary', label: 'Draft' });
  });

  it('returns fallback for unknown status', () => {
    const result = getStatusConfig('UNKNOWN_STATUS');
    expect(result).toEqual({ variant: 'secondary', label: 'UNKNOWN_STATUS' });
  });
});

describe('currencyConfig', () => {
  it('defines USD with $ symbol and 2 decimals', () => {
    expect(currencyConfig.USD).toEqual({ symbol: '$', decimals: 2 });
  });

  it('defines JPY with 0 decimals', () => {
    expect(currencyConfig.JPY).toEqual({ symbol: '¥', decimals: 0 });
  });

  it('defines MYR with RM symbol', () => {
    expect(currencyConfig.MYR).toEqual({ symbol: 'RM', decimals: 2 });
  });
});

describe('navigationConfig', () => {
  it('has Dashboard, Finance, and Settings top-level items', () => {
    const titles = navigationConfig.map((n) => n.title);
    expect(titles).toContain('Dashboard');
    expect(titles).toContain('Finance');
    expect(titles).toContain('Settings');
  });

  it('Finance section has children including S5 entries', () => {
    const finance = navigationConfig.find((n) => n.title === 'Finance');
    expect(finance?.children).toBeDefined();
    const childTitles = finance!.children!.map((c) => c.title);
    expect(childTitles).toContain('Journals');
    expect(childTitles).toContain('Intercompany');
    expect(childTitles).toContain('Recurring');
    expect(childTitles).toContain('FX Rates');
    expect(childTitles).toContain('Ledgers');
    expect(childTitles).toContain('Reports');
  });
});
