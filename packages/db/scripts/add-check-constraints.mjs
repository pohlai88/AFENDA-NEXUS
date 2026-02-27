/**
 * add-check-constraints.mjs
 * Adds CHECK constraints to Drizzle schema tables for financial data integrity.
 *
 * Two table patterns are handled:
 *   Pattern A – table already has a third-arg callback:
 *       (t) => [
 *         existing...,
 *       ]
 *     → inserts checks before the closing `]`
 *
 *   Pattern B – table has NO third-arg callback:
 *       },
 *     ).enableRLS();
 *     → transforms to:
 *       },
 *       (t) => [
 *         checks...
 *       ]
 *     ).enableRLS();
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_FILE = resolve(__dirname, '../src/schema/erp.ts');

// ─── CHECK constraint definitions ──────────────────────────────────────────
// Key = JS table variable name (exported const)
// Value = array of { name: constraintName, cols: [{ col, op }] }
//   - op: '>= 0', '> 0', 'BETWEEN 0 AND 100', 'BETWEEN 0 AND 10000', custom SQL string
//   - For multi-column: provide custom expr string

const CHECKS = {
  // ── GL ───────
  glJournalLines: [
    {
      name: 'chk_gl_line_amounts_nonneg',
      cols: [
        { col: 'debit', op: '>= 0' },
        { col: 'credit', op: '>= 0' },
        { col: 'baseCurrencyDebit', op: '>= 0' },
        { col: 'baseCurrencyCredit', op: '>= 0' },
      ],
    },
  ],
  glBalances: [
    {
      name: 'chk_gl_bal_amounts_nonneg',
      cols: [
        { col: 'debitBalance', op: '>= 0' },
        { col: 'creditBalance', op: '>= 0' },
      ],
    },
  ],
  fiscalPeriods: [
    {
      name: 'chk_fiscal_period_number_positive',
      cols: [{ col: 'periodNumber', op: '> 0' }],
    },
  ],

  // ── IC ───────
  icTransactions: [
    {
      name: 'chk_ic_txn_amount_nonneg',
      cols: [{ col: 'amount', op: '>= 0' }],
    },
  ],
  icSettlements: [
    {
      name: 'chk_ic_settle_total_nonneg',
      cols: [{ col: 'totalAmount', op: '>= 0' }],
    },
  ],
  icSettlementLines: [
    {
      name: 'chk_ic_settle_line_amt_nonneg',
      cols: [{ col: 'amount', op: '>= 0' }],
    },
  ],

  // ── Revenue Recognition ───────
  revenueContracts: [
    {
      name: 'chk_rev_contract_amounts_nonneg',
      cols: [
        { col: 'totalAmount', op: '>= 0' },
        { col: 'recognizedToDate', op: '>= 0' },
      ],
    },
  ],
  recognitionMilestones: [
    {
      name: 'chk_rev_milestone_amt_nonneg',
      cols: [{ col: 'amount', op: '>= 0' }],
    },
  ],

  // ── Budgets ───────
  budgetEntries: [
    {
      name: 'chk_budget_amount_nonneg',
      cols: [{ col: 'budgetAmount', op: '>= 0' }],
    },
  ],

  // ── AP ───────
  apInvoices: [
    {
      name: 'chk_ap_inv_amounts_nonneg',
      cols: [
        { col: 'totalAmount', op: '>= 0' },
        { col: 'paidAmount', op: '>= 0' },
      ],
    },
    {
      name: 'chk_ap_paid_lte_total',
      expr: '${t.paidAmount} <= ${t.totalAmount}',
    },
  ],
  apInvoiceLines: [
    {
      name: 'chk_ap_line_amounts_nonneg',
      cols: [
        { col: 'unitPrice', op: '>= 0' },
        { col: 'amount', op: '>= 0' },
        { col: 'taxAmount', op: '>= 0' },
      ],
    },
    {
      name: 'chk_ap_line_qty_positive',
      cols: [{ col: 'quantity', op: '> 0' }],
    },
  ],
  apPaymentRuns: [
    {
      name: 'chk_ap_payrun_total_nonneg',
      cols: [{ col: 'totalAmount', op: '>= 0' }],
    },
  ],
  apPaymentRunItems: [
    {
      name: 'chk_ap_payitem_amounts_nonneg',
      cols: [
        { col: 'amount', op: '>= 0' },
        { col: 'discountAmount', op: '>= 0' },
        { col: 'netAmount', op: '>= 0' },
      ],
    },
  ],

  // ── AR ───────
  arInvoices: [
    {
      name: 'chk_ar_inv_amounts_nonneg',
      cols: [
        { col: 'totalAmount', op: '>= 0' },
        { col: 'paidAmount', op: '>= 0' },
      ],
    },
    {
      name: 'chk_ar_paid_lte_total',
      expr: '${t.paidAmount} <= ${t.totalAmount}',
    },
  ],
  arInvoiceLines: [
    {
      name: 'chk_ar_line_amounts_nonneg',
      cols: [
        { col: 'unitPrice', op: '>= 0' },
        { col: 'amount', op: '>= 0' },
        { col: 'taxAmount', op: '>= 0' },
      ],
    },
    {
      name: 'chk_ar_line_qty_positive',
      cols: [{ col: 'quantity', op: '> 0' }],
    },
  ],
  arPaymentAllocations: [
    {
      name: 'chk_ar_pmt_total_nonneg',
      cols: [{ col: 'totalAmount', op: '>= 0' }],
    },
  ],
  arAllocationItems: [
    {
      name: 'chk_ar_alloc_amt_nonneg',
      cols: [{ col: 'allocatedAmount', op: '>= 0' }],
    },
  ],
  dunningLetters: [
    {
      name: 'chk_dunning_overdue_nonneg',
      cols: [{ col: 'totalOverdue', op: '>= 0' }],
    },
    {
      name: 'chk_dunning_level_positive',
      cols: [{ col: 'level', op: '> 0' }],
    },
  ],

  // ── Tax ───────
  taxRates: [
    {
      name: 'chk_tax_rate_pct_range',
      cols: [{ col: 'ratePercent', op: 'BETWEEN 0 AND 100' }],
    },
  ],
  taxReturnPeriods: [
    {
      name: 'chk_tax_return_amounts_nonneg',
      cols: [
        { col: 'outputTax', op: '>= 0' },
        { col: 'inputTax', op: '>= 0' },
      ],
    },
  ],
  whtCertificates: [
    {
      name: 'chk_wht_amounts_nonneg',
      cols: [
        { col: 'grossAmount', op: '>= 0' },
        { col: 'whtAmount', op: '>= 0' },
        { col: 'netAmount', op: '>= 0' },
      ],
    },
    {
      name: 'chk_wht_rate_range',
      cols: [{ col: 'rateApplied', op: 'BETWEEN 0 AND 100' }],
    },
  ],

  // ── Assets ───────
  assets: [
    {
      name: 'chk_asset_amounts_nonneg',
      cols: [
        { col: 'acquisitionCost', op: '>= 0' },
        { col: 'residualValue', op: '>= 0' },
        { col: 'accumulatedDepreciation', op: '>= 0' },
        { col: 'netBookValue', op: '>= 0' },
      ],
    },
    {
      name: 'chk_asset_useful_life_positive',
      cols: [{ col: 'usefulLifeMonths', op: '> 0' }],
    },
  ],
  depreciationSchedules: [
    {
      name: 'chk_depr_amounts_nonneg',
      cols: [
        { col: 'depreciationAmount', op: '>= 0' },
        { col: 'accumulatedDepreciation', op: '>= 0' },
        { col: 'netBookValue', op: '>= 0' },
      ],
    },
  ],
  assetMovements: [
    {
      name: 'chk_asset_mvmt_amt_nonneg',
      cols: [{ col: 'amount', op: '>= 0' }],
    },
  ],
  assetComponents: [
    {
      name: 'chk_asset_comp_amounts_nonneg',
      cols: [
        { col: 'acquisitionCost', op: '>= 0' },
        { col: 'residualValue', op: '>= 0' },
        { col: 'accumulatedDepreciation', op: '>= 0' },
        { col: 'netBookValue', op: '>= 0' },
      ],
    },
    {
      name: 'chk_asset_comp_life_positive',
      cols: [{ col: 'usefulLifeMonths', op: '> 0' }],
    },
  ],

  // ── Banking ───────
  bankMatches: [
    {
      name: 'chk_bank_match_amt_nonneg',
      cols: [{ col: 'matchedAmount', op: '>= 0' }],
    },
    {
      name: 'chk_bank_match_confidence',
      cols: [{ col: 'confidenceScore', op: 'BETWEEN 0 AND 100' }],
    },
  ],
  bankReconciliations: [
    {
      name: 'chk_bank_recon_amounts_nonneg',
      cols: [
        { col: 'outstandingChecks', op: '>= 0' },
        { col: 'depositsInTransit', op: '>= 0' },
      ],
    },
    {
      name: 'chk_bank_recon_counts_nonneg',
      cols: [
        { col: 'matchedCount', op: '>= 0' },
        { col: 'unmatchedCount', op: '>= 0' },
      ],
    },
  ],
  bankStatements: [
    {
      name: 'chk_bank_stmt_linecount_nonneg',
      cols: [{ col: 'lineCount', op: '>= 0' }],
    },
  ],

  // ── Credit ───────
  creditLimits: [
    {
      name: 'chk_credit_amounts_nonneg',
      cols: [
        { col: 'creditLimit', op: '>= 0' },
        { col: 'currentExposure', op: '>= 0' },
        { col: 'availableCredit', op: '>= 0' },
      ],
    },
  ],
  creditReviews: [
    {
      name: 'chk_credit_review_amounts_nonneg',
      cols: [
        { col: 'previousLimit', op: '>= 0' },
        { col: 'proposedLimit', op: '>= 0' },
        { col: 'approvedLimit', op: '>= 0' },
      ],
    },
  ],

  // ── Expenses ───────
  expenseClaims: [
    {
      name: 'chk_expense_claim_amounts_nonneg',
      cols: [
        { col: 'totalAmount', op: '>= 0' },
        { col: 'baseCurrencyAmount', op: '>= 0' },
      ],
    },
    {
      name: 'chk_expense_claim_linecount_nonneg',
      cols: [{ col: 'lineCount', op: '>= 0' }],
    },
  ],
  expenseClaimLines: [
    {
      name: 'chk_expense_line_amounts_nonneg',
      cols: [
        { col: 'amount', op: '>= 0' },
        { col: 'baseCurrencyAmount', op: '>= 0' },
      ],
    },
  ],
  expensePolicies: [
    {
      name: 'chk_expense_policy_amounts_nonneg',
      cols: [
        { col: 'maxAmountPerItem', op: '>= 0' },
        { col: 'maxAmountPerClaim', op: '>= 0' },
      ],
    },
  ],

  // ── Projects ───────
  projects: [
    {
      name: 'chk_project_amounts_nonneg',
      cols: [
        { col: 'budgetAmount', op: '>= 0' },
        { col: 'actualCost', op: '>= 0' },
        { col: 'billedAmount', op: '>= 0' },
      ],
    },
    {
      name: 'chk_project_completion_range',
      cols: [{ col: 'completionPct', op: 'BETWEEN 0 AND 100' }],
    },
  ],
  projectCostLines: [
    {
      name: 'chk_proj_cost_amt_nonneg',
      cols: [{ col: 'amount', op: '>= 0' }],
    },
  ],
  projectBillings: [
    {
      name: 'chk_proj_billing_amt_nonneg',
      cols: [{ col: 'amount', op: '>= 0' }],
    },
  ],

  // ── Leases ───────
  leaseContracts: [
    {
      name: 'chk_lease_amounts_nonneg',
      cols: [
        { col: 'monthlyPayment', op: '>= 0' },
        { col: 'rouAssetAmount', op: '>= 0' },
        { col: 'leaseLiabilityAmount', op: '>= 0' },
      ],
    },
    {
      name: 'chk_lease_term_positive',
      cols: [{ col: 'leaseTermMonths', op: '> 0' }],
    },
    {
      name: 'chk_lease_discount_positive',
      cols: [{ col: 'discountRateBps', op: '> 0' }],
    },
  ],
  leaseSchedules: [
    {
      name: 'chk_lease_sched_amounts_nonneg',
      cols: [
        { col: 'paymentAmount', op: '>= 0' },
        { col: 'principalPortion', op: '>= 0' },
        { col: 'interestPortion', op: '>= 0' },
        { col: 'openingLiability', op: '>= 0' },
        { col: 'closingLiability', op: '>= 0' },
        { col: 'rouDepreciation', op: '>= 0' },
      ],
    },
    {
      name: 'chk_lease_sched_period_positive',
      cols: [{ col: 'periodNumber', op: '> 0' }],
    },
  ],
  leaseModifications: [
    {
      name: 'chk_lease_mod_amounts_nonneg',
      cols: [
        { col: 'previousMonthlyPayment', op: '>= 0' },
        { col: 'newMonthlyPayment', op: '>= 0' },
      ],
    },
    {
      name: 'chk_lease_mod_terms_positive',
      cols: [
        { col: 'previousLeaseTermMonths', op: '> 0' },
        { col: 'newLeaseTermMonths', op: '> 0' },
        { col: 'previousDiscountRateBps', op: '> 0' },
        { col: 'newDiscountRateBps', op: '> 0' },
      ],
    },
  ],

  // ── Provisions ───────
  provisions: [
    {
      name: 'chk_provision_amounts_nonneg',
      cols: [
        { col: 'initialAmount', op: '>= 0' },
        { col: 'currentAmount', op: '>= 0' },
      ],
    },
  ],
  provisionMovements: [
    {
      name: 'chk_provision_mvmt_nonneg',
      cols: [
        { col: 'amount', op: '>= 0' },
        { col: 'balanceAfter', op: '>= 0' },
      ],
    },
  ],

  // ── IC Loans ───────
  icLoans: [
    {
      name: 'chk_ic_loan_amounts_nonneg',
      cols: [
        { col: 'principalAmount', op: '>= 0' },
        { col: 'outstandingBalance', op: '>= 0' },
      ],
    },
  ],

  // ── Cash Forecasts ───────
  cashForecasts: [
    {
      name: 'chk_cash_forecast_probability',
      cols: [{ col: 'probability', op: 'BETWEEN 0 AND 100' }],
    },
  ],

  // ── Cost Accounting ───────
  costCenters: [
    {
      name: 'chk_cost_center_level_nonneg',
      cols: [{ col: 'level', op: '>= 0' }],
    },
  ],
  costDriverValues: [
    {
      name: 'chk_cost_driver_qty_nonneg',
      cols: [{ col: 'quantity', op: '>= 0' }],
    },
  ],
  costAllocationRuns: [
    {
      name: 'chk_cost_alloc_run_nonneg',
      cols: [
        { col: 'totalAllocated', op: '>= 0' },
        { col: 'lineCount', op: '>= 0' },
      ],
    },
  ],
  costAllocationLines: [
    {
      name: 'chk_cost_alloc_line_nonneg',
      cols: [
        { col: 'amount', op: '>= 0' },
        { col: 'driverQuantity', op: '>= 0' },
        { col: 'allocationRate', op: '>= 0' },
      ],
    },
  ],

  // ── Consolidation ───────
  ownershipRecords: [
    {
      name: 'chk_ownership_cost_nonneg',
      cols: [{ col: 'acquisitionCost', op: '>= 0' }],
    },
    {
      name: 'chk_ownership_pct_bps_range',
      cols: [
        { col: 'ownershipPctBps', op: 'BETWEEN 0 AND 10000' },
        { col: 'votingPctBps', op: 'BETWEEN 0 AND 10000' },
      ],
    },
  ],
  goodwills: [
    {
      name: 'chk_goodwill_amounts_nonneg',
      cols: [
        { col: 'considerationPaid', op: '>= 0' },
        { col: 'fairValueNetAssets', op: '>= 0' },
        { col: 'nciAtAcquisition', op: '>= 0' },
        { col: 'goodwillAmount', op: '>= 0' },
        { col: 'accumulatedImpairment', op: '>= 0' },
        { col: 'carryingAmount', op: '>= 0' },
      ],
    },
  ],
  intangibleAssets: [
    {
      name: 'chk_intangible_amounts_nonneg',
      cols: [
        { col: 'acquisitionCost', op: '>= 0' },
        { col: 'residualValue', op: '>= 0' },
        { col: 'accumulatedAmortization', op: '>= 0' },
        { col: 'netBookValue', op: '>= 0' },
      ],
    },
  ],

  // ── IFRS / Financial Instruments ───────
  financialInstruments: [
    {
      name: 'chk_fin_instr_amounts_nonneg',
      cols: [
        { col: 'nominalAmount', op: '>= 0' },
        { col: 'carryingAmount', op: '>= 0' },
      ],
    },
  ],
  deferredTaxItems: [
    {
      name: 'chk_deferred_tax_nonneg',
      cols: [
        { col: 'deferredTaxAsset', op: '>= 0' },
        { col: 'deferredTaxLiability', op: '>= 0' },
      ],
    },
  ],
  fairValueMeasurements: [
    {
      name: 'chk_fair_value_nonneg',
      cols: [{ col: 'fairValue', op: '>= 0' }],
    },
  ],

  // ── AP Prepayments ───────
  apPrepayments: [
    {
      name: 'chk_prepay_amounts_nonneg',
      cols: [
        { col: 'totalAmount', op: '>= 0' },
        { col: 'appliedAmount', op: '>= 0' },
        { col: 'unappliedBalance', op: '>= 0' },
      ],
    },
    {
      name: 'chk_prepay_applied_lte_total',
      expr: '${t.appliedAmount} <= ${t.totalAmount}',
    },
  ],
  apPrepaymentApplications: [
    {
      name: 'chk_prepay_app_amt_nonneg',
      cols: [{ col: 'amount', op: '>= 0' }],
    },
  ],

  // ── Payment Terms ───────
  paymentTermsTemplates: [
    {
      name: 'chk_pay_terms_days_positive',
      cols: [{ col: 'netDays', op: '> 0' }],
    },
    {
      name: 'chk_pay_terms_discount_range',
      cols: [{ col: 'discountPercent', op: 'BETWEEN 0 AND 100' }],
    },
  ],
  paymentTermsLines: [
    {
      name: 'chk_pay_terms_line_days_positive',
      cols: [{ col: 'dueDays', op: '> 0' }],
    },
    {
      name: 'chk_pay_terms_line_pct_range',
      cols: [{ col: 'percentageOfTotal', op: 'BETWEEN 0 AND 100' }],
    },
  ],

  // ── Matching Tolerances ───────
  matchTolerances: [
    {
      name: 'chk_match_tol_qty_range',
      cols: [{ col: 'quantityTolerancePercent', op: 'BETWEEN 0 AND 100' }],
    },
  ],

  // ── Supplier MDM ───────
  supplierDocuments: [
    {
      name: 'chk_supplier_doc_size_positive',
      cols: [{ col: 'fileSizeBytes', op: '> 0' }],
    },
  ],
  supplierEvalCriteria: [
    {
      name: 'chk_supplier_eval_criteria_positive',
      cols: [
        { col: 'weight', op: '> 0' },
        { col: 'maxScore', op: '> 0' },
      ],
    },
  ],
  supplierEvalScores: [
    {
      name: 'chk_supplier_eval_score_nonneg',
      cols: [{ col: 'score', op: '>= 0' }],
    },
  ],
  supplierEvaluations: [
    {
      name: 'chk_supplier_eval_score_nonneg',
      cols: [{ col: 'overallScore', op: '>= 0' }],
    },
  ],
  supplierDuplicateSuspects: [
    {
      name: 'chk_supplier_dup_confidence',
      expr: '${t.confidence} >= 0 AND ${t.confidence} <= 1',
    },
  ],
  supplierCompanyOverrides: [
    {
      name: 'chk_supplier_override_tolerance',
      cols: [{ col: 'tolerancePercent', op: 'BETWEEN 0 AND 100' }],
    },
  ],

  // ── Transfer Pricing ───────
  tpPolicies: [
    {
      name: 'chk_tp_benchmarks_nonneg',
      cols: [
        { col: 'benchmarkLowBps', op: '>= 0' },
        { col: 'benchmarkMedianBps', op: '>= 0' },
        { col: 'benchmarkHighBps', op: '>= 0' },
      ],
    },
    {
      name: 'chk_tp_benchmark_ordering',
      expr: '${t.benchmarkLowBps} <= ${t.benchmarkMedianBps} AND ${t.benchmarkMedianBps} <= ${t.benchmarkHighBps}',
    },
  ],
  tpBenchmarks: [
    {
      name: 'chk_tp_iqr_nonneg',
      cols: [
        { col: 'interquartileRangeLowBps', op: '>= 0' },
        { col: 'interquartileRangeMedianBps', op: '>= 0' },
        { col: 'interquartileRangeHighBps', op: '>= 0' },
      ],
    },
    {
      name: 'chk_tp_iqr_ordering',
      expr: '${t.interquartileRangeLowBps} <= ${t.interquartileRangeMedianBps} AND ${t.interquartileRangeMedianBps} <= ${t.interquartileRangeHighBps}',
    },
    {
      name: 'chk_tp_comparable_positive',
      cols: [{ col: 'comparableCount', op: '> 0' }],
    },
  ],

  // ── Hedge Accounting ───────
  hedgeRelationships: [
    {
      name: 'chk_hedge_ratio_nonneg',
      cols: [{ col: 'hedgeRatio', op: '>= 0' }],
    },
  ],
};

// ─── Build check SQL string ────────────────────────────────────────────────
function buildCheckSql(checkDef) {
  if (checkDef.expr) {
    // Custom expression – already uses ${t.col} syntax
    return checkDef.expr;
  }
  // Build from cols array
  const conditions = checkDef.cols.map(({ col, op }) => {
    if (op === 'BETWEEN 0 AND 100' || op === 'BETWEEN 0 AND 10000') {
      return `\${t.${col}} ${op}`;
    }
    return `\${t.${col}} ${op}`;
  });
  return conditions.join(' AND ');
}

function buildCheckLine(checkDef) {
  const sqlExpr = buildCheckSql(checkDef);
  return `    check('${checkDef.name}', sql\`${sqlExpr}\`)`;
}

// ─── Main transform ────────────────────────────────────────────────────────
function transform() {
  let src = readFileSync(SCHEMA_FILE, 'utf-8');
  const lines = src.split('\n');

  let modified = 0;
  let skipped = 0;

  for (const [tableName, checks] of Object.entries(CHECKS)) {
    // Find the table definition: `export const TABLE_NAME = erpSchema.table(`
    const tablePattern = new RegExp(
      `^export\\s+const\\s+${tableName}\\s*=\\s*erpSchema\\.table\\(`
    );
    let tableLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (tablePattern.test(lines[i])) {
        tableLineIdx = i;
        break;
      }
    }
    if (tableLineIdx === -1) {
      console.warn(`⚠  Table "${tableName}" not found in schema – skipping`);
      skipped++;
      continue;
    }

    // Find the `.enableRLS()` line for this table
    let enableRlsIdx = -1;
    let depth = 0;
    for (let i = tableLineIdx; i < lines.length; i++) {
      const line = lines[i];
      // Track parens to find the matching close
      for (const ch of line) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
      }
      if (line.includes('.enableRLS()') && depth <= 0) {
        enableRlsIdx = i;
        break;
      }
    }

    if (enableRlsIdx === -1) {
      console.warn(`⚠  .enableRLS() not found for "${tableName}" – skipping`);
      skipped++;
      continue;
    }

    // Check if any of these constraints already exist
    const existingChecks = checks.filter((c) => src.includes(`'${c.name}'`));
    const newChecks = checks.filter((c) => !src.includes(`'${c.name}'`));

    if (newChecks.length === 0) {
      console.log(`⏭  "${tableName}" – all ${checks.length} checks already exist`);
      continue;
    }

    if (existingChecks.length > 0) {
      console.log(
        `ℹ  "${tableName}" – ${existingChecks.length} already exist, adding ${newChecks.length} new`
      );
    }

    const checkLines = newChecks.map(buildCheckLine);

    // Determine if table already has a third-arg callback
    // Look for `(t) => [` between tableLineIdx and enableRlsIdx
    let hasCallback = false;
    let closingBracketIdx = -1; // the `  ]` line before `.enableRLS()`
    for (let i = tableLineIdx; i <= enableRlsIdx; i++) {
      if (/\(t\)\s*=>\s*\[/.test(lines[i])) {
        hasCallback = true;
        break;
      }
    }

    if (hasCallback) {
      // Find the closing `]` of the callback (the line just before `).enableRLS()`)
      // It should be the line before enableRlsIdx, or enableRlsIdx itself if on same line
      for (let i = enableRlsIdx; i >= tableLineIdx; i--) {
        if (lines[i].trimStart().startsWith(']')) {
          closingBracketIdx = i;
          break;
        }
      }
      if (closingBracketIdx === -1) {
        console.warn(`⚠  Could not find ] for "${tableName}" callback – skipping`);
        skipped++;
        continue;
      }
      // Insert check lines before the `]`
      const insertLines = checkLines.map((l) => l + ',');
      lines.splice(closingBracketIdx, 0, ...insertLines);
      console.log(`✓  "${tableName}" – added ${newChecks.length} check(s) to existing callback`);
    } else {
      // No callback – need to add one
      // The pattern is:
      //   },
      // ).enableRLS();
      // Transform to:
      //   },
      //   (t) => [
      //     checks...
      //   ]
      // ).enableRLS();
      const insertLines = [
        '  (t) => [',
        ...checkLines.map((l) => l + ','),
        '  ]',
      ];
      // Insert before the `).enableRLS()` line
      lines.splice(enableRlsIdx, 0, ...insertLines);
      console.log(`✓  "${tableName}" – added callback with ${newChecks.length} check(s)`);
    }

    modified++;
    // Re-read the file content (lines array was mutated)
    // No need to re-read, we're working on the lines array
  }

  const result = lines.join('\n');
  writeFileSync(SCHEMA_FILE, result);
  console.log(`\n═══ Done: ${modified} tables modified, ${skipped} skipped ═══`);
}

transform();
