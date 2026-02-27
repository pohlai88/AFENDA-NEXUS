-- Migration: 0001_rls_policies_and_roles
-- Generated: 2026-02-27T16:17:45.065Z
-- Purpose: RLS tenant-isolation policies, helper functions, roles & grants
--
-- This migration is NOT managed by drizzle-kit.
-- Run manually: psql -f 0001_rls_policies_and_roles.sql
-- Or via: pnpm db:migrate:custom

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS erp;
CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS audit;

CREATE OR REPLACE FUNCTION erp.current_tenant_id() RETURNS uuid
  LANGUAGE sql STABLE PARALLEL SAFE
  AS $$ SELECT current_setting('app.tenant_id', true)::uuid $$;

CREATE OR REPLACE FUNCTION erp.current_user_id() RETURNS uuid
  LANGUAGE sql STABLE PARALLEL SAFE
  AS $$ SELECT current_setting('app.user_id', true)::uuid $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. ROLES & GRANTS
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime_login') THEN
    CREATE ROLE app_runtime_login LOGIN NOINHERIT;
  END IF;
END
$$;

GRANT app_runtime TO app_runtime_login WITH SET TRUE;

-- Schema usage
GRANT USAGE ON SCHEMA platform TO app_runtime;
GRANT USAGE ON SCHEMA erp TO app_runtime;
GRANT USAGE ON SCHEMA audit TO app_runtime;

-- Table grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA erp TO app_runtime;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO app_runtime;

-- Sequence grants
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA platform TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA erp TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA audit TO app_runtime;

-- Function grants
GRANT EXECUTE ON FUNCTION erp.current_tenant_id() TO app_runtime;
GRANT EXECUTE ON FUNCTION erp.current_user_id() TO app_runtime;

-- Default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA platform GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT SELECT, INSERT ON TABLES TO app_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA platform GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. FORCE ROW LEVEL SECURITY (prevents table-owner bypass)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE platform.company FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.user FORCE ROW LEVEL SECURITY;
ALTER TABLE audit.audit_log FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.currency FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.fiscal_year FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.fiscal_period FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.account FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ledger FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.gl_journal FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.gl_journal_line FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.gl_balance FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.fx_rate FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.counterparty FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ic_agreement FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ic_transaction FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ic_transaction_leg FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ic_settlement FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ic_settlement_line FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ic_loan FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.recurring_template FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.budget_entry FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.revenue_contract FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.recognition_milestone FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.classification_rule_set FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.classification_rule FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.payment_terms_template FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.payment_terms_line FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_site FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_bank_account FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_user FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_document FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_dispute FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_notification_pref FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_compliance_item FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_account_group_config FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_company_override FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_block FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_block_history FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_blacklist FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_tax_registration FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_legal_document FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_doc_requirement FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_eval_template FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_eval_criteria FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_evaluation FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_eval_score FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_risk_indicator FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_diversity FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_contact FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.supplier_duplicate_suspect FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ap_invoice FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ap_invoice_line FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ap_hold FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ap_payment_run FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ap_payment_run_item FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ap_prepayment FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ap_prepayment_application FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ar_invoice FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ar_invoice_line FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ar_payment_allocation FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ar_allocation_item FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.dunning_run FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.dunning_letter FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.tax_code FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.tax_rate FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.tax_return_period FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.wht_certificate FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.asset FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.depreciation_schedule FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.asset_movement FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.asset_component FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.bank_statement FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.bank_statement_line FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.bank_match FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.bank_reconciliation FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.match_tolerance FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.credit_limit FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.credit_review FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.expense_claim FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.expense_claim_line FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.expense_policy FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.project FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.project_cost_line FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.project_billing FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.lease_contract FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.lease_schedule FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.lease_modification FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.provision FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.provision_movement FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.cash_forecast FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.covenant FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.cost_center FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.cost_driver FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.cost_driver_value FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.cost_allocation_run FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.cost_allocation_line FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.group_entity FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ownership_record FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.goodwill FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.intangible_asset FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.financial_instrument FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.hedge_relationship FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.fair_value_measurement FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.hedge_effectiveness_test FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.deferred_tax_item FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.tp_policy FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.tp_benchmark FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.accounting_event FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.mapping_rule FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.mapping_rule_version FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.document_attachment FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.document_link FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.ocr_job FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.sod_action_log FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.approval_policy FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.approval_request FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.approval_step FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.outbox FORCE ROW LEVEL SECURITY;
ALTER TABLE erp.idempotency_store FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.tenant FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.user_preference FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.system_config FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.admin_user FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.admin_action_log FORCE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. TENANT ISOLATION POLICIES (120 tenant-scoped tables)
--    Policy: tenant_id = current_setting('app.tenant_id', true)::uuid
--    FOR ALL covers SELECT, INSERT, UPDATE, DELETE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY tenant_isolation ON platform.company
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON platform.user
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON audit.audit_log
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.currency
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.fiscal_year
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.fiscal_period
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.account
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ledger
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.gl_journal
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.gl_journal_line
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.gl_balance
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.fx_rate
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.counterparty
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ic_agreement
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ic_transaction
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ic_transaction_leg
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ic_settlement
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ic_settlement_line
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ic_loan
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.recurring_template
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.budget_entry
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.revenue_contract
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.recognition_milestone
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.classification_rule_set
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.classification_rule
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.payment_terms_template
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.payment_terms_line
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_site
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_bank_account
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_user
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_document
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_dispute
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_notification_pref
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_compliance_item
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_account_group_config
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_company_override
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_block
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_block_history
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_blacklist
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_tax_registration
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_legal_document
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_doc_requirement
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_eval_template
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_eval_criteria
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_evaluation
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_eval_score
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_risk_indicator
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_diversity
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_contact
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.supplier_duplicate_suspect
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ap_invoice
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ap_invoice_line
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ap_hold
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ap_payment_run
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ap_payment_run_item
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ap_prepayment
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ap_prepayment_application
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ar_invoice
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ar_invoice_line
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ar_payment_allocation
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ar_allocation_item
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.dunning_run
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.dunning_letter
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.tax_code
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.tax_rate
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.tax_return_period
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.wht_certificate
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.asset
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.depreciation_schedule
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.asset_movement
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.asset_component
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.bank_statement
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.bank_statement_line
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.bank_match
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.bank_reconciliation
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.match_tolerance
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.credit_limit
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.credit_review
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.expense_claim
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.expense_claim_line
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.expense_policy
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.project
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.project_cost_line
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.project_billing
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.lease_contract
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.lease_schedule
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.lease_modification
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.provision
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.provision_movement
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.cash_forecast
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.covenant
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.cost_center
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.cost_driver
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.cost_driver_value
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.cost_allocation_run
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.cost_allocation_line
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.group_entity
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ownership_record
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.goodwill
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.intangible_asset
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.financial_instrument
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.hedge_relationship
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.fair_value_measurement
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.hedge_effectiveness_test
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.deferred_tax_item
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.tp_policy
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.tp_benchmark
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.accounting_event
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.mapping_rule
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.mapping_rule_version
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.document_attachment
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.document_link
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.ocr_job
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.sod_action_log
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.approval_policy
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.approval_request
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.approval_step
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.outbox
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON erp.idempotency_store
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. NON-TENANT PLATFORM TABLE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- platform.tenant: app_runtime can SELECT its own tenant
CREATE POLICY tenant_self_read ON platform.tenant
  FOR SELECT
  USING (id = current_setting('app.tenant_id', true)::uuid);

-- platform.user_preference: users can only access their own preferences
CREATE POLICY user_pref_own ON platform.user_preference
  FOR ALL
  USING (user_id = current_setting('app.user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);

-- platform.system_config: read-only for app_runtime
CREATE POLICY system_config_read ON platform.system_config
  FOR SELECT
  USING (true);

-- platform.admin_user: no access for app_runtime (admin-only via superuser/owner)
CREATE POLICY admin_deny ON platform.admin_user
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- platform.admin_action_log: no access for app_runtime (admin audit trail)
CREATE POLICY admin_log_deny ON platform.admin_action_log
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- Total: 120 tenant-isolation policies
--        5 non-tenant policies
--        125 FORCE ROW LEVEL SECURITY
--        2 helper functions, 2 roles, schema/table/sequence grants
-- ═══════════════════════════════════════════════════════════════════════════
