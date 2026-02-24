-- 0006_gap_remediation.sql
-- Adds 8 missing tables identified in FINANCE-DEV-PLAN gap analysis
-- Tables: payment_terms_line, asset_component, accounting_event, mapping_rule,
--         mapping_rule_version, fair_value_measurement, hedge_effectiveness_test, tp_benchmark
-- Enums: accounting_event_status, mapping_rule_status, hedge_test_method, hedge_test_result, tp_method

-- ─── New enums ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE accounting_event_status AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE mapping_rule_status AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE hedge_test_method AS ENUM ('DOLLAR_OFFSET', 'REGRESSION', 'CRITICAL_TERMS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE hedge_test_result AS ENUM ('HIGHLY_EFFECTIVE', 'EFFECTIVE', 'INEFFECTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tp_method AS ENUM ('CUP', 'RESALE_PRICE', 'COST_PLUS', 'TNMM', 'PROFIT_SPLIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 1. payment_terms_line ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.payment_terms_line (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  template_id   uuid NOT NULL,
  line_number   smallint NOT NULL,
  due_days      smallint NOT NULL,
  percentage_of_total smallint NOT NULL,
  discount_percent_bps integer NOT NULL DEFAULT 0,
  discount_days smallint NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_terms_line_template ON erp.payment_terms_line (tenant_id, template_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_terms_line_order ON erp.payment_terms_line (tenant_id, template_id, line_number);

ALTER TABLE erp.payment_terms_line ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_payment_terms_line ON erp.payment_terms_line
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── 2. asset_component ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.asset_component (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  asset_id            uuid NOT NULL,
  component_name      varchar(200) NOT NULL,
  acquisition_cost    bigint NOT NULL,
  residual_value      bigint NOT NULL DEFAULT 0,
  useful_life_months  smallint NOT NULL,
  depreciation_method depreciation_method NOT NULL,
  accumulated_depreciation bigint NOT NULL DEFAULT 0,
  net_book_value      bigint NOT NULL,
  currency_code       varchar(3) NOT NULL DEFAULT 'USD',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_component_asset ON erp.asset_component (tenant_id, asset_id);

ALTER TABLE erp.asset_component ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_asset_component ON erp.asset_component
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── 3. accounting_event ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.accounting_event (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  company_id            uuid NOT NULL,
  event_type            varchar(100) NOT NULL,
  source_document_type  varchar(50) NOT NULL,
  source_document_id    uuid NOT NULL,
  event_date            timestamptz NOT NULL,
  payload               jsonb NOT NULL,
  status                accounting_event_status NOT NULL DEFAULT 'PENDING',
  processed_at          timestamptz,
  error_message         text,
  journal_id            uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounting_event_company ON erp.accounting_event (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_accounting_event_type ON erp.accounting_event (tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_accounting_event_status ON erp.accounting_event (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_accounting_event_source ON erp.accounting_event (tenant_id, source_document_type, source_document_id);

ALTER TABLE erp.accounting_event ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_accounting_event ON erp.accounting_event
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── 4. mapping_rule ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.mapping_rule (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  company_id            uuid NOT NULL,
  rule_name             varchar(200) NOT NULL,
  event_type            varchar(100) NOT NULL,
  priority              smallint NOT NULL DEFAULT 0,
  condition_expression  text,
  journal_template      jsonb NOT NULL,
  target_ledger_id      uuid,
  status                mapping_rule_status NOT NULL DEFAULT 'DRAFT',
  version_id            uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mapping_rule_company ON erp.mapping_rule (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_mapping_rule_event ON erp.mapping_rule (tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_mapping_rule_status ON erp.mapping_rule (tenant_id, status);

ALTER TABLE erp.mapping_rule ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_mapping_rule ON erp.mapping_rule
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── 5. mapping_rule_version ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.mapping_rule_version (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  rule_id               uuid NOT NULL,
  version_number        smallint NOT NULL,
  status                mapping_rule_status NOT NULL DEFAULT 'DRAFT',
  journal_template      jsonb NOT NULL,
  condition_expression  text,
  published_at          timestamptz,
  published_by          uuid,
  deprecated_at         timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mapping_rule_version_rule ON erp.mapping_rule_version (tenant_id, rule_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mapping_rule_version ON erp.mapping_rule_version (tenant_id, rule_id, version_number);

ALTER TABLE erp.mapping_rule_version ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_mapping_rule_version ON erp.mapping_rule_version
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── 6. fair_value_measurement ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.fair_value_measurement (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  instrument_id       uuid NOT NULL,
  measurement_date    timestamptz NOT NULL,
  fair_value_level    fair_value_level NOT NULL,
  fair_value          bigint NOT NULL,
  previous_fair_value bigint,
  valuation_method    varchar(100),
  currency_code       varchar(3) NOT NULL,
  gain_or_loss        bigint,
  is_recognized_in_pl boolean NOT NULL DEFAULT true,
  journal_id          uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fvm_instrument ON erp.fair_value_measurement (tenant_id, instrument_id);
CREATE INDEX IF NOT EXISTS idx_fvm_date ON erp.fair_value_measurement (tenant_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_fvm_level ON erp.fair_value_measurement (tenant_id, fair_value_level);

ALTER TABLE erp.fair_value_measurement ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_fair_value_measurement ON erp.fair_value_measurement
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── 7. hedge_effectiveness_test ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.hedge_effectiveness_test (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                     uuid NOT NULL,
  hedge_relationship_id         uuid NOT NULL,
  test_date                     timestamptz NOT NULL,
  test_method                   hedge_test_method NOT NULL,
  result                        hedge_test_result NOT NULL,
  effectiveness_ratio_bps       integer NOT NULL,
  hedged_item_fv_change         bigint NOT NULL,
  hedging_instrument_fv_change  bigint NOT NULL,
  ineffective_portion_amount    bigint NOT NULL DEFAULT 0,
  currency_code                 varchar(3) NOT NULL,
  notes                         text,
  journal_id                    uuid,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hedge_test_relationship ON erp.hedge_effectiveness_test (tenant_id, hedge_relationship_id);
CREATE INDEX IF NOT EXISTS idx_hedge_test_date ON erp.hedge_effectiveness_test (tenant_id, test_date);
CREATE INDEX IF NOT EXISTS idx_hedge_test_result ON erp.hedge_effectiveness_test (tenant_id, result);

ALTER TABLE erp.hedge_effectiveness_test ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_hedge_effectiveness_test ON erp.hedge_effectiveness_test
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── 8. tp_benchmark ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.tp_benchmark (
  id                             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                      uuid NOT NULL,
  policy_id                      uuid NOT NULL,
  benchmark_year                 smallint NOT NULL,
  method                         tp_method NOT NULL,
  comparable_count               smallint NOT NULL,
  interquartile_range_low_bps    integer NOT NULL,
  interquartile_range_median_bps integer NOT NULL,
  interquartile_range_high_bps   integer NOT NULL,
  data_source                    varchar(200),
  notes                          text,
  created_at                     timestamptz NOT NULL DEFAULT now(),
  updated_at                     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tp_benchmark_policy ON erp.tp_benchmark (tenant_id, policy_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tp_benchmark_year ON erp.tp_benchmark (tenant_id, policy_id, benchmark_year);

ALTER TABLE erp.tp_benchmark ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_tp_benchmark ON erp.tp_benchmark
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
