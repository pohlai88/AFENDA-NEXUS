-- 0019: AP Wave 1 — Supplier master + Hold lifecycle
-- Tables: erp.supplier, erp.supplier_site, erp.supplier_bank_account, erp.ap_hold
-- Enums: supplier_status, payment_method_type, ap_hold_type, ap_hold_status

-- ─── Enums ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "supplier_status" AS ENUM ('ACTIVE', 'ON_HOLD', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "payment_method_type" AS ENUM ('BANK_TRANSFER', 'CHECK', 'WIRE', 'SEPA', 'LOCAL_TRANSFER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ap_hold_type" AS ENUM ('DUPLICATE', 'MATCH_EXCEPTION', 'VALIDATION', 'SUPPLIER', 'FX_RATE', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ap_hold_status" AS ENUM ('ACTIVE', 'RELEASED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── erp.supplier ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "erp"."supplier" (
  "id"                        uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id"                 uuid NOT NULL,
  "company_id"                uuid NOT NULL,
  "code"                      varchar(20) NOT NULL,
  "name"                      text NOT NULL,
  "tax_id"                    varchar(50),
  "currency_id"               uuid NOT NULL,
  "default_payment_terms_id"  uuid,
  "default_payment_method"    "payment_method_type",
  "wht_rate_id"               uuid,
  "remittance_email"          varchar(255),
  "status"                    "supplier_status" NOT NULL DEFAULT 'ACTIVE',
  "created_at"                timestamptz NOT NULL DEFAULT now(),
  "updated_at"                timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_supplier_code_tenant"
  ON "erp"."supplier" ("tenant_id", "company_id", "code");
CREATE INDEX IF NOT EXISTS "idx_supplier_status_tenant"
  ON "erp"."supplier" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_supplier_company_tenant"
  ON "erp"."supplier" ("tenant_id", "company_id");

-- ─── erp.supplier_site ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "erp"."supplier_site" (
  "id"              uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id"       uuid NOT NULL,
  "supplier_id"     uuid NOT NULL,
  "site_code"       varchar(20) NOT NULL,
  "name"            text NOT NULL,
  "address_line1"   text NOT NULL,
  "address_line2"   text,
  "city"            varchar(100) NOT NULL,
  "region"          varchar(100),
  "postal_code"     varchar(20),
  "country_code"    varchar(3) NOT NULL,
  "is_primary"      boolean NOT NULL DEFAULT false,
  "is_active"       boolean NOT NULL DEFAULT true,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  "updated_at"      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_supplier_site_code"
  ON "erp"."supplier_site" ("tenant_id", "supplier_id", "site_code");
CREATE INDEX IF NOT EXISTS "idx_supplier_site_supplier"
  ON "erp"."supplier_site" ("tenant_id", "supplier_id");

-- ─── erp.supplier_bank_account ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "erp"."supplier_bank_account" (
  "id"              uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id"       uuid NOT NULL,
  "supplier_id"     uuid NOT NULL,
  "bank_name"       varchar(200) NOT NULL,
  "account_name"    varchar(200) NOT NULL,
  "account_number"  varchar(50) NOT NULL,
  "iban"            varchar(34),
  "swift_bic"       varchar(11),
  "local_bank_code" varchar(20),
  "currency_id"     uuid NOT NULL,
  "is_primary"      boolean NOT NULL DEFAULT false,
  "is_active"       boolean NOT NULL DEFAULT true,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  "updated_at"      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_supplier_bank_supplier"
  ON "erp"."supplier_bank_account" ("tenant_id", "supplier_id");

-- ─── erp.ap_hold ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "erp"."ap_hold" (
  "id"              uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id"       uuid NOT NULL,
  "invoice_id"      uuid NOT NULL,
  "hold_type"       "ap_hold_type" NOT NULL,
  "hold_reason"     text NOT NULL,
  "hold_date"       timestamptz NOT NULL DEFAULT now(),
  "release_date"    timestamptz,
  "released_by"     uuid,
  "release_reason"  text,
  "status"          "ap_hold_status" NOT NULL DEFAULT 'ACTIVE',
  "created_by"      uuid NOT NULL,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  "updated_at"      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_ap_hold_invoice_tenant"
  ON "erp"."ap_hold" ("tenant_id", "invoice_id");
CREATE INDEX IF NOT EXISTS "idx_ap_hold_status_tenant"
  ON "erp"."ap_hold" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_ap_hold_type_tenant"
  ON "erp"."ap_hold" ("tenant_id", "hold_type");

-- ─── RLS Policies ──────────────────────────────────────────────────────────

ALTER TABLE "erp"."supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."supplier_site" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."supplier_bank_account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."ap_hold" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON "erp"."supplier"
    USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON "erp"."supplier_site"
    USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON "erp"."supplier_bank_account"
    USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tenant_isolation" ON "erp"."ap_hold"
    USING ("tenant_id" = current_setting('app.current_tenant_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
