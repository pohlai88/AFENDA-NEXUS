#!/usr/bin/env node
/**
 * gen-rls-policies.mjs
 *
 * Generates the RLS policy migration SQL:
 *  1. Helper functions: current_tenant_id(), current_user_id()
 *  2. FORCE ROW LEVEL SECURITY on all tenant-scoped tables
 *  3. CREATE POLICY tenant_isolation for all 120 tenant-scoped tables
 *  4. Roles & grants (app_runtime + app_runtime_login)
 *  5. Non-tenant platform table policies
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── 124 tenant-scoped tables ───────────────────────────────────────────────
const tenantTables = [
  // platform (5)
  'platform.company',
  'platform.user',
  'platform.notifications',
  'platform.notification_preferences',
  'platform.seed_run',
  // audit (1)
  'audit.audit_log',
  // erp — Core GL & Multi-Currency (10)
  'erp.currency',
  'erp.fiscal_year',
  'erp.fiscal_period',
  'erp.account',
  'erp.ledger',
  'erp.gl_journal',
  'erp.gl_journal_line',
  'erp.gl_balance',
  'erp.fx_rate',
  'erp.counterparty',
  // erp — Intercompany (6)
  'erp.ic_agreement',
  'erp.ic_transaction',
  'erp.ic_transaction_leg',
  'erp.ic_settlement',
  'erp.ic_settlement_line',
  'erp.ic_loan',
  // erp — Recurring, Budgets, Revenue (4)
  'erp.recurring_template',
  'erp.budget_entry',
  'erp.revenue_contract',
  'erp.recognition_milestone',
  // erp — Classification & Payment Terms (4)
  'erp.classification_rule_set',
  'erp.classification_rule',
  'erp.payment_terms_template',
  'erp.payment_terms_line',
  // erp — Suppliers (24)
  'erp.supplier',
  'erp.supplier_site',
  'erp.supplier_bank_account',
  'erp.supplier_user',
  'erp.supplier_document',
  'erp.supplier_dispute',
  'erp.supplier_notification_pref',
  'erp.supplier_compliance_item',
  'erp.supplier_account_group_config',
  'erp.supplier_company_override',
  'erp.supplier_block',
  'erp.supplier_block_history',
  'erp.supplier_blacklist',
  'erp.supplier_tax_registration',
  'erp.supplier_legal_document',
  'erp.supplier_doc_requirement',
  'erp.supplier_eval_template',
  'erp.supplier_eval_criteria',
  'erp.supplier_evaluation',
  'erp.supplier_eval_score',
  'erp.supplier_risk_indicator',
  'erp.supplier_diversity',
  'erp.supplier_contact',
  'erp.supplier_duplicate_suspect',
  // erp — Accounts Payable (7)
  'erp.ap_invoice',
  'erp.ap_invoice_line',
  'erp.ap_hold',
  'erp.ap_payment_run',
  'erp.ap_payment_run_item',
  'erp.ap_prepayment',
  'erp.ap_prepayment_application',
  // erp — Accounts Receivable (6)
  'erp.ar_invoice',
  'erp.ar_invoice_line',
  'erp.ar_payment_allocation',
  'erp.ar_allocation_item',
  'erp.dunning_run',
  'erp.dunning_letter',
  // erp — Tax (4)
  'erp.tax_code',
  'erp.tax_rate',
  'erp.tax_return_period',
  'erp.wht_certificate',
  // erp — Fixed Assets (4)
  'erp.asset',
  'erp.depreciation_schedule',
  'erp.asset_movement',
  'erp.asset_component',
  // erp — Banking & Reconciliation (5)
  'erp.bank_statement',
  'erp.bank_statement_line',
  'erp.bank_match',
  'erp.bank_reconciliation',
  'erp.match_tolerance',
  // erp — Credit Management (2)
  'erp.credit_limit',
  'erp.credit_review',
  // erp — Expenses (3)
  'erp.expense_claim',
  'erp.expense_claim_line',
  'erp.expense_policy',
  // erp — Projects (3)
  'erp.project',
  'erp.project_cost_line',
  'erp.project_billing',
  // erp — Leases (3)
  'erp.lease_contract',
  'erp.lease_schedule',
  'erp.lease_modification',
  // erp — Provisions & Treasury (4)
  'erp.provision',
  'erp.provision_movement',
  'erp.cash_forecast',
  'erp.covenant',
  // erp — Cost Accounting (5)
  'erp.cost_center',
  'erp.cost_driver',
  'erp.cost_driver_value',
  'erp.cost_allocation_run',
  'erp.cost_allocation_line',
  // erp — Consolidation (4)
  'erp.group_entity',
  'erp.ownership_record',
  'erp.goodwill',
  'erp.intangible_asset',
  // erp — Financial Instruments & Hedging (4)
  'erp.financial_instrument',
  'erp.hedge_relationship',
  'erp.fair_value_measurement',
  'erp.hedge_effectiveness_test',
  // erp — Deferred Tax, Transfer Pricing, Accounting Rules (6)
  'erp.deferred_tax_item',
  'erp.tp_policy',
  'erp.tp_benchmark',
  'erp.accounting_event',
  'erp.mapping_rule',
  'erp.mapping_rule_version',
  // erp — Documents & OCR (3)
  'erp.document_attachment',
  'erp.document_link',
  'erp.ocr_job',
  // erp — SoD & Approval (4)
  'erp.sod_action_log',
  'erp.approval_policy',
  'erp.approval_request',
  'erp.approval_step',
  // erp — Infrastructure (2)
  'erp.outbox',
  'erp.idempotency_store',
];

// ─── 5 non-tenant platform tables ──────────────────────────────────────────
const nonTenantTables = [
  'platform.tenant',
  'platform.user_preference',
  'platform.system_config',
  'platform.admin_user',
  'platform.admin_action_log',
];

// ─── Build SQL ──────────────────────────────────────────────────────────────
const lines = [];

lines.push(`-- Migration: 0001_rls_policies_and_roles`);
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push(`-- Purpose: RLS tenant-isolation policies, helper functions, roles & grants`);
lines.push(`--`);
lines.push(`-- This migration is NOT managed by drizzle-kit.`);
lines.push(`-- Run manually: psql -f 0001_rls_policies_and_roles.sql`);
lines.push(`-- Or via: pnpm db:migrate:custom`);
lines.push(``);

// ─── 1. Helper Functions ────────────────────────────────────────────────────
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);
lines.push(`-- 1. HELPER FUNCTIONS`);
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);
lines.push(``);
lines.push(`CREATE SCHEMA IF NOT EXISTS erp;`);
lines.push(`CREATE SCHEMA IF NOT EXISTS platform;`);
lines.push(`CREATE SCHEMA IF NOT EXISTS audit;`);
lines.push(``);
lines.push(`CREATE OR REPLACE FUNCTION erp.current_tenant_id() RETURNS uuid`);
lines.push(`  LANGUAGE sql STABLE PARALLEL SAFE`);
lines.push(`  AS $$ SELECT current_setting('app.tenant_id', true)::uuid $$;`);
lines.push(``);
lines.push(`CREATE OR REPLACE FUNCTION erp.current_user_id() RETURNS uuid`);
lines.push(`  LANGUAGE sql STABLE PARALLEL SAFE`);
lines.push(`  AS $$ SELECT current_setting('app.user_id', true)::uuid $$;`);
lines.push(``);

// ─── 2. Roles & Grants ─────────────────────────────────────────────────────
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);
lines.push(`-- 2. ROLES & GRANTS`);
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);
lines.push(``);
lines.push(`DO $$`);
lines.push(`BEGIN`);
lines.push(`  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN`);
lines.push(`    CREATE ROLE app_runtime NOLOGIN;`);
lines.push(`  END IF;`);
lines.push(`  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime_login') THEN`);
lines.push(`    CREATE ROLE app_runtime_login LOGIN NOINHERIT;`);
lines.push(`  END IF;`);
lines.push(`END`);
lines.push(`$$;`);
lines.push(``);
lines.push(`GRANT app_runtime TO app_runtime_login WITH SET TRUE;`);
lines.push(``);
lines.push(`-- Schema usage`);
lines.push(`GRANT USAGE ON SCHEMA platform TO app_runtime;`);
lines.push(`GRANT USAGE ON SCHEMA erp TO app_runtime;`);
lines.push(`GRANT USAGE ON SCHEMA audit TO app_runtime;`);
lines.push(``);
lines.push(`-- Table grants`);
lines.push(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO app_runtime;`);
lines.push(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA erp TO app_runtime;`);
lines.push(`GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO app_runtime;`);
lines.push(``);
lines.push(`-- Sequence grants`);
lines.push(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA platform TO app_runtime;`);
lines.push(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA erp TO app_runtime;`);
lines.push(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA audit TO app_runtime;`);
lines.push(``);
lines.push(`-- Function grants`);
lines.push(`GRANT EXECUTE ON FUNCTION erp.current_tenant_id() TO app_runtime;`);
lines.push(`GRANT EXECUTE ON FUNCTION erp.current_user_id() TO app_runtime;`);
lines.push(``);
lines.push(`-- Default privileges for future objects`);
lines.push(
  `ALTER DEFAULT PRIVILEGES IN SCHEMA platform GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;`
);
lines.push(
  `ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;`
);
lines.push(
  `ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT SELECT, INSERT ON TABLES TO app_runtime;`
);
lines.push(``);
lines.push(
  `ALTER DEFAULT PRIVILEGES IN SCHEMA platform GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;`
);
lines.push(
  `ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;`
);
lines.push(
  `ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;`
);
lines.push(``);

// ─── 3. FORCE ROW LEVEL SECURITY ───────────────────────────────────────────
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);
lines.push(`-- 3. FORCE ROW LEVEL SECURITY (prevents table-owner bypass)`);
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);
lines.push(``);

const allTables = [...tenantTables, ...nonTenantTables];
for (const t of allTables) {
  lines.push(`ALTER TABLE ${t} FORCE ROW LEVEL SECURITY;`);
}
lines.push(``);

// ─── 4. Tenant Isolation Policies ───────────────────────────────────────────
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);
lines.push(`-- 4. TENANT ISOLATION POLICIES (120 tenant-scoped tables)`);
lines.push(`--    Policy: tenant_id = current_setting('app.tenant_id', true)::uuid`);
lines.push(`--    FOR ALL covers SELECT, INSERT, UPDATE, DELETE`);
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);
lines.push(``);

for (const t of tenantTables) {
  lines.push(`CREATE POLICY tenant_isolation ON ${t}`);
  lines.push(`  FOR ALL`);
  lines.push(`  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)`);
  lines.push(`  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);`);
  lines.push(``);
}

// ─── 5. Non-tenant Platform Policies ────────────────────────────────────────
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);
lines.push(`-- 5. NON-TENANT PLATFORM TABLE POLICIES`);
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);
lines.push(``);

// platform.tenant — read-only for app_runtime, write via admin only
lines.push(`-- platform.tenant: app_runtime can SELECT its own tenant`);
lines.push(`CREATE POLICY tenant_self_read ON platform.tenant`);
lines.push(`  FOR SELECT`);
lines.push(`  USING (id = current_setting('app.tenant_id', true)::uuid);`);
lines.push(``);

// platform.user_preference — users can only access their own preferences
lines.push(`-- platform.user_preference: users can only access their own preferences`);
lines.push(`CREATE POLICY user_pref_own ON platform.user_preference`);
lines.push(`  FOR ALL`);
lines.push(`  USING (user_id = current_setting('app.user_id', true)::uuid)`);
lines.push(`  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);`);
lines.push(``);

// platform.system_config — read-only for app_runtime
lines.push(`-- platform.system_config: read-only for app_runtime`);
lines.push(`CREATE POLICY system_config_read ON platform.system_config`);
lines.push(`  FOR SELECT`);
lines.push(`  USING (true);`);
lines.push(``);

// platform.admin_user — no access for app_runtime (admin-only)
lines.push(`-- platform.admin_user: no access for app_runtime (admin-only via superuser/owner)`);
lines.push(`CREATE POLICY admin_deny ON platform.admin_user`);
lines.push(`  FOR ALL`);
lines.push(`  USING (false)`);
lines.push(`  WITH CHECK (false);`);
lines.push(``);

// platform.admin_action_log — no access for app_runtime
lines.push(`-- platform.admin_action_log: no access for app_runtime (admin audit trail)`);
lines.push(`CREATE POLICY admin_log_deny ON platform.admin_action_log`);
lines.push(`  FOR ALL`);
lines.push(`  USING (false)`);
lines.push(`  WITH CHECK (false);`);
lines.push(``);

// ─── Done ───────────────────────────────────────────────────────────────────
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);
lines.push(`-- MIGRATION COMPLETE`);
lines.push(
  `-- Total: ${tenantTables.length} tenant-isolation policies (incl. notifications, seed_run)`
);
lines.push(`--        ${nonTenantTables.length} non-tenant policies`);
lines.push(`--        ${allTables.length} FORCE ROW LEVEL SECURITY`);
lines.push(`--        2 helper functions, 2 roles, schema/table/sequence grants`);
lines.push(`-- ═══════════════════════════════════════════════════════════════════════════`);

const sql = lines.join('\n') + '\n';

const outPath = resolve(__dirname, '..', 'drizzle', 'custom', '0001_rls_policies_and_roles.sql');
import('fs').then((fs) => {
  fs.mkdirSync(resolve(__dirname, '..', 'drizzle', 'custom'), { recursive: true });
  fs.writeFileSync(outPath, sql, 'utf-8');
  console.log(`✅ Written ${sql.split('\n').length} lines to ${outPath}`);
  console.log(`   ${tenantTables.length} tenant-isolation policies`);
  console.log(`   ${nonTenantTables.length} non-tenant policies`);
  console.log(`   ${allTables.length} FORCE ROW LEVEL SECURITY`);
});
