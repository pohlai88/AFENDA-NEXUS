-- 0012_standardize_rls_current_tenant_id.sql
-- Standardize RLS policies to use erp.current_tenant_id() (NEON-INTEGRATION.md).
-- Replaces current_setting('app.tenant_id')::uuid for consistency and null handling.

-- ─── 0004 IFRS tables ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS intangible_asset_tenant ON erp.intangible_asset;
CREATE POLICY intangible_asset_tenant ON erp.intangible_asset
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS fin_instrument_tenant ON erp.financial_instrument;
CREATE POLICY fin_instrument_tenant ON erp.financial_instrument
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS hedge_tenant ON erp.hedge_relationship;
CREATE POLICY hedge_tenant ON erp.hedge_relationship
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS deferred_tax_tenant ON erp.deferred_tax_item;
CREATE POLICY deferred_tax_tenant ON erp.deferred_tax_item
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tp_policy_tenant ON erp.tp_policy;
CREATE POLICY tp_policy_tenant ON erp.tp_policy
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

-- ─── 0006 gap remediation tables ────────────────────────────────────────────

DROP POLICY IF EXISTS tenant_isolation_payment_terms_line ON erp.payment_terms_line;
CREATE POLICY tenant_isolation_payment_terms_line ON erp.payment_terms_line
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_asset_component ON erp.asset_component;
CREATE POLICY tenant_isolation_asset_component ON erp.asset_component
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_accounting_event ON erp.accounting_event;
CREATE POLICY tenant_isolation_accounting_event ON erp.accounting_event
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_mapping_rule ON erp.mapping_rule;
CREATE POLICY tenant_isolation_mapping_rule ON erp.mapping_rule
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_mapping_rule_version ON erp.mapping_rule_version;
CREATE POLICY tenant_isolation_mapping_rule_version ON erp.mapping_rule_version
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_fair_value_measurement ON erp.fair_value_measurement;
CREATE POLICY tenant_isolation_fair_value_measurement ON erp.fair_value_measurement
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_hedge_effectiveness_test ON erp.hedge_effectiveness_test;
CREATE POLICY tenant_isolation_hedge_effectiveness_test ON erp.hedge_effectiveness_test
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_tp_benchmark ON erp.tp_benchmark;
CREATE POLICY tenant_isolation_tp_benchmark ON erp.tp_benchmark
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());
