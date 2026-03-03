-- Migration: 0002_rls_portal_tables
-- Purpose: Add ENABLE ROW LEVEL SECURITY + tenant-isolation policies for
--          portal tables added in Phase 1.1–1.2 that were missing RLS coverage.
-- Run via: pnpm db:migrate:custom

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

-- Portal case management (Phase 1.1)
ALTER TABLE "erp"."supplier_case" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."supplier_case_timeline" ENABLE ROW LEVEL SECURITY;

-- Portal communication proof
ALTER TABLE "erp"."portal_communication_proof" ENABLE ROW LEVEL SECURITY;

-- Portal company location / directory
ALTER TABLE "erp"."portal_company_location" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."portal_directory_entry" ENABLE ROW LEVEL SECURITY;

-- Portal invitation flow (Phase 1.1.7)
ALTER TABLE "erp"."portal_supplier_invitation" ENABLE ROW LEVEL SECURITY;

-- Portal compliance alerts (Phase 1.1.3)
ALTER TABLE "erp"."supplier_compliance_alert_log" ENABLE ROW LEVEL SECURITY;

-- Portal onboarding (Phase 1.1.2)
ALTER TABLE "erp"."supplier_onboarding_submission" ENABLE ROW LEVEL SECURITY;

-- Portal messaging hub (Phase 1.2.1)
ALTER TABLE "erp"."supplier_message_thread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."supplier_message" ENABLE ROW LEVEL SECURITY;

-- Portal escalation (Phase 1.2.2)
ALTER TABLE "erp"."supplier_escalation" ENABLE ROW LEVEL SECURITY;

-- Portal announcement (Phase 1.2.3)
ALTER TABLE "erp"."portal_announcement" ENABLE ROW LEVEL SECURITY;

-- SCF / early payment offers (Phase 1.2)
ALTER TABLE "erp"."early_payment_offer" ENABLE ROW LEVEL SECURITY;

-- Supplier payment status fact table
ALTER TABLE "erp"."supplier_payment_status_fact" ENABLE ROW LEVEL SECURITY;

-- Brand config and webhook subscription (no erp schema prefix in migration)
ALTER TABLE "portal_brand_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "portal_webhook_subscription" ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. FORCE ROW LEVEL SECURITY (prevents table-owner bypass)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE "erp"."supplier_case" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."supplier_case_timeline" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."portal_communication_proof" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."portal_company_location" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."portal_directory_entry" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."portal_supplier_invitation" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."supplier_compliance_alert_log" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."supplier_onboarding_submission" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."supplier_message_thread" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."supplier_message" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."supplier_escalation" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."portal_announcement" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."early_payment_offer" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."supplier_payment_status_fact" FORCE ROW LEVEL SECURITY;
ALTER TABLE "erp"."portal_meeting_request" FORCE ROW LEVEL SECURITY;
ALTER TABLE "portal_brand_config" FORCE ROW LEVEL SECURITY;
ALTER TABLE "portal_webhook_subscription" FORCE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. TENANT ISOLATION POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY tenant_isolation ON "erp"."supplier_case"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."supplier_case_timeline"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."portal_communication_proof"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."portal_company_location"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."portal_directory_entry"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."portal_supplier_invitation"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."supplier_compliance_alert_log"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."supplier_onboarding_submission"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."supplier_message_thread"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."supplier_message"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."supplier_escalation"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."portal_announcement"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."early_payment_offer"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."supplier_payment_status_fact"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "erp"."portal_meeting_request"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "portal_brand_config"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON "portal_webhook_subscription"
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
