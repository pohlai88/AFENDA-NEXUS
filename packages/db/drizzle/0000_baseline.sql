CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE SCHEMA "erp";
--> statement-breakpoint
CREATE SCHEMA "platform";
--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."counterparty_type" AS ENUM('CUSTOMER', 'VENDOR', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('JOURNAL', 'INVOICE', 'PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."ic_leg_side" AS ENUM('SELLER', 'BUYER');--> statement-breakpoint
CREATE TYPE "public"."ic_pricing" AS ENUM('COST', 'MARKET', 'TRANSFER_PRICE', 'AGREED');--> statement-breakpoint
CREATE TYPE "public"."ic_settlement_status" AS ENUM('PENDING', 'SETTLED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."journal_status" AS ENUM('DRAFT', 'POSTED', 'REVERSED', 'VOIDED');--> statement-breakpoint
CREATE TYPE "public"."period_status" AS ENUM('OPEN', 'CLOSED', 'LOCKED');--> statement-breakpoint
CREATE TYPE "public"."recognition_method" AS ENUM('STRAIGHT_LINE', 'MILESTONE', 'PERCENTAGE_OF_COMPLETION');--> statement-breakpoint
CREATE TYPE "public"."recurring_frequency" AS ENUM('MONTHLY', 'QUARTERLY', 'YEARLY');--> statement-breakpoint
CREATE TYPE "public"."reporting_standard" AS ENUM('IFRS', 'US_GAAP', 'LOCAL');--> statement-breakpoint
CREATE TYPE "public"."settlement_method" AS ENUM('NETTING', 'CASH', 'JOURNAL');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('DRAFT', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('ACTIVE', 'SUSPENDED', 'DEACTIVATED');--> statement-breakpoint
CREATE TABLE "audit"."audit_log" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid,
	"old_data" jsonb,
	"new_data" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."account" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"account_type" "account_type" NOT NULL,
	"parent_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."budget_entry" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"ledger_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"budget_amount" bigint NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"version_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."classification_rule_set" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"standard" "reporting_standard" NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."classification_rule" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rule_set_id" uuid NOT NULL,
	"account_type" "account_type" NOT NULL,
	"pattern" varchar(100) NOT NULL,
	"category" varchar(100) NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."counterparty" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"counterparty_type" "counterparty_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."currency" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(3) NOT NULL,
	"name" text NOT NULL,
	"symbol" varchar(5) NOT NULL,
	"decimal_places" smallint DEFAULT 2 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_currency_decimal_places" CHECK ("erp"."currency"."decimal_places" >= 0 AND "erp"."currency"."decimal_places" <= 4)
);
--> statement-breakpoint
CREATE TABLE "erp"."fiscal_period" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"fiscal_year_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"period_number" smallint NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" "period_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."fiscal_year" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."fx_rate" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"from_currency_id" uuid NOT NULL,
	"to_currency_id" uuid NOT NULL,
	"rate" text NOT NULL,
	"effective_date" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone,
	"source" varchar(50) DEFAULT 'MANUAL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."gl_balance" (
	"tenant_id" uuid NOT NULL,
	"ledger_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"fiscal_year" varchar(10) NOT NULL,
	"fiscal_period" smallint NOT NULL,
	"debit_balance" bigint DEFAULT 0 NOT NULL,
	"credit_balance" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gl_balance_tenant_id_ledger_id_account_id_fiscal_year_fiscal_period_pk" PRIMARY KEY("tenant_id","ledger_id","account_id","fiscal_year","fiscal_period")
);
--> statement-breakpoint
CREATE TABLE "erp"."gl_journal_line" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"journal_id" uuid NOT NULL,
	"line_number" smallint NOT NULL,
	"account_id" uuid NOT NULL,
	"description" text,
	"debit" bigint DEFAULT 0 NOT NULL,
	"credit" bigint DEFAULT 0 NOT NULL,
	"currency_code" varchar(3),
	"base_currency_debit" bigint DEFAULT 0 NOT NULL,
	"base_currency_credit" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_journal_line_debit_credit" CHECK (("erp"."gl_journal_line"."debit" = 0) <> ("erp"."gl_journal_line"."credit" = 0))
);
--> statement-breakpoint
CREATE TABLE "erp"."gl_journal" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ledger_id" uuid NOT NULL,
	"fiscal_period_id" uuid NOT NULL,
	"journal_number" varchar(30) NOT NULL,
	"document_type" "document_type" DEFAULT 'JOURNAL' NOT NULL,
	"status" "journal_status" DEFAULT 'DRAFT' NOT NULL,
	"description" text,
	"posting_date" timestamp with time zone NOT NULL,
	"reversal_of_id" uuid,
	"reversed_by_id" uuid,
	"posted_at" timestamp with time zone,
	"posted_by" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."ic_agreement" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"seller_company_id" uuid NOT NULL,
	"buyer_company_id" uuid NOT NULL,
	"pricing" "ic_pricing" DEFAULT 'COST' NOT NULL,
	"markup_percent" smallint,
	"currency_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."ic_settlement_line" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"settlement_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."ic_settlement" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"settlement_number" varchar(30) NOT NULL,
	"agreement_id" uuid NOT NULL,
	"method" "settlement_method" NOT NULL,
	"status" "settlement_status" DEFAULT 'DRAFT' NOT NULL,
	"settlement_date" timestamp with time zone NOT NULL,
	"total_amount" bigint NOT NULL,
	"currency_id" uuid NOT NULL,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."ic_transaction_leg" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"side" "ic_leg_side" NOT NULL,
	"journal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."ic_transaction" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"agreement_id" uuid NOT NULL,
	"transaction_date" timestamp with time zone NOT NULL,
	"amount" bigint NOT NULL,
	"currency_id" uuid NOT NULL,
	"settlement_status" "ic_settlement_status" DEFAULT 'PENDING' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."ledger" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"currency_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."recognition_milestone" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"description" text NOT NULL,
	"amount" bigint NOT NULL,
	"target_date" timestamp with time zone NOT NULL,
	"completed_date" timestamp with time zone,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."recurring_template" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"ledger_id" uuid NOT NULL,
	"description" text NOT NULL,
	"line_template" jsonb NOT NULL,
	"frequency" "recurring_frequency" NOT NULL,
	"next_run_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."revenue_contract" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"customer_name" text NOT NULL,
	"total_amount" bigint NOT NULL,
	"currency_id" uuid NOT NULL,
	"recognition_method" "recognition_method" NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"deferred_account_id" uuid NOT NULL,
	"revenue_account_id" uuid NOT NULL,
	"status" "contract_status" DEFAULT 'ACTIVE' NOT NULL,
	"recognized_to_date" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."idempotency_store" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"command_type" varchar(100) NOT NULL,
	"result_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."company" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20) NOT NULL,
	"base_currency_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."outbox" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "platform"."tenant" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(63) NOT NULL,
	"status" "tenant_status" DEFAULT 'ACTIVE' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."user" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_account_code_tenant" ON "erp"."account" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_account_type_tenant" ON "erp"."account" USING btree ("tenant_id","account_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_budget_entry_tenant_ledger_account_period" ON "erp"."budget_entry" USING btree ("tenant_id","ledger_id","account_id","period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_classification_rule_set_tenant_standard_version" ON "erp"."classification_rule_set" USING btree ("tenant_id","standard","version");--> statement-breakpoint
CREATE INDEX "idx_classification_rule_set_tenant" ON "erp"."classification_rule" USING btree ("tenant_id","rule_set_id");--> statement-breakpoint
CREATE INDEX "idx_classification_rule_type_tenant" ON "erp"."classification_rule" USING btree ("tenant_id","account_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_counterparty_code_tenant" ON "erp"."counterparty" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_currency_code_tenant" ON "erp"."currency" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fiscal_period_year_num_tenant" ON "erp"."fiscal_period" USING btree ("tenant_id","fiscal_year_id","period_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fiscal_year_name_tenant" ON "erp"."fiscal_year" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fx_rate_pair_date_tenant" ON "erp"."fx_rate" USING btree ("tenant_id","from_currency_id","to_currency_id","effective_date");--> statement-breakpoint
CREATE INDEX "idx_fx_rate_effective_tenant" ON "erp"."fx_rate" USING btree ("tenant_id","effective_date");--> statement-breakpoint
CREATE INDEX "idx_gl_balance_account_tenant" ON "erp"."gl_balance" USING btree ("tenant_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_journal_line_num_tenant" ON "erp"."gl_journal_line" USING btree ("tenant_id","journal_id","line_number");--> statement-breakpoint
CREATE INDEX "idx_journal_line_account_tenant" ON "erp"."gl_journal_line" USING btree ("tenant_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_journal_number_ledger_tenant" ON "erp"."gl_journal" USING btree ("tenant_id","ledger_id","journal_number");--> statement-breakpoint
CREATE INDEX "idx_journal_status_tenant" ON "erp"."gl_journal" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_journal_posting_date_tenant" ON "erp"."gl_journal" USING btree ("tenant_id","posting_date");--> statement-breakpoint
CREATE INDEX "idx_journal_period_tenant" ON "erp"."gl_journal" USING btree ("tenant_id","fiscal_period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ic_agreement_pair_tenant" ON "erp"."ic_agreement" USING btree ("tenant_id","seller_company_id","buyer_company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ic_settlement_line_tx_tenant" ON "erp"."ic_settlement_line" USING btree ("tenant_id","settlement_id","transaction_id");--> statement-breakpoint
CREATE INDEX "idx_ic_settlement_line_settlement" ON "erp"."ic_settlement_line" USING btree ("tenant_id","settlement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ic_settlement_number_tenant" ON "erp"."ic_settlement" USING btree ("tenant_id","settlement_number");--> statement-breakpoint
CREATE INDEX "idx_ic_settlement_agreement_tenant" ON "erp"."ic_settlement" USING btree ("tenant_id","agreement_id");--> statement-breakpoint
CREATE INDEX "idx_ic_settlement_status_tenant" ON "erp"."ic_settlement" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ic_leg_tx_side_tenant" ON "erp"."ic_transaction_leg" USING btree ("tenant_id","transaction_id","side");--> statement-breakpoint
CREATE INDEX "idx_ic_tx_agreement_tenant" ON "erp"."ic_transaction" USING btree ("tenant_id","agreement_id");--> statement-breakpoint
CREATE INDEX "idx_ic_tx_status_tenant" ON "erp"."ic_transaction" USING btree ("tenant_id","settlement_status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ledger_name_company_tenant" ON "erp"."ledger" USING btree ("tenant_id","company_id","name");--> statement-breakpoint
CREATE INDEX "idx_recognition_milestone_contract_tenant" ON "erp"."recognition_milestone" USING btree ("tenant_id","contract_id");--> statement-breakpoint
CREATE INDEX "idx_recurring_template_tenant_active" ON "erp"."recurring_template" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_recurring_template_next_run" ON "erp"."recurring_template" USING btree ("tenant_id","next_run_date") WHERE is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_revenue_contract_number_tenant" ON "erp"."revenue_contract" USING btree ("tenant_id","contract_number");--> statement-breakpoint
CREATE INDEX "idx_revenue_contract_company_tenant" ON "erp"."revenue_contract" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_revenue_contract_status_tenant" ON "erp"."revenue_contract" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_idempotency_tenant_key_cmd" ON "erp"."idempotency_store" USING btree ("tenant_id","idempotency_key","command_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_company_code_tenant" ON "platform"."company" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_outbox_unprocessed" ON "erp"."outbox" USING btree ("created_at") WHERE "erp"."outbox"."processed_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tenant_slug" ON "platform"."tenant" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_email_tenant" ON "platform"."user" USING btree ("tenant_id","email");