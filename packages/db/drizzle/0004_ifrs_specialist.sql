-- Phase 7: IFRS Specialist Modules
-- Tables: intangible_asset, financial_instrument, hedge_relationship,
--         deferred_tax_item, tp_policy
-- Enums:  intangible_asset_status, intangible_category, useful_life_type,
--         instrument_classification, instrument_type, fair_value_level,
--         hedge_type, hedge_status

-- ─── Enum types ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE intangible_asset_status AS ENUM (
    'ACTIVE','DISPOSED','FULLY_AMORTIZED','IMPAIRED','IN_DEVELOPMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE intangible_category AS ENUM (
    'SOFTWARE','PATENT','TRADEMARK','COPYRIGHT','LICENCE',
    'CUSTOMER_RELATIONSHIP','GOODWILL_RELATED','DEVELOPMENT_COST','OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE useful_life_type AS ENUM ('FINITE','INDEFINITE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE instrument_classification AS ENUM ('AMORTIZED_COST','FVOCI','FVTPL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE instrument_type AS ENUM (
    'DEBT_HELD','DEBT_ISSUED','EQUITY_INVESTMENT','DERIVATIVE',
    'LOAN_RECEIVABLE','TRADE_RECEIVABLE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fair_value_level AS ENUM ('LEVEL_1','LEVEL_2','LEVEL_3');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE hedge_type AS ENUM ('FAIR_VALUE','CASH_FLOW','NET_INVESTMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE hedge_status AS ENUM ('DESIGNATED','ACTIVE','DISCONTINUED','REBALANCED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── erp.intangible_asset ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.intangible_asset (
  id                                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                         uuid NOT NULL,
  company_id                        uuid NOT NULL,
  asset_number                      varchar(30) NOT NULL,
  name                              varchar(200) NOT NULL,
  description                       text,
  category                          intangible_category NOT NULL,
  useful_life_type                  useful_life_type NOT NULL,
  acquisition_date                  timestamptz NOT NULL,
  acquisition_cost                  bigint NOT NULL,
  residual_value                    bigint NOT NULL DEFAULT 0,
  useful_life_months                integer,
  accumulated_amortization          bigint NOT NULL DEFAULT 0,
  net_book_value                    bigint NOT NULL,
  currency_code                     varchar(3) NOT NULL,
  gl_account_id                     uuid NOT NULL,
  amortization_account_id           uuid NOT NULL,
  accumulated_amortization_account_id uuid NOT NULL,
  status                            intangible_asset_status NOT NULL DEFAULT 'ACTIVE',
  is_internally_generated           boolean NOT NULL DEFAULT false,
  created_at                        timestamptz NOT NULL DEFAULT now(),
  updated_at                        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_intangible_asset_number
  ON erp.intangible_asset (tenant_id, company_id, asset_number);
CREATE INDEX IF NOT EXISTS idx_intangible_company
  ON erp.intangible_asset (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_intangible_category
  ON erp.intangible_asset (tenant_id, category);

ALTER TABLE erp.intangible_asset ENABLE ROW LEVEL SECURITY;
CREATE POLICY intangible_asset_tenant ON erp.intangible_asset
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── erp.financial_instrument ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.financial_instrument (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL,
  company_id                  uuid NOT NULL,
  instrument_type             instrument_type NOT NULL,
  classification              instrument_classification NOT NULL,
  fair_value_level            fair_value_level,
  nominal_amount              bigint NOT NULL,
  carrying_amount             bigint NOT NULL,
  fair_value                  bigint,
  effective_interest_rate_bps integer NOT NULL,
  contractual_rate_bps        integer NOT NULL,
  currency_code               varchar(3) NOT NULL,
  maturity_date               timestamptz,
  counterparty_id             uuid NOT NULL,
  gl_account_id               uuid NOT NULL,
  is_derecognized             boolean NOT NULL DEFAULT false,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fin_instrument_company
  ON erp.financial_instrument (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_fin_instrument_type
  ON erp.financial_instrument (tenant_id, instrument_type);
CREATE INDEX IF NOT EXISTS idx_fin_instrument_classification
  ON erp.financial_instrument (tenant_id, classification);

ALTER TABLE erp.financial_instrument ENABLE ROW LEVEL SECURITY;
CREATE POLICY fin_instrument_tenant ON erp.financial_instrument
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── erp.hedge_relationship ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.hedge_relationship (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL,
  company_id              uuid NOT NULL,
  hedge_type              hedge_type NOT NULL,
  hedging_instrument_id   uuid NOT NULL,
  hedged_item_id          uuid NOT NULL,
  hedged_risk             varchar(100) NOT NULL,
  hedge_ratio             integer NOT NULL DEFAULT 10000,
  designation_date        timestamptz NOT NULL,
  status                  hedge_status NOT NULL DEFAULT 'DESIGNATED',
  discontinuation_date    timestamptz,
  discontinuation_reason  text,
  oci_reserve_balance     bigint NOT NULL DEFAULT 0,
  currency_code           varchar(3) NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hedge_company
  ON erp.hedge_relationship (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_hedge_instrument
  ON erp.hedge_relationship (tenant_id, hedging_instrument_id);
CREATE INDEX IF NOT EXISTS idx_hedge_status
  ON erp.hedge_relationship (tenant_id, status);

ALTER TABLE erp.hedge_relationship ENABLE ROW LEVEL SECURITY;
CREATE POLICY hedge_tenant ON erp.hedge_relationship
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── erp.deferred_tax_item ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.deferred_tax_item (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL,
  company_id              uuid NOT NULL,
  item_name               varchar(200) NOT NULL,
  origin                  varchar(50) NOT NULL,
  carrying_amount         bigint NOT NULL,
  tax_base                bigint NOT NULL,
  temporary_difference    bigint NOT NULL,
  tax_rate_bps            integer NOT NULL,
  deferred_tax_asset      bigint NOT NULL DEFAULT 0,
  deferred_tax_liability  bigint NOT NULL DEFAULT 0,
  is_recognized           boolean NOT NULL DEFAULT true,
  currency_code           varchar(3) NOT NULL,
  period_id               uuid NOT NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deferred_tax_company
  ON erp.deferred_tax_item (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_deferred_tax_period
  ON erp.deferred_tax_item (tenant_id, period_id);

ALTER TABLE erp.deferred_tax_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY deferred_tax_tenant ON erp.deferred_tax_item
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── erp.tp_policy ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.tp_policy (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  company_id            uuid NOT NULL,
  policy_name           varchar(200) NOT NULL,
  method                varchar(30) NOT NULL,
  benchmark_low_bps     integer NOT NULL,
  benchmark_median_bps  integer NOT NULL,
  benchmark_high_bps    integer NOT NULL,
  is_active             boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tp_policy_company
  ON erp.tp_policy (tenant_id, company_id);

ALTER TABLE erp.tp_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY tp_policy_tenant ON erp.tp_policy
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
