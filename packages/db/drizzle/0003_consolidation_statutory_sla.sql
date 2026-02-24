-- Phase 6: Consolidation, Statutory Reporting, Subledger Architecture
-- Migration: 0003_consolidation_statutory_sla.sql

-- ─── Enums ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE group_entity_type AS ENUM ('PARENT', 'SUBSIDIARY', 'ASSOCIATE', 'JOINT_VENTURE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE goodwill_status AS ENUM ('ACTIVE', 'IMPAIRED', 'DERECOGNIZED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── erp.group_entity ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.group_entity (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  company_id    uuid NOT NULL,
  name          varchar(200) NOT NULL,
  entity_type   group_entity_type NOT NULL,
  parent_entity_id uuid,
  base_currency varchar(3) NOT NULL,
  country_code  varchar(3) NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_entity_company_tenant
  ON erp.group_entity (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_group_entity_parent
  ON erp.group_entity (tenant_id, parent_entity_id);

-- ─── erp.ownership_record ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.ownership_record (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  parent_entity_id  uuid NOT NULL,
  child_entity_id   uuid NOT NULL,
  ownership_pct_bps integer NOT NULL,
  voting_pct_bps    integer NOT NULL,
  effective_from    timestamptz NOT NULL,
  effective_to      timestamptz,
  acquisition_date  timestamptz NOT NULL,
  acquisition_cost  bigint NOT NULL,
  currency_code     varchar(3) NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ownership_parent_tenant
  ON erp.ownership_record (tenant_id, parent_entity_id);
CREATE INDEX IF NOT EXISTS idx_ownership_child_tenant
  ON erp.ownership_record (tenant_id, child_entity_id);
CREATE INDEX IF NOT EXISTS idx_ownership_effective
  ON erp.ownership_record (tenant_id, effective_from, effective_to);

-- ─── erp.goodwill ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.goodwill (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL,
  ownership_record_id     uuid NOT NULL,
  child_entity_id         uuid NOT NULL,
  acquisition_date        timestamptz NOT NULL,
  consideration_paid      bigint NOT NULL,
  fair_value_net_assets   bigint NOT NULL,
  nci_at_acquisition      bigint NOT NULL,
  goodwill_amount         bigint NOT NULL,
  accumulated_impairment  bigint NOT NULL DEFAULT 0,
  carrying_amount         bigint NOT NULL,
  currency_code           varchar(3) NOT NULL,
  status                  goodwill_status NOT NULL DEFAULT 'ACTIVE',
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goodwill_child_tenant
  ON erp.goodwill (tenant_id, child_entity_id);
CREATE INDEX IF NOT EXISTS idx_goodwill_ownership
  ON erp.goodwill (tenant_id, ownership_record_id);

-- ─── RLS policies ────────────────────────────────────────────────────────────

ALTER TABLE erp.group_entity ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.ownership_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.goodwill ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_group_entity ON erp.group_entity
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation_ownership_record ON erp.ownership_record
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation_goodwill ON erp.goodwill
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
