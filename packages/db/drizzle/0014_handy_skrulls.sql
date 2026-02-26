-- Ensure erp.current_company_id() exists (from 0013; idempotent for migration order)
CREATE OR REPLACE FUNCTION erp.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT NULLIF(current_setting('app.company_id', true), '')::uuid;
$$;
GRANT EXECUTE ON FUNCTION erp.current_company_id() TO app_runtime;
--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('INVOICE', 'RECEIPT', 'CONTRACT', 'BANK_STATEMENT', 'BOARD_MINUTES', 'TAX_NOTICE', 'VALUATION_REPORT', 'LEGAL_OPINION', 'INSURANCE_POLICY', 'CORRESPONDENCE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('PENDING_UPLOAD', 'STORED', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."integrity_status" AS ENUM('PENDING', 'VERIFIED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."linked_entity_type" AS ENUM('JOURNAL', 'AP_INVOICE', 'AR_INVOICE', 'FIXED_ASSET', 'LEASE_CONTRACT', 'EXPENSE_CLAIM', 'BANK_RECONCILIATION', 'TAX_RETURN', 'PROVISION', 'IC_TRANSACTION');--> statement-breakpoint
CREATE TYPE "public"."scan_status" AS ENUM('NOT_SCANNED', 'CLEAN', 'SUSPECT', 'FAILED');--> statement-breakpoint
CREATE TABLE "erp"."document_attachment" (
	"document_id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"key_version" smallint DEFAULT 1 NOT NULL,
	"bucket" text NOT NULL,
	"storage_key" text NOT NULL,
	"provider" text DEFAULT 'R2' NOT NULL,
	"file_name" text NOT NULL,
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
DROP INDEX "erp"."idx_outbox_unprocessed";--> statement-breakpoint
ALTER TABLE "erp"."document_link" ADD CONSTRAINT "document_link_document_id_document_attachment_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "erp"."document_attachment"("document_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_attachment_tenant_checksum" ON "erp"."document_attachment" USING btree ("tenant_id","checksum_sha256") WHERE "erp"."document_attachment"."deleted_at" IS NULL AND "erp"."document_attachment"."checksum_sha256" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_document_attachment_tenant_status" ON "erp"."document_attachment" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_document_attachment_tenant_checksum_lookup" ON "erp"."document_attachment" USING btree ("tenant_id","checksum_sha256");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_document_link_tenant_entity_doc" ON "erp"."document_link" USING btree ("tenant_id","entity_type","entity_id","document_id");--> statement-breakpoint
CREATE INDEX "idx_document_link_tenant_entity" ON "erp"."document_link" USING btree ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_document_link_tenant_document" ON "erp"."document_link" USING btree ("tenant_id","document_id");--> statement-breakpoint
CREATE INDEX "idx_outbox_unprocessed" ON "erp"."outbox" USING btree ("tenant_id","created_at") WHERE "erp"."outbox"."processed_at" IS NULL;

-- RLS for document tables (tenant isolation + company-scoped for document_link)
ALTER TABLE "erp"."document_attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."document_attachment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "erp"."document_attachment";
CREATE POLICY "tenant_isolation" ON "erp"."document_attachment"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id())
  WITH CHECK ("tenant_id" = erp.current_tenant_id());

ALTER TABLE "erp"."document_link" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "erp"."document_link" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON "erp"."document_link";
CREATE POLICY "tenant_isolation" ON "erp"."document_link"
  FOR ALL TO app_runtime
  USING ("tenant_id" = erp.current_tenant_id()
    AND (erp.current_company_id() IS NULL OR "linked_company_id" IS NULL OR "linked_company_id" = erp.current_company_id()))
  WITH CHECK ("tenant_id" = erp.current_tenant_id()
    AND (erp.current_company_id() IS NULL OR "linked_company_id" IS NULL OR "linked_company_id" = erp.current_company_id()));