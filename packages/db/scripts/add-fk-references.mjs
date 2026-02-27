/**
 * Enterprise FK Reference Transformer
 * Adds .references(() => target.id, { onDelete: '...' }) to all FK columns
 * in the Drizzle schema files.
 * 
 * Run: node packages/db/scripts/add-fk-references.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = join(__dirname, '..', 'src', 'schema');

// FK mappings: columnPattern → { target, onDelete? }
// Pattern matches the exact column definition text to replace
const ERP_FK_MAPPINGS = [
  // ─── GL Core ──────────────────────────────────────
  // fiscalPeriods.fiscalYearId → fiscalYears
  { table: 'fiscal_period', col: 'fiscal_year_id', target: 'fiscalYears', onDelete: 'restrict' },
  // accounts.parentId → accounts (self-ref)
  { table: 'account', col: 'parent_id', target: 'accounts', onDelete: 'set null', nullable: true },
  // ledgers.currencyId → currencies
  { table: 'ledger', col: 'currency_id', target: 'currencies', onDelete: 'restrict' },
  // glJournals.ledgerId → ledgers
  { table: 'gl_journal', col: 'ledger_id', target: 'ledgers', onDelete: 'restrict' },
  // glJournals.fiscalPeriodId → fiscalPeriods
  { table: 'gl_journal', col: 'fiscal_period_id', target: 'fiscalPeriods', onDelete: 'restrict' },
  // glJournals.reversalOfId → glJournals (self-ref, nullable)
  { table: 'gl_journal', col: 'reversal_of_id', target: 'glJournals', onDelete: 'set null', nullable: true },
  // glJournals.reversedById → glJournals (self-ref, nullable)
  { table: 'gl_journal', col: 'reversed_by_id', target: 'glJournals', onDelete: 'set null', nullable: true },
  // glJournalLines.journalId → glJournals
  { table: 'gl_journal_line', col: 'journal_id', target: 'glJournals', onDelete: 'cascade' },
  // glJournalLines.accountId → accounts
  { table: 'gl_journal_line', col: 'account_id', target: 'accounts', onDelete: 'restrict' },

  // ─── FX ───────────────────────────────────────────
  { table: 'fx_rate', col: 'from_currency_id', target: 'currencies', onDelete: 'restrict' },
  { table: 'fx_rate', col: 'to_currency_id', target: 'currencies', onDelete: 'restrict' },

  // ─── Intercompany ─────────────────────────────────
  { table: 'ic_agreement', col: 'currency_id', target: 'currencies', onDelete: 'restrict' },
  { table: 'ic_transaction', col: 'agreement_id', target: 'icAgreements', onDelete: 'restrict' },
  { table: 'ic_transaction', col: 'currency_id', target: 'currencies', onDelete: 'restrict' },
  { table: 'ic_transaction_leg', col: 'transaction_id', target: 'icTransactions', onDelete: 'cascade' },
  { table: 'ic_transaction_leg', col: 'journal_id', target: 'glJournals', onDelete: 'set null', nullable: true },
  { table: 'ic_settlement', col: 'agreement_id', target: 'icAgreements', onDelete: 'restrict' },
  { table: 'ic_settlement', col: 'currency_id', target: 'currencies', onDelete: 'restrict' },
  { table: 'ic_settlement_line', col: 'settlement_id', target: 'icSettlements', onDelete: 'cascade' },
  { table: 'ic_settlement_line', col: 'transaction_id', target: 'icTransactions', onDelete: 'restrict' },

  // ─── Budget / Recurring ───────────────────────────
  { table: 'recurring_template', col: 'ledger_id', target: 'ledgers', onDelete: 'restrict' },
  { table: 'budget_entry', col: 'ledger_id', target: 'ledgers', onDelete: 'restrict' },
  { table: 'budget_entry', col: 'account_id', target: 'accounts', onDelete: 'restrict' },
  { table: 'budget_entry', col: 'period_id', target: 'fiscalPeriods', onDelete: 'restrict' },

  // ─── Revenue Recognition ──────────────────────────
  { table: 'revenue_contract', col: 'currency_id', target: 'currencies', onDelete: 'restrict' },
  { table: 'revenue_contract', col: 'deferred_account_id', target: 'accounts', onDelete: 'restrict' },
  { table: 'revenue_contract', col: 'revenue_account_id', target: 'accounts', onDelete: 'restrict' },
  { table: 'recognition_milestone', col: 'contract_id', target: 'revenueContracts', onDelete: 'cascade' },

  // ─── Classification Rules ─────────────────────────
  { table: 'classification_rule', col: 'rule_set_id', target: 'classificationRuleSets', onDelete: 'cascade' },

  // ─── AP Sub-Ledger ────────────────────────────────
  { table: 'supplier', col: 'currency_id', target: 'currencies', onDelete: 'restrict' },
  { table: 'supplier', col: 'default_payment_terms_id', target: 'paymentTermsTemplates', onDelete: 'set null', nullable: true },
  { table: 'supplier', col: 'parent_supplier_id', target: 'suppliers', onDelete: 'set null', nullable: true },
  { table: 'supplier_site', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_bank_account', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_bank_account', col: 'site_id', target: 'supplierSites', onDelete: 'set null', nullable: true },
  { table: 'supplier_bank_account', col: 'currency_id', target: 'currencies', onDelete: 'restrict' },
  { table: 'supplier_user', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'ap_invoice', col: 'supplier_id', target: 'suppliers', onDelete: 'restrict' },
  { table: 'ap_invoice', col: 'ledger_id', target: 'ledgers', onDelete: 'restrict' },
  { table: 'ap_invoice', col: 'currency_id', target: 'currencies', onDelete: 'restrict' },
  { table: 'ap_invoice', col: 'payment_terms_id', target: 'paymentTermsTemplates', onDelete: 'set null', nullable: true },
  { table: 'ap_invoice', col: 'journal_id', target: 'glJournals', onDelete: 'set null', nullable: true },
  { table: 'ap_invoice_line', col: 'invoice_id', target: 'apInvoices', onDelete: 'cascade' },
  { table: 'ap_invoice_line', col: 'account_id', target: 'accounts', onDelete: 'restrict' },
  { table: 'ap_hold', col: 'invoice_id', target: 'apInvoices', onDelete: 'cascade' },
  { table: 'ap_payment_run', col: 'currency_id', target: 'currencies', onDelete: 'restrict' },
  { table: 'ap_payment_run_item', col: 'payment_run_id', target: 'apPaymentRuns', onDelete: 'cascade' },
  { table: 'ap_payment_run_item', col: 'invoice_id', target: 'apInvoices', onDelete: 'restrict' },
  { table: 'ap_payment_run_item', col: 'supplier_id', target: 'suppliers', onDelete: 'restrict' },
  { table: 'ap_payment_run_item', col: 'journal_id', target: 'glJournals', onDelete: 'set null', nullable: true },

  // ─── AR Sub-Ledger ────────────────────────────────
  { table: 'ar_invoice', col: 'ledger_id', target: 'ledgers', onDelete: 'restrict' },
  { table: 'ar_invoice', col: 'payment_terms_id', target: 'paymentTermsTemplates', onDelete: 'set null', nullable: true },
  { table: 'ar_invoice', col: 'journal_id', target: 'glJournals', onDelete: 'set null', nullable: true },
  { table: 'ar_invoice_line', col: 'invoice_id', target: 'arInvoices', onDelete: 'cascade' },
  { table: 'ar_invoice_line', col: 'account_id', target: 'accounts', onDelete: 'restrict' },
  { table: 'ar_payment_allocation', col: 'journal_id', target: 'glJournals', onDelete: 'set null', nullable: true },
  { table: 'ar_allocation_item', col: 'payment_allocation_id', target: 'arPaymentAllocations', onDelete: 'cascade' },
  { table: 'ar_allocation_item', col: 'invoice_id', target: 'arInvoices', onDelete: 'restrict' },
  { table: 'dunning_run', col: 'ledger_id', target: 'ledgers', onDelete: 'restrict' },
  { table: 'dunning_letter', col: 'dunning_run_id', target: 'dunningRuns', onDelete: 'cascade' },

  // ─── Tax ──────────────────────────────────────────
  { table: 'tax_rate', col: 'tax_code_id', target: 'taxCodes', onDelete: 'cascade' },

  // ─── Fixed Assets ─────────────────────────────────
  { table: 'depreciation_schedule', col: 'asset_id', target: 'assets', onDelete: 'cascade' },
  { table: 'asset_movement', col: 'asset_id', target: 'assets', onDelete: 'cascade' },
  { table: 'asset_component', col: 'asset_id', target: 'assets', onDelete: 'cascade' },

  // ─── Bank Reconciliation ──────────────────────────
  { table: 'bank_statement_line', col: 'statement_id', target: 'bankStatements', onDelete: 'cascade' },
  { table: 'bank_match', col: 'statement_line_id', target: 'bankStatementLines', onDelete: 'cascade' },
  { table: 'bank_reconciliation', col: 'statement_id', target: 'bankStatements', onDelete: 'restrict' },

  // ─── Credit Management ────────────────────────────
  { table: 'credit_review', col: 'credit_limit_id', target: 'creditLimits', onDelete: 'cascade' },

  // ─── Expense Management ───────────────────────────
  { table: 'expense_claim_line', col: 'claim_id', target: 'expenseClaims', onDelete: 'cascade' },

  // ─── Projects ─────────────────────────────────────
  { table: 'project_cost_line', col: 'project_id', target: 'projects', onDelete: 'cascade' },
  { table: 'project_billing', col: 'project_id', target: 'projects', onDelete: 'cascade' },

  // ─── Leases ───────────────────────────────────────
  { table: 'lease_schedule', col: 'lease_contract_id', target: 'leaseContracts', onDelete: 'cascade' },
  { table: 'lease_modification', col: 'lease_contract_id', target: 'leaseContracts', onDelete: 'cascade' },

  // ─── Provisions ───────────────────────────────────
  { table: 'provision_movement', col: 'provision_id', target: 'provisions', onDelete: 'cascade' },

  // ─── IC Loans ─────────────────────────────────────
  // (companyId references are cross-schema — handled separately)

  // ─── Cost Accounting ──────────────────────────────
  { table: 'cost_driver', col: 'cost_center_id', target: 'costCenters', onDelete: 'cascade' },
  { table: 'cost_driver_value', col: 'driver_id', target: 'costDrivers', onDelete: 'cascade' },
  { table: 'cost_allocation_line', col: 'run_id', target: 'costAllocationRuns', onDelete: 'cascade' },
  { table: 'cost_allocation_line', col: 'driver_id', target: 'costDrivers', onDelete: 'restrict' },
  { table: 'cost_allocation_line', col: 'cost_center_id', target: 'costCenters', onDelete: 'restrict' },

  // ─── Consolidation ────────────────────────────────
  { table: 'ownership_record', col: 'parent_entity_id', target: 'groupEntities', onDelete: 'cascade' },
  { table: 'ownership_record', col: 'child_entity_id', target: 'groupEntities', onDelete: 'cascade' },

  // ─── IFRS Specialist ──────────────────────────────
  { table: 'hedge_relationship', col: 'instrument_id', target: 'financialInstruments', onDelete: 'restrict' },
  { table: 'fair_value_measurement', col: 'instrument_id', target: 'financialInstruments', onDelete: 'cascade' },
  { table: 'hedge_effectiveness_test', col: 'hedge_id', target: 'hedgeRelationships', onDelete: 'cascade' },
  { table: 'mapping_rule_version', col: 'rule_id', target: 'mappingRules', onDelete: 'cascade' },

  // ─── AP Prepayments ───────────────────────────────
  { table: 'ap_prepayment', col: 'supplier_id', target: 'suppliers', onDelete: 'restrict' },
  { table: 'ap_prepayment_application', col: 'prepayment_id', target: 'apPrepayments', onDelete: 'cascade' },
  { table: 'ap_prepayment_application', col: 'invoice_id', target: 'apInvoices', onDelete: 'restrict' },

  // ─── Supplier MDM ─────────────────────────────────
  { table: 'supplier_document', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_dispute', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_notification_pref', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_compliance_item', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'ocr_job', col: 'invoice_id', target: 'apInvoices', onDelete: 'set null', nullable: true },
  { table: 'supplier_company_override', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_block', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_block_history', col: 'block_id', target: 'supplierBlocks', onDelete: 'cascade' },
  { table: 'supplier_blacklist', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_tax_registration', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_legal_document', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_doc_requirement', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_eval_template', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_eval_criteria', col: 'template_id', target: 'supplierEvalTemplates', onDelete: 'cascade' },
  { table: 'supplier_evaluation', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_evaluation', col: 'template_id', target: 'supplierEvalTemplates', onDelete: 'restrict' },
  { table: 'supplier_eval_score', col: 'evaluation_id', target: 'supplierEvaluations', onDelete: 'cascade' },
  { table: 'supplier_eval_score', col: 'criteria_id', target: 'supplierEvalCriteria', onDelete: 'restrict' },
  { table: 'supplier_risk_indicator', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_diversity', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_contact', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_duplicate_suspect', col: 'supplier_id', target: 'suppliers', onDelete: 'cascade' },
  { table: 'supplier_duplicate_suspect', col: 'duplicate_supplier_id', target: 'suppliers', onDelete: 'cascade' },
];

// Approval/SoD/Document FKs (erp-approval.ts, erp-document.ts)
const APPROVAL_FK_MAPPINGS = [
  { table: 'approval_request', col: 'policy_id', target: 'approvalPolicies', onDelete: 'set null', nullable: true },
  { table: 'approval_step', col: 'request_id', target: 'approvalRequests', onDelete: 'cascade' },
];

const DOCUMENT_FK_MAPPINGS = [
  // documentLinks already has FK — skip
];

function addFkReferences(content, mappings, currentTable) {
  let modified = content;
  let changeCount = 0;
  let inTable = null;

  for (const mapping of mappings) {
    const colName = mapping.col;
    const target = mapping.target;
    const onDeleteRule = mapping.onDelete || 'restrict';

    // Build the reference suffix
    const refOptions = onDeleteRule !== 'no action'
      ? `.references(() => ${target}.id, { onDelete: '${onDeleteRule}' })`
      : `.references(() => ${target}.id)`;

    // Match the column definition:
    // Pattern 1: uuid('col_name').notNull() — required FK
    // Pattern 2: uuid('col_name') — optional FK (nullable)
    //
    // We need to match within the correct table context.
    // Strategy: find the table definition, then find the column within it.
    
    const tableStart = `'${mapping.table}'`;
    const tableIdx = modified.indexOf(tableStart);
    if (tableIdx === -1) {
      console.warn(`  ⚠ Table '${mapping.table}' not found`);
      continue;
    }

    // Find the column within the table's column block
    // Look for uuid('col_name') after the table start
    const searchFrom = tableIdx;
    
    if (mapping.nullable) {
      // Nullable column: uuid('col_name')  or uuid('col_name'),
      const colPattern = `uuid('${colName}')`;
      const colIdx = modified.indexOf(colPattern, searchFrom);
      if (colIdx === -1) {
        console.warn(`  ⚠ Column '${colName}' not found in table '${mapping.table}'`);
        continue;
      }
      // Check it doesn't already have .references
      const afterCol = modified.substring(colIdx, colIdx + colPattern.length + 50);
      if (afterCol.includes('.references(')) {
        continue; // Already has FK
      }
      // Replace: uuid('col_name') → uuid('col_name').references(...)
      // But only replace this specific occurrence
      const beforeReplacement = modified.substring(0, colIdx);
      const afterReplacement = modified.substring(colIdx + colPattern.length);
      // Check what follows: comma, newline, .notNull, etc.
      const charAfter = afterReplacement.charAt(0);
      if (charAfter === ',') {
        modified = beforeReplacement + colPattern + refOptions + afterReplacement;
      } else if (charAfter === ')') {
        modified = beforeReplacement + colPattern + refOptions + afterReplacement;
      } else {
        modified = beforeReplacement + colPattern + refOptions + afterReplacement;
      }
      changeCount++;
    } else {
      // Required column: uuid('col_name').notNull()
      const colPattern = `uuid('${colName}').notNull()`;
      const colIdx = modified.indexOf(colPattern, searchFrom);
      if (colIdx === -1) {
        console.warn(`  ⚠ Column '${colName}.notNull()' not found in table '${mapping.table}'`);
        continue;
      }
      // Check it doesn't already have .references
      const afterCol = modified.substring(colIdx, colIdx + colPattern.length + 50);
      if (afterCol.includes('.references(')) {
        continue; // Already has FK
      }
      // Replace: uuid('col_name').notNull() → uuid('col_name').notNull().references(...)
      const beforeReplacement = modified.substring(0, colIdx);
      const afterReplacement = modified.substring(colIdx + colPattern.length);
      modified = beforeReplacement + colPattern + refOptions + afterReplacement;
      changeCount++;
    }
  }
  
  return { content: modified, count: changeCount };
}

// ─── Process erp.ts ───────────────────────────────────────────────────────
console.log('Processing erp.ts...');
let erpContent = readFileSync(join(SCHEMA_DIR, 'erp.ts'), 'utf-8');
const erpResult = addFkReferences(erpContent, ERP_FK_MAPPINGS);
writeFileSync(join(SCHEMA_DIR, 'erp.ts'), erpResult.content);
console.log(`  ✓ ${erpResult.count} FK references added to erp.ts`);

// ─── Process erp-approval.ts ──────────────────────────────────────────────
console.log('Processing erp-approval.ts...');
let approvalContent = readFileSync(join(SCHEMA_DIR, 'erp-approval.ts'), 'utf-8');

// Need to add imports for approvalPolicies and approvalRequests
// But they're in the same file — so self-references work
const approvalResult = addFkReferences(approvalContent, APPROVAL_FK_MAPPINGS);
writeFileSync(join(SCHEMA_DIR, 'erp-approval.ts'), approvalResult.content);
console.log(`  ✓ ${approvalResult.count} FK references added to erp-approval.ts`);

// ─── Summary ──────────────────────────────────────────────────────────────
const total = erpResult.count + approvalResult.count;
console.log(`\n✅ Total: ${total} FK references added across all schema files`);
console.log('\nNext steps:');
console.log('  1. Run: pnpm --filter @afenda/db db:generate');
console.log('  2. Review the generated migration SQL');
console.log('  3. Run: pnpm --filter @afenda/db db:migrate');
