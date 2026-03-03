import type { EmptyStateKey, EmptyStateContent, EmptyStateVariant } from './empty-state.types';

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
      description:
        'Add rules to define PO–receipt–invoice matching tolerances. Invoices outside tolerance can be auto-held.',
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

  'shell.moduleNav': {
    firstRun: {
      title: 'No navigation items',
      description: 'No navigation items for this module.',
    },
    noResults: {
      title: 'No matches',
      description: 'Try a different search term.',
    },
  },

  'shell.shortcuts': {
    firstRun: {
      title: 'No shortcuts',
      description: 'No shortcuts registered.',
    },
    noResults: {
      title: 'No matches',
      description: 'Try a different search term.',
    },
  },

  'shell.notifications': {
    firstRun: {
      title: 'All caught up!',
      description: 'You have no unread notifications.',
    },
    noResults: {
      title: 'No notifications',
      description: 'Notifications will appear here when there are updates.',
    },
  },

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  'finance.dashboard.activity': {
    firstRun: {
      title: 'No recent activity',
      description: 'Transactions and updates will appear here.',
    },
    noResults: {
      title: 'No recent activity',
      description: 'Transactions and updates will appear here.',
    },
  },

  'finance.dashboard.attention': {
    firstRun: {
      title: 'All caught up!',
      description: 'No items need attention.',
    },
    noResults: {
      title: 'All caught up!',
      description: 'No items need attention.',
    },
  },

  'finance.dashboard.quickActions': {
    firstRun: {
      title: 'No quick actions',
      description: 'Configure quick actions for common tasks.',
    },
    noResults: {
      title: 'No quick actions',
      description: 'Configure quick actions for common tasks.',
    },
  },

  // ─── Dashboard — Charts ────────────────────────────────────────────────────

  'finance.dashboard.cashFlow': {
    firstRun: {
      title: 'No cash flow data',
      description: 'Monthly inflows and outflows will appear once transactions are posted.',
    },
    noResults: {
      title: 'No cash flow data',
      description: 'No cash flow transactions for the selected period.',
    },
  },

  'finance.dashboard.revenueExpense': {
    firstRun: {
      title: 'No revenue & expense data',
      description: 'P&L trend data will appear once journal entries are posted.',
    },
    noResults: {
      title: 'No revenue & expense data',
      description: 'No P&L data for the selected period.',
    },
  },

  'finance.dashboard.arAging': {
    firstRun: {
      title: 'No receivables',
      description: 'AR aging data will appear once invoices are created.',
    },
    noResults: {
      title: 'No aging data',
      description: 'No outstanding receivables for the selected period.',
    },
  },

  'finance.dashboard.apAging': {
    firstRun: {
      title: 'No payables',
      description: 'AP aging data will appear once supplier invoices are recorded.',
    },
    noResults: {
      title: 'No aging data',
      description: 'No outstanding payables for the selected period.',
    },
  },

  'finance.dashboard.budgetVariance': {
    firstRun: {
      title: 'No budget data',
      description: 'Budget vs actual variance will appear once budget entries are configured.',
    },
    noResults: {
      title: 'No variance data',
      description: 'No budget data for the selected period or accounts.',
    },
  },

  'finance.dashboard.dsoTrend': {
    firstRun: {
      title: 'No DSO data',
      description: 'Days Sales Outstanding trend will appear once receivables are tracked.',
    },
    noResults: {
      title: 'No DSO data',
      description: 'No DSO history for the selected period.',
    },
  },

  'finance.dashboard.assetTreemap': {
    firstRun: {
      title: 'No asset data',
      description: 'Asset portfolio breakdown will appear once fixed assets are registered.',
    },
    noResults: {
      title: 'No asset data',
      description: 'No fixed assets match the selected filters.',
    },
  },

  'finance.dashboard.cashFlowSankey': {
    firstRun: {
      title: 'No cash flow data',
      description:
        'Cash flow visualization will appear once operating, investing, and financing activities are recorded.',
    },
    noResults: {
      title: 'No cash flow data',
      description: 'No cash flow activities for the selected period.',
    },
  },

  'finance.dashboard.financialRatios': {
    firstRun: {
      title: 'No ratio data',
      description:
        'Financial health indicators will appear once sufficient accounting data is available.',
    },
    noResults: {
      title: 'No ratio data',
      description: 'Unable to compute ratios for the selected period.',
    },
  },

  'finance.dashboard.liquidityWaterfall': {
    firstRun: {
      title: 'No liquidity data',
      description: 'Cash movement waterfall will appear once bank transactions are recorded.',
    },
    noResults: {
      title: 'No liquidity data',
      description: 'No cash movements for the selected period.',
    },
  },

  'finance.dashboard.taxLiability': {
    firstRun: {
      title: 'No tax data',
      description: 'Tax liability trend will appear once tax codes are applied to transactions.',
    },
    noResults: {
      title: 'No tax data',
      description: 'No tax data for the selected period.',
    },
  },

  'finance.dashboard.workingCapital': {
    firstRun: {
      title: 'No working capital data',
      description:
        'Working capital trend will appear once current assets and liabilities are recorded.',
    },
    noResults: {
      title: 'No working capital data',
      description: 'No working capital data for the selected period.',
    },
  },

  // ─── Charts — Generic Fallbacks ────────────────────────────────────────────

  'charts.generic.empty': {
    firstRun: {
      title: 'No data available',
      description: 'Data will appear here once records are created.',
    },
    noResults: {
      title: 'No data available',
      description: 'Try adjusting the date range or filters.',
    },
  },

  'charts.generic.error': {
    firstRun: {
      title: 'Failed to load chart',
      description: 'An unexpected error occurred while loading this chart.',
    },
    noResults: {
      title: 'Failed to load chart',
      description: 'An unexpected error occurred while loading this chart.',
    },
  },

  // ─── KPI Cards — Finance Overview ──────────────────────────────────────────

  'kpi.cashPosition': {
    firstRun: {
      title: 'No cash data',
      description: 'Bank balances will appear once accounts are connected.',
    },
    noResults: {
      title: 'No cash data',
      description: 'No bank data for the selected period.',
    },
  },

  'kpi.accountsPayable': {
    firstRun: {
      title: 'No payable invoices found',
      description: 'Outstanding bills will appear once vendor invoices are recorded.',
    },
    noResults: {
      title: 'No payables',
      description: 'No outstanding payables for the selected period.',
    },
  },

  'kpi.accountsReceivable': {
    firstRun: {
      title: 'No receivable invoices found',
      description: 'Outstanding invoices will appear once customer invoices are created.',
    },
    noResults: {
      title: 'No receivables',
      description: 'No outstanding receivables for the selected period.',
    },
  },

  'kpi.netIncome': {
    firstRun: {
      title: 'No income data',
      description: 'Net income will appear once transactions are posted.',
    },
    noResults: {
      title: 'No income data',
      description: 'No income data for the selected period.',
    },
  },

  // ─── KPI Cards — AP ────────────────────────────────────────────────────────

  'kpi.apAging': {
    firstRun: {
      title: 'No aging data',
      description: 'AP aging will appear once vendor invoices are recorded.',
    },
    noResults: {
      title: 'No aging data',
      description: 'No payables to age for the selected period.',
    },
  },

  'kpi.apOverdue': {
    firstRun: {
      title: 'No overdue invoices',
      description: 'Overdue bills will appear here when past due date.',
    },
    noResults: {
      title: 'No overdue invoices',
      description: 'All payables are current.',
    },
  },

  'kpi.apPending': {
    firstRun: {
      title: 'No pending approvals',
      description: 'Bills awaiting approval will appear here.',
    },
    noResults: {
      title: 'No pending approvals',
      description: 'No bills pending approval.',
    },
  },

  'kpi.apDiscount': {
    firstRun: {
      title: 'No discount data',
      description: 'Early payment discounts will be tracked once captured.',
    },
    noResults: {
      title: 'No discounts',
      description: 'No early payment discounts captured this period.',
    },
  },

  // ─── KPI Cards — AR ────────────────────────────────────────────────────────

  'kpi.totalReceivables': {
    firstRun: {
      title: 'No receivables',
      description: 'Customer invoices will appear once created.',
    },
    noResults: {
      title: 'No receivables',
      description: 'No outstanding receivables for the selected period.',
    },
  },

  'kpi.arAging': {
    firstRun: {
      title: 'No aging data',
      description: 'AR aging will appear once customer invoices are created.',
    },
    noResults: {
      title: 'No aging data',
      description: 'No receivables to age for the selected period.',
    },
  },

  'kpi.arOverdue': {
    firstRun: {
      title: 'No overdue invoices',
      description: 'Overdue invoices will appear here when past due date.',
    },
    noResults: {
      title: 'No overdue invoices',
      description: 'All receivables are current.',
    },
  },

  'kpi.dso': {
    firstRun: {
      title: 'No DSO data',
      description: 'Days Sales Outstanding will calculate once invoices are paid.',
    },
    noResults: {
      title: 'No DSO data',
      description: 'Insufficient data to calculate DSO.',
    },
  },

  // ─── KPI Cards — GL ────────────────────────────────────────────────────────

  'kpi.journalsMtd': {
    firstRun: {
      title: 'No journals',
      description: 'Journal entries will appear once posted.',
    },
    noResults: {
      title: 'No journals',
      description: 'No journal entries for this period.',
    },
  },

  'kpi.unpostedJournals': {
    firstRun: {
      title: 'No unposted journals',
      description: 'Draft journals awaiting posting will appear here.',
    },
    noResults: {
      title: 'No unposted journals',
      description: 'All journals have been posted.',
    },
  },

  'kpi.trialBalance': {
    firstRun: {
      title: 'No trial balance',
      description: 'Trial balance will display once transactions are posted.',
    },
    noResults: {
      title: 'No trial balance',
      description: 'No trial balance data for the selected period.',
    },
  },

  // ─── KPI Cards — Banking ───────────────────────────────────────────────────

  'kpi.unreconciledItems': {
    firstRun: {
      title: 'No unreconciled items',
      description: 'Bank transactions needing reconciliation will appear here.',
    },
    noResults: {
      title: 'Fully reconciled',
      description: 'All bank transactions have been matched.',
    },
  },

  // ─── KPI Cards — Assets ────────────────────────────────────────────────────

  'kpi.totalFixedAssets': {
    firstRun: {
      title: 'No fixed assets',
      description: 'Fixed assets will appear once recorded.',
    },
    noResults: {
      title: 'No fixed assets',
      description: 'No fixed asset data for the selected period.',
    },
  },

  'kpi.depreciationMtd': {
    firstRun: {
      title: 'No depreciation',
      description: 'Depreciation will appear once assets are depreciated.',
    },
    noResults: {
      title: 'No depreciation',
      description: 'No depreciation recorded this period.',
    },
  },

  'kpi.pendingDisposals': {
    firstRun: {
      title: 'No pending disposals',
      description: 'Assets awaiting disposal will appear here.',
    },
    noResults: {
      title: 'No pending disposals',
      description: 'No assets pending disposal.',
    },
  },

  // ─── KPI Cards — Travel/Expenses ───────────────────────────────────────────

  'kpi.openClaims': {
    firstRun: {
      title: 'No expense claims',
      description: 'Expense claims will appear once submitted.',
    },
    noResults: {
      title: 'No open claims',
      description: 'No expense claims currently open.',
    },
  },

  'kpi.expensesPending': {
    firstRun: {
      title: 'No pending expenses',
      description: 'Expenses awaiting approval will appear here.',
    },
    noResults: {
      title: 'No pending expenses',
      description: 'No expenses pending approval.',
    },
  },

  'kpi.expensesMtd': {
    firstRun: {
      title: 'No expenses',
      description: 'Monthly expenses will appear once claims are processed.',
    },
    noResults: {
      title: 'No expenses',
      description: 'No expenses recorded this period.',
    },
  },

  // ─── KPI Cards — Treasury ──────────────────────────────────────────────────

  'kpi.cashForecast': {
    firstRun: {
      title: 'No forecast data',
      description: 'Cash forecasts will appear once configured.',
    },
    noResults: {
      title: 'No forecast data',
      description: 'No cash forecast data for the selected period.',
    },
  },

  'kpi.activeLoans': {
    firstRun: {
      title: 'No active loans',
      description: 'Loan facilities will appear once recorded.',
    },
    noResults: {
      title: 'No active loans',
      description: 'No loan facilities currently active.',
    },
  },

  'kpi.covenantBreaches': {
    firstRun: {
      title: 'No covenant data',
      description: 'Covenant status will appear once loans are configured.',
    },
    noResults: {
      title: 'No breaches',
      description: 'All covenants are in compliance.',
    },
  },

  // ─── KPI Cards — Controlling ───────────────────────────────────────────────

  'kpi.activeCostCenters': {
    firstRun: {
      title: 'No cost centers',
      description: 'Cost centers will appear once configured.',
    },
    noResults: {
      title: 'No active cost centers',
      description: 'No cost centers with activity this period.',
    },
  },

  'kpi.activeProjects': {
    firstRun: {
      title: 'No projects',
      description: 'Projects will appear once created.',
    },
    noResults: {
      title: 'No active projects',
      description: 'No projects with open WIP or billing.',
    },
  },

  'kpi.pendingAllocations': {
    firstRun: {
      title: 'No pending allocations',
      description: 'Allocation runs awaiting processing will appear here.',
    },
    noResults: {
      title: 'No pending allocations',
      description: 'All allocations have been processed.',
    },
  },

  'kpi.budgetVariance': {
    firstRun: {
      title: 'No variance data',
      description: 'Budget variance will appear once budgets are set.',
    },
    noResults: {
      title: 'No variance data',
      description: 'No budget variance data for the selected period.',
    },
  },

  // ─── Generated Entries (managed by afenda-gen) ─────────────────────────────
  // @afenda-gen:empty-state-entries:start

  'finance.payables.duplicates': {
    firstRun: {
      title: 'No duplicate holds',
      description: 'Invoices flagged as potential duplicates will appear here for review.',
    },
    noResults: {
      title: 'No matching duplicates',
      description: 'Try adjusting your search or filters.',
    },
  },

  'finance.payables.creditMemos': {
    firstRun: {
      title: 'No credit memos yet',
      description: 'Create your first Credit Memo to get started.',
      ctaLabel: 'Create Credit Memo',
    },
    noResults: {
      title: 'No matching credit memos',
      description: 'Try adjusting your search or filters.',
    },
  },

  'finance.payables.debitMemos': {
    firstRun: {
      title: 'No debit memos yet',
      description: 'Create your first Debit Memo to get started.',
      ctaLabel: 'Create Debit Memo',
    },
    noResults: {
      title: 'No matching debit memos',
      description: 'Try adjusting your search or filters.',
    },
  },

  'finance.payables.prepayments': {
    firstRun: {
      title: 'No prepayments yet',
      description: 'Create your first Prepayment to get started.',
      ctaLabel: 'Create Prepayment',
    },
    noResults: {
      title: 'No matching prepayments',
      description: 'Try adjusting your search or filters.',
    },
  },

  'finance.payables.triage': {
    firstRun: {
      title: 'No triage items yet',
      description: 'Invoices requiring manual review will appear here.',
    },
    noResults: {
      title: 'No matching triage items',
      description: 'Try adjusting your search or filters.',
    },
  },

  'finance.payables.reconciliation': {
    firstRun: {
      title: 'No reconciliation items yet',
      description: 'Statement lines pending reconciliation will appear here.',
    },
    noResults: {
      title: 'No matching reconciliation items',
      description: 'Try adjusting your search or filters.',
    },
  },

  'finance.payables.import': {
    firstRun: {
      title: 'No imports yet',
      description: 'Import invoices from a file or connected source.',
      ctaLabel: 'Import Invoices',
    },
    noResults: {
      title: 'No matching imports',
      description: 'Try adjusting your search or filters.',
    },
  },

  'finance.payables.closeChecklist': {
    firstRun: {
      title: 'No close checklist items',
      description: 'Period-end close tasks for AP will appear here.',
    },
    noResults: {
      title: 'No matching checklist items',
      description: 'Try adjusting your search or filters.',
    },
  },

  // @afenda-gen:empty-state-entries:end
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
  variant: EmptyStateVariant = 'firstRun'
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
