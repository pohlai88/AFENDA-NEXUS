-- 0004_rls_policies_force: RLS on ALL tables including platform.tenant
-- No pgPolicy() in Drizzle TS schema — policies managed here.

-- ─── Enable RLS ─────────────────────────────────────────────────────────────

-- Platform
ALTER TABLE "platform"."tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform"."user" ENABLE ROW LEVEL SECURITY;

-- ERP
ALTER TABLE "erp"."currency" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."fiscal_year" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."fiscal_period" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."gl_journal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."gl_journal_line" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."gl_balance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."counterparty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."ic_agreement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."ic_transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."ic_transaction_leg" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."outbox" ENABLE ROW LEVEL SECURITY;

-- Audit
ALTER TABLE "audit"."audit_log" ENABLE ROW LEVEL SECURITY;

-- ─── Force RLS (applies even to table owners) ──────────────────────────────

ALTER TABLE "platform"."tenant" FORCE ROW LEVEL SECURITY;
ALTER TABLE "platform"."company" FORCE ROW LEVEL SECURITY;
ALTER TABLE "platform"."user" FORCE ROW LEVEL SECURITY;

ALTER TABLE "erp"."currency" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."fiscal_year" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."fiscal_period" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."account" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."ledger" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."gl_journal" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."gl_journal_line" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."gl_balance" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."counterparty" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."ic_agreement" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."ic_transaction" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."ic_transaction_leg" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."outbox" FORCE ROW LEVEL SECURITY;

ALTER TABLE "audit"."audit_log" FORCE ROW LEVEL SECURITY;

-- ─── Tenant Isolation Policies ──────────────────────────────────────────────

-- platform.tenant — tenant can only see its own row
CREATE POLICY "tenant_isolation" ON "platform"."tenant"
  FOR ALL TO app_runtime
  USING ("id" = erp.current_tenant_id())
  WITH CHECK ("id" = erp.current_tenant_id());

-- All tenant-owned tables use the same pattern:
-- USING (tenant_id = erp.current_tenant_id())

CREATE POLICY "tenant_isolation" ON "platform"."company"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "platform"."user"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."currency"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."fiscal_year"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."fiscal_period"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."account"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."ledger"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."gl_journal"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."gl_journal_line"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."gl_balance"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."counterparty"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."ic_agreement"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."ic_transaction"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."ic_transaction_leg"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "erp"."outbox"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

CREATE POLICY "tenant_isolation" ON "audit"."audit_log"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());
