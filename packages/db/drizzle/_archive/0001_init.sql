-- 0001_init: Extensions, schemas, enums, tables, indexes, composite FKs, CHECK constraints
-- All PKs use: id UUID PRIMARY KEY DEFAULT uuid_generate_v7()

CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

-- ─── Schemas ────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS platform;
CREATE SCHEMA IF NOT EXISTS erp;
CREATE SCHEMA IF NOT EXISTS audit;

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE "tenant_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');
CREATE TYPE "journal_status" AS ENUM ('DRAFT', 'POSTED', 'REVERSED', 'VOIDED');
CREATE TYPE "account_type" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');
CREATE TYPE "period_status" AS ENUM ('OPEN', 'CLOSED', 'LOCKED');
CREATE TYPE "document_type" AS ENUM ('JOURNAL', 'INVOICE', 'PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'TRANSFER');
CREATE TYPE "ic_pricing" AS ENUM ('COST', 'MARKET', 'TRANSFER_PRICE', 'AGREED');
CREATE TYPE "ic_settlement_status" AS ENUM ('PENDING', 'SETTLED', 'CANCELLED');
CREATE TYPE "ic_leg_side" AS ENUM ('SELLER', 'BUYER');
CREATE TYPE "counterparty_type" AS ENUM ('CUSTOMER', 'VENDOR', 'BOTH');

-- ─── Platform Tables ────────────────────────────────────────────────────────

CREATE TABLE "platform"."tenant" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "name" text NOT NULL,
  "slug" varchar(63) NOT NULL,
  "status" "tenant_status" NOT NULL DEFAULT 'ACTIVE',
  "settings" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_tenant_slug" ON "platform"."tenant" ("slug");

CREATE TABLE "platform"."company" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "code" varchar(20) NOT NULL,
  "base_currency_id" uuid NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_company_code_tenant" ON "platform"."company" ("tenant_id", "code");

CREATE TABLE "platform"."user" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "email" varchar(255) NOT NULL,
  "display_name" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_user_email_tenant" ON "platform"."user" ("tenant_id", "email");

-- ─── ERP Tables ─────────────────────────────────────────────────────────────

CREATE TABLE "erp"."currency" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "code" varchar(3) NOT NULL,
  "name" text NOT NULL,
  "symbol" varchar(5) NOT NULL,
  "decimal_places" smallint NOT NULL DEFAULT 2,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "chk_currency_decimal_places" CHECK ("decimal_places" >= 0 AND "decimal_places" <= 4)
);
CREATE UNIQUE INDEX "uq_currency_code_tenant" ON "erp"."currency" ("tenant_id", "code");

CREATE TABLE "erp"."fiscal_year" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "name" varchar(50) NOT NULL,
  "start_date" timestamptz NOT NULL,
  "end_date" timestamptz NOT NULL,
  "is_closed" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_fiscal_year_name_tenant" ON "erp"."fiscal_year" ("tenant_id", "name");

CREATE TABLE "erp"."fiscal_period" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "fiscal_year_id" uuid NOT NULL,
  "name" varchar(50) NOT NULL,
  "period_number" smallint NOT NULL,
  "start_date" timestamptz NOT NULL,
  "end_date" timestamptz NOT NULL,
  "status" "period_status" NOT NULL DEFAULT 'OPEN',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_fiscal_period_year_num_tenant" ON "erp"."fiscal_period" ("tenant_id", "fiscal_year_id", "period_number");

CREATE TABLE "erp"."account" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "code" varchar(20) NOT NULL,
  "name" text NOT NULL,
  "account_type" "account_type" NOT NULL,
  "parent_id" uuid,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_account_code_tenant" ON "erp"."account" ("tenant_id", "code");
CREATE INDEX "idx_account_type_tenant" ON "erp"."account" ("tenant_id", "account_type");

CREATE TABLE "erp"."ledger" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "name" text NOT NULL,
  "currency_id" uuid NOT NULL,
  "is_default" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_ledger_name_company_tenant" ON "erp"."ledger" ("tenant_id", "company_id", "name");

CREATE TABLE "erp"."gl_journal" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "ledger_id" uuid NOT NULL,
  "fiscal_period_id" uuid NOT NULL,
  "journal_number" varchar(30) NOT NULL,
  "document_type" "document_type" NOT NULL DEFAULT 'JOURNAL',
  "status" "journal_status" NOT NULL DEFAULT 'DRAFT',
  "description" text,
  "posting_date" timestamptz NOT NULL,
  "reversal_of_id" uuid,
  "posted_at" timestamptz,
  "posted_by" uuid,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_journal_number_ledger_tenant" ON "erp"."gl_journal" ("tenant_id", "ledger_id", "journal_number");
CREATE INDEX "idx_journal_status_tenant" ON "erp"."gl_journal" ("tenant_id", "status");
CREATE INDEX "idx_journal_posting_date_tenant" ON "erp"."gl_journal" ("tenant_id", "posting_date");
CREATE INDEX "idx_journal_period_tenant" ON "erp"."gl_journal" ("tenant_id", "fiscal_period_id");

CREATE TABLE "erp"."gl_journal_line" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "journal_id" uuid NOT NULL,
  "line_number" smallint NOT NULL,
  "account_id" uuid NOT NULL,
  "description" text,
  "debit" bigint NOT NULL DEFAULT 0,
  "credit" bigint NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "chk_journal_line_debit_credit" CHECK (("debit" = 0) <> ("credit" = 0))
);
CREATE UNIQUE INDEX "uq_journal_line_num_tenant" ON "erp"."gl_journal_line" ("tenant_id", "journal_id", "line_number");
CREATE INDEX "idx_journal_line_account_tenant" ON "erp"."gl_journal_line" ("tenant_id", "account_id");

CREATE TABLE "erp"."gl_balance" (
  "tenant_id" uuid NOT NULL,
  "ledger_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "fiscal_year" varchar(10) NOT NULL,
  "fiscal_period" smallint NOT NULL,
  "debit_balance" bigint NOT NULL DEFAULT 0,
  "credit_balance" bigint NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("tenant_id", "ledger_id", "account_id", "fiscal_year", "fiscal_period")
);
CREATE INDEX "idx_gl_balance_account_tenant" ON "erp"."gl_balance" ("tenant_id", "account_id");

CREATE TABLE "erp"."counterparty" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "code" varchar(20) NOT NULL,
  "name" text NOT NULL,
  "counterparty_type" "counterparty_type" NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_counterparty_code_tenant" ON "erp"."counterparty" ("tenant_id", "code");

CREATE TABLE "erp"."ic_agreement" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "seller_company_id" uuid NOT NULL,
  "buyer_company_id" uuid NOT NULL,
  "pricing" "ic_pricing" NOT NULL DEFAULT 'COST',
  "markup_percent" smallint,
  "currency_id" uuid NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_ic_agreement_pair_tenant" ON "erp"."ic_agreement" ("tenant_id", "seller_company_id", "buyer_company_id");

CREATE TABLE "erp"."ic_transaction" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "agreement_id" uuid NOT NULL,
  "transaction_date" timestamptz NOT NULL,
  "amount" bigint NOT NULL,
  "currency_id" uuid NOT NULL,
  "settlement_status" "ic_settlement_status" NOT NULL DEFAULT 'PENDING',
  "description" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "idx_ic_tx_agreement_tenant" ON "erp"."ic_transaction" ("tenant_id", "agreement_id");
CREATE INDEX "idx_ic_tx_status_tenant" ON "erp"."ic_transaction" ("tenant_id", "settlement_status");

CREATE TABLE "erp"."ic_transaction_leg" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "transaction_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "side" "ic_leg_side" NOT NULL,
  "journal_id" uuid,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "uq_ic_leg_tx_side_tenant" ON "erp"."ic_transaction_leg" ("tenant_id", "transaction_id", "side");

-- ─── Outbox ─────────────────────────────────────────────────────────────────

CREATE TABLE "erp"."outbox" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "event_type" text NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "processed_at" timestamptz
);
CREATE INDEX "idx_outbox_unprocessed" ON "erp"."outbox" ("created_at") WHERE "processed_at" IS NULL;

-- ─── Audit ──────────────────────────────────────────────────────────────────

CREATE TABLE "audit"."audit_log" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  "tenant_id" uuid NOT NULL,
  "user_id" uuid,
  "action" varchar(50) NOT NULL,
  "table_name" varchar(100) NOT NULL,
  "record_id" uuid,
  "old_data" jsonb,
  "new_data" jsonb,
  "ip_address" varchar(45),
  "user_agent" text,
  "occurred_at" timestamptz NOT NULL DEFAULT now()
);

-- ─── Composite Tenant Foreign Keys (18 pairs) ──────────────────────────────

ALTER TABLE "platform"."company"
  ADD CONSTRAINT "fk_company_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id");

ALTER TABLE "platform"."user"
  ADD CONSTRAINT "fk_user_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id");

ALTER TABLE "erp"."currency"
  ADD CONSTRAINT "fk_currency_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id");

ALTER TABLE "erp"."fiscal_year"
  ADD CONSTRAINT "fk_fiscal_year_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id");

ALTER TABLE "erp"."fiscal_period"
  ADD CONSTRAINT "fk_fiscal_period_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id"),
  ADD CONSTRAINT "fk_fiscal_period_year" FOREIGN KEY ("fiscal_year_id") REFERENCES "erp"."fiscal_year"("id");

ALTER TABLE "erp"."account"
  ADD CONSTRAINT "fk_account_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id"),
  ADD CONSTRAINT "fk_account_parent" FOREIGN KEY ("parent_id") REFERENCES "erp"."account"("id");

ALTER TABLE "erp"."ledger"
  ADD CONSTRAINT "fk_ledger_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id"),
  ADD CONSTRAINT "fk_ledger_company" FOREIGN KEY ("company_id") REFERENCES "platform"."company"("id"),
  ADD CONSTRAINT "fk_ledger_currency" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id");

ALTER TABLE "erp"."gl_journal"
  ADD CONSTRAINT "fk_journal_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id"),
  ADD CONSTRAINT "fk_journal_ledger" FOREIGN KEY ("ledger_id") REFERENCES "erp"."ledger"("id"),
  ADD CONSTRAINT "fk_journal_period" FOREIGN KEY ("fiscal_period_id") REFERENCES "erp"."fiscal_period"("id"),
  ADD CONSTRAINT "fk_journal_reversal" FOREIGN KEY ("reversal_of_id") REFERENCES "erp"."gl_journal"("id"),
  ADD CONSTRAINT "fk_journal_posted_by" FOREIGN KEY ("posted_by") REFERENCES "platform"."user"("id");

ALTER TABLE "erp"."gl_journal_line"
  ADD CONSTRAINT "fk_journal_line_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id"),
  ADD CONSTRAINT "fk_journal_line_journal" FOREIGN KEY ("journal_id") REFERENCES "erp"."gl_journal"("id"),
  ADD CONSTRAINT "fk_journal_line_account" FOREIGN KEY ("account_id") REFERENCES "erp"."account"("id");

ALTER TABLE "erp"."gl_balance"
  ADD CONSTRAINT "fk_gl_balance_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id"),
  ADD CONSTRAINT "fk_gl_balance_ledger" FOREIGN KEY ("ledger_id") REFERENCES "erp"."ledger"("id"),
  ADD CONSTRAINT "fk_gl_balance_account" FOREIGN KEY ("account_id") REFERENCES "erp"."account"("id");

ALTER TABLE "erp"."counterparty"
  ADD CONSTRAINT "fk_counterparty_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id");

ALTER TABLE "erp"."ic_agreement"
  ADD CONSTRAINT "fk_ic_agreement_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id"),
  ADD CONSTRAINT "fk_ic_agreement_seller" FOREIGN KEY ("seller_company_id") REFERENCES "platform"."company"("id"),
  ADD CONSTRAINT "fk_ic_agreement_buyer" FOREIGN KEY ("buyer_company_id") REFERENCES "platform"."company"("id"),
  ADD CONSTRAINT "fk_ic_agreement_currency" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id");

ALTER TABLE "erp"."ic_transaction"
  ADD CONSTRAINT "fk_ic_tx_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id"),
  ADD CONSTRAINT "fk_ic_tx_agreement" FOREIGN KEY ("agreement_id") REFERENCES "erp"."ic_agreement"("id"),
  ADD CONSTRAINT "fk_ic_tx_currency" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id");

ALTER TABLE "erp"."ic_transaction_leg"
  ADD CONSTRAINT "fk_ic_leg_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id"),
  ADD CONSTRAINT "fk_ic_leg_tx" FOREIGN KEY ("transaction_id") REFERENCES "erp"."ic_transaction"("id"),
  ADD CONSTRAINT "fk_ic_leg_company" FOREIGN KEY ("company_id") REFERENCES "platform"."company"("id"),
  ADD CONSTRAINT "fk_ic_leg_journal" FOREIGN KEY ("journal_id") REFERENCES "erp"."gl_journal"("id");

ALTER TABLE "erp"."outbox"
  ADD CONSTRAINT "fk_outbox_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id");

ALTER TABLE "audit"."audit_log"
  ADD CONSTRAINT "fk_audit_log_tenant" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id"),
  ADD CONSTRAINT "fk_audit_log_user" FOREIGN KEY ("user_id") REFERENCES "platform"."user"("id");

ALTER TABLE "platform"."company"
  ADD CONSTRAINT "fk_company_base_currency" FOREIGN KEY ("base_currency_id") REFERENCES "erp"."currency"("id");
