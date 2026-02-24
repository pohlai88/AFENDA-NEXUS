-- Migration 0012: Phase 4 domain tables
-- Lease Accounting (IFRS 16): lease_contract, lease_schedule, lease_modification
-- Provisions (IAS 37): provision, provision_movement
-- Treasury & Cash Management: cash_forecast, covenant, ic_loan
-- New enums: lease_type, lease_status, lessee_or_lessor, lease_modification_type,
--            provision_type, provision_status, provision_movement_type,
--            forecast_type, covenant_type, covenant_status, ic_loan_status

BEGIN;

-- ─── Lease Enums ──────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE lease_type AS ENUM ('FINANCE', 'OPERATING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lease_status AS ENUM ('DRAFT', 'ACTIVE', 'MODIFIED', 'TERMINATED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lessee_or_lessor AS ENUM ('LESSEE', 'LESSOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lease_modification_type AS ENUM ('TERM_EXTENSION', 'TERM_REDUCTION', 'PAYMENT_CHANGE', 'SCOPE_CHANGE', 'RATE_CHANGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Provision Enums ──────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE provision_type AS ENUM ('WARRANTY', 'RESTRUCTURING', 'ONEROUS_CONTRACT', 'DECOMMISSIONING', 'LEGAL', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE provision_status AS ENUM ('ACTIVE', 'PARTIALLY_UTILISED', 'FULLY_UTILISED', 'REVERSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE provision_movement_type AS ENUM ('INITIAL_RECOGNITION', 'UNWINDING_DISCOUNT', 'UTILISATION', 'REVERSAL', 'REMEASUREMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Treasury Enums ───────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE forecast_type AS ENUM ('RECEIPTS', 'PAYMENTS', 'FINANCING', 'INVESTING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE covenant_type AS ENUM ('DEBT_TO_EQUITY', 'INTEREST_COVERAGE', 'CURRENT_RATIO', 'DEBT_SERVICE_COVERAGE', 'LEVERAGE', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE covenant_status AS ENUM ('COMPLIANT', 'WARNING', 'BREACHED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ic_loan_status AS ENUM ('ACTIVE', 'REPAID', 'WRITTEN_OFF');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Lease Accounting Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── erp.lease_contract ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.lease_contract (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  company_id      uuid NOT NULL,
  lease_number    varchar(50) NOT NULL,
  description     text NOT NULL,
  lessee_or_lessor lessee_or_lessor NOT NULL DEFAULT 'LESSEE',
  lease_type      lease_type NOT NULL DEFAULT 'OPERATING',
  status          lease_status NOT NULL DEFAULT 'DRAFT',
  counterparty_id uuid NOT NULL,
  counterparty_name varchar(200) NOT NULL,
  asset_description text NOT NULL,
  commencement_date timestamptz NOT NULL,
  end_date        timestamptz NOT NULL,
  lease_term_months integer NOT NULL,
  currency_code   varchar(3) NOT NULL DEFAULT 'USD',
  monthly_payment bigint NOT NULL,
  annual_escalation_bps integer NOT NULL DEFAULT 0,
  discount_rate_bps integer NOT NULL,
  rou_asset_amount bigint NOT NULL DEFAULT 0,
  lease_liability_amount bigint NOT NULL DEFAULT 0,
  is_short_term   boolean NOT NULL DEFAULT false,
  is_low_value    boolean NOT NULL DEFAULT false,
  created_by      uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lease_contract_number_tenant
  ON erp.lease_contract (tenant_id, lease_number);
CREATE INDEX IF NOT EXISTS idx_lease_contract_company_tenant
  ON erp.lease_contract (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_lease_contract_status
  ON erp.lease_contract (tenant_id, status);

ALTER TABLE erp.lease_contract ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON erp.lease_contract;
CREATE POLICY tenant_isolation ON erp.lease_contract
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── erp.lease_schedule ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.lease_schedule (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  lease_contract_id uuid NOT NULL REFERENCES erp.lease_contract(id),
  period_number     integer NOT NULL,
  payment_date      timestamptz NOT NULL,
  payment_amount    bigint NOT NULL,
  principal_portion bigint NOT NULL,
  interest_portion  bigint NOT NULL,
  opening_liability bigint NOT NULL,
  closing_liability bigint NOT NULL,
  rou_depreciation  bigint NOT NULL,
  currency_code     varchar(3) NOT NULL DEFAULT 'USD',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lease_schedule_contract_tenant
  ON erp.lease_schedule (tenant_id, lease_contract_id);

ALTER TABLE erp.lease_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON erp.lease_schedule;
CREATE POLICY tenant_isolation ON erp.lease_schedule
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── erp.lease_modification ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.lease_modification (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid NOT NULL,
  lease_contract_id        uuid NOT NULL REFERENCES erp.lease_contract(id),
  modification_date        timestamptz NOT NULL,
  modification_type        lease_modification_type NOT NULL,
  description              text NOT NULL,
  previous_lease_term_months integer NOT NULL,
  new_lease_term_months    integer NOT NULL,
  previous_monthly_payment bigint NOT NULL,
  new_monthly_payment      bigint NOT NULL,
  previous_discount_rate_bps integer NOT NULL,
  new_discount_rate_bps    integer NOT NULL,
  liability_adjustment     bigint NOT NULL,
  rou_asset_adjustment     bigint NOT NULL,
  gain_loss_on_modification bigint NOT NULL DEFAULT 0,
  currency_code            varchar(3) NOT NULL DEFAULT 'USD',
  modified_by              uuid NOT NULL,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lease_modification_contract_tenant
  ON erp.lease_modification (tenant_id, lease_contract_id);

ALTER TABLE erp.lease_modification ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON erp.lease_modification;
CREATE POLICY tenant_isolation ON erp.lease_modification
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ═══════════════════════════════════════════════════════════════════════════
-- Provision Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── erp.provision ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.provision (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid NOT NULL,
  company_id               uuid NOT NULL,
  provision_number         varchar(50) NOT NULL,
  description              text NOT NULL,
  provision_type           provision_type NOT NULL,
  status                   provision_status NOT NULL DEFAULT 'ACTIVE',
  recognition_date         timestamptz NOT NULL,
  expected_settlement_date timestamptz,
  initial_amount           bigint NOT NULL,
  current_amount           bigint NOT NULL,
  discount_rate_bps        integer NOT NULL DEFAULT 0,
  currency_code            varchar(3) NOT NULL DEFAULT 'USD',
  gl_account_id            uuid,
  is_contingent_liability  boolean NOT NULL DEFAULT false,
  contingent_liability_note text,
  created_by               uuid NOT NULL,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_provision_number_tenant
  ON erp.provision (tenant_id, provision_number);
CREATE INDEX IF NOT EXISTS idx_provision_company_tenant
  ON erp.provision (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_provision_type_status
  ON erp.provision (tenant_id, provision_type, status);

ALTER TABLE erp.provision ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON erp.provision;
CREATE POLICY tenant_isolation ON erp.provision
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── erp.provision_movement ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.provision_movement (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  provision_id    uuid NOT NULL REFERENCES erp.provision(id),
  movement_date   timestamptz NOT NULL,
  movement_type   provision_movement_type NOT NULL,
  amount          bigint NOT NULL,
  balance_after   bigint NOT NULL,
  description     text NOT NULL,
  journal_id      uuid,
  currency_code   varchar(3) NOT NULL DEFAULT 'USD',
  created_by      uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provision_movement_provision_tenant
  ON erp.provision_movement (tenant_id, provision_id);

ALTER TABLE erp.provision_movement ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON erp.provision_movement;
CREATE POLICY tenant_isolation ON erp.provision_movement
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ═══════════════════════════════════════════════════════════════════════════
-- Treasury & Cash Management Tables
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── erp.cash_forecast ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.cash_forecast (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL,
  company_id           uuid NOT NULL,
  forecast_date        timestamptz NOT NULL,
  forecast_type        forecast_type NOT NULL,
  description          text NOT NULL,
  amount               bigint NOT NULL,
  currency_code        varchar(3) NOT NULL DEFAULT 'USD',
  probability          integer NOT NULL DEFAULT 100,
  source_document_id   uuid,
  source_document_type varchar(50),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_forecast_company_date
  ON erp.cash_forecast (tenant_id, company_id, forecast_date);
CREATE INDEX IF NOT EXISTS idx_cash_forecast_type
  ON erp.cash_forecast (tenant_id, forecast_type);

ALTER TABLE erp.cash_forecast ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON erp.cash_forecast;
CREATE POLICY tenant_isolation ON erp.cash_forecast
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── erp.covenant ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.covenant (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  company_id      uuid NOT NULL,
  lender_id       uuid NOT NULL,
  lender_name     varchar(200) NOT NULL,
  covenant_type   covenant_type NOT NULL,
  description     text NOT NULL,
  threshold_value integer NOT NULL,
  current_value   integer,
  status          covenant_status NOT NULL DEFAULT 'COMPLIANT',
  test_frequency  varchar(20) NOT NULL DEFAULT 'QUARTERLY',
  last_test_date  timestamptz,
  next_test_date  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_covenant_company_tenant
  ON erp.covenant (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_covenant_status
  ON erp.covenant (tenant_id, status);

ALTER TABLE erp.covenant ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON erp.covenant;
CREATE POLICY tenant_isolation ON erp.covenant
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── erp.ic_loan ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.ic_loan (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  lender_company_id   uuid NOT NULL,
  borrower_company_id uuid NOT NULL,
  loan_number         varchar(50) NOT NULL,
  description         text NOT NULL,
  principal_amount    bigint NOT NULL,
  outstanding_balance bigint NOT NULL,
  interest_rate_bps   integer NOT NULL,
  currency_code       varchar(3) NOT NULL DEFAULT 'USD',
  start_date          timestamptz NOT NULL,
  maturity_date       timestamptz NOT NULL,
  status              ic_loan_status NOT NULL DEFAULT 'ACTIVE',
  ic_agreement_id     uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ic_loan_number_tenant
  ON erp.ic_loan (tenant_id, loan_number);
CREATE INDEX IF NOT EXISTS idx_ic_loan_lender_tenant
  ON erp.ic_loan (tenant_id, lender_company_id);
CREATE INDEX IF NOT EXISTS idx_ic_loan_borrower_tenant
  ON erp.ic_loan (tenant_id, borrower_company_id);

ALTER TABLE erp.ic_loan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON erp.ic_loan;
CREATE POLICY tenant_isolation ON erp.ic_loan
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

COMMIT;
