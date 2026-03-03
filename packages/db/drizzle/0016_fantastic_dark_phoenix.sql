CREATE TYPE "public"."case_category" AS ENUM('PAYMENT', 'INVOICE', 'COMPLIANCE', 'DELIVERY', 'QUALITY', 'ONBOARDING', 'GENERAL', 'ESCALATION');--> statement-breakpoint
CREATE TYPE "public"."case_linked_entity_type" AS ENUM('INVOICE', 'PAYMENT', 'DOCUMENT', 'COMPLIANCE', 'PO');--> statement-breakpoint
CREATE TYPE "public"."case_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('DRAFT', 'SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_INFO', 'RESOLVED', 'CLOSED', 'REOPENED');--> statement-breakpoint
CREATE TYPE "public"."case_timeline_entry_type" AS ENUM('status', 'message', 'attachment', 'escalation', 'sla_breach', 'payment', 'match', 'system');--> statement-breakpoint
CREATE TYPE "public"."compliance_alert_type" AS ENUM('EXPIRING_30D', 'EXPIRING_14D', 'EXPIRING_7D', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."department" AS ENUM('ACCOUNTS_PAYABLE', 'PROCUREMENT', 'COMPLIANCE', 'FINANCE_MANAGEMENT', 'EXECUTIVE', 'OPERATIONS', 'LEGAL');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('HQ', 'WAREHOUSE', 'BILLING', 'SHIPPING', 'BRANCH');--> statement-breakpoint
CREATE TYPE "public"."onboarding_step" AS ENUM('company_info', 'bank_details', 'kyc_documents', 'tax_registration', 'review');--> statement-breakpoint
CREATE TYPE "public"."portal_actor_type" AS ENUM('SUPPLIER', 'BUYER', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."proof_event_type" AS ENUM('MESSAGE_SENT', 'MESSAGE_READ', 'CASE_CREATED', 'CASE_STATUS_CHANGED', 'CASE_ASSIGNED', 'CASE_RESOLVED', 'CASE_REOPENED', 'ESCALATION_TRIGGERED', 'ESCALATION_RESOLVED', 'DOCUMENT_UPLOADED', 'DOCUMENT_SHARED', 'DOCUMENT_SIGNED', 'BANK_ACCOUNT_PROPOSED', 'BANK_ACCOUNT_APPROVED', 'BANK_ACCOUNT_REJECTED', 'PAYMENT_STATUS_CHANGED', 'INVOICE_SUBMITTED', 'INVOICE_STATUS_CHANGED', 'COMPLIANCE_UPLOADED', 'COMPLIANCE_VERIFIED', 'COMPLIANCE_RENEWED', 'ONBOARDING_SUBMITTED', 'ONBOARDING_APPROVED', 'ONBOARDING_REJECTED', 'DAILY_ANCHOR');--> statement-breakpoint
CREATE TABLE "erp"."portal_communication_proof" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"chain_position" bigint NOT NULL,
	"event_type" "proof_event_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"actor_id" uuid NOT NULL,
	"actor_type" "portal_actor_type" NOT NULL,
	"event_at" timestamp with time zone NOT NULL,
	"payload_canonical" jsonb,
	"content_hash" varchar(64) NOT NULL,
	"previous_hash" varchar(64),
	"payload_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."portal_communication_proof" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."portal_company_location" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"location_type" "location_type" NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state_province" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(2) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"primary_contact_name" varchar(255),
	"primary_contact_email" varchar(255),
	"primary_contact_phone" varchar(50),
	"business_hours_start" time,
	"business_hours_end" time,
	"timezone" varchar(50),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."portal_company_location" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."portal_directory_entry" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"department" "department" NOT NULL,
	"email_address" varchar(255) NOT NULL,
	"show_full_email" boolean DEFAULT false NOT NULL,
	"phone_number" varchar(50),
	"show_phone" boolean DEFAULT false NOT NULL,
	"availability" varchar(255),
	"timezone" varchar(50),
	"bio" text,
	"is_escalation_contact" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."portal_directory_entry" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."portal_supplier_invitation" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"supplier_name" varchar(255) NOT NULL,
	"token" varchar(64) NOT NULL,
	"token_expires_at" timestamp with time zone NOT NULL,
	"status" "invitation_status" DEFAULT 'PENDING' NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"supplier_id" uuid,
	"invited_by" uuid NOT NULL,
	"invitation_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portal_supplier_invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "erp"."portal_supplier_invitation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_case_timeline" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"case_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entry_type" "case_timeline_entry_type" NOT NULL,
	"ref_id" uuid,
	"ref_type" varchar(80),
	"actor_id" uuid NOT NULL,
	"actor_type" "portal_actor_type" NOT NULL,
	"content" jsonb,
	"proof_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_case_timeline" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_case" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_number" varchar(30) NOT NULL,
	"supplier_id" uuid NOT NULL,
	"category" "case_category" NOT NULL,
	"priority" "case_priority" DEFAULT 'MEDIUM' NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" "case_status" DEFAULT 'DRAFT' NOT NULL,
	"assigned_to" uuid,
	"co_assignees" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"linked_entity_id" uuid,
	"linked_entity_type" "case_linked_entity_type",
	"sla_deadline" timestamp with time zone,
	"resolution" text,
	"root_cause" text,
	"corrective_action" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"escalation_id" uuid,
	"proof_chain_head" varchar(64),
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_case" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_compliance_alert_log" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"compliance_item_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"alert_type" "compliance_alert_type" NOT NULL,
	"alerted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_compliance_alert_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "erp"."supplier_onboarding_submission" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"current_step" "onboarding_step" DEFAULT 'company_info' NOT NULL,
	"completed_steps" "onboarding_step"[] DEFAULT '{}'::onboarding_step[] NOT NULL,
	"company_info_draft" jsonb,
	"bank_details_draft" jsonb,
	"kyc_documents_draft" jsonb,
	"tax_registration_draft" jsonb,
	"is_submitted" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone,
	"submitted_by" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"proof_chain_head" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_onboarding_submission" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "erp"."supplier_case_timeline" ADD CONSTRAINT "supplier_case_timeline_case_id_supplier_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "erp"."supplier_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_case" ADD CONSTRAINT "supplier_case_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_compliance_alert_log" ADD CONSTRAINT "supplier_compliance_alert_log_compliance_item_id_supplier_compliance_item_id_fk" FOREIGN KEY ("compliance_item_id") REFERENCES "erp"."supplier_compliance_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_compliance_alert_log" ADD CONSTRAINT "supplier_compliance_alert_log_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_onboarding_submission" ADD CONSTRAINT "supplier_onboarding_submission_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_proof_chain_position" ON "erp"."portal_communication_proof" USING btree ("tenant_id","chain_position");--> statement-breakpoint
CREATE INDEX "idx_proof_entity" ON "erp"."portal_communication_proof" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_proof_chain_tenant" ON "erp"."portal_communication_proof" USING btree ("tenant_id","chain_position");--> statement-breakpoint
CREATE INDEX "idx_proof_event_type" ON "erp"."portal_communication_proof" USING btree ("tenant_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_portal_company_location_tenant" ON "erp"."portal_company_location" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_portal_company_location_type" ON "erp"."portal_company_location" USING btree ("tenant_id","location_type");--> statement-breakpoint
CREATE INDEX "idx_portal_directory_tenant" ON "erp"."portal_directory_entry" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_portal_directory_department" ON "erp"."portal_directory_entry" USING btree ("tenant_id","department");--> statement-breakpoint
CREATE INDEX "idx_portal_directory_escalation" ON "erp"."portal_directory_entry" USING btree ("tenant_id","is_escalation_contact");--> statement-breakpoint
CREATE INDEX "idx_portal_invitation_token" ON "erp"."portal_supplier_invitation" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_portal_invitation_email" ON "erp"."portal_supplier_invitation" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "idx_portal_invitation_status" ON "erp"."portal_supplier_invitation" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_case_timeline_case" ON "erp"."supplier_case_timeline" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_case_timeline_tenant" ON "erp"."supplier_case_timeline" USING btree ("tenant_id","case_id");--> statement-breakpoint
CREATE INDEX "idx_case_timeline_entry_type" ON "erp"."supplier_case_timeline" USING btree ("case_id","entry_type");--> statement-breakpoint
CREATE INDEX "idx_case_timeline_ref" ON "erp"."supplier_case_timeline" USING btree ("ref_type","ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_case_ticket" ON "erp"."supplier_case" USING btree ("tenant_id","ticket_number");--> statement-breakpoint
CREATE INDEX "idx_supplier_case_supplier" ON "erp"."supplier_case" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_supplier_case_status" ON "erp"."supplier_case" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_supplier_case_category" ON "erp"."supplier_case" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX "idx_supplier_case_priority" ON "erp"."supplier_case" USING btree ("tenant_id","priority");--> statement-breakpoint
CREATE INDEX "idx_supplier_case_assigned" ON "erp"."supplier_case" USING btree ("tenant_id","assigned_to");--> statement-breakpoint
CREATE INDEX "idx_supplier_case_sla" ON "erp"."supplier_case" USING btree ("tenant_id","sla_deadline");--> statement-breakpoint
CREATE INDEX "idx_supplier_case_linked" ON "erp"."supplier_case" USING btree ("tenant_id","linked_entity_type","linked_entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_compliance_alert_item_type" ON "erp"."supplier_compliance_alert_log" USING btree ("tenant_id","compliance_item_id","alert_type");--> statement-breakpoint
CREATE INDEX "idx_compliance_alert_supplier" ON "erp"."supplier_compliance_alert_log" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_onboarding_supplier" ON "erp"."supplier_onboarding_submission" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_onboarding_tenant" ON "erp"."supplier_onboarding_submission" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_onboarding_submitted" ON "erp"."supplier_onboarding_submission" USING btree ("tenant_id","is_submitted");