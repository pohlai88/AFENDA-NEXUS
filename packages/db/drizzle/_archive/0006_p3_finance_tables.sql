-- Migration: 0006_p3_finance_tables
-- Adds: recurring_frequency enum, erp.idempotency_store, erp.recurring_template, erp.budget_entry
-- Date: 2026-02-23

-- ─── 1. Enum: recurring_frequency ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "recurring_frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Table: erp.idempotency_store ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp.idempotency_store (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id   uuid        NOT NULL,
  idempotency_key varchar(255) NOT NULL,
  command_type    varchar(100) NOT NULL,
  result_ref      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_idempotency_tenant_key_cmd
  ON erp.idempotency_store (tenant_id, idempotency_key, command_type);

-- ─── 3. Table: erp.recurring_template ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp.recurring_template (
  id            uuid            PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id     uuid            NOT NULL,
  company_id    uuid            NOT NULL,
  ledger_id     uuid            NOT NULL,
  description   text            NOT NULL,
  line_template jsonb           NOT NULL,
  frequency     recurring_frequency NOT NULL,
  next_run_date timestamptz     NOT NULL,
  is_active     boolean         NOT NULL DEFAULT true,
  created_at    timestamptz     NOT NULL DEFAULT now(),
  updated_at    timestamptz     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_template_tenant_active
  ON erp.recurring_template (tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_recurring_template_next_run
  ON erp.recurring_template (tenant_id, next_run_date)
  WHERE is_active = true;

-- ─── 4. Table: erp.budget_entry ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp.budget_entry (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id     uuid        NOT NULL,
  company_id    uuid        NOT NULL,
  ledger_id     uuid        NOT NULL,
  account_id    uuid        NOT NULL,
  period_id     uuid        NOT NULL,
  budget_amount bigint      NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_budget_entry_tenant_ledger_account_period
  ON erp.budget_entry (tenant_id, ledger_id, account_id, period_id);

-- ─── 5. RLS policies (match existing pattern) ────────────────────────────────
ALTER TABLE erp.idempotency_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.recurring_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.budget_entry ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY tenant_isolation ON erp.idempotency_store
    FOR ALL TO app_runtime
    USING (tenant_id = erp.current_tenant_id())
    WITH CHECK (tenant_id = erp.current_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY tenant_isolation ON erp.recurring_template
    FOR ALL TO app_runtime
    USING (tenant_id = erp.current_tenant_id())
    WITH CHECK (tenant_id = erp.current_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY tenant_isolation ON erp.budget_entry
    FOR ALL TO app_runtime
    USING (tenant_id = erp.current_tenant_id())
    WITH CHECK (tenant_id = erp.current_tenant_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 6. Grants ──────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.idempotency_store TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.recurring_template TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.budget_entry TO app_runtime;
