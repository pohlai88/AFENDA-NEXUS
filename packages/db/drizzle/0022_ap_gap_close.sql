-- Migration 0022: AP Gap-Close
-- Closes 11 capability gaps identified in ap-remaining.md audit.
-- B2: INCOMPLETE enum value, F2: wht_income_type column,
-- C5: match_tolerance table, B6: ap_prepayment tables,
-- N8-N11: supplier portal persistence tables.

-- ─── B2: Add INCOMPLETE to ap_invoice_status enum ────────────────────────────
ALTER TYPE erp.ap_invoice_status ADD VALUE IF NOT EXISTS 'INCOMPLETE' BEFORE 'PENDING_APPROVAL';

-- ─── F2: Add wht_income_type enum + column on ap_invoice_line ────────────────
DO $$ BEGIN
  CREATE TYPE erp.wht_income_type AS ENUM (
    'ROYALTIES', 'INTEREST', 'DIVIDENDS', 'TECHNICAL_FEES',
    'MANAGEMENT_FEES', 'CONTRACT_PAYMENTS', 'RENTAL_INCOME',
    'COMMISSION', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE erp.ap_invoice_line
  ADD COLUMN IF NOT EXISTS wht_income_type erp.wht_income_type;

-- ─── C5: match_tolerance table ───────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE erp.tolerance_scope AS ENUM ('ORG', 'COMPANY', 'SITE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS erp.match_tolerance (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id   uuid NOT NULL REFERENCES platform.tenant(id),
  scope       erp.tolerance_scope NOT NULL,
  scope_entity_id uuid,
  company_id  uuid,
  tolerance_bps integer NOT NULL,
  quantity_tolerance_percent integer NOT NULL DEFAULT 0,
  auto_hold   boolean NOT NULL DEFAULT true,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_tolerance_tenant ON erp.match_tolerance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_match_tolerance_scope ON erp.match_tolerance(tenant_id, scope);

ALTER TABLE erp.match_tolerance ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON erp.match_tolerance
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── B6: ap_prepayment + ap_prepayment_application tables ───────────────────
DO $$ BEGIN
  CREATE TYPE erp.ap_prepayment_status AS ENUM (
    'OPEN', 'PARTIALLY_APPLIED', 'FULLY_APPLIED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS erp.ap_prepayment (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id       uuid NOT NULL REFERENCES platform.tenant(id),
  invoice_id      uuid NOT NULL,
  supplier_id     uuid NOT NULL,
  total_amount    bigint NOT NULL,
  applied_amount  bigint NOT NULL DEFAULT 0,
  unapplied_balance bigint NOT NULL,
  currency_code   varchar(3) NOT NULL,
  status          erp.ap_prepayment_status NOT NULL DEFAULT 'OPEN',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ap_prepayment_supplier ON erp.ap_prepayment(tenant_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_ap_prepayment_invoice ON erp.ap_prepayment(tenant_id, invoice_id);
CREATE INDEX IF NOT EXISTS idx_ap_prepayment_status ON erp.ap_prepayment(tenant_id, status);

ALTER TABLE erp.ap_prepayment ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON erp.ap_prepayment
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE TABLE IF NOT EXISTS erp.ap_prepayment_application (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id         uuid NOT NULL REFERENCES platform.tenant(id),
  prepayment_id     uuid NOT NULL REFERENCES erp.ap_prepayment(id),
  target_invoice_id uuid NOT NULL,
  amount            bigint NOT NULL,
  applied_by        uuid NOT NULL,
  applied_at        timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ap_prepay_app_prepayment ON erp.ap_prepayment_application(tenant_id, prepayment_id);
CREATE INDEX IF NOT EXISTS idx_ap_prepay_app_invoice ON erp.ap_prepayment_application(tenant_id, target_invoice_id);

ALTER TABLE erp.ap_prepayment_application ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON erp.ap_prepayment_application
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── N8: supplier_document table ─────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE erp.supplier_document_category AS ENUM (
    'CONTRACT', 'TAX_NOTICE', 'INSURANCE_POLICY', 'CORRESPONDENCE', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS erp.supplier_document (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id       uuid NOT NULL REFERENCES platform.tenant(id),
  supplier_id     uuid NOT NULL,
  category        erp.supplier_document_category NOT NULL,
  title           varchar(255) NOT NULL,
  description     text,
  file_name       varchar(255) NOT NULL,
  mime_type       varchar(100) NOT NULL,
  file_size_bytes integer NOT NULL,
  checksum_sha256 varchar(64) NOT NULL,
  expires_at      timestamptz,
  uploaded_by     uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_doc_supplier ON erp.supplier_document(tenant_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_doc_category ON erp.supplier_document(tenant_id, category);

ALTER TABLE erp.supplier_document ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON erp.supplier_document
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── N9: supplier_dispute table ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE erp.dispute_status AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE erp.dispute_category AS ENUM (
    'INCORRECT_AMOUNT', 'MISSING_PAYMENT', 'DUPLICATE_CHARGE',
    'PRICING_DISCREPANCY', 'DELIVERY_ISSUE', 'QUALITY_ISSUE', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS erp.supplier_dispute (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id       uuid NOT NULL REFERENCES platform.tenant(id),
  supplier_id     uuid NOT NULL,
  invoice_id      uuid,
  payment_run_id  uuid,
  category        erp.dispute_category NOT NULL,
  subject         varchar(255) NOT NULL,
  description     text NOT NULL,
  status          erp.dispute_status NOT NULL DEFAULT 'OPEN',
  resolution      text,
  resolved_by     uuid,
  resolved_at     timestamptz,
  created_by      uuid NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_dispute_supplier ON erp.supplier_dispute(tenant_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_dispute_status ON erp.supplier_dispute(tenant_id, status);

ALTER TABLE erp.supplier_dispute ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON erp.supplier_dispute
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── N10: supplier_notification_pref table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS erp.supplier_notification_pref (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id               uuid NOT NULL REFERENCES platform.tenant(id),
  supplier_id             uuid NOT NULL,
  channel                 varchar(20) NOT NULL,
  endpoint                varchar(500) NOT NULL,
  invoice_status_changes  boolean NOT NULL DEFAULT true,
  payment_notifications   boolean NOT NULL DEFAULT true,
  dispute_updates         boolean NOT NULL DEFAULT true,
  compliance_alerts       boolean NOT NULL DEFAULT true,
  is_active               boolean NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_notif_pref
  ON erp.supplier_notification_pref(tenant_id, supplier_id, channel);

ALTER TABLE erp.supplier_notification_pref ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON erp.supplier_notification_pref
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- ─── N11: supplier_compliance_item table ─────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE erp.compliance_item_type AS ENUM (
    'KYC', 'TAX_CLEARANCE', 'INSURANCE', 'BANK_VERIFICATION', 'TRADE_LICENSE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS erp.supplier_compliance_item (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id     uuid NOT NULL REFERENCES platform.tenant(id),
  supplier_id   uuid NOT NULL,
  item_type     erp.compliance_item_type NOT NULL,
  label         varchar(255) NOT NULL,
  is_compliant  boolean NOT NULL DEFAULT false,
  expires_at    timestamptz,
  document_id   uuid,
  notes         text,
  verified_by   uuid,
  verified_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_compliance_supplier
  ON erp.supplier_compliance_item(tenant_id, supplier_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_compliance_type
  ON erp.supplier_compliance_item(tenant_id, supplier_id, item_type);

ALTER TABLE erp.supplier_compliance_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON erp.supplier_compliance_item
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
