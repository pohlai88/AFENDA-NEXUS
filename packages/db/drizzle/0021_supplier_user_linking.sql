-- 0021: Supplier-User linking table for portal authentication
-- Maps platform users to supplier records so GET /portal/me can resolve the
-- authenticated user's supplier identity without a supplierId path param.

CREATE TABLE IF NOT EXISTS erp.supplier_user (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id     uuid        NOT NULL,
  supplier_id   uuid        NOT NULL,
  user_id       uuid        NOT NULL,
  is_primary    boolean     NOT NULL DEFAULT false,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_user
  ON erp.supplier_user (tenant_id, supplier_id, user_id);

CREATE INDEX IF NOT EXISTS idx_supplier_user_user
  ON erp.supplier_user (tenant_id, user_id);

-- RLS: tenant isolation
ALTER TABLE erp.supplier_user ENABLE ROW LEVEL SECURITY;

CREATE POLICY supplier_user_tenant_isolation ON erp.supplier_user
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
