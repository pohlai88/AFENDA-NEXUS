import type {
  EmptyStateKey,
  EmptyStateContent,
  EmptyStateVariant,
} from './empty-state.types';

// ─── Registry Type ───────────────────────────────────────────────────────────

type RegistryEntry = Partial<Record<EmptyStateVariant, EmptyStateContent>>;

// ─── Registry ────────────────────────────────────────────────────────────────

const registry: Record<EmptyStateKey, RegistryEntry> = {
  // ─── Finance — GL ──────────────────────────────────────────────────────────

  'finance.journals': {
    firstRun: {
      title: 'No journal entries yet',
      description: 'Create your first journal entry to get started.',
      ctaLabel: 'Create Journal',
    },
    noResults: {
      title: 'No journals match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.accounts': {
    firstRun: {
      title: 'No accounts found',
      description: 'No accounts match the current filters.',
    },
    noResults: {
      title: 'No accounts match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.ledgers': {
    firstRun: {
      title: 'No ledgers',
      description: 'Create a ledger to start recording journal entries.',
    },
    noResults: {
      title: 'No ledgers match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.periods': {
    firstRun: {
      title: 'No periods found',
      description: 'No fiscal periods found for the selected year.',
    },
    noResults: {
      title: 'No periods found',
      description: 'No periods match the current filters.',
    },
  },

  'finance.recurring': {
    firstRun: {
      title: 'No recurring templates',
      description: 'Create recurring journal templates to automate repetitive postings.',
    },
    noResults: {
      title: 'No templates match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  // ─── Finance — Sub-ledgers ─────────────────────────────────────────────────

  'finance.payables': {
    firstRun: {
      title: 'No payable invoices found',
      description: 'Create your first AP invoice to get started.',
      ctaLabel: 'Create Invoice',
    },
    noResults: {
      title: 'No payable invoices found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.payables.suppliers': {
    firstRun: {
      title: 'No suppliers',
      description: 'Add a supplier to start processing invoices.',
      ctaLabel: 'New Supplier',
    },
    noResults: {
      title: 'No suppliers found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.payables.paymentRuns': {
    firstRun: {
      title: 'No payment runs',
      description: 'Create a payment run to batch-pay approved invoices.',
      ctaLabel: 'New Payment Run',
    },
    noResults: {
      title: 'No payment runs found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.payables.whtCerts': {
    firstRun: {
      title: 'No WHT certificates',
      description: 'No withholding tax certificates found for the selected period.',
    },
    noResults: {
      title: 'No WHT certificates found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.payables.holds': {
    firstRun: {
      title: 'No holds',
      description: 'There are no active holds matching the current filters.',
    },
    noResults: {
      title: 'No holds found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.payables.matchTolerances': {
    firstRun: {
      title: 'No match tolerance rules',
      description: 'Add rules to define PO–receipt–invoice matching tolerances. Invoices outside tolerance can be auto-held.',
      ctaLabel: 'Add Tolerance Rule',
    },
    noResults: {
      title: 'No rules found',
      description: 'Add a match tolerance rule to get started.',
    },
  },

  'finance.receivables': {
    firstRun: {
      title: 'No receivable invoices found',
      description: 'Create your first AR invoice to get started.',
      ctaLabel: 'Create Invoice',
    },
    noResults: {
      title: 'No receivable invoices found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  // ─── Finance — FX & IC ─────────────────────────────────────────────────────

  'finance.fxRates': {
    firstRun: {
      title: 'No FX rates',
      description: 'Add exchange rates for multi-currency reporting and transactions.',
    },
    noResults: {
      title: 'No FX rates match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.intercompany': {
    firstRun: {
      title: 'No IC transactions',
      description: 'No intercompany transactions found. Create one to get started.',
      ctaLabel: 'Create IC Transaction',
    },
    noResults: {
      title: 'No IC transactions match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  // ─── Finance — Reports ─────────────────────────────────────────────────────

  'finance.reports.trialBalance': {
    firstRun: {
      title: 'Select a ledger',
      description: 'Choose a ledger and year from the filters above to view the trial balance.',
    },
    noResults: {
      title: 'No balances found',
      description: 'No account balances were found for the selected ledger and period.',
    },
  },

  'finance.reports.balanceSheet': {
    firstRun: {
      title: 'Select parameters',
      description: 'Choose a ledger and period to generate the balance sheet.',
    },
    noResults: {
      title: 'No balance sheet data',
      description: 'No data found for the selected parameters.',
    },
  },

  'finance.reports.incomeStatement': {
    firstRun: {
      title: 'Select parameters',
      description: 'Choose a ledger and period range to generate the income statement.',
    },
    noResults: {
      title: 'No income statement data',
      description: 'No data found for the selected parameters.',
    },
  },

  'finance.reports.cashFlow': {
    firstRun: {
      title: 'Select parameters',
      description: 'Choose a ledger and period range to generate the cash flow statement.',
    },
    noResults: {
      title: 'No cash flow data',
      description: 'No data found for the selected parameters.',
    },
  },

  'finance.reports.budgetVariance': {
    firstRun: {
      title: 'Select parameters',
      description: 'Choose a ledger and fiscal period to generate the budget variance report.',
    },
    noResults: {
      title: 'No variance data',
      description: 'No budget entries found for the selected parameters.',
    },
  },

  'finance.reports.icAging': {
    firstRun: {
      title: 'Select parameters',
      description: 'Provide a currency and as-of date to generate the IC aging report.',
    },
    noResults: {
      title: 'No aging data',
      description: 'No intercompany balances found for the selected parameters.',
    },
  },

  'finance.reports.apAging': {
    firstRun: {
      title: 'Select parameters',
      description: 'Choose a ledger and as-of date to generate the AP aging report.',
    },
    noResults: {
      title: 'No aging data',
      description: 'No payable balances found for the selected parameters.',
    },
  },

  'finance.reports.arAging': {
    firstRun: {
      title: 'Select parameters',
      description: 'Choose a ledger and as-of date to generate the AR aging report.',
    },
    noResults: {
      title: 'No aging data',
      description: 'No receivable balances found for the selected parameters.',
    },
  },

  'finance.reports.assetRegister': {
    firstRun: {
      title: 'Select parameters',
      description: 'Choose a ledger to view the fixed asset register.',
    },
    noResults: {
      title: 'No assets found',
      description: 'No fixed assets match the selected parameters.',
    },
  },

  'finance.reports.consolidation': {
    firstRun: {
      title: 'Select parameters',
      description: 'Choose entities and period to generate the consolidation report.',
    },
    noResults: {
      title: 'No consolidation data',
      description: 'No data found for the selected parameters.',
    },
  },

  'finance.reports.costAllocation': {
    firstRun: {
      title: 'Select parameters',
      description: 'Choose a period and allocation run to view cost allocation results.',
    },
    noResults: {
      title: 'No allocation data',
      description: 'No cost allocations found for the selected parameters.',
    },
  },

  'finance.reports.equityStatement': {
    firstRun: {
      title: 'Select parameters',
      description: 'Choose a ledger and period range to generate the statement of equity.',
    },
    noResults: {
      title: 'No equity data',
      description: 'No equity movements found for the selected parameters.',
    },
  },

  'finance.reports.taxSummary': {
    firstRun: {
      title: 'Select parameters',
      description: 'Choose a period to generate the tax summary report.',
    },
    noResults: {
      title: 'No tax data',
      description: 'No tax entries found for the selected period.',
    },
  },

  'finance.budgetEntries': {
    firstRun: {
      title: 'No budget entries',
      description: 'Create budget line items to start tracking against actuals.',
      ctaLabel: 'Create Budget Entry',
    },
    noResults: {
      title: 'No budget entries match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  // ─── Finance — Extended Domains ────────────────────────────────────────────

  'finance.tax.codes': {
    firstRun: {
      title: 'No tax codes found',
      description: 'Create your first tax code to start tracking taxes.',
      ctaLabel: 'Create Tax Code',
    },
    noResults: {
      title: 'No tax codes match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.tax.returns': {
    firstRun: {
      title: 'No tax return periods',
      description: 'Tax return periods will appear here once configured.',
      ctaLabel: 'Create Period',
    },
    noResults: {
      title: 'No tax return periods found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.tax.whtCerts': {
    firstRun: {
      title: 'No WHT certificates',
      description: 'Create a withholding tax certificate to get started.',
      ctaLabel: 'Create Certificate',
    },
    noResults: {
      title: 'No WHT certificates found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.fixedAssets': {
    firstRun: {
      title: 'No fixed assets found',
      description: 'Add your first fixed asset to start tracking depreciation.',
      ctaLabel: 'Add Asset',
    },
    noResults: {
      title: 'No fixed assets match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.leases': {
    firstRun: {
      title: 'No leases found',
      description: 'Create a new lease to start tracking under IFRS 16.',
      ctaLabel: 'New Lease',
    },
    noResults: {
      title: 'No leases match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.intangibles': {
    firstRun: {
      title: 'No intangible assets found',
      description: 'Add your first intangible asset to start tracking amortization.',
      ctaLabel: 'Add Intangible',
    },
    noResults: {
      title: 'No intangible assets match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.expenses.claims': {
    firstRun: {
      title: 'No expense claims found',
      description: 'Create your first expense claim to get started.',
      ctaLabel: 'New Claim',
    },
    noResults: {
      title: 'No expense claims match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.projects': {
    firstRun: {
      title: 'No projects found',
      description: 'Get started by creating your first project.',
      ctaLabel: 'New Project',
    },
    noResults: {
      title: 'No projects match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.treasury.covenants': {
    firstRun: {
      title: 'No covenants defined',
      description: 'Set up covenant monitoring for your credit facilities.',
      ctaLabel: 'Add Covenant',
    },
    noResults: {
      title: 'No covenants match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.treasury.icLoans': {
    firstRun: {
      title: 'No intercompany loans',
      description: 'Set up intercompany loan tracking for transfer pricing compliance.',
      ctaLabel: 'New IC Loan',
    },
    noResults: {
      title: 'No intercompany loans found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.credit.holds': {
    firstRun: {
      title: 'No credit holds',
      description: 'No customers are currently on credit hold.',
    },
    noResults: {
      title: 'No credit holds found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.credit.customers': {
    firstRun: {
      title: 'No customer credits',
      description: 'Set up credit limits for your customers.',
      ctaLabel: 'Add Credit Limit',
    },
    noResults: {
      title: 'No customer credits found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.costAccounting.drivers': {
    firstRun: {
      title: 'No cost drivers defined',
      description: 'Create cost drivers to allocate costs across cost centers.',
      ctaLabel: 'New Driver',
    },
    noResults: {
      title: 'No cost drivers match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.costAccounting.allocations': {
    firstRun: {
      title: 'No allocation runs',
      description: 'Create an allocation run to distribute costs across cost centers.',
      ctaLabel: 'New Allocation Run',
    },
    noResults: {
      title: 'No allocation runs found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.approvals': {
    firstRun: {
      title: 'No pending approvals',
      description: "You're all caught up! There are no items waiting for your approval.",
    },
    noResults: {
      title: 'No approvals match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'finance.banking.statements': {
    firstRun: {
      title: 'No statements found',
      description: 'Import a bank statement to get started with reconciliation.',
      ctaLabel: 'Import Statement',
    },
    noResults: {
      title: 'No statements match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  // ─── Portal ────────────────────────────────────────────────────────────────

  'portal.invoices': {
    firstRun: {
      title: 'No invoices found',
      description: 'Submit your first invoice to get started.',
      ctaLabel: 'Submit Invoice',
    },
    noResults: {
      title: 'No invoices match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'portal.payments': {
    firstRun: {
      title: 'No payment runs found',
      description: 'Payment runs will appear here once payments are processed.',
    },
    noResults: {
      title: 'No payments match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'portal.documents': {
    firstRun: {
      title: 'No documents found',
      description: 'Upload documents to your secure vault.',
    },
    noResults: {
      title: 'No documents match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'portal.disputes': {
    firstRun: {
      title: 'No disputes',
      description: 'Raise a dispute if you have a billing or payment issue.',
      ctaLabel: 'Raise Dispute',
    },
    noResults: {
      title: 'No disputes match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'portal.whtCerts': {
    firstRun: {
      title: 'No WHT certificates found',
      description: 'Withholding tax certificates will appear here once issued.',
    },
    noResults: {
      title: 'No WHT certificates match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'portal.bankAccounts': {
    firstRun: {
      title: 'No bank accounts',
      description: 'Add a bank account to receive payments.',
    },
    noResults: {
      title: 'No bank accounts found',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  // ─── Admin & Settings ──────────────────────────────────────────────────────

  'admin.users': {
    firstRun: {
      title: 'No users found',
      description: 'Invite team members to get started.',
    },
    noResults: {
      title: 'No users match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'admin.audit': {
    firstRun: {
      title: 'No audit entries found',
      description: 'Audit log entries will appear here as actions are performed.',
    },
    noResults: {
      title: 'No audit entries match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'admin.members': {
    firstRun: {
      title: 'No members found',
      description: 'Invite members to your organization.',
    },
    noResults: {
      title: 'No members match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  'settings.auditLog': {
    firstRun: {
      title: 'No audit log entries',
      description: 'Activity will be logged here automatically.',
    },
    noResults: {
      title: 'No audit log entries match your search',
      description: 'Try adjusting your filters or search terms.',
    },
  },

  // ─── Shell ─────────────────────────────────────────────────────────────────

  'shell.attention': {
    firstRun: {
      title: 'Everything looks good',
      description: 'No items require your attention',
    },
    noResults: {
      title: 'No items need attention',
      description: 'All items are up to date.',
    },
  },
};

// ─── Resolver ────────────────────────────────────────────────────────────────

/**
 * Resolve content from the registry by key and variant.
 *
 * Falls back to `firstRun` when the requested variant is missing,
 * then to a generic placeholder with a dev-mode warning.
 */
export function getEmptyStateContent(
  key: EmptyStateKey,
  variant: EmptyStateVariant = 'firstRun',
): EmptyStateContent {
  const entry = registry[key];
  const content = entry?.[variant] ?? entry?.firstRun;

  if (!content) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[EmptyState] Missing registry entry: ${key}.${variant}`);
    }
    return { title: 'No data', description: 'No results found.' };
  }

  return content;
}

export { registry };
