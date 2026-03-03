CREATE TYPE "public"."announcement_severity" AS ENUM('INFO', 'WARNING', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."ap_invoice_type" AS ENUM('STANDARD', 'DEBIT_MEMO', 'CREDIT_MEMO', 'PREPAYMENT');--> statement-breakpoint
CREATE TYPE "public"."hold_reason" AS ENUM('APPROVAL_PENDING', 'COMPLIANCE_EXPIRED', 'MISMATCH_3WAY', 'BANK_REJECTED', 'TAX_VALIDATION_FAILED', 'PAYMENT_RUN_NOT_SCHEDULED', 'MANUAL_HOLD', 'FRAUD_SUSPICION');--> statement-breakpoint
CREATE TYPE "public"."meeting_request_status" AS ENUM('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."meeting_type" AS ENUM('VIRTUAL', 'IN_PERSON');--> statement-breakpoint
CREATE TYPE "public"."payment_source" AS ENUM('BANK_FILE', 'ERP', 'MANUAL_OVERRIDE');--> statement-breakpoint
CREATE TYPE "public"."payment_stage" AS ENUM('SCHEDULED', 'APPROVED', 'PROCESSING', 'SENT', 'CLEARED', 'ON_HOLD', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."portal_webhook_status" AS ENUM('ACTIVE', 'PAUSED', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TABLE "erp"."early_payment_offer" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"offer_expires_at" timestamp with time zone NOT NULL,
	"proposed_payment_date" timestamp with time zone NOT NULL,
	"original_due_date" timestamp with time zone NOT NULL,
	"discount_bps" integer NOT NULL,
	"apr_bps" integer NOT NULL,
	"pricing_type" varchar(10) DEFAULT 'APR' NOT NULL,
	"invoice_amount_minor" varchar(30) NOT NULL,
	"discount_amount_minor" varchar(30) NOT NULL,
	"net_payment_amount_minor" varchar(30) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by_portal_user_id" uuid,
	"gl_config_ref" varchar(100),
	"is_immutable" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."early_payment_offer" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."portal_announcement" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"body" text NOT NULL,
	"severity" "announcement_severity" DEFAULT 'INFO' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"created_by" varchar(255) NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portal_brand_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"portal_display_name" text,
	"logo_url" text,
	"logo_alt_text" text,
	"primary_color" text,
	"primary_foreground_color" text,
	"accent_color" text,
	"support_email" text,
	"support_phone" text,
	"support_url" text,
	"created_by" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_brand_config_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "erp"."portal_meeting_request" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"requested_by" varchar(255) NOT NULL,
	"supplier_id" varchar(36) NOT NULL,
	"requested_with" varchar(36),
	"meeting_type" "meeting_type" DEFAULT 'VIRTUAL' NOT NULL,
	"agenda" text NOT NULL,
	"location" varchar(500),
	"proposed_times" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"confirmed_time" timestamp with time zone,
	"duration_minutes" varchar(10) DEFAULT '30' NOT NULL,
	"case_id" varchar(36),
	"escalation_id" varchar(36),
	"status" "meeting_request_status" DEFAULT 'REQUESTED' NOT NULL,
	"cancellation_reason" text,
	"buyer_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."portal_meeting_request" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "portal_webhook_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"label" text NOT NULL,
	"endpoint_url" text NOT NULL,
	"signing_secret" text NOT NULL,
	"event_types" text NOT NULL,
	"status" "portal_webhook_status" DEFAULT 'ACTIVE' NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_delivered_at" timestamp with time zone,
	"last_failed_at" timestamp with time zone,
	"last_failure_reason" text,
	"created_by" text NOT NULL,
	"paused_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."supplier_payment_status_fact" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"payment_run_id" uuid NOT NULL,
	"invoice_id" uuid,
	"supplier_id" uuid NOT NULL,
	"stage" "payment_stage" NOT NULL,
	"previous_stage" "payment_stage",
	"event_at" timestamp with time zone NOT NULL,
	"source" "payment_source" NOT NULL,
	"source_precedence" smallint NOT NULL,
	"reference" varchar(255),
	"hold_reason" "hold_reason",
	"supplier_visible_label" varchar(120),
	"next_action_href" varchar(512),
	"note" text,
	"linked_case_id" uuid,
	"is_under_review" boolean DEFAULT false NOT NULL,
	"hold_duration_days" integer,
	"created_by" uuid NOT NULL,
	"created_by_type" "portal_actor_type" DEFAULT 'SYSTEM' NOT NULL,
	"proof_payload_canonical" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_payment_status_fact" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice" ADD COLUMN "invoice_type" "ap_invoice_type" DEFAULT 'STANDARD' NOT NULL;--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice" ADD COLUMN "original_invoice_id" uuid;--> statement-breakpoint
CREATE INDEX "epo_invoice_idx" ON "erp"."early_payment_offer" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE INDEX "epo_supplier_idx" ON "erp"."early_payment_offer" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "epo_status_idx" ON "erp"."early_payment_offer" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_announcement_tenant_active" ON "erp"."portal_announcement" USING btree ("tenant_id","archived_at","valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "idx_announcement_pinned" ON "erp"."portal_announcement" USING btree ("tenant_id","pinned","archived_at");--> statement-breakpoint
CREATE INDEX "idx_announcement_severity" ON "erp"."portal_announcement" USING btree ("tenant_id","severity");--> statement-breakpoint
CREATE INDEX "idx_meeting_supplier" ON "erp"."portal_meeting_request" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_meeting_status" ON "erp"."portal_meeting_request" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_meeting_requested_with" ON "erp"."portal_meeting_request" USING btree ("tenant_id","requested_with");--> statement-breakpoint
CREATE INDEX "sppsf_payment_run_idx" ON "erp"."supplier_payment_status_fact" USING btree ("tenant_id","payment_run_id");--> statement-breakpoint
CREATE INDEX "sppsf_invoice_idx" ON "erp"."supplier_payment_status_fact" USING btree ("tenant_id","invoice_id");--> statement-breakpoint
CREATE INDEX "sppsf_supplier_idx" ON "erp"."supplier_payment_status_fact" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "sppsf_case_idx" ON "erp"."supplier_payment_status_fact" USING btree ("linked_case_id");--> statement-breakpoint
CREATE INDEX "sppsf_event_at_idx" ON "erp"."supplier_payment_status_fact" USING btree ("tenant_id","payment_run_id","event_at");--> statement-breakpoint
ALTER TABLE "erp"."ap_invoice" ADD CONSTRAINT "ap_invoice_original_invoice_id_ap_invoice_id_fk" FOREIGN KEY ("original_invoice_id") REFERENCES "erp"."ap_invoice"("id") ON DELETE set null ON UPDATE no action;