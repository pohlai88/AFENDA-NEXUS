-- 0010_sod_action_log.sql
-- GAP-A1: Segregation of Duties action log table
-- Records which actor performed which action on which entity for real-time SoD conflict detection.
-- Manual migration (drizzle-kit broken by BigInt serialization issue).

CREATE TABLE erp.sod_action_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  action varchar(50) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sod_action_tenant_entity ON erp.sod_action_log (tenant_id, entity_type, entity_id);

ALTER TABLE erp.sod_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY sod_action_tenant_isolation ON erp.sod_action_log
  USING (tenant_id = erp.current_tenant_id());
