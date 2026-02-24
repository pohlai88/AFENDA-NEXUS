-- Phase 5: Cost Accounting, Budget Extensions, Subscription Billing
-- Migration: 0002_cost_budget_subscription.sql

-- ─── Cost Center Status Enum ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE cost_center_status AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Driver Type Enum ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE driver_type AS ENUM ('HEADCOUNT', 'MACHINE_HOURS', 'DIRECT_LABOR', 'FLOOR_AREA', 'REVENUE', 'UNITS_PRODUCED', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Allocation Method Enum ───────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE allocation_method AS ENUM ('DIRECT', 'STEP_DOWN', 'RECIPROCAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Allocation Run Status Enum ───────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE allocation_run_status AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'REVERSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── erp.cost_center ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp.cost_center (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  company_id  uuid NOT NULL,
  code        varchar(30) NOT NULL,
  name        varchar(200) NOT NULL,
  parent_id   uuid,
  level       smallint NOT NULL DEFAULT 0,
  status      cost_center_status NOT NULL DEFAULT 'ACTIVE',
  manager_id  uuid,
  currency_code varchar(3) NOT NULL DEFAULT 'USD',
  effective_from timestamptz NOT NULL,
  effective_to   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_center_code_tenant
  ON erp.cost_center (tenant_id, company_id, code);
CREATE INDEX IF NOT EXISTS idx_cost_center_parent
  ON erp.cost_center (tenant_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_cost_center_company
  ON erp.cost_center (tenant_id, company_id);

ALTER TABLE erp.cost_center ENABLE ROW LEVEL SECURITY;

-- ─── erp.cost_driver ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp.cost_driver (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  company_id  uuid NOT NULL,
  code        varchar(30) NOT NULL,
  name        varchar(200) NOT NULL,
  driver_type driver_type NOT NULL,
  unit_of_measure varchar(30) NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_driver_code_tenant
  ON erp.cost_driver (tenant_id, company_id, code);
CREATE INDEX IF NOT EXISTS idx_cost_driver_company
  ON erp.cost_driver (tenant_id, company_id);

ALTER TABLE erp.cost_driver ENABLE ROW LEVEL SECURITY;

-- ─── erp.cost_driver_value ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp.cost_driver_value (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL,
  driver_id      uuid NOT NULL,
  cost_center_id uuid NOT NULL,
  period_id      uuid NOT NULL,
  quantity       bigint NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_driver_value_unique
  ON erp.cost_driver_value (tenant_id, driver_id, cost_center_id, period_id);
CREATE INDEX IF NOT EXISTS idx_cost_driver_value_period
  ON erp.cost_driver_value (tenant_id, period_id);

ALTER TABLE erp.cost_driver_value ENABLE ROW LEVEL SECURITY;

-- ─── erp.cost_allocation_run ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp.cost_allocation_run (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  company_id      uuid NOT NULL,
  period_id       uuid NOT NULL,
  method          allocation_method NOT NULL,
  status          allocation_run_status NOT NULL DEFAULT 'DRAFT',
  total_allocated bigint NOT NULL DEFAULT 0,
  currency_code   varchar(3) NOT NULL DEFAULT 'USD',
  line_count      integer NOT NULL DEFAULT 0,
  executed_by     uuid NOT NULL,
  executed_at     timestamptz,
  reversed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cost_alloc_run_period
  ON erp.cost_allocation_run (tenant_id, company_id, period_id);
CREATE INDEX IF NOT EXISTS idx_cost_alloc_run_status
  ON erp.cost_allocation_run (tenant_id, status);

ALTER TABLE erp.cost_allocation_run ENABLE ROW LEVEL SECURITY;

-- ─── erp.cost_allocation_line ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp.cost_allocation_line (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  run_id              uuid NOT NULL,
  from_cost_center_id uuid NOT NULL,
  to_cost_center_id   uuid NOT NULL,
  driver_id           uuid NOT NULL,
  amount              bigint NOT NULL,
  driver_quantity     bigint NOT NULL,
  allocation_rate     bigint NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cost_alloc_line_run
  ON erp.cost_allocation_line (tenant_id, run_id);
CREATE INDEX IF NOT EXISTS idx_cost_alloc_line_from
  ON erp.cost_allocation_line (tenant_id, from_cost_center_id);
CREATE INDEX IF NOT EXISTS idx_cost_alloc_line_to
  ON erp.cost_allocation_line (tenant_id, to_cost_center_id);

ALTER TABLE erp.cost_allocation_line ENABLE ROW LEVEL SECURITY;
