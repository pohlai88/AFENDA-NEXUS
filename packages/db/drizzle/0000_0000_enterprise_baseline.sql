CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE SCHEMA "erp";
--> statement-breakpoint
CREATE SCHEMA "platform";
--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "public"."accounting_event_status" AS ENUM('PENDING', 'PROCESSED', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."allocation_method" AS ENUM('DIRECT', 'STEP_DOWN', 'RECIPROCAL');--> statement-breakpoint
CREATE TYPE "public"."allocation_run_status" AS ENUM('DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."ap_hold_status" AS ENUM('ACTIVE', 'RELEASED');--> statement-breakpoint
CREATE TYPE "public"."ap_hold_type" AS ENUM('DUPLICATE', 'MATCH_EXCEPTION', 'VALIDATION', 'SUPPLIER', 'FX_RATE', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."ap_invoice_status" AS ENUM('DRAFT', 'INCOMPLETE', 'PENDING_APPROVAL', 'APPROVED', 'POSTED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ap_prepayment_status" AS ENUM('OPEN', 'PARTIALLY_APPLIED', 'FULLY_APPLIED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ar_invoice_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'POSTED', 'PAID', 'PARTIALLY_PAID', 'WRITTEN_OFF', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."asset_movement_type" AS ENUM('ACQUISITION', 'DEPRECIATION', 'REVALUATION', 'IMPAIRMENT', 'DISPOSAL', 'TRANSFER', 'CAPITALIZATION');--> statement-breakpoint
CREATE TYPE "public"."asset_status" AS ENUM('ACTIVE', 'DISPOSED', 'FULLY_DEPRECIATED', 'IMPAIRED', 'CWIP');--> statement-breakpoint
CREATE TYPE "public"."bank_line_match_status" AS ENUM('UNMATCHED', 'AUTO_MATCHED', 'MANUAL_MATCHED', 'CONFIRMED', 'INVESTIGATING');--> statement-breakpoint
CREATE TYPE "public"."bank_match_confidence" AS ENUM('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."bank_match_type" AS ENUM('AUTO', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."billing_status" AS ENUM('DRAFT', 'INVOICED', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."billing_type" AS ENUM('FIXED_FEE', 'TIME_AND_MATERIALS', 'MILESTONE', 'COST_PLUS');--> statement-breakpoint
CREATE TYPE "public"."compliance_item_type" AS ENUM('KYC', 'TAX_CLEARANCE', 'INSURANCE', 'BANK_VERIFICATION', 'TRADE_LICENSE');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."cost_category" AS ENUM('LABOR', 'MATERIALS', 'SUBCONTRACT', 'TRAVEL', 'EQUIPMENT', 'OVERHEAD', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."cost_center_status" AS ENUM('ACTIVE', 'INACTIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."counterparty_type" AS ENUM('CUSTOMER', 'VENDOR', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."covenant_status" AS ENUM('COMPLIANT', 'WARNING', 'BREACHED');--> statement-breakpoint
CREATE TYPE "public"."covenant_type" AS ENUM('DEBT_TO_EQUITY', 'INTEREST_COVERAGE', 'CURRENT_RATIO', 'DEBT_SERVICE_COVERAGE', 'LEVERAGE', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."credit_status" AS ENUM('ACTIVE', 'ON_HOLD', 'SUSPENDED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."depreciation_method" AS ENUM('STRAIGHT_LINE', 'DECLINING_BALANCE', 'UNITS_OF_PRODUCTION');--> statement-breakpoint
CREATE TYPE "public"."dispute_category" AS ENUM('INCORRECT_AMOUNT', 'MISSING_PAYMENT', 'DUPLICATE_CHARGE', 'PRICING_DISCREPANCY', 'DELIVERY_ISSUE', 'QUALITY_ISSUE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('INVOICE', 'RECEIPT', 'CONTRACT', 'BANK_STATEMENT', 'BOARD_MINUTES', 'TAX_NOTICE', 'VALUATION_REPORT', 'LEGAL_OPINION', 'INSURANCE_POLICY', 'CORRESPONDENCE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('PENDING_UPLOAD', 'STORED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('JOURNAL', 'INVOICE', 'PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."driver_type" AS ENUM('HEADCOUNT', 'MACHINE_HOURS', 'DIRECT_LABOR', 'FLOOR_AREA', 'REVENUE', 'UNITS_PRODUCED', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."dunning_run_status" AS ENUM('DRAFT', 'APPROVED', 'SENT', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORT', 'SUPPLIES', 'COMMUNICATION', 'ENTERTAINMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."expense_claim_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REIMBURSED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."fair_value_level" AS ENUM('LEVEL_1', 'LEVEL_2', 'LEVEL_3');--> statement-breakpoint
CREATE TYPE "public"."forecast_type" AS ENUM('RECEIPTS', 'PAYMENTS', 'FINANCING', 'INVESTING');--> statement-breakpoint
CREATE TYPE "public"."goodwill_status" AS ENUM('ACTIVE', 'IMPAIRED', 'DERECOGNIZED');--> statement-breakpoint
CREATE TYPE "public"."group_entity_type" AS ENUM('PARENT', 'SUBSIDIARY', 'ASSOCIATE', 'JOINT_VENTURE');--> statement-breakpoint
CREATE TYPE "public"."hedge_status" AS ENUM('DESIGNATED', 'ACTIVE', 'DISCONTINUED', 'REBALANCED');--> statement-breakpoint
CREATE TYPE "public"."hedge_test_method" AS ENUM('DOLLAR_OFFSET', 'REGRESSION', 'CRITICAL_TERMS');--> statement-breakpoint
CREATE TYPE "public"."hedge_test_result" AS ENUM('HIGHLY_EFFECTIVE', 'EFFECTIVE', 'INEFFECTIVE');--> statement-breakpoint
CREATE TYPE "public"."hedge_type" AS ENUM('FAIR_VALUE', 'CASH_FLOW', 'NET_INVESTMENT');--> statement-breakpoint
CREATE TYPE "public"."ic_leg_side" AS ENUM('SELLER', 'BUYER');--> statement-breakpoint
CREATE TYPE "public"."ic_loan_status" AS ENUM('ACTIVE', 'REPAID', 'WRITTEN_OFF');--> statement-breakpoint
CREATE TYPE "public"."ic_pricing" AS ENUM('COST', 'MARKET', 'TRANSFER_PRICE', 'AGREED');--> statement-breakpoint
CREATE TYPE "public"."ic_settlement_status" AS ENUM('PENDING', 'SETTLED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."instrument_classification" AS ENUM('AMORTIZED_COST', 'FVOCI', 'FVTPL');--> statement-breakpoint
CREATE TYPE "public"."instrument_type" AS ENUM('DEBT_HELD', 'DEBT_ISSUED', 'EQUITY_INVESTMENT', 'DERIVATIVE', 'LOAN_RECEIVABLE', 'TRADE_RECEIVABLE');--> statement-breakpoint
CREATE TYPE "public"."intangible_asset_status" AS ENUM('ACTIVE', 'DISPOSED', 'FULLY_AMORTIZED', 'IMPAIRED', 'IN_DEVELOPMENT');--> statement-breakpoint
CREATE TYPE "public"."intangible_category" AS ENUM('SOFTWARE', 'PATENT', 'TRADEMARK', 'COPYRIGHT', 'LICENCE', 'CUSTOMER_RELATIONSHIP', 'GOODWILL_RELATED', 'DEVELOPMENT_COST', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."integrity_status" AS ENUM('PENDING', 'VERIFIED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."journal_status" AS ENUM('DRAFT', 'PENDING_APPROVAL', 'POSTED', 'REVERSED', 'VOIDED');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction_level" AS ENUM('COUNTRY', 'STATE', 'CITY', 'SPECIAL');--> statement-breakpoint
CREATE TYPE "public"."lease_modification_type" AS ENUM('TERM_EXTENSION', 'TERM_REDUCTION', 'PAYMENT_CHANGE', 'SCOPE_CHANGE', 'RATE_CHANGE');--> statement-breakpoint
CREATE TYPE "public"."lease_status" AS ENUM('DRAFT', 'ACTIVE', 'MODIFIED', 'TERMINATED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."lease_type" AS ENUM('FINANCE', 'OPERATING');--> statement-breakpoint
CREATE TYPE "public"."lessee_or_lessor" AS ENUM('LESSEE', 'LESSOR');--> statement-breakpoint
CREATE TYPE "public"."linked_entity_type" AS ENUM('JOURNAL', 'AP_INVOICE', 'AR_INVOICE', 'FIXED_ASSET', 'LEASE_CONTRACT', 'EXPENSE_CLAIM', 'BANK_RECONCILIATION', 'TAX_RETURN', 'PROVISION', 'IC_TRANSACTION', 'SUPPLIER', 'SUPPLIER_CONTRACT', 'SUPPLIER_STATEMENT');--> statement-breakpoint
CREATE TYPE "public"."mapping_rule_status" AS ENUM('DRAFT', 'PUBLISHED', 'DEPRECATED');--> statement-breakpoint
CREATE TYPE "public"."ocr_confidence_level" AS ENUM('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "public"."ocr_failure_reason" AS ENUM('PROVIDER_TIMEOUT', 'PROVIDER_REJECTED', 'UNSUPPORTED_MIME', 'PARSE_ERROR', 'INTERNAL_ERROR');--> statement-breakpoint
CREATE TYPE "public"."ocr_job_status" AS ENUM('CLAIMED', 'UPLOADED', 'EXTRACTING', 'SCORED', 'INVOICE_CREATING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('BANK_TRANSFER', 'CHECK', 'WIRE', 'SEPA', 'LOCAL_TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."payment_run_status" AS ENUM('DRAFT', 'APPROVED', 'EXECUTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."period_status" AS ENUM('OPEN', 'CLOSED', 'LOCKED');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."provision_movement_type" AS ENUM('INITIAL_RECOGNITION', 'UNWINDING_DISCOUNT', 'UTILISATION', 'REVERSAL', 'REMEASUREMENT');--> statement-breakpoint
CREATE TYPE "public"."provision_status" AS ENUM('ACTIVE', 'PARTIALLY_UTILISED', 'FULLY_UTILISED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."provision_type" AS ENUM('WARRANTY', 'RESTRUCTURING', 'ONEROUS_CONTRACT', 'DECOMMISSIONING', 'LEGAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."recognition_method" AS ENUM('STRAIGHT_LINE', 'MILESTONE', 'PERCENTAGE_OF_COMPLETION');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status" AS ENUM('IN_PROGRESS', 'COMPLETED', 'SIGNED_OFF');--> statement-breakpoint
CREATE TYPE "public"."recurring_frequency" AS ENUM('MONTHLY', 'QUARTERLY', 'YEARLY');--> statement-breakpoint
CREATE TYPE "public"."reporting_standard" AS ENUM('IFRS', 'US_GAAP', 'LOCAL');--> statement-breakpoint
CREATE TYPE "public"."review_outcome" AS ENUM('APPROVED', 'REDUCED', 'SUSPENDED', 'UNCHANGED');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('NOT_SCANNED', 'CLEAN', 'SUSPECT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."settlement_method" AS ENUM('NETTING', 'CASH', 'JOURNAL');--> statement-breakpoint
CREATE TYPE "public"."settlement_status" AS ENUM('DRAFT', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."statement_format" AS ENUM('OFX', 'MT940', 'CAMT053', 'CSV', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."supplier_account_group" AS ENUM('TRADE', 'INTERCOMPANY', 'ONE_TIME', 'EMPLOYEE', 'GOVERNMENT', 'SUBCONTRACTOR');--> statement-breakpoint
CREATE TYPE "public"."supplier_block_action" AS ENUM('BLOCKED', 'UNBLOCKED');--> statement-breakpoint
CREATE TYPE "public"."supplier_block_scope" AS ENUM('ALL_COMPANIES', 'SPECIFIC_COMPANY', 'SPECIFIC_SITE');--> statement-breakpoint
CREATE TYPE "public"."supplier_block_type" AS ENUM('PURCHASING_BLOCK', 'POSTING_BLOCK', 'PAYMENT_BLOCK', 'FULL_BLOCK');--> statement-breakpoint
CREATE TYPE "public"."supplier_category" AS ENUM('GOODS', 'SERVICES', 'SUBCONTRACTOR', 'ONE_TIME', 'INTERCOMPANY', 'GOVERNMENT', 'EMPLOYEE');--> statement-breakpoint
CREATE TYPE "public"."supplier_contact_role" AS ENUM('AP_CONTACT', 'SALES_REP', 'COMPLIANCE_OFFICER', 'LOGISTICS', 'EXECUTIVE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."supplier_diversity_code" AS ENUM('SMALL_BUSINESS', 'MINORITY_OWNED', 'WOMEN_OWNED', 'VETERAN_OWNED', 'DISABLED_OWNED', 'INDIGENOUS_OWNED', 'LARGE_ENTERPRISE', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."supplier_document_category" AS ENUM('CONTRACT', 'TAX_NOTICE', 'INSURANCE_POLICY', 'CORRESPONDENCE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."supplier_duplicate_match_type" AS ENUM('NAME_MATCH', 'TAX_ID_MATCH', 'REG_NO_MATCH', 'COMBINED');--> statement-breakpoint
CREATE TYPE "public"."supplier_duplicate_status" AS ENUM('OPEN', 'CONFIRMED_DUPLICATE', 'DISMISSED', 'MERGED');--> statement-breakpoint
CREATE TYPE "public"."supplier_eval_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED');--> statement-breakpoint
CREATE TYPE "public"."supplier_legal_doc_status" AS ENUM('PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."supplier_legal_doc_type" AS ENUM('REGISTRATION_CERTIFICATE', 'TAX_REGISTRATION', 'ARTICLES_OF_INCORPORATION', 'POWER_OF_ATTORNEY', 'BANK_CONFIRMATION_LETTER', 'INSURANCE_CERTIFICATE', 'TRADE_LICENSE', 'GOOD_STANDING_CERTIFICATE', 'BENEFICIAL_OWNERSHIP', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."supplier_onboarding_status" AS ENUM('PROSPECT', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."supplier_risk_category" AS ENUM('FINANCIAL', 'QUALITY', 'COMPLIANCE', 'FRAUD', 'DELIVERY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."supplier_risk_rating" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."supplier_status" AS ENUM('ACTIVE', 'ON_HOLD', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."supplier_tax_type" AS ENUM('VAT', 'GST', 'SST', 'TIN', 'CIT', 'WHT', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."tax_rate_type" AS ENUM('VAT', 'GST', 'SALES_TAX', 'WHT', 'EXCISE', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."tax_return_status" AS ENUM('DRAFT', 'CALCULATED', 'FILED', 'AMENDED');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('ACTIVE', 'SUSPENDED', 'DEACTIVATED');--> statement-breakpoint
CREATE TYPE "public"."tolerance_scope" AS ENUM('ORG', 'COMPANY', 'SITE');--> statement-breakpoint
CREATE TYPE "public"."tp_method" AS ENUM('CUP', 'RESALE_PRICE', 'COST_PLUS', 'TNMM', 'PROFIT_SPLIT');--> statement-breakpoint
CREATE TYPE "public"."useful_life_type" AS ENUM('FINITE', 'INDEFINITE');--> statement-breakpoint
CREATE TYPE "public"."wht_certificate_status" AS ENUM('DRAFT', 'ISSUED', 'CANCELLED', 'EXEMPT', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."wht_income_type" AS ENUM('ROYALTIES', 'INTEREST', 'DIVIDENDS', 'TECHNICAL_FEES', 'MANAGEMENT_FEES', 'CONTRACT_PAYMENTS', 'RENTAL_INCOME', 'COMMISSION', 'OTHER');--> statement-breakpoint
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
ALTER TABLE "audit"."audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."approval_policy" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid,
	"entity_type" text NOT NULL,
	"name" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."approval_policy" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."approval_request" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"policy_id" uuid,
	"policy_version" integer,
	"requested_by" text NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"current_step_index" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "erp"."approval_request" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."approval_step" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"request_id" uuid NOT NULL,
	"step_index" integer NOT NULL,
	"approver_id" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"decided_at" timestamp with time zone,
	"reason" text,
	"tenant_id" uuid NOT NULL,
	"delegated_to" text
);
--> statement-breakpoint
ALTER TABLE "erp"."approval_step" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."document_attachment" (
	"document_id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"key_version" smallint DEFAULT 1 NOT NULL,
	"bucket" text NOT NULL,
	"storage_key" text NOT NULL,
	"provider" text DEFAULT 'R2' NOT NULL,
	"file_name" text NOT NULL,
	"file_name_original" text,
	"declared_size" integer,
	"declared_mime" text,
	"observed_size" integer,
	"observed_mime" text,
	"checksum_sha256" text,
	"status" "document_status" DEFAULT 'PENDING_UPLOAD' NOT NULL,
	"integrity_status" "integrity_status" DEFAULT 'PENDING' NOT NULL,
	"scan_status" "scan_status" DEFAULT 'NOT_SCANNED' NOT NULL,
	"category" "document_category",
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"storage_deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "erp"."document_attachment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."document_link" (
	"document_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" "linked_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"linked_by" uuid NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"linked_company_id" uuid
);
--> statement-breakpoint
ALTER TABLE "erp"."document_link" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."sod_action_log" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."sod_action_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."accounting_event" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"source_document_type" varchar(50) NOT NULL,
	"source_document_id" uuid NOT NULL,
	"event_date" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "accounting_event_status" DEFAULT 'PENDING' NOT NULL,
	"processed_at" timestamp with time zone,
	"error_message" text,
	"journal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."accounting_event" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ap_hold" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"hold_type" "ap_hold_type" NOT NULL,
	"hold_reason" text NOT NULL,
	"hold_date" timestamp with time zone DEFAULT now() NOT NULL,
	"release_date" timestamp with time zone,
	"released_by" uuid,
	"release_reason" text,
	"status" "ap_hold_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."ap_hold" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ap_invoice_line" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"line_number" smallint NOT NULL,
	"account_id" uuid NOT NULL,
	"description" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" bigint NOT NULL,
	"amount" bigint NOT NULL,
	"tax_amount" bigint DEFAULT 0 NOT NULL,
	"wht_income_type" "wht_income_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ap_line_amounts_nonneg" CHECK ("erp"."ap_invoice_line"."unit_price" >= 0 AND "erp"."ap_invoice_line"."amount" >= 0 AND "erp"."ap_invoice_line"."tax_amount" >= 0),
	CONSTRAINT "chk_ap_line_qty_positive" CHECK ("erp"."ap_invoice_line"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice_line" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ap_invoice" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"ledger_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"supplier_ref" varchar(100),
	"invoice_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"currency_id" uuid NOT NULL,
	"total_amount" bigint NOT NULL,
	"paid_amount" bigint DEFAULT 0 NOT NULL,
	"status" "ap_invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"description" text,
	"po_ref" varchar(50),
	"receipt_ref" varchar(50),
	"payment_terms_id" uuid,
	"journal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ap_inv_amounts_nonneg" CHECK ("erp"."ap_invoice"."total_amount" >= 0 AND "erp"."ap_invoice"."paid_amount" >= 0),
	CONSTRAINT "chk_ap_paid_lte_total" CHECK ("erp"."ap_invoice"."paid_amount" <= "erp"."ap_invoice"."total_amount")
);
--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ap_payment_run_item" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_run_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"discount_amount" bigint DEFAULT 0 NOT NULL,
	"net_amount" bigint NOT NULL,
	"journal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ap_payitem_amounts_nonneg" CHECK ("erp"."ap_payment_run_item"."amount" >= 0 AND "erp"."ap_payment_run_item"."discount_amount" >= 0 AND "erp"."ap_payment_run_item"."net_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."ap_payment_run_item" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ap_payment_run" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"run_number" varchar(30) NOT NULL,
	"run_date" timestamp with time zone NOT NULL,
	"cutoff_date" timestamp with time zone NOT NULL,
	"currency_id" uuid NOT NULL,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"status" "payment_run_status" DEFAULT 'DRAFT' NOT NULL,
	"executed_at" timestamp with time zone,
	"executed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ap_payrun_total_nonneg" CHECK ("erp"."ap_payment_run"."total_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."ap_payment_run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ap_prepayment_application" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"prepayment_id" uuid NOT NULL,
	"target_invoice_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"applied_by" uuid NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_prepay_app_amt_nonneg" CHECK ("erp"."ap_prepayment_application"."amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."ap_prepayment_application" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ap_prepayment" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"total_amount" bigint NOT NULL,
	"applied_amount" bigint DEFAULT 0 NOT NULL,
	"unapplied_balance" bigint NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"status" "ap_prepayment_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_prepay_amounts_nonneg" CHECK ("erp"."ap_prepayment"."total_amount" >= 0 AND "erp"."ap_prepayment"."applied_amount" >= 0 AND "erp"."ap_prepayment"."unapplied_balance" >= 0),
	CONSTRAINT "chk_prepay_applied_lte_total" CHECK ("erp"."ap_prepayment"."applied_amount" <= "erp"."ap_prepayment"."total_amount")
);
--> statement-breakpoint
ALTER TABLE "erp"."ap_prepayment" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ar_allocation_item" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_allocation_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"allocated_amount" bigint NOT NULL,
	"journal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ar_alloc_amt_nonneg" CHECK ("erp"."ar_allocation_item"."allocated_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."ar_allocation_item" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ar_invoice_line" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"line_number" smallint NOT NULL,
	"account_id" uuid NOT NULL,
	"description" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" bigint NOT NULL,
	"amount" bigint NOT NULL,
	"tax_amount" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ar_line_amounts_nonneg" CHECK ("erp"."ar_invoice_line"."unit_price" >= 0 AND "erp"."ar_invoice_line"."amount" >= 0 AND "erp"."ar_invoice_line"."tax_amount" >= 0),
	CONSTRAINT "chk_ar_line_qty_positive" CHECK ("erp"."ar_invoice_line"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."ar_invoice_line" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ar_invoice" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"ledger_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"customer_ref" varchar(100),
	"invoice_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"total_amount" bigint DEFAULT 0 NOT NULL,
	"paid_amount" bigint DEFAULT 0 NOT NULL,
	"status" "ar_invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"description" text,
	"payment_terms_id" uuid,
	"journal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ar_inv_amounts_nonneg" CHECK ("erp"."ar_invoice"."total_amount" >= 0 AND "erp"."ar_invoice"."paid_amount" >= 0),
	CONSTRAINT "chk_ar_paid_lte_total" CHECK ("erp"."ar_invoice"."paid_amount" <= "erp"."ar_invoice"."total_amount")
);
--> statement-breakpoint
ALTER TABLE "erp"."ar_invoice" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ar_payment_allocation" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"payment_ref" varchar(100) NOT NULL,
	"total_amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ar_pmt_total_nonneg" CHECK ("erp"."ar_payment_allocation"."total_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."ar_payment_allocation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."asset_component" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"component_name" varchar(200) NOT NULL,
	"acquisition_cost" bigint NOT NULL,
	"residual_value" bigint DEFAULT 0 NOT NULL,
	"useful_life_months" smallint NOT NULL,
	"depreciation_method" "depreciation_method" NOT NULL,
	"accumulated_depreciation" bigint DEFAULT 0 NOT NULL,
	"net_book_value" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_asset_comp_amounts_nonneg" CHECK ("erp"."asset_component"."acquisition_cost" >= 0 AND "erp"."asset_component"."residual_value" >= 0 AND "erp"."asset_component"."accumulated_depreciation" >= 0 AND "erp"."asset_component"."net_book_value" >= 0),
	CONSTRAINT "chk_asset_comp_life_positive" CHECK ("erp"."asset_component"."useful_life_months" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."asset_component" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."asset_movement" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"movement_type" "asset_movement_type" NOT NULL,
	"movement_date" timestamp with time zone NOT NULL,
	"amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"description" text,
	"from_company_id" uuid,
	"to_company_id" uuid,
	"journal_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_asset_mvmt_amt_nonneg" CHECK ("erp"."asset_movement"."amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."asset_movement" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."asset" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"asset_number" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_code" varchar(20) NOT NULL,
	"acquisition_date" timestamp with time zone NOT NULL,
	"acquisition_cost" bigint NOT NULL,
	"residual_value" bigint NOT NULL,
	"useful_life_months" smallint NOT NULL,
	"depreciation_method" "depreciation_method" NOT NULL,
	"accumulated_depreciation" bigint DEFAULT 0 NOT NULL,
	"net_book_value" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"location_code" varchar(20),
	"cost_center_id" uuid,
	"gl_account_id" uuid NOT NULL,
	"depreciation_account_id" uuid NOT NULL,
	"accumulated_depreciation_account_id" uuid NOT NULL,
	"status" "asset_status" DEFAULT 'ACTIVE' NOT NULL,
	"disposed_at" timestamp with time zone,
	"disposal_proceeds" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_asset_amounts_nonneg" CHECK ("erp"."asset"."acquisition_cost" >= 0 AND "erp"."asset"."residual_value" >= 0 AND "erp"."asset"."accumulated_depreciation" >= 0 AND "erp"."asset"."net_book_value" >= 0),
	CONSTRAINT "chk_asset_useful_life_positive" CHECK ("erp"."asset"."useful_life_months" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."asset" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."bank_match" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"statement_line_id" uuid NOT NULL,
	"journal_id" uuid,
	"source_document_id" uuid,
	"source_document_type" varchar(30),
	"match_type" "bank_match_type" NOT NULL,
	"confidence" "bank_match_confidence" NOT NULL,
	"confidence_score" smallint NOT NULL,
	"matched_amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"matched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"matched_by" uuid,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_bank_match_amt_nonneg" CHECK ("erp"."bank_match"."matched_amount" >= 0),
	CONSTRAINT "chk_bank_match_confidence" CHECK ("erp"."bank_match"."confidence_score" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "erp"."bank_match" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."bank_reconciliation" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"statement_balance" bigint NOT NULL,
	"gl_balance" bigint NOT NULL,
	"adjusted_statement_balance" bigint NOT NULL,
	"adjusted_gl_balance" bigint NOT NULL,
	"outstanding_checks" bigint DEFAULT 0 NOT NULL,
	"deposits_in_transit" bigint DEFAULT 0 NOT NULL,
	"difference" bigint DEFAULT 0 NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "reconciliation_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"matched_count" smallint DEFAULT 0 NOT NULL,
	"unmatched_count" smallint DEFAULT 0 NOT NULL,
	"signed_off_at" timestamp with time zone,
	"signed_off_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_bank_recon_amounts_nonneg" CHECK ("erp"."bank_reconciliation"."outstanding_checks" >= 0 AND "erp"."bank_reconciliation"."deposits_in_transit" >= 0),
	CONSTRAINT "chk_bank_recon_counts_nonneg" CHECK ("erp"."bank_reconciliation"."matched_count" >= 0 AND "erp"."bank_reconciliation"."unmatched_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."bank_reconciliation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."bank_statement_line" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"statement_id" uuid NOT NULL,
	"line_number" smallint NOT NULL,
	"transaction_date" timestamp with time zone NOT NULL,
	"value_date" timestamp with time zone,
	"transaction_type" varchar(10) NOT NULL,
	"amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"reference" varchar(100),
	"description" text NOT NULL,
	"payee_or_payer" text,
	"bank_reference" varchar(100),
	"match_status" "bank_line_match_status" DEFAULT 'UNMATCHED' NOT NULL,
	"match_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."bank_statement_line" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."bank_statement" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"bank_account_name" text NOT NULL,
	"statement_date" timestamp with time zone NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"opening_balance" bigint NOT NULL,
	"closing_balance" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"format" "statement_format" NOT NULL,
	"line_count" smallint DEFAULT 0 NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"imported_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_bank_stmt_linecount_nonneg" CHECK ("erp"."bank_statement"."line_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."bank_statement" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_budget_amount_nonneg" CHECK ("erp"."budget_entry"."budget_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."budget_entry" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."cash_forecast" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"forecast_date" timestamp with time zone NOT NULL,
	"forecast_type" "forecast_type" NOT NULL,
	"description" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"probability" integer DEFAULT 100 NOT NULL,
	"source_document_id" uuid,
	"source_document_type" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_cash_forecast_probability" CHECK ("erp"."cash_forecast"."probability" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "erp"."cash_forecast" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."classification_rule_set" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."classification_rule" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."cost_allocation_line" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"from_cost_center_id" uuid NOT NULL,
	"to_cost_center_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"driver_quantity" bigint NOT NULL,
	"allocation_rate" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_cost_alloc_line_nonneg" CHECK ("erp"."cost_allocation_line"."amount" >= 0 AND "erp"."cost_allocation_line"."driver_quantity" >= 0 AND "erp"."cost_allocation_line"."allocation_rate" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."cost_allocation_line" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."cost_allocation_run" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"method" "allocation_method" NOT NULL,
	"status" "allocation_run_status" DEFAULT 'DRAFT' NOT NULL,
	"total_allocated" bigint DEFAULT 0 NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"line_count" integer DEFAULT 0 NOT NULL,
	"executed_by" uuid NOT NULL,
	"executed_at" timestamp with time zone,
	"reversed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_cost_alloc_run_nonneg" CHECK ("erp"."cost_allocation_run"."total_allocated" >= 0 AND "erp"."cost_allocation_run"."line_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."cost_allocation_run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."cost_center" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(200) NOT NULL,
	"parent_id" uuid,
	"level" smallint DEFAULT 0 NOT NULL,
	"status" "cost_center_status" DEFAULT 'ACTIVE' NOT NULL,
	"manager_id" uuid,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_cost_center_level_nonneg" CHECK ("erp"."cost_center"."level" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."cost_center" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."cost_driver_value" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"cost_center_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"quantity" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_cost_driver_qty_nonneg" CHECK ("erp"."cost_driver_value"."quantity" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."cost_driver_value" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."cost_driver" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(200) NOT NULL,
	"driver_type" "driver_type" NOT NULL,
	"unit_of_measure" varchar(30) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."cost_driver" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."counterparty" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."covenant" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"lender_id" uuid NOT NULL,
	"lender_name" varchar(200) NOT NULL,
	"covenant_type" "covenant_type" NOT NULL,
	"description" text NOT NULL,
	"threshold_value" integer NOT NULL,
	"current_value" integer,
	"status" "covenant_status" DEFAULT 'COMPLIANT' NOT NULL,
	"test_frequency" varchar(20) DEFAULT 'QUARTERLY' NOT NULL,
	"last_test_date" timestamp with time zone,
	"next_test_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."covenant" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."credit_limit" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"credit_limit" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"current_exposure" bigint DEFAULT 0 NOT NULL,
	"available_credit" bigint DEFAULT 0 NOT NULL,
	"status" "credit_status" DEFAULT 'ACTIVE' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"last_review_date" timestamp with time zone,
	"next_review_date" timestamp with time zone,
	"risk_rating" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_credit_amounts_nonneg" CHECK ("erp"."credit_limit"."credit_limit" >= 0 AND "erp"."credit_limit"."current_exposure" >= 0 AND "erp"."credit_limit"."available_credit" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."credit_limit" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."credit_review" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"credit_limit_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"review_date" timestamp with time zone NOT NULL,
	"previous_limit" bigint NOT NULL,
	"proposed_limit" bigint NOT NULL,
	"approved_limit" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"outcome" "review_outcome" NOT NULL,
	"risk_rating" varchar(10),
	"notes" text,
	"reviewed_by" uuid NOT NULL,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_credit_review_amounts_nonneg" CHECK ("erp"."credit_review"."previous_limit" >= 0 AND "erp"."credit_review"."proposed_limit" >= 0 AND "erp"."credit_review"."approved_limit" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."credit_review" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."currency" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."deferred_tax_item" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"item_name" varchar(200) NOT NULL,
	"origin" varchar(50) NOT NULL,
	"carrying_amount" bigint NOT NULL,
	"tax_base" bigint NOT NULL,
	"temporary_difference" bigint NOT NULL,
	"tax_rate_bps" integer NOT NULL,
	"deferred_tax_asset" bigint DEFAULT 0 NOT NULL,
	"deferred_tax_liability" bigint DEFAULT 0 NOT NULL,
	"is_recognized" boolean DEFAULT true NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"period_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_deferred_tax_nonneg" CHECK ("erp"."deferred_tax_item"."deferred_tax_asset" >= 0 AND "erp"."deferred_tax_item"."deferred_tax_liability" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."deferred_tax_item" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."depreciation_schedule" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"component_id" uuid,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"depreciation_amount" bigint NOT NULL,
	"accumulated_depreciation" bigint NOT NULL,
	"net_book_value" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"journal_id" uuid,
	"is_posted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_depr_amounts_nonneg" CHECK ("erp"."depreciation_schedule"."depreciation_amount" >= 0 AND "erp"."depreciation_schedule"."accumulated_depreciation" >= 0 AND "erp"."depreciation_schedule"."net_book_value" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."depreciation_schedule" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."dunning_letter" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"dunning_run_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"level" smallint NOT NULL,
	"invoice_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_overdue" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_dunning_overdue_nonneg" CHECK ("erp"."dunning_letter"."total_overdue" >= 0),
	CONSTRAINT "chk_dunning_level_positive" CHECK ("erp"."dunning_letter"."level" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."dunning_letter" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."dunning_run" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"run_date" timestamp with time zone NOT NULL,
	"status" "dunning_run_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."dunning_run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."expense_claim_line" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"line_number" smallint NOT NULL,
	"expense_date" timestamp with time zone NOT NULL,
	"category" "expense_category" NOT NULL,
	"description" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"base_currency_amount" bigint NOT NULL,
	"receipt_ref" varchar(200),
	"gl_account_id" uuid NOT NULL,
	"cost_center_id" uuid,
	"project_id" uuid,
	"is_billable" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_expense_line_amounts_nonneg" CHECK ("erp"."expense_claim_line"."amount" >= 0 AND "erp"."expense_claim_line"."base_currency_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."expense_claim_line" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."expense_claim" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"claim_number" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"claim_date" timestamp with time zone NOT NULL,
	"total_amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"base_currency_amount" bigint NOT NULL,
	"status" "expense_claim_status" DEFAULT 'DRAFT' NOT NULL,
	"submitted_at" timestamp with time zone,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"reimbursed_at" timestamp with time zone,
	"ap_invoice_id" uuid,
	"line_count" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_expense_claim_amounts_nonneg" CHECK ("erp"."expense_claim"."total_amount" >= 0 AND "erp"."expense_claim"."base_currency_amount" >= 0),
	CONSTRAINT "chk_expense_claim_linecount_nonneg" CHECK ("erp"."expense_claim"."line_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."expense_claim" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."expense_policy" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" varchar(30) NOT NULL,
	"max_amount_per_item" bigint NOT NULL,
	"max_amount_per_claim" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"requires_receipt" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT true NOT NULL,
	"per_diem_rate" bigint,
	"mileage_rate_bps" smallint,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_expense_policy_amounts_nonneg" CHECK ("erp"."expense_policy"."max_amount_per_item" >= 0 AND "erp"."expense_policy"."max_amount_per_claim" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."expense_policy" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."fair_value_measurement" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"instrument_id" uuid NOT NULL,
	"measurement_date" timestamp with time zone NOT NULL,
	"fair_value_level" "fair_value_level" NOT NULL,
	"fair_value" bigint NOT NULL,
	"previous_fair_value" bigint,
	"valuation_method" varchar(100),
	"currency_code" varchar(3) NOT NULL,
	"gain_or_loss" bigint,
	"is_recognized_in_pl" boolean DEFAULT true NOT NULL,
	"journal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_fair_value_nonneg" CHECK ("erp"."fair_value_measurement"."fair_value" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."fair_value_measurement" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."financial_instrument" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"instrument_type" "instrument_type" NOT NULL,
	"classification" "instrument_classification" NOT NULL,
	"fair_value_level" "fair_value_level",
	"nominal_amount" bigint NOT NULL,
	"carrying_amount" bigint NOT NULL,
	"fair_value" bigint,
	"effective_interest_rate_bps" integer NOT NULL,
	"contractual_rate_bps" integer NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"maturity_date" timestamp with time zone,
	"counterparty_id" uuid NOT NULL,
	"gl_account_id" uuid NOT NULL,
	"is_derecognized" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_fin_instr_amounts_nonneg" CHECK ("erp"."financial_instrument"."nominal_amount" >= 0 AND "erp"."financial_instrument"."carrying_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."financial_instrument" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_fiscal_period_number_positive" CHECK ("erp"."fiscal_period"."period_number" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."fiscal_period" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."fiscal_year" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."fx_rate" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	CONSTRAINT "gl_balance_tenant_id_ledger_id_account_id_fiscal_year_fiscal_period_pk" PRIMARY KEY("tenant_id","ledger_id","account_id","fiscal_year","fiscal_period"),
	CONSTRAINT "chk_gl_bal_amounts_nonneg" CHECK ("erp"."gl_balance"."debit_balance" >= 0 AND "erp"."gl_balance"."credit_balance" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."gl_balance" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	CONSTRAINT "chk_journal_line_debit_credit" CHECK (("erp"."gl_journal_line"."debit" = 0) <> ("erp"."gl_journal_line"."credit" = 0)),
	CONSTRAINT "chk_gl_line_amounts_nonneg" CHECK ("erp"."gl_journal_line"."debit" >= 0 AND "erp"."gl_journal_line"."credit" >= 0 AND "erp"."gl_journal_line"."base_currency_debit" >= 0 AND "erp"."gl_journal_line"."base_currency_credit" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."gl_journal_line" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."gl_journal" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."goodwill" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ownership_record_id" uuid NOT NULL,
	"child_entity_id" uuid NOT NULL,
	"acquisition_date" timestamp with time zone NOT NULL,
	"consideration_paid" bigint NOT NULL,
	"fair_value_net_assets" bigint NOT NULL,
	"nci_at_acquisition" bigint NOT NULL,
	"goodwill_amount" bigint NOT NULL,
	"accumulated_impairment" bigint DEFAULT 0 NOT NULL,
	"carrying_amount" bigint NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"status" "goodwill_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_goodwill_amounts_nonneg" CHECK ("erp"."goodwill"."consideration_paid" >= 0 AND "erp"."goodwill"."fair_value_net_assets" >= 0 AND "erp"."goodwill"."nci_at_acquisition" >= 0 AND "erp"."goodwill"."goodwill_amount" >= 0 AND "erp"."goodwill"."accumulated_impairment" >= 0 AND "erp"."goodwill"."carrying_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."goodwill" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."group_entity" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"entity_type" "group_entity_type" NOT NULL,
	"parent_entity_id" uuid,
	"base_currency" varchar(3) NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."group_entity" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."hedge_effectiveness_test" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"hedge_relationship_id" uuid NOT NULL,
	"test_date" timestamp with time zone NOT NULL,
	"test_method" "hedge_test_method" NOT NULL,
	"result" "hedge_test_result" NOT NULL,
	"effectiveness_ratio_bps" integer NOT NULL,
	"hedged_item_fv_change" bigint NOT NULL,
	"hedging_instrument_fv_change" bigint NOT NULL,
	"ineffective_portion_amount" bigint DEFAULT 0 NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"notes" text,
	"journal_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."hedge_effectiveness_test" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."hedge_relationship" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"hedge_type" "hedge_type" NOT NULL,
	"hedging_instrument_id" uuid NOT NULL,
	"hedged_item_id" uuid NOT NULL,
	"hedged_risk" varchar(100) NOT NULL,
	"hedge_ratio" integer DEFAULT 10000 NOT NULL,
	"designation_date" timestamp with time zone NOT NULL,
	"status" "hedge_status" DEFAULT 'DESIGNATED' NOT NULL,
	"discontinuation_date" timestamp with time zone,
	"discontinuation_reason" text,
	"oci_reserve_balance" bigint DEFAULT 0 NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_hedge_ratio_nonneg" CHECK ("erp"."hedge_relationship"."hedge_ratio" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."hedge_relationship" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."ic_agreement" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ic_loan" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lender_company_id" uuid NOT NULL,
	"borrower_company_id" uuid NOT NULL,
	"loan_number" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"principal_amount" bigint NOT NULL,
	"outstanding_balance" bigint NOT NULL,
	"interest_rate_bps" integer NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"maturity_date" timestamp with time zone NOT NULL,
	"status" "ic_loan_status" DEFAULT 'ACTIVE' NOT NULL,
	"ic_agreement_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ic_loan_amounts_nonneg" CHECK ("erp"."ic_loan"."principal_amount" >= 0 AND "erp"."ic_loan"."outstanding_balance" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."ic_loan" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ic_settlement_line" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"settlement_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ic_settle_line_amt_nonneg" CHECK ("erp"."ic_settlement_line"."amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."ic_settlement_line" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ic_settle_total_nonneg" CHECK ("erp"."ic_settlement"."total_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."ic_settlement" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."ic_transaction_leg" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ic_txn_amount_nonneg" CHECK ("erp"."ic_transaction"."amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."ic_transaction" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."intangible_asset" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"asset_number" varchar(30) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"category" "intangible_category" NOT NULL,
	"useful_life_type" "useful_life_type" NOT NULL,
	"acquisition_date" timestamp with time zone NOT NULL,
	"acquisition_cost" bigint NOT NULL,
	"residual_value" bigint DEFAULT 0 NOT NULL,
	"useful_life_months" integer,
	"accumulated_amortization" bigint DEFAULT 0 NOT NULL,
	"net_book_value" bigint NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"gl_account_id" uuid NOT NULL,
	"amortization_account_id" uuid NOT NULL,
	"accumulated_amortization_account_id" uuid NOT NULL,
	"status" "intangible_asset_status" DEFAULT 'ACTIVE' NOT NULL,
	"is_internally_generated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_intangible_amounts_nonneg" CHECK ("erp"."intangible_asset"."acquisition_cost" >= 0 AND "erp"."intangible_asset"."residual_value" >= 0 AND "erp"."intangible_asset"."accumulated_amortization" >= 0 AND "erp"."intangible_asset"."net_book_value" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."intangible_asset" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."lease_contract" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"lease_number" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"lessee_or_lessor" "lessee_or_lessor" DEFAULT 'LESSEE' NOT NULL,
	"lease_type" "lease_type" DEFAULT 'OPERATING' NOT NULL,
	"status" "lease_status" DEFAULT 'DRAFT' NOT NULL,
	"counterparty_id" uuid NOT NULL,
	"counterparty_name" varchar(200) NOT NULL,
	"asset_description" text NOT NULL,
	"commencement_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"lease_term_months" integer NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"monthly_payment" bigint NOT NULL,
	"annual_escalation_bps" integer DEFAULT 0 NOT NULL,
	"discount_rate_bps" integer NOT NULL,
	"rou_asset_amount" bigint DEFAULT 0 NOT NULL,
	"lease_liability_amount" bigint DEFAULT 0 NOT NULL,
	"is_short_term" boolean DEFAULT false NOT NULL,
	"is_low_value" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_lease_amounts_nonneg" CHECK ("erp"."lease_contract"."monthly_payment" >= 0 AND "erp"."lease_contract"."rou_asset_amount" >= 0 AND "erp"."lease_contract"."lease_liability_amount" >= 0),
	CONSTRAINT "chk_lease_term_positive" CHECK ("erp"."lease_contract"."lease_term_months" > 0),
	CONSTRAINT "chk_lease_discount_positive" CHECK ("erp"."lease_contract"."discount_rate_bps" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."lease_contract" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."lease_modification" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lease_contract_id" uuid NOT NULL,
	"modification_date" timestamp with time zone NOT NULL,
	"modification_type" "lease_modification_type" NOT NULL,
	"description" text NOT NULL,
	"previous_lease_term_months" integer NOT NULL,
	"new_lease_term_months" integer NOT NULL,
	"previous_monthly_payment" bigint NOT NULL,
	"new_monthly_payment" bigint NOT NULL,
	"previous_discount_rate_bps" integer NOT NULL,
	"new_discount_rate_bps" integer NOT NULL,
	"liability_adjustment" bigint NOT NULL,
	"rou_asset_adjustment" bigint NOT NULL,
	"gain_loss_on_modification" bigint DEFAULT 0 NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"modified_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_lease_mod_amounts_nonneg" CHECK ("erp"."lease_modification"."previous_monthly_payment" >= 0 AND "erp"."lease_modification"."new_monthly_payment" >= 0),
	CONSTRAINT "chk_lease_mod_terms_positive" CHECK ("erp"."lease_modification"."previous_lease_term_months" > 0 AND "erp"."lease_modification"."new_lease_term_months" > 0 AND "erp"."lease_modification"."previous_discount_rate_bps" > 0 AND "erp"."lease_modification"."new_discount_rate_bps" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."lease_modification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."lease_schedule" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"lease_contract_id" uuid NOT NULL,
	"period_number" integer NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"payment_amount" bigint NOT NULL,
	"principal_portion" bigint NOT NULL,
	"interest_portion" bigint NOT NULL,
	"opening_liability" bigint NOT NULL,
	"closing_liability" bigint NOT NULL,
	"rou_depreciation" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_lease_sched_amounts_nonneg" CHECK ("erp"."lease_schedule"."payment_amount" >= 0 AND "erp"."lease_schedule"."principal_portion" >= 0 AND "erp"."lease_schedule"."interest_portion" >= 0 AND "erp"."lease_schedule"."opening_liability" >= 0 AND "erp"."lease_schedule"."closing_liability" >= 0 AND "erp"."lease_schedule"."rou_depreciation" >= 0),
	CONSTRAINT "chk_lease_sched_period_positive" CHECK ("erp"."lease_schedule"."period_number" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."lease_schedule" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."ledger" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."mapping_rule_version" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	"version_number" smallint NOT NULL,
	"status" "mapping_rule_status" DEFAULT 'DRAFT' NOT NULL,
	"journal_template" jsonb NOT NULL,
	"condition_expression" text,
	"published_at" timestamp with time zone,
	"published_by" uuid,
	"deprecated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."mapping_rule_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."mapping_rule" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"rule_name" varchar(200) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"condition_expression" text,
	"journal_template" jsonb NOT NULL,
	"target_ledger_id" uuid,
	"status" "mapping_rule_status" DEFAULT 'DRAFT' NOT NULL,
	"version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."mapping_rule" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."match_tolerance" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"scope" "tolerance_scope" NOT NULL,
	"scope_entity_id" uuid,
	"company_id" uuid,
	"tolerance_bps" integer NOT NULL,
	"quantity_tolerance_percent" integer DEFAULT 0 NOT NULL,
	"auto_hold" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_match_tol_qty_range" CHECK ("erp"."match_tolerance"."quantity_tolerance_percent" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "erp"."match_tolerance" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ocr_job" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"file_size" bigint,
	"mime_type" varchar(100),
	"status" "ocr_job_status" DEFAULT 'CLAIMED' NOT NULL,
	"storage_key" text,
	"provider_name" varchar(100),
	"external_ref" text,
	"confidence" "ocr_confidence_level",
	"invoice_id" uuid,
	"error_reason" "ocr_failure_reason",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."ocr_job" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."ownership_record" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"parent_entity_id" uuid NOT NULL,
	"child_entity_id" uuid NOT NULL,
	"ownership_pct_bps" integer NOT NULL,
	"voting_pct_bps" integer NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"acquisition_date" timestamp with time zone NOT NULL,
	"acquisition_cost" bigint NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_ownership_cost_nonneg" CHECK ("erp"."ownership_record"."acquisition_cost" >= 0),
	CONSTRAINT "chk_ownership_pct_bps_range" CHECK ("erp"."ownership_record"."ownership_pct_bps" BETWEEN 0 AND 10000 AND "erp"."ownership_record"."voting_pct_bps" BETWEEN 0 AND 10000)
);
--> statement-breakpoint
ALTER TABLE "erp"."ownership_record" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."payment_terms_line" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"line_number" smallint NOT NULL,
	"due_days" smallint NOT NULL,
	"percentage_of_total" smallint NOT NULL,
	"discount_percent_bps" integer DEFAULT 0 NOT NULL,
	"discount_days" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_pay_terms_line_days_positive" CHECK ("erp"."payment_terms_line"."due_days" > 0),
	CONSTRAINT "chk_pay_terms_line_pct_range" CHECK ("erp"."payment_terms_line"."percentage_of_total" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "erp"."payment_terms_line" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."payment_terms_template" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"net_days" smallint NOT NULL,
	"discount_percent" smallint DEFAULT 0 NOT NULL,
	"discount_days" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_pay_terms_days_positive" CHECK ("erp"."payment_terms_template"."net_days" > 0),
	CONSTRAINT "chk_pay_terms_discount_range" CHECK ("erp"."payment_terms_template"."discount_percent" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "erp"."payment_terms_template" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."project_billing" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"billing_date" timestamp with time zone NOT NULL,
	"description" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "billing_status" DEFAULT 'DRAFT' NOT NULL,
	"milestone_ref" varchar(100),
	"ar_invoice_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_proj_billing_amt_nonneg" CHECK ("erp"."project_billing"."amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."project_billing" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."project_cost_line" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"line_number" smallint NOT NULL,
	"cost_date" timestamp with time zone NOT NULL,
	"category" "cost_category" NOT NULL,
	"description" text NOT NULL,
	"amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"gl_account_id" uuid NOT NULL,
	"journal_id" uuid,
	"employee_id" uuid,
	"is_billable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_proj_cost_amt_nonneg" CHECK ("erp"."project_cost_line"."amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."project_cost_line" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."project" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"project_code" varchar(30) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"customer_id" uuid,
	"manager_id" uuid NOT NULL,
	"status" "project_status" DEFAULT 'PLANNING' NOT NULL,
	"billing_type" "billing_type" NOT NULL,
	"budget_amount" bigint NOT NULL,
	"actual_cost" bigint DEFAULT 0 NOT NULL,
	"billed_amount" bigint DEFAULT 0 NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"completion_pct" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_project_amounts_nonneg" CHECK ("erp"."project"."budget_amount" >= 0 AND "erp"."project"."actual_cost" >= 0 AND "erp"."project"."billed_amount" >= 0),
	CONSTRAINT "chk_project_completion_range" CHECK ("erp"."project"."completion_pct" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "erp"."project" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."provision_movement" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"provision_id" uuid NOT NULL,
	"movement_date" timestamp with time zone NOT NULL,
	"movement_type" "provision_movement_type" NOT NULL,
	"amount" bigint NOT NULL,
	"balance_after" bigint NOT NULL,
	"description" text NOT NULL,
	"journal_id" uuid,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_provision_mvmt_nonneg" CHECK ("erp"."provision_movement"."amount" >= 0 AND "erp"."provision_movement"."balance_after" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."provision_movement" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."provision" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"provision_number" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"provision_type" "provision_type" NOT NULL,
	"status" "provision_status" DEFAULT 'ACTIVE' NOT NULL,
	"recognition_date" timestamp with time zone NOT NULL,
	"expected_settlement_date" timestamp with time zone,
	"initial_amount" bigint NOT NULL,
	"current_amount" bigint NOT NULL,
	"discount_rate_bps" integer DEFAULT 0 NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"gl_account_id" uuid,
	"is_contingent_liability" boolean DEFAULT false NOT NULL,
	"contingent_liability_note" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_provision_amounts_nonneg" CHECK ("erp"."provision"."initial_amount" >= 0 AND "erp"."provision"."current_amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."provision" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_rev_milestone_amt_nonneg" CHECK ("erp"."recognition_milestone"."amount" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."recognition_milestone" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "erp"."recurring_template" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_rev_contract_amounts_nonneg" CHECK ("erp"."revenue_contract"."total_amount" >= 0 AND "erp"."revenue_contract"."recognized_to_date" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."revenue_contract" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_account_group_config" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"account_group" "supplier_account_group" NOT NULL,
	"label" varchar(100) NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"requires_tax_verification" boolean DEFAULT false NOT NULL,
	"requires_bank_verification" boolean DEFAULT false NOT NULL,
	"allow_one_time_use" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_account_group_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_bank_account" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"site_id" uuid,
	"bank_name" varchar(200) NOT NULL,
	"account_name" varchar(200) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"iban" varchar(34),
	"swift_bic" varchar(11),
	"local_bank_code" varchar(20),
	"currency_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"verification_method" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_bank_account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_blacklist" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"justification" text NOT NULL,
	"blacklisted_by" uuid NOT NULL,
	"blacklisted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_until" timestamp with time zone,
	"reversal_approved_by" uuid,
	"reversal_approved_at" timestamp with time zone,
	"reversal_reason" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_blacklist" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_block_history" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"action" "supplier_block_action" NOT NULL,
	"block_type" "supplier_block_type" NOT NULL,
	"scope" "supplier_block_scope" NOT NULL,
	"company_id" uuid,
	"site_id" uuid,
	"reason" text NOT NULL,
	"performed_by" uuid NOT NULL,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_block_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_block" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"block_type" "supplier_block_type" NOT NULL,
	"scope" "supplier_block_scope" NOT NULL,
	"company_id" uuid,
	"site_id" uuid,
	"reason_code" varchar(50) NOT NULL,
	"reason" text NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_until" timestamp with time zone,
	"blocked_by" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_block" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_company_override" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"default_payment_terms_id" uuid,
	"default_payment_method" "payment_method_type",
	"default_currency_id" uuid,
	"tolerance_percent" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_supplier_override_tolerance" CHECK ("erp"."supplier_company_override"."tolerance_percent" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_company_override" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_compliance_item" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"item_type" "compliance_item_type" NOT NULL,
	"label" varchar(255) NOT NULL,
	"is_compliant" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"document_id" uuid,
	"notes" text,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_compliance_item" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_contact" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"site_id" uuid,
	"role" "supplier_contact_role" NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"job_title" varchar(200),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_contact" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_dispute" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"invoice_id" uuid,
	"payment_run_id" uuid,
	"category" "dispute_category" NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" "dispute_status" DEFAULT 'OPEN' NOT NULL,
	"resolution" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_dispute" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_diversity" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"diversity_code" "supplier_diversity_code" NOT NULL,
	"certificate_number" varchar(100),
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"document_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_diversity" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_doc_requirement" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"account_group" "supplier_account_group" NOT NULL,
	"doc_type" "supplier_legal_doc_type" NOT NULL,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"country_code" varchar(3),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_doc_requirement" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_document" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"category" "supplier_document_category" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"checksum_sha256" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_supplier_doc_size_positive" CHECK ("erp"."supplier_document"."file_size_bytes" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_document" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_duplicate_suspect" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_a_id" uuid NOT NULL,
	"supplier_b_id" uuid NOT NULL,
	"match_type" "supplier_duplicate_match_type" NOT NULL,
	"confidence" numeric(3, 2) NOT NULL,
	"status" "supplier_duplicate_status" DEFAULT 'OPEN' NOT NULL,
	"merged_into_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_supplier_dup_confidence" CHECK ("erp"."supplier_duplicate_suspect"."confidence" >= 0 AND "erp"."supplier_duplicate_suspect"."confidence" <= 1)
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_duplicate_suspect" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_eval_criteria" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"weight" smallint NOT NULL,
	"max_score" smallint DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_supplier_eval_criteria_positive" CHECK ("erp"."supplier_eval_criteria"."weight" > 0 AND "erp"."supplier_eval_criteria"."max_score" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_eval_criteria" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_eval_score" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"criteria_id" uuid NOT NULL,
	"score" smallint NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_supplier_eval_score_nonneg" CHECK ("erp"."supplier_eval_score"."score" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_eval_score" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_eval_template" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_eval_template" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_evaluation" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"template_version_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"evaluated_by" uuid NOT NULL,
	"status" "supplier_eval_status" DEFAULT 'DRAFT' NOT NULL,
	"overall_score" numeric(5, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_supplier_eval_score_nonneg" CHECK ("erp"."supplier_evaluation"."overall_score" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_evaluation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_legal_document" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"doc_type" "supplier_legal_doc_type" NOT NULL,
	"document_number" varchar(100),
	"issuing_authority" varchar(200),
	"issue_date" timestamp with time zone,
	"expiry_date" timestamp with time zone,
	"storage_key" text,
	"checksum_sha256" varchar(64),
	"status" "supplier_legal_doc_status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_legal_document" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_notification_pref" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"channel" varchar(20) NOT NULL,
	"endpoint" varchar(500) NOT NULL,
	"invoice_status_changes" boolean DEFAULT true NOT NULL,
	"payment_notifications" boolean DEFAULT true NOT NULL,
	"dispute_updates" boolean DEFAULT true NOT NULL,
	"compliance_alerts" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_notification_pref" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_risk_indicator" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"risk_rating" "supplier_risk_rating" NOT NULL,
	"risk_category" "supplier_risk_category" NOT NULL,
	"description" text NOT NULL,
	"incident_date" timestamp with time zone,
	"document_id" uuid,
	"raised_by" uuid NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_risk_indicator" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_site" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"site_code" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" varchar(100) NOT NULL,
	"region" varchar(100),
	"postal_code" varchar(20),
	"country_code" varchar(3) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_pay_site" boolean DEFAULT false NOT NULL,
	"is_purchasing_site" boolean DEFAULT false NOT NULL,
	"is_remit_to" boolean DEFAULT false NOT NULL,
	"contact_name" varchar(200),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_site" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_tax_registration" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"tax_type" "supplier_tax_type" NOT NULL,
	"registration_number" varchar(50) NOT NULL,
	"issuing_country" varchar(3) NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_tax_registration" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_user" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"trading_name" varchar(200),
	"registration_number" varchar(50),
	"country_of_incorporation" varchar(3),
	"legal_form" varchar(50),
	"tax_id" varchar(50),
	"currency_id" uuid NOT NULL,
	"default_payment_terms_id" uuid,
	"default_payment_method" "payment_method_type",
	"wht_rate_id" uuid,
	"remittance_email" varchar(255),
	"status" "supplier_status" DEFAULT 'ACTIVE' NOT NULL,
	"onboarding_status" "supplier_onboarding_status" DEFAULT 'ACTIVE' NOT NULL,
	"account_group" "supplier_account_group" DEFAULT 'TRADE' NOT NULL,
	"category" "supplier_category" DEFAULT 'GOODS' NOT NULL,
	"industry_code" varchar(20),
	"industry_description" varchar(200),
	"parent_supplier_id" uuid,
	"is_group_header" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."tax_code" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"jurisdiction_level" "jurisdiction_level" NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"state_code" varchar(10),
	"city_code" varchar(20),
	"parent_id" uuid,
	"is_compound" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."tax_code" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."tax_rate" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tax_code_id" uuid NOT NULL,
	"name" text NOT NULL,
	"rate_percent" smallint NOT NULL,
	"type" "tax_rate_type" NOT NULL,
	"jurisdiction_code" varchar(20) NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_tax_rate_pct_range" CHECK ("erp"."tax_rate"."rate_percent" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "erp"."tax_rate" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."tax_return_period" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tax_type" varchar(20) NOT NULL,
	"jurisdiction_code" varchar(20) NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"output_tax" bigint DEFAULT 0 NOT NULL,
	"input_tax" bigint DEFAULT 0 NOT NULL,
	"net_payable" bigint DEFAULT 0 NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "tax_return_status" DEFAULT 'DRAFT' NOT NULL,
	"filed_at" timestamp with time zone,
	"filed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_tax_return_amounts_nonneg" CHECK ("erp"."tax_return_period"."output_tax" >= 0 AND "erp"."tax_return_period"."input_tax" >= 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."tax_return_period" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."tp_benchmark" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"policy_id" uuid NOT NULL,
	"benchmark_year" smallint NOT NULL,
	"method" "tp_method" NOT NULL,
	"comparable_count" smallint NOT NULL,
	"interquartile_range_low_bps" integer NOT NULL,
	"interquartile_range_median_bps" integer NOT NULL,
	"interquartile_range_high_bps" integer NOT NULL,
	"data_source" varchar(200),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_tp_iqr_nonneg" CHECK ("erp"."tp_benchmark"."interquartile_range_low_bps" >= 0 AND "erp"."tp_benchmark"."interquartile_range_median_bps" >= 0 AND "erp"."tp_benchmark"."interquartile_range_high_bps" >= 0),
	CONSTRAINT "chk_tp_iqr_ordering" CHECK ("erp"."tp_benchmark"."interquartile_range_low_bps" <= "erp"."tp_benchmark"."interquartile_range_median_bps" AND "erp"."tp_benchmark"."interquartile_range_median_bps" <= "erp"."tp_benchmark"."interquartile_range_high_bps"),
	CONSTRAINT "chk_tp_comparable_positive" CHECK ("erp"."tp_benchmark"."comparable_count" > 0)
);
--> statement-breakpoint
ALTER TABLE "erp"."tp_benchmark" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."tp_policy" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"policy_name" varchar(200) NOT NULL,
	"method" varchar(30) NOT NULL,
	"benchmark_low_bps" integer NOT NULL,
	"benchmark_median_bps" integer NOT NULL,
	"benchmark_high_bps" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_tp_benchmarks_nonneg" CHECK ("erp"."tp_policy"."benchmark_low_bps" >= 0 AND "erp"."tp_policy"."benchmark_median_bps" >= 0 AND "erp"."tp_policy"."benchmark_high_bps" >= 0),
	CONSTRAINT "chk_tp_benchmark_ordering" CHECK ("erp"."tp_policy"."benchmark_low_bps" <= "erp"."tp_policy"."benchmark_median_bps" AND "erp"."tp_policy"."benchmark_median_bps" <= "erp"."tp_policy"."benchmark_high_bps")
);
--> statement-breakpoint
ALTER TABLE "erp"."tp_policy" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."wht_certificate" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payee_id" uuid NOT NULL,
	"payee_name" text NOT NULL,
	"payee_type" varchar(20) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"income_type" varchar(50) NOT NULL,
	"gross_amount" bigint NOT NULL,
	"wht_amount" bigint NOT NULL,
	"net_amount" bigint NOT NULL,
	"currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
	"rate_applied" smallint NOT NULL,
	"treaty_rate" smallint,
	"certificate_number" varchar(50) NOT NULL,
	"issue_date" timestamp with time zone NOT NULL,
	"tax_period_start" timestamp with time zone NOT NULL,
	"tax_period_end" timestamp with time zone NOT NULL,
	"related_invoice_id" uuid,
	"related_payment_id" uuid,
	"status" "wht_certificate_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_wht_amounts_nonneg" CHECK ("erp"."wht_certificate"."gross_amount" >= 0 AND "erp"."wht_certificate"."wht_amount" >= 0 AND "erp"."wht_certificate"."net_amount" >= 0),
	CONSTRAINT "chk_wht_rate_range" CHECK ("erp"."wht_certificate"."rate_applied" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "erp"."wht_certificate" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."idempotency_store" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"command_type" varchar(100) NOT NULL,
	"result_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."idempotency_store" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "platform"."admin_action_log" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_tenant_id" uuid,
	"target_user_id" uuid,
	"details" jsonb,
	"request_id" varchar(64),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."admin_action_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "platform"."admin_user" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"scope" varchar(50) DEFAULT 'full' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."admin_user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "platform"."company" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."outbox" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"correlation_id" uuid,
	"content_hash" varchar(64),
	"previous_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "erp"."outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "platform"."system_config" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."system_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "platform"."tenant" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(63) NOT NULL,
	"status" "tenant_status" DEFAULT 'ACTIVE' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"display_name" text,
	"logo_url" text,
	"plan_tier" varchar(20) DEFAULT 'free' NOT NULL,
	"settings_version" integer DEFAULT 1 NOT NULL,
	"settings_updated_by" uuid,
	"settings_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."tenant" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "platform"."user_preference" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."user_preference" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
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
ALTER TABLE "platform"."user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "erp"."approval_request" ADD CONSTRAINT "approval_request_policy_id_approval_policy_id_fk" FOREIGN KEY ("policy_id") REFERENCES "erp"."approval_policy"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."approval_step" ADD CONSTRAINT "approval_step_request_id_approval_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "erp"."approval_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."document_link" ADD CONSTRAINT "document_link_document_id_document_attachment_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "erp"."document_attachment"("document_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."account" ADD CONSTRAINT "account_parent_id_account_id_fk" FOREIGN KEY ("parent_id") REFERENCES "erp"."account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_hold" ADD CONSTRAINT "ap_hold_invoice_id_ap_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "erp"."ap_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice_line" ADD CONSTRAINT "ap_invoice_line_invoice_id_ap_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "erp"."ap_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice_line" ADD CONSTRAINT "ap_invoice_line_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "erp"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice" ADD CONSTRAINT "ap_invoice_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice" ADD CONSTRAINT "ap_invoice_ledger_id_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "erp"."ledger"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice" ADD CONSTRAINT "ap_invoice_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice" ADD CONSTRAINT "ap_invoice_payment_terms_id_payment_terms_template_id_fk" FOREIGN KEY ("payment_terms_id") REFERENCES "erp"."payment_terms_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice" ADD CONSTRAINT "ap_invoice_journal_id_gl_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "erp"."gl_journal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_payment_run_item" ADD CONSTRAINT "ap_payment_run_item_payment_run_id_ap_payment_run_id_fk" FOREIGN KEY ("payment_run_id") REFERENCES "erp"."ap_payment_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_payment_run_item" ADD CONSTRAINT "ap_payment_run_item_invoice_id_ap_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "erp"."ap_invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_payment_run_item" ADD CONSTRAINT "ap_payment_run_item_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_payment_run_item" ADD CONSTRAINT "ap_payment_run_item_journal_id_gl_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "erp"."gl_journal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_payment_run" ADD CONSTRAINT "ap_payment_run_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_prepayment_application" ADD CONSTRAINT "ap_prepayment_application_prepayment_id_ap_prepayment_id_fk" FOREIGN KEY ("prepayment_id") REFERENCES "erp"."ap_prepayment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_prepayment_application" ADD CONSTRAINT "ap_prepayment_application_target_invoice_id_ap_invoice_id_fk" FOREIGN KEY ("target_invoice_id") REFERENCES "erp"."ap_invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ap_prepayment" ADD CONSTRAINT "ap_prepayment_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ar_allocation_item" ADD CONSTRAINT "ar_allocation_item_payment_allocation_id_ar_payment_allocation_id_fk" FOREIGN KEY ("payment_allocation_id") REFERENCES "erp"."ar_payment_allocation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ar_allocation_item" ADD CONSTRAINT "ar_allocation_item_invoice_id_ar_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "erp"."ar_invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ar_allocation_item" ADD CONSTRAINT "ar_allocation_item_journal_id_gl_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "erp"."gl_journal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ar_invoice_line" ADD CONSTRAINT "ar_invoice_line_invoice_id_ar_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "erp"."ar_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ar_invoice_line" ADD CONSTRAINT "ar_invoice_line_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "erp"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ar_invoice" ADD CONSTRAINT "ar_invoice_ledger_id_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "erp"."ledger"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ar_invoice" ADD CONSTRAINT "ar_invoice_payment_terms_id_payment_terms_template_id_fk" FOREIGN KEY ("payment_terms_id") REFERENCES "erp"."payment_terms_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ar_invoice" ADD CONSTRAINT "ar_invoice_journal_id_gl_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "erp"."gl_journal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."asset_component" ADD CONSTRAINT "asset_component_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "erp"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."asset_movement" ADD CONSTRAINT "asset_movement_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "erp"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."bank_match" ADD CONSTRAINT "bank_match_statement_line_id_bank_statement_line_id_fk" FOREIGN KEY ("statement_line_id") REFERENCES "erp"."bank_statement_line"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."bank_statement_line" ADD CONSTRAINT "bank_statement_line_statement_id_bank_statement_id_fk" FOREIGN KEY ("statement_id") REFERENCES "erp"."bank_statement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."budget_entry" ADD CONSTRAINT "budget_entry_ledger_id_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "erp"."ledger"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."budget_entry" ADD CONSTRAINT "budget_entry_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "erp"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."budget_entry" ADD CONSTRAINT "budget_entry_period_id_fiscal_period_id_fk" FOREIGN KEY ("period_id") REFERENCES "erp"."fiscal_period"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."classification_rule" ADD CONSTRAINT "classification_rule_rule_set_id_classification_rule_set_id_fk" FOREIGN KEY ("rule_set_id") REFERENCES "erp"."classification_rule_set"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."cost_allocation_line" ADD CONSTRAINT "cost_allocation_line_run_id_cost_allocation_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "erp"."cost_allocation_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."cost_allocation_line" ADD CONSTRAINT "cost_allocation_line_from_cost_center_id_cost_center_id_fk" FOREIGN KEY ("from_cost_center_id") REFERENCES "erp"."cost_center"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."cost_allocation_line" ADD CONSTRAINT "cost_allocation_line_to_cost_center_id_cost_center_id_fk" FOREIGN KEY ("to_cost_center_id") REFERENCES "erp"."cost_center"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."cost_allocation_line" ADD CONSTRAINT "cost_allocation_line_driver_id_cost_driver_id_fk" FOREIGN KEY ("driver_id") REFERENCES "erp"."cost_driver"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."cost_driver_value" ADD CONSTRAINT "cost_driver_value_driver_id_cost_driver_id_fk" FOREIGN KEY ("driver_id") REFERENCES "erp"."cost_driver"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."cost_driver_value" ADD CONSTRAINT "cost_driver_value_cost_center_id_cost_center_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "erp"."cost_center"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."credit_review" ADD CONSTRAINT "credit_review_credit_limit_id_credit_limit_id_fk" FOREIGN KEY ("credit_limit_id") REFERENCES "erp"."credit_limit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."depreciation_schedule" ADD CONSTRAINT "depreciation_schedule_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "erp"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."dunning_letter" ADD CONSTRAINT "dunning_letter_dunning_run_id_dunning_run_id_fk" FOREIGN KEY ("dunning_run_id") REFERENCES "erp"."dunning_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."expense_claim_line" ADD CONSTRAINT "expense_claim_line_claim_id_expense_claim_id_fk" FOREIGN KEY ("claim_id") REFERENCES "erp"."expense_claim"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."fair_value_measurement" ADD CONSTRAINT "fair_value_measurement_instrument_id_financial_instrument_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "erp"."financial_instrument"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."fiscal_period" ADD CONSTRAINT "fiscal_period_fiscal_year_id_fiscal_year_id_fk" FOREIGN KEY ("fiscal_year_id") REFERENCES "erp"."fiscal_year"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."fx_rate" ADD CONSTRAINT "fx_rate_from_currency_id_currency_id_fk" FOREIGN KEY ("from_currency_id") REFERENCES "erp"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."fx_rate" ADD CONSTRAINT "fx_rate_to_currency_id_currency_id_fk" FOREIGN KEY ("to_currency_id") REFERENCES "erp"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."gl_journal_line" ADD CONSTRAINT "gl_journal_line_journal_id_gl_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "erp"."gl_journal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."gl_journal_line" ADD CONSTRAINT "gl_journal_line_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "erp"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."gl_journal" ADD CONSTRAINT "gl_journal_ledger_id_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "erp"."ledger"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."gl_journal" ADD CONSTRAINT "gl_journal_fiscal_period_id_fiscal_period_id_fk" FOREIGN KEY ("fiscal_period_id") REFERENCES "erp"."fiscal_period"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."gl_journal" ADD CONSTRAINT "gl_journal_reversal_of_id_gl_journal_id_fk" FOREIGN KEY ("reversal_of_id") REFERENCES "erp"."gl_journal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."gl_journal" ADD CONSTRAINT "gl_journal_reversed_by_id_gl_journal_id_fk" FOREIGN KEY ("reversed_by_id") REFERENCES "erp"."gl_journal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."hedge_effectiveness_test" ADD CONSTRAINT "hedge_effectiveness_test_hedge_relationship_id_hedge_relationship_id_fk" FOREIGN KEY ("hedge_relationship_id") REFERENCES "erp"."hedge_relationship"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ic_agreement" ADD CONSTRAINT "ic_agreement_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ic_settlement_line" ADD CONSTRAINT "ic_settlement_line_settlement_id_ic_settlement_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "erp"."ic_settlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ic_settlement_line" ADD CONSTRAINT "ic_settlement_line_transaction_id_ic_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "erp"."ic_transaction"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ic_settlement" ADD CONSTRAINT "ic_settlement_agreement_id_ic_agreement_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "erp"."ic_agreement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ic_settlement" ADD CONSTRAINT "ic_settlement_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ic_transaction_leg" ADD CONSTRAINT "ic_transaction_leg_transaction_id_ic_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "erp"."ic_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ic_transaction_leg" ADD CONSTRAINT "ic_transaction_leg_journal_id_gl_journal_id_fk" FOREIGN KEY ("journal_id") REFERENCES "erp"."gl_journal"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ic_transaction" ADD CONSTRAINT "ic_transaction_agreement_id_ic_agreement_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "erp"."ic_agreement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ic_transaction" ADD CONSTRAINT "ic_transaction_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."lease_modification" ADD CONSTRAINT "lease_modification_lease_contract_id_lease_contract_id_fk" FOREIGN KEY ("lease_contract_id") REFERENCES "erp"."lease_contract"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."lease_schedule" ADD CONSTRAINT "lease_schedule_lease_contract_id_lease_contract_id_fk" FOREIGN KEY ("lease_contract_id") REFERENCES "erp"."lease_contract"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ledger" ADD CONSTRAINT "ledger_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."mapping_rule_version" ADD CONSTRAINT "mapping_rule_version_rule_id_mapping_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "erp"."mapping_rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ocr_job" ADD CONSTRAINT "ocr_job_invoice_id_ap_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "erp"."ap_invoice"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ownership_record" ADD CONSTRAINT "ownership_record_parent_entity_id_group_entity_id_fk" FOREIGN KEY ("parent_entity_id") REFERENCES "erp"."group_entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."ownership_record" ADD CONSTRAINT "ownership_record_child_entity_id_group_entity_id_fk" FOREIGN KEY ("child_entity_id") REFERENCES "erp"."group_entity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."project_billing" ADD CONSTRAINT "project_billing_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "erp"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."project_cost_line" ADD CONSTRAINT "project_cost_line_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "erp"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."provision_movement" ADD CONSTRAINT "provision_movement_provision_id_provision_id_fk" FOREIGN KEY ("provision_id") REFERENCES "erp"."provision"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."recognition_milestone" ADD CONSTRAINT "recognition_milestone_contract_id_revenue_contract_id_fk" FOREIGN KEY ("contract_id") REFERENCES "erp"."revenue_contract"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."recurring_template" ADD CONSTRAINT "recurring_template_ledger_id_ledger_id_fk" FOREIGN KEY ("ledger_id") REFERENCES "erp"."ledger"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."revenue_contract" ADD CONSTRAINT "revenue_contract_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."revenue_contract" ADD CONSTRAINT "revenue_contract_deferred_account_id_account_id_fk" FOREIGN KEY ("deferred_account_id") REFERENCES "erp"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."revenue_contract" ADD CONSTRAINT "revenue_contract_revenue_account_id_account_id_fk" FOREIGN KEY ("revenue_account_id") REFERENCES "erp"."account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_bank_account" ADD CONSTRAINT "supplier_bank_account_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_bank_account" ADD CONSTRAINT "supplier_bank_account_site_id_supplier_site_id_fk" FOREIGN KEY ("site_id") REFERENCES "erp"."supplier_site"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_bank_account" ADD CONSTRAINT "supplier_bank_account_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_blacklist" ADD CONSTRAINT "supplier_blacklist_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_block_history" ADD CONSTRAINT "supplier_block_history_block_id_supplier_block_id_fk" FOREIGN KEY ("block_id") REFERENCES "erp"."supplier_block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_block" ADD CONSTRAINT "supplier_block_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_company_override" ADD CONSTRAINT "supplier_company_override_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_compliance_item" ADD CONSTRAINT "supplier_compliance_item_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_contact" ADD CONSTRAINT "supplier_contact_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_dispute" ADD CONSTRAINT "supplier_dispute_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_diversity" ADD CONSTRAINT "supplier_diversity_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_document" ADD CONSTRAINT "supplier_document_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_duplicate_suspect" ADD CONSTRAINT "supplier_duplicate_suspect_supplier_a_id_supplier_id_fk" FOREIGN KEY ("supplier_a_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_duplicate_suspect" ADD CONSTRAINT "supplier_duplicate_suspect_supplier_b_id_supplier_id_fk" FOREIGN KEY ("supplier_b_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_eval_criteria" ADD CONSTRAINT "supplier_eval_criteria_template_id_supplier_eval_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "erp"."supplier_eval_template"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_eval_score" ADD CONSTRAINT "supplier_eval_score_evaluation_id_supplier_evaluation_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "erp"."supplier_evaluation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_eval_score" ADD CONSTRAINT "supplier_eval_score_criteria_id_supplier_eval_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "erp"."supplier_eval_criteria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_evaluation" ADD CONSTRAINT "supplier_evaluation_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_legal_document" ADD CONSTRAINT "supplier_legal_document_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_notification_pref" ADD CONSTRAINT "supplier_notification_pref_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_risk_indicator" ADD CONSTRAINT "supplier_risk_indicator_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_site" ADD CONSTRAINT "supplier_site_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_tax_registration" ADD CONSTRAINT "supplier_tax_registration_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_user" ADD CONSTRAINT "supplier_user_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier" ADD CONSTRAINT "supplier_currency_id_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "erp"."currency"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier" ADD CONSTRAINT "supplier_default_payment_terms_id_payment_terms_template_id_fk" FOREIGN KEY ("default_payment_terms_id") REFERENCES "erp"."payment_terms_template"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier" ADD CONSTRAINT "supplier_parent_supplier_id_supplier_id_fk" FOREIGN KEY ("parent_supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."tax_rate" ADD CONSTRAINT "tax_rate_tax_code_id_tax_code_id_fk" FOREIGN KEY ("tax_code_id") REFERENCES "erp"."tax_code"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_attachment_tenant_checksum" ON "erp"."document_attachment" USING btree ("tenant_id","checksum_sha256") WHERE "erp"."document_attachment"."deleted_at" IS NULL AND "erp"."document_attachment"."checksum_sha256" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_document_attachment_tenant_status" ON "erp"."document_attachment" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_document_attachment_tenant_checksum_lookup" ON "erp"."document_attachment" USING btree ("tenant_id","checksum_sha256");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_link_tenant_entity_doc" ON "erp"."document_link" USING btree ("tenant_id","entity_type","entity_id","document_id");--> statement-breakpoint
CREATE INDEX "idx_document_link_tenant_entity" ON "erp"."document_link" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_document_link_tenant_document" ON "erp"."document_link" USING btree ("tenant_id","document_id");--> statement-breakpoint
CREATE INDEX "idx_accounting_event_company" ON "erp"."accounting_event" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_accounting_event_type" ON "erp"."accounting_event" USING btree ("tenant_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_accounting_event_status" ON "erp"."accounting_event" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_accounting_event_source" ON "erp"."accounting_event" USING btree ("tenant_id","source_document_type","source_document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_account_code_tenant" ON "erp"."account" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_account_type_tenant" ON "erp"."account" USING btree ("tenant_id","account_type");--> statement-breakpoint
CREATE INDEX "idx_ap_hold_invoice_tenant" ON "erp"."ap_hold" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE INDEX "idx_ap_hold_status_tenant" ON "erp"."ap_hold" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_ap_hold_type_tenant" ON "erp"."ap_hold" USING btree ("tenant_id","hold_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ap_invoice_line_num_tenant" ON "erp"."ap_invoice_line" USING btree ("tenant_id","invoice_id","line_number");--> statement-breakpoint
CREATE INDEX "idx_ap_invoice_line_account_tenant" ON "erp"."ap_invoice_line" USING btree ("tenant_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ap_invoice_number_tenant" ON "erp"."ap_invoice" USING btree ("tenant_id","company_id","invoice_number");--> statement-breakpoint
CREATE INDEX "idx_ap_invoice_supplier_tenant" ON "erp"."ap_invoice" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_ap_invoice_status_tenant" ON "erp"."ap_invoice" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_ap_invoice_due_date_tenant" ON "erp"."ap_invoice" USING btree ("tenant_id","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ap_payment_run_item_invoice_tenant" ON "erp"."ap_payment_run_item" USING btree ("tenant_id","payment_run_id","invoice_id");--> statement-breakpoint
CREATE INDEX "idx_ap_payment_run_item_run_tenant" ON "erp"."ap_payment_run_item" USING btree ("tenant_id","payment_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ap_payment_run_number_tenant" ON "erp"."ap_payment_run" USING btree ("tenant_id","company_id","run_number");--> statement-breakpoint
CREATE INDEX "idx_ap_payment_run_status_tenant" ON "erp"."ap_payment_run" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_ap_prepay_app_prepayment" ON "erp"."ap_prepayment_application" USING btree ("tenant_id","prepayment_id");--> statement-breakpoint
CREATE INDEX "idx_ap_prepay_app_invoice" ON "erp"."ap_prepayment_application" USING btree ("tenant_id","target_invoice_id");--> statement-breakpoint
CREATE INDEX "idx_ap_prepayment_supplier" ON "erp"."ap_prepayment" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_ap_prepayment_invoice" ON "erp"."ap_prepayment" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE INDEX "idx_ap_prepayment_status" ON "erp"."ap_prepayment" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ar_allocation_item_tenant" ON "erp"."ar_allocation_item" USING btree ("tenant_id","payment_allocation_id","invoice_id");--> statement-breakpoint
CREATE INDEX "idx_ar_allocation_item_alloc_tenant" ON "erp"."ar_allocation_item" USING btree ("tenant_id","payment_allocation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ar_invoice_line_tenant" ON "erp"."ar_invoice_line" USING btree ("tenant_id","invoice_id","line_number");--> statement-breakpoint
CREATE INDEX "idx_ar_invoice_line_invoice_tenant" ON "erp"."ar_invoice_line" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ar_invoice_number_tenant" ON "erp"."ar_invoice" USING btree ("tenant_id","invoice_number");--> statement-breakpoint
CREATE INDEX "idx_ar_invoice_customer_tenant" ON "erp"."ar_invoice" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "idx_ar_invoice_status_tenant" ON "erp"."ar_invoice" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_ar_invoice_due_date_tenant" ON "erp"."ar_invoice" USING btree ("tenant_id","due_date");--> statement-breakpoint
CREATE INDEX "idx_ar_payment_allocation_customer_tenant" ON "erp"."ar_payment_allocation" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "idx_asset_component_asset" ON "erp"."asset_component" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE INDEX "idx_asset_movement_asset_tenant" ON "erp"."asset_movement" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE INDEX "idx_asset_movement_type_tenant" ON "erp"."asset_movement" USING btree ("tenant_id","movement_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_asset_number_tenant" ON "erp"."asset" USING btree ("tenant_id","asset_number");--> statement-breakpoint
CREATE INDEX "idx_asset_company_tenant" ON "erp"."asset" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_asset_status_tenant" ON "erp"."asset" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_bank_match_line_tenant" ON "erp"."bank_match" USING btree ("tenant_id","statement_line_id");--> statement-breakpoint
CREATE INDEX "idx_bank_recon_account_tenant" ON "erp"."bank_reconciliation" USING btree ("tenant_id","bank_account_id");--> statement-breakpoint
CREATE INDEX "idx_bank_recon_status_tenant" ON "erp"."bank_reconciliation" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_bank_line_stmt_tenant" ON "erp"."bank_statement_line" USING btree ("tenant_id","statement_id");--> statement-breakpoint
CREATE INDEX "idx_bank_line_status_tenant" ON "erp"."bank_statement_line" USING btree ("tenant_id","match_status");--> statement-breakpoint
CREATE INDEX "idx_bank_stmt_account_tenant" ON "erp"."bank_statement" USING btree ("tenant_id","bank_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_budget_entry_tenant_ledger_account_period" ON "erp"."budget_entry" USING btree ("tenant_id","ledger_id","account_id","period_id");--> statement-breakpoint
CREATE INDEX "idx_cash_forecast_company_date" ON "erp"."cash_forecast" USING btree ("tenant_id","company_id","forecast_date");--> statement-breakpoint
CREATE INDEX "idx_cash_forecast_type" ON "erp"."cash_forecast" USING btree ("tenant_id","forecast_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_classification_rule_set_tenant_standard_version" ON "erp"."classification_rule_set" USING btree ("tenant_id","standard","version");--> statement-breakpoint
CREATE INDEX "idx_classification_rule_set_tenant" ON "erp"."classification_rule" USING btree ("tenant_id","rule_set_id");--> statement-breakpoint
CREATE INDEX "idx_classification_rule_type_tenant" ON "erp"."classification_rule" USING btree ("tenant_id","account_type");--> statement-breakpoint
CREATE INDEX "idx_cost_alloc_line_run" ON "erp"."cost_allocation_line" USING btree ("tenant_id","run_id");--> statement-breakpoint
CREATE INDEX "idx_cost_alloc_line_from" ON "erp"."cost_allocation_line" USING btree ("tenant_id","from_cost_center_id");--> statement-breakpoint
CREATE INDEX "idx_cost_alloc_line_to" ON "erp"."cost_allocation_line" USING btree ("tenant_id","to_cost_center_id");--> statement-breakpoint
CREATE INDEX "idx_cost_alloc_run_period" ON "erp"."cost_allocation_run" USING btree ("tenant_id","company_id","period_id");--> statement-breakpoint
CREATE INDEX "idx_cost_alloc_run_status" ON "erp"."cost_allocation_run" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cost_center_code_tenant" ON "erp"."cost_center" USING btree ("tenant_id","company_id","code");--> statement-breakpoint
CREATE INDEX "idx_cost_center_parent" ON "erp"."cost_center" USING btree ("tenant_id","parent_id");--> statement-breakpoint
CREATE INDEX "idx_cost_center_company" ON "erp"."cost_center" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cost_driver_value_unique" ON "erp"."cost_driver_value" USING btree ("tenant_id","driver_id","cost_center_id","period_id");--> statement-breakpoint
CREATE INDEX "idx_cost_driver_value_period" ON "erp"."cost_driver_value" USING btree ("tenant_id","period_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cost_driver_code_tenant" ON "erp"."cost_driver" USING btree ("tenant_id","company_id","code");--> statement-breakpoint
CREATE INDEX "idx_cost_driver_company" ON "erp"."cost_driver" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_counterparty_code_tenant" ON "erp"."counterparty" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_covenant_company_tenant" ON "erp"."covenant" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_covenant_status" ON "erp"."covenant" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_credit_limit_customer_tenant" ON "erp"."credit_limit" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "idx_credit_limit_company_tenant" ON "erp"."credit_limit" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_credit_limit_status_tenant" ON "erp"."credit_limit" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_credit_review_limit_tenant" ON "erp"."credit_review" USING btree ("tenant_id","credit_limit_id");--> statement-breakpoint
CREATE INDEX "idx_credit_review_customer_tenant" ON "erp"."credit_review" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_currency_code_tenant" ON "erp"."currency" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_deferred_tax_company" ON "erp"."deferred_tax_item" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_deferred_tax_period" ON "erp"."deferred_tax_item" USING btree ("tenant_id","period_id");--> statement-breakpoint
CREATE INDEX "idx_depr_schedule_asset_tenant" ON "erp"."depreciation_schedule" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE INDEX "idx_depr_schedule_posted_tenant" ON "erp"."depreciation_schedule" USING btree ("tenant_id","is_posted");--> statement-breakpoint
CREATE INDEX "idx_dunning_letter_run_tenant" ON "erp"."dunning_letter" USING btree ("tenant_id","dunning_run_id");--> statement-breakpoint
CREATE INDEX "idx_dunning_letter_customer_tenant" ON "erp"."dunning_letter" USING btree ("tenant_id","customer_id");--> statement-breakpoint
CREATE INDEX "idx_dunning_run_status_tenant" ON "erp"."dunning_run" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_expense_line_claim_tenant" ON "erp"."expense_claim_line" USING btree ("tenant_id","claim_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_expense_claim_number_tenant" ON "erp"."expense_claim" USING btree ("tenant_id","claim_number");--> statement-breakpoint
CREATE INDEX "idx_expense_claim_employee_tenant" ON "erp"."expense_claim" USING btree ("tenant_id","employee_id");--> statement-breakpoint
CREATE INDEX "idx_expense_claim_status_tenant" ON "erp"."expense_claim" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_expense_policy_company_tenant" ON "erp"."expense_policy" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_fvm_instrument" ON "erp"."fair_value_measurement" USING btree ("tenant_id","instrument_id");--> statement-breakpoint
CREATE INDEX "idx_fvm_date" ON "erp"."fair_value_measurement" USING btree ("tenant_id","measurement_date");--> statement-breakpoint
CREATE INDEX "idx_fvm_level" ON "erp"."fair_value_measurement" USING btree ("tenant_id","fair_value_level");--> statement-breakpoint
CREATE INDEX "idx_fin_instrument_company" ON "erp"."financial_instrument" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_fin_instrument_type" ON "erp"."financial_instrument" USING btree ("tenant_id","instrument_type");--> statement-breakpoint
CREATE INDEX "idx_fin_instrument_classification" ON "erp"."financial_instrument" USING btree ("tenant_id","classification");--> statement-breakpoint
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
CREATE INDEX "idx_goodwill_child_tenant" ON "erp"."goodwill" USING btree ("tenant_id","child_entity_id");--> statement-breakpoint
CREATE INDEX "idx_goodwill_ownership" ON "erp"."goodwill" USING btree ("tenant_id","ownership_record_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_group_entity_company_tenant" ON "erp"."group_entity" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_group_entity_parent" ON "erp"."group_entity" USING btree ("tenant_id","parent_entity_id");--> statement-breakpoint
CREATE INDEX "idx_hedge_test_relationship" ON "erp"."hedge_effectiveness_test" USING btree ("tenant_id","hedge_relationship_id");--> statement-breakpoint
CREATE INDEX "idx_hedge_test_date" ON "erp"."hedge_effectiveness_test" USING btree ("tenant_id","test_date");--> statement-breakpoint
CREATE INDEX "idx_hedge_test_result" ON "erp"."hedge_effectiveness_test" USING btree ("tenant_id","result");--> statement-breakpoint
CREATE INDEX "idx_hedge_company" ON "erp"."hedge_relationship" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_hedge_instrument" ON "erp"."hedge_relationship" USING btree ("tenant_id","hedging_instrument_id");--> statement-breakpoint
CREATE INDEX "idx_hedge_status" ON "erp"."hedge_relationship" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ic_agreement_pair_tenant" ON "erp"."ic_agreement" USING btree ("tenant_id","seller_company_id","buyer_company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_ic_loan_number_tenant" ON "erp"."ic_loan" USING btree ("tenant_id","loan_number");--> statement-breakpoint
CREATE INDEX "idx_ic_loan_lender_tenant" ON "erp"."ic_loan" USING btree ("tenant_id","lender_company_id");--> statement-breakpoint
CREATE INDEX "idx_ic_loan_borrower_tenant" ON "erp"."ic_loan" USING btree ("tenant_id","borrower_company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ic_settlement_line_tx_tenant" ON "erp"."ic_settlement_line" USING btree ("tenant_id","settlement_id","transaction_id");--> statement-breakpoint
CREATE INDEX "idx_ic_settlement_line_settlement" ON "erp"."ic_settlement_line" USING btree ("tenant_id","settlement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ic_settlement_number_tenant" ON "erp"."ic_settlement" USING btree ("tenant_id","settlement_number");--> statement-breakpoint
CREATE INDEX "idx_ic_settlement_agreement_tenant" ON "erp"."ic_settlement" USING btree ("tenant_id","agreement_id");--> statement-breakpoint
CREATE INDEX "idx_ic_settlement_status_tenant" ON "erp"."ic_settlement" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ic_leg_tx_side_tenant" ON "erp"."ic_transaction_leg" USING btree ("tenant_id","transaction_id","side");--> statement-breakpoint
CREATE INDEX "idx_ic_tx_agreement_tenant" ON "erp"."ic_transaction" USING btree ("tenant_id","agreement_id");--> statement-breakpoint
CREATE INDEX "idx_ic_tx_status_tenant" ON "erp"."ic_transaction" USING btree ("tenant_id","settlement_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_intangible_asset_number" ON "erp"."intangible_asset" USING btree ("tenant_id","company_id","asset_number");--> statement-breakpoint
CREATE INDEX "idx_intangible_company" ON "erp"."intangible_asset" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_intangible_category" ON "erp"."intangible_asset" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_lease_contract_number_tenant" ON "erp"."lease_contract" USING btree ("tenant_id","lease_number");--> statement-breakpoint
CREATE INDEX "idx_lease_contract_company_tenant" ON "erp"."lease_contract" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_lease_contract_status" ON "erp"."lease_contract" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_lease_modification_contract_tenant" ON "erp"."lease_modification" USING btree ("tenant_id","lease_contract_id");--> statement-breakpoint
CREATE INDEX "idx_lease_schedule_contract_tenant" ON "erp"."lease_schedule" USING btree ("tenant_id","lease_contract_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ledger_name_company_tenant" ON "erp"."ledger" USING btree ("tenant_id","company_id","name");--> statement-breakpoint
CREATE INDEX "idx_mapping_rule_version_rule" ON "erp"."mapping_rule_version" USING btree ("tenant_id","rule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mapping_rule_version" ON "erp"."mapping_rule_version" USING btree ("tenant_id","rule_id","version_number");--> statement-breakpoint
CREATE INDEX "idx_mapping_rule_company" ON "erp"."mapping_rule" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_mapping_rule_event" ON "erp"."mapping_rule" USING btree ("tenant_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_mapping_rule_status" ON "erp"."mapping_rule" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_match_tolerance_tenant" ON "erp"."match_tolerance" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_match_tolerance_scope" ON "erp"."match_tolerance" USING btree ("tenant_id","scope");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ocr_job_tenant_checksum" ON "erp"."ocr_job" USING btree ("tenant_id","checksum");--> statement-breakpoint
CREATE INDEX "idx_ocr_job_tenant_status" ON "erp"."ocr_job" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_ownership_parent_tenant" ON "erp"."ownership_record" USING btree ("tenant_id","parent_entity_id");--> statement-breakpoint
CREATE INDEX "idx_ownership_child_tenant" ON "erp"."ownership_record" USING btree ("tenant_id","child_entity_id");--> statement-breakpoint
CREATE INDEX "idx_ownership_effective" ON "erp"."ownership_record" USING btree ("tenant_id","effective_from","effective_to");--> statement-breakpoint
CREATE INDEX "idx_payment_terms_line_template" ON "erp"."payment_terms_line" USING btree ("tenant_id","template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payment_terms_line_order" ON "erp"."payment_terms_line" USING btree ("tenant_id","template_id","line_number");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payment_terms_code_tenant" ON "erp"."payment_terms_template" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_project_billing_project_tenant" ON "erp"."project_billing" USING btree ("tenant_id","project_id");--> statement-breakpoint
CREATE INDEX "idx_project_cost_project_tenant" ON "erp"."project_cost_line" USING btree ("tenant_id","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_project_code_tenant" ON "erp"."project" USING btree ("tenant_id","project_code");--> statement-breakpoint
CREATE INDEX "idx_project_company_tenant" ON "erp"."project" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_project_status_tenant" ON "erp"."project" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_provision_movement_provision_tenant" ON "erp"."provision_movement" USING btree ("tenant_id","provision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_provision_number_tenant" ON "erp"."provision" USING btree ("tenant_id","provision_number");--> statement-breakpoint
CREATE INDEX "idx_provision_company_tenant" ON "erp"."provision" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_provision_type_status" ON "erp"."provision" USING btree ("tenant_id","provision_type","status");--> statement-breakpoint
CREATE INDEX "idx_recognition_milestone_contract_tenant" ON "erp"."recognition_milestone" USING btree ("tenant_id","contract_id");--> statement-breakpoint
CREATE INDEX "idx_recurring_template_tenant_active" ON "erp"."recurring_template" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_recurring_template_next_run" ON "erp"."recurring_template" USING btree ("tenant_id","next_run_date") WHERE is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_revenue_contract_number_tenant" ON "erp"."revenue_contract" USING btree ("tenant_id","contract_number");--> statement-breakpoint
CREATE INDEX "idx_revenue_contract_company_tenant" ON "erp"."revenue_contract" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_revenue_contract_status_tenant" ON "erp"."revenue_contract" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_acct_group_config" ON "erp"."supplier_account_group_config" USING btree ("tenant_id","account_group");--> statement-breakpoint
CREATE INDEX "idx_supplier_bank_supplier" ON "erp"."supplier_bank_account" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_blacklist_supplier" ON "erp"."supplier_blacklist" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_blacklist_active" ON "erp"."supplier_blacklist" USING btree ("tenant_id","supplier_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_supplier_block_hist_supplier" ON "erp"."supplier_block_history" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_block_hist_block" ON "erp"."supplier_block_history" USING btree ("tenant_id","block_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_block_supplier" ON "erp"."supplier_block" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_block_active" ON "erp"."supplier_block" USING btree ("tenant_id","supplier_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_company_override" ON "erp"."supplier_company_override" USING btree ("tenant_id","supplier_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_co_override_supplier" ON "erp"."supplier_company_override" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_compliance_supplier" ON "erp"."supplier_compliance_item" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_compliance_type" ON "erp"."supplier_compliance_item" USING btree ("tenant_id","supplier_id","item_type");--> statement-breakpoint
CREATE INDEX "idx_supplier_contact_supplier" ON "erp"."supplier_contact" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_contact_site" ON "erp"."supplier_contact" USING btree ("tenant_id","supplier_id","site_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_dispute_supplier" ON "erp"."supplier_dispute" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_dispute_status" ON "erp"."supplier_dispute" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_supplier_diversity_supplier" ON "erp"."supplier_diversity" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_diversity" ON "erp"."supplier_diversity" USING btree ("tenant_id","supplier_id","diversity_code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_doc_req" ON "erp"."supplier_doc_requirement" USING btree ("tenant_id","account_group","doc_type","country_code");--> statement-breakpoint
CREATE INDEX "idx_supplier_doc_req_group" ON "erp"."supplier_doc_requirement" USING btree ("tenant_id","account_group");--> statement-breakpoint
CREATE INDEX "idx_supplier_doc_supplier" ON "erp"."supplier_document" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_doc_category" ON "erp"."supplier_document" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX "idx_supplier_dup_suspect_a" ON "erp"."supplier_duplicate_suspect" USING btree ("tenant_id","supplier_a_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_dup_suspect_b" ON "erp"."supplier_duplicate_suspect" USING btree ("tenant_id","supplier_b_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_dup_suspect_status" ON "erp"."supplier_duplicate_suspect" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_eval_criteria_code" ON "erp"."supplier_eval_criteria" USING btree ("tenant_id","template_id","code");--> statement-breakpoint
CREATE INDEX "idx_supplier_eval_criteria_tpl" ON "erp"."supplier_eval_criteria" USING btree ("tenant_id","template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_eval_score" ON "erp"."supplier_eval_score" USING btree ("evaluation_id","criteria_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_eval_score_eval" ON "erp"."supplier_eval_score" USING btree ("evaluation_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_eval_tpl_tenant" ON "erp"."supplier_eval_template" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_supplier_eval_supplier" ON "erp"."supplier_evaluation" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_eval_status" ON "erp"."supplier_evaluation" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_supplier_legal_doc_supplier" ON "erp"."supplier_legal_document" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_legal_doc_type" ON "erp"."supplier_legal_document" USING btree ("tenant_id","supplier_id","doc_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_notif_pref" ON "erp"."supplier_notification_pref" USING btree ("tenant_id","supplier_id","channel");--> statement-breakpoint
CREATE INDEX "idx_supplier_risk_supplier" ON "erp"."supplier_risk_indicator" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_risk_active" ON "erp"."supplier_risk_indicator" USING btree ("tenant_id","supplier_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_site_code" ON "erp"."supplier_site" USING btree ("tenant_id","supplier_id","site_code");--> statement-breakpoint
CREATE INDEX "idx_supplier_site_supplier" ON "erp"."supplier_site" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_tax_reg_supplier" ON "erp"."supplier_tax_registration" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_tax_reg" ON "erp"."supplier_tax_registration" USING btree ("tenant_id","supplier_id","tax_type","issuing_country");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_user" ON "erp"."supplier_user" USING btree ("tenant_id","supplier_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_user_user" ON "erp"."supplier_user" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_code_tenant" ON "erp"."supplier" USING btree ("tenant_id","company_id","code");--> statement-breakpoint
CREATE INDEX "idx_supplier_status_tenant" ON "erp"."supplier" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_supplier_company_tenant" ON "erp"."supplier" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_parent" ON "erp"."supplier" USING btree ("tenant_id","parent_supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_account_group" ON "erp"."supplier" USING btree ("tenant_id","account_group");--> statement-breakpoint
CREATE INDEX "idx_supplier_category" ON "erp"."supplier" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX "idx_supplier_onboarding" ON "erp"."supplier" USING btree ("tenant_id","onboarding_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tax_code_tenant_code" ON "erp"."tax_code" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_tax_code_country_tenant" ON "erp"."tax_code" USING btree ("tenant_id","country_code");--> statement-breakpoint
CREATE INDEX "idx_tax_rate_code_tenant" ON "erp"."tax_rate" USING btree ("tenant_id","tax_code_id");--> statement-breakpoint
CREATE INDEX "idx_tax_rate_jurisdiction_tenant" ON "erp"."tax_rate" USING btree ("tenant_id","jurisdiction_code");--> statement-breakpoint
CREATE INDEX "idx_tax_return_jurisdiction_tenant" ON "erp"."tax_return_period" USING btree ("tenant_id","jurisdiction_code");--> statement-breakpoint
CREATE INDEX "idx_tax_return_status_tenant" ON "erp"."tax_return_period" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_tp_benchmark_policy" ON "erp"."tp_benchmark" USING btree ("tenant_id","policy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tp_benchmark_year" ON "erp"."tp_benchmark" USING btree ("tenant_id","policy_id","benchmark_year");--> statement-breakpoint
CREATE INDEX "idx_tp_policy_company" ON "erp"."tp_policy" USING btree ("tenant_id","company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_wht_cert_number_tenant" ON "erp"."wht_certificate" USING btree ("tenant_id","certificate_number");--> statement-breakpoint
CREATE INDEX "idx_wht_cert_payee_tenant" ON "erp"."wht_certificate" USING btree ("tenant_id","payee_id");--> statement-breakpoint
CREATE INDEX "idx_wht_cert_status_tenant" ON "erp"."wht_certificate" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_idempotency_tenant_key_cmd" ON "erp"."idempotency_store" USING btree ("tenant_id","idempotency_key","command_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_company_code_tenant" ON "platform"."company" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_outbox_unprocessed" ON "erp"."outbox" USING btree ("tenant_id","created_at") WHERE "erp"."outbox"."processed_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tenant_slug" ON "platform"."tenant" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_email_tenant" ON "platform"."user" USING btree ("tenant_id","email");