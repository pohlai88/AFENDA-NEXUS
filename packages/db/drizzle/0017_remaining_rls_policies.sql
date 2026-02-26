-- 0017_remaining_rls_policies.sql
-- Hand-written migration: adds missing CREATE POLICY for tables that already
-- have ENABLE ROW LEVEL SECURITY but lacked tenant isolation policies.
-- Covers: 5 cost-accounting tables (from 0002) + approval_step (from 0011).

-- ═══════════════════════════════════════════════════════════════════════════════
-- §1  Cost-Accounting tables (0002_cost_budget_subscription.sql)
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS tenant_isolation ON erp.cost_center;
CREATE POLICY tenant_isolation ON erp.cost_center
  FOR ALL TO app_runtime
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON erp.cost_driver;
CREATE POLICY tenant_isolation ON erp.cost_driver
  FOR ALL TO app_runtime
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON erp.cost_driver_value;
CREATE POLICY tenant_isolation ON erp.cost_driver_value
  FOR ALL TO app_runtime
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON erp.cost_allocation_run;
CREATE POLICY tenant_isolation ON erp.cost_allocation_run
  FOR ALL TO app_runtime
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation ON erp.cost_allocation_line;
CREATE POLICY tenant_isolation ON erp.cost_allocation_line
  FOR ALL TO app_runtime
  USING (tenant_id = erp.current_tenant_id())
  WITH CHECK (tenant_id = erp.current_tenant_id());

-- ═══════════════════════════════════════════════════════════════════════════════
-- §2  Approval step (0011_approval_workflow.sql)
--     approval_step has no tenant_id column — it relies on the FK to
--     approval_request which IS tenant-isolated. We add an RLS policy that
--     joins through the parent request for defense-in-depth.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS approval_step_tenant_isolation ON erp.approval_step;
CREATE POLICY approval_step_tenant_isolation ON erp.approval_step
  FOR ALL TO app_runtime
  USING (
    EXISTS (
      SELECT 1 FROM erp.approval_request ar
      WHERE ar.id = request_id
        AND ar.tenant_id = erp.current_tenant_id()
    )
  );
