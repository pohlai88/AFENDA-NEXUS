-- Migration: 0002_rls_notifications_seed_run
-- Purpose: Add missing RLS policies for platform.notifications,
--          platform.notification_preferences, and platform.seed_run
-- These tables are tenant-scoped and must have isolation policies.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ENABLE + FORCE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE platform.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.notification_preferences FORCE ROW LEVEL SECURITY;
ALTER TABLE platform.seed_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.seed_run FORCE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. TENANT ISOLATION POLICIES
--    Policy: tenant_id = current_setting('app.tenant_id', true)::uuid
--    FOR ALL covers SELECT, INSERT, UPDATE, DELETE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE POLICY tenant_isolation ON platform.notifications
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON platform.notification_preferences
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation ON platform.seed_run
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. GRANTS (extend to app_runtime role)
-- ═══════════════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON platform.notifications TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON platform.notification_preferences TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON platform.seed_run TO app_runtime;
