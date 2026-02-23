-- Migration 0011: P3 domain tables
-- A-22: IC settlement + settlement lines
-- A-24: Revenue contracts + recognition milestones
-- A-18: Classification rule sets + rules
-- New enums: settlement_method, settlement_status, recognition_method, contract_status, reporting_standard

BEGIN;

-- ─── New Enums ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE settlement_method AS ENUM ('NETTING', 'CASH', 'JOURNAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE settlement_status AS ENUM ('DRAFT', 'CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recognition_method AS ENUM ('STRAIGHT_LINE', 'MILESTONE', 'PERCENTAGE_OF_COMPLETION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reporting_standard AS ENUM ('IFRS', 'US_GAAP', 'LOCAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── erp.ic_settlement (A-22) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.ic_settlement (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id     uuid NOT NULL,
  settlement_number varchar(30) NOT NULL,
  agreement_id  uuid NOT NULL,
  method        settlement_method NOT NULL,
  status        settlement_status NOT NULL DEFAULT 'DRAFT',
  settlement_date timestamptz NOT NULL,
  total_amount  bigint NOT NULL,
  currency_id   uuid NOT NULL,
  confirmed_at  timestamptz,
  confirmed_by  uuid,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ic_settlement_number_tenant
  ON erp.ic_settlement (tenant_id, settlement_number);
CREATE INDEX IF NOT EXISTS idx_ic_settlement_agreement_tenant
  ON erp.ic_settlement (tenant_id, agreement_id);
CREATE INDEX IF NOT EXISTS idx_ic_settlement_status_tenant
  ON erp.ic_settlement (tenant_id, status);

-- ─── erp.ic_settlement_line ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.ic_settlement_line (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id       uuid NOT NULL,
  settlement_id   uuid NOT NULL,
  transaction_id  uuid NOT NULL,
  amount          bigint NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ic_settlement_line_tx_tenant
  ON erp.ic_settlement_line (tenant_id, settlement_id, transaction_id);
CREATE INDEX IF NOT EXISTS idx_ic_settlement_line_settlement
  ON erp.ic_settlement_line (tenant_id, settlement_id);

-- ─── erp.revenue_contract (A-24) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.revenue_contract (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id           uuid NOT NULL,
  company_id          uuid NOT NULL,
  contract_number     varchar(50) NOT NULL,
  customer_name       text NOT NULL,
  total_amount        bigint NOT NULL,
  currency_id         uuid NOT NULL,
  recognition_method  recognition_method NOT NULL,
  start_date          timestamptz NOT NULL,
  end_date            timestamptz NOT NULL,
  deferred_account_id uuid NOT NULL,
  revenue_account_id  uuid NOT NULL,
  status              contract_status NOT NULL DEFAULT 'ACTIVE',
  recognized_to_date  bigint NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_revenue_contract_number_tenant
  ON erp.revenue_contract (tenant_id, contract_number);
CREATE INDEX IF NOT EXISTS idx_revenue_contract_company_tenant
  ON erp.revenue_contract (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_revenue_contract_status_tenant
  ON erp.revenue_contract (tenant_id, status);

-- ─── erp.recognition_milestone ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.recognition_milestone (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id       uuid NOT NULL,
  contract_id     uuid NOT NULL,
  description     text NOT NULL,
  amount          bigint NOT NULL,
  target_date     timestamptz NOT NULL,
  completed_date  timestamptz,
  is_completed    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recognition_milestone_contract_tenant
  ON erp.recognition_milestone (tenant_id, contract_id);

-- ─── erp.classification_rule_set (A-18) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.classification_rule_set (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id   uuid NOT NULL,
  standard    reporting_standard NOT NULL,
  version     integer NOT NULL DEFAULT 1,
  name        varchar(100) NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_classification_rule_set_tenant_standard_version
  ON erp.classification_rule_set (tenant_id, standard, version);

-- ─── erp.classification_rule ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.classification_rule (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id     uuid NOT NULL,
  rule_set_id   uuid NOT NULL,
  account_type  account_type NOT NULL,
  pattern       varchar(100) NOT NULL,
  category      varchar(100) NOT NULL,
  priority      smallint NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classification_rule_set_tenant
  ON erp.classification_rule (tenant_id, rule_set_id);
CREATE INDEX IF NOT EXISTS idx_classification_rule_type_tenant
  ON erp.classification_rule (tenant_id, account_type);

-- ─── RLS Policies ──────────────────────────────────────────────────────────

ALTER TABLE erp.ic_settlement ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.ic_settlement_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.revenue_contract ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.recognition_milestone ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.classification_rule_set ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.classification_rule ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON erp.ic_settlement
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON erp.ic_settlement_line
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON erp.revenue_contract
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON erp.recognition_milestone
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON erp.classification_rule_set
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_isolation ON erp.classification_rule
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── Foreign Keys ──────────────────────────────────────────────────────────

ALTER TABLE erp.ic_settlement
  ADD CONSTRAINT fk_ic_settlement_agreement FOREIGN KEY (agreement_id) REFERENCES erp.ic_agreement(id),
  ADD CONSTRAINT fk_ic_settlement_currency FOREIGN KEY (currency_id) REFERENCES erp.currency(id);

ALTER TABLE erp.ic_settlement_line
  ADD CONSTRAINT fk_ic_settlement_line_settlement FOREIGN KEY (settlement_id) REFERENCES erp.ic_settlement(id),
  ADD CONSTRAINT fk_ic_settlement_line_transaction FOREIGN KEY (transaction_id) REFERENCES erp.ic_transaction(id);

ALTER TABLE erp.revenue_contract
  ADD CONSTRAINT fk_revenue_contract_company FOREIGN KEY (company_id) REFERENCES platform.company(id),
  ADD CONSTRAINT fk_revenue_contract_currency FOREIGN KEY (currency_id) REFERENCES erp.currency(id),
  ADD CONSTRAINT fk_revenue_contract_deferred_acct FOREIGN KEY (deferred_account_id) REFERENCES erp.account(id),
  ADD CONSTRAINT fk_revenue_contract_revenue_acct FOREIGN KEY (revenue_account_id) REFERENCES erp.account(id);

ALTER TABLE erp.recognition_milestone
  ADD CONSTRAINT fk_recognition_milestone_contract FOREIGN KEY (contract_id) REFERENCES erp.revenue_contract(id);

ALTER TABLE erp.classification_rule_set
  ADD CONSTRAINT fk_classification_rule_set_tenant FOREIGN KEY (tenant_id) REFERENCES platform.tenant(id);

ALTER TABLE erp.classification_rule
  ADD CONSTRAINT fk_classification_rule_set FOREIGN KEY (rule_set_id) REFERENCES erp.classification_rule_set(id);

COMMIT;
