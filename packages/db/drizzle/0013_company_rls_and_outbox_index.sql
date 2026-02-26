-- 0013_company_rls_and_outbox_index.sql
-- P0 enterprise: erp.current_company_id() + company-scoped RLS; outbox (tenant_id, created_at) index.
-- NEON-DRIZZLE-BEST-PRACTICES.md §2–3: company boundary is legal boundary; tenant-only RLS does not prevent cross-company leakage.

-- ═══════════════════════════════════════════════════════════════════════════════
-- §1  erp.current_company_id() — reads app.company_id from session
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION erp.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT NULLIF(current_setting('app.company_id', true), '')::uuid;
$$;

COMMENT ON FUNCTION erp.current_company_id() IS 'Returns company_id from SET LOCAL app.company_id — used in company-scoped RLS policies. NULL when withTenant() used without company.';

GRANT EXECUTE ON FUNCTION erp.current_company_id() TO app_runtime;

-- ═══════════════════════════════════════════════════════════════════════════════
-- §2  Company-scoped RLS — tenant + (no company context OR company match)
--     Tables with company_id: enforce company boundary when app.company_id is set.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ledger
DROP POLICY IF EXISTS "tenant_isolation" ON "erp"."ledger";
CREATE POLICY "tenant_isolation" ON "erp"."ledger"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "company_id" = erp.current_company_id()))
  WITH CHECK ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "company_id" = erp.current_company_id()));

-- gl_journal
DROP POLICY IF EXISTS "tenant_isolation" ON "erp"."gl_journal";
CREATE POLICY "tenant_isolation" ON "erp"."gl_journal"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "company_id" = erp.current_company_id()))
  WITH CHECK ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "company_id" = erp.current_company_id()));

-- ic_agreement — seller or buyer company
DROP POLICY IF EXISTS "tenant_isolation" ON "erp"."ic_agreement";
CREATE POLICY "tenant_isolation" ON "erp"."ic_agreement"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "seller_company_id" = erp.current_company_id() OR "buyer_company_id" = erp.current_company_id()))
  WITH CHECK ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "seller_company_id" = erp.current_company_id() OR "buyer_company_id" = erp.current_company_id()));

-- ic_transaction_leg
DROP POLICY IF EXISTS "tenant_isolation" ON "erp"."ic_transaction_leg";
CREATE POLICY "tenant_isolation" ON "erp"."ic_transaction_leg"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "company_id" = erp.current_company_id()))
  WITH CHECK ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "company_id" = erp.current_company_id()));

-- ic_settlement
DROP POLICY IF EXISTS "tenant_isolation" ON "erp"."ic_settlement";
CREATE POLICY "tenant_isolation" ON "erp"."ic_settlement"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "company_id" = erp.current_company_id()))
  WITH CHECK ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "company_id" = erp.current_company_id()));

-- revenue_contract
DROP POLICY IF EXISTS "tenant_isolation" ON "erp"."revenue_contract";
CREATE POLICY "tenant_isolation" ON "erp"."revenue_contract"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "company_id" = erp.current_company_id()))
  WITH CHECK ("tenant_id" = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR "company_id" = erp.current_company_id()));

-- ─── 0003 group_entity ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS tenant_isolation_group_entity ON erp.group_entity;
CREATE POLICY tenant_isolation_group_entity ON erp.group_entity
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

-- ─── 0004 IFRS tables ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS intangible_asset_tenant ON erp.intangible_asset;
CREATE POLICY intangible_asset_tenant ON erp.intangible_asset
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

DROP POLICY IF EXISTS fin_instrument_tenant ON erp.financial_instrument;
CREATE POLICY fin_instrument_tenant ON erp.financial_instrument
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

DROP POLICY IF EXISTS hedge_tenant ON erp.hedge_relationship;
CREATE POLICY hedge_tenant ON erp.hedge_relationship
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

DROP POLICY IF EXISTS deferred_tax_tenant ON erp.deferred_tax_item;
CREATE POLICY deferred_tax_tenant ON erp.deferred_tax_item
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

DROP POLICY IF EXISTS tp_policy_tenant ON erp.tp_policy;
CREATE POLICY tp_policy_tenant ON erp.tp_policy
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

-- ─── 0006 gap remediation tables ───────────────────────────────────────────────

DROP POLICY IF EXISTS tenant_isolation_payment_terms_line ON erp.payment_terms_line;
CREATE POLICY tenant_isolation_payment_terms_line ON erp.payment_terms_line
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

DROP POLICY IF EXISTS tenant_isolation_asset_component ON erp.asset_component;
CREATE POLICY tenant_isolation_asset_component ON erp.asset_component
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

DROP POLICY IF EXISTS tenant_isolation_accounting_event ON erp.accounting_event;
CREATE POLICY tenant_isolation_accounting_event ON erp.accounting_event
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

DROP POLICY IF EXISTS tenant_isolation_mapping_rule ON erp.mapping_rule;
CREATE POLICY tenant_isolation_mapping_rule ON erp.mapping_rule
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

DROP POLICY IF EXISTS tenant_isolation_mapping_rule_version ON erp.mapping_rule_version;
CREATE POLICY tenant_isolation_mapping_rule_version ON erp.mapping_rule_version
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

DROP POLICY IF EXISTS tenant_isolation_fair_value_measurement ON erp.fair_value_measurement;
CREATE POLICY tenant_isolation_fair_value_measurement ON erp.fair_value_measurement
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

DROP POLICY IF EXISTS tenant_isolation_hedge_effectiveness_test ON erp.hedge_effectiveness_test;
CREATE POLICY tenant_isolation_hedge_effectiveness_test ON erp.hedge_effectiveness_test
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

DROP POLICY IF EXISTS tenant_isolation_tp_benchmark ON erp.tp_benchmark;
CREATE POLICY tenant_isolation_tp_benchmark ON erp.tp_benchmark
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id = erp.current_company_id()));

-- ─── 0011 approval_policy (company_id optional) ────────────────────────────────

DROP POLICY IF EXISTS approval_policy_tenant_isolation ON erp.approval_policy;
CREATE POLICY approval_policy_tenant_isolation ON erp.approval_policy
  USING (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id IS NULL OR company_id = erp.current_company_id()))
  WITH CHECK (tenant_id = erp.current_tenant_id() AND (erp.current_company_id() IS NULL OR company_id IS NULL OR company_id = erp.current_company_id()));

-- ═══════════════════════════════════════════════════════════════════════════════
-- §3  Outbox index — (tenant_id, created_at) for tenant-isolated drains
-- ═══════════════════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS erp.idx_outbox_unprocessed;
CREATE INDEX idx_outbox_unprocessed ON erp.outbox (tenant_id, created_at)
  WHERE processed_at IS NULL;
