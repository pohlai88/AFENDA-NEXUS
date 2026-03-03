CREATE TYPE "public"."escalation_status" AS ENUM('ESCALATION_REQUESTED', 'ESCALATION_ASSIGNED', 'ESCALATION_IN_PROGRESS', 'ESCALATION_RESOLVED');--> statement-breakpoint
CREATE TABLE "erp"."supplier_escalation" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"triggered_by" uuid NOT NULL,
	"assigned_to" uuid,
	"assigned_at" timestamp with time zone,
	"status" "escalation_status" DEFAULT 'ESCALATION_REQUESTED' NOT NULL,
	"reason" text NOT NULL,
	"respond_by_at" timestamp with time zone NOT NULL,
	"resolve_by_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"proof_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_escalation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "erp"."supplier_escalation" ADD CONSTRAINT "supplier_escalation_case_id_supplier_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "erp"."supplier_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_escalation" ADD CONSTRAINT "supplier_escalation_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_escalation_case" ON "erp"."supplier_escalation" USING btree ("tenant_id","case_id");--> statement-breakpoint
CREATE INDEX "idx_escalation_supplier" ON "erp"."supplier_escalation" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_escalation_status" ON "erp"."supplier_escalation" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_escalation_assigned" ON "erp"."supplier_escalation" USING btree ("tenant_id","assigned_to");--> statement-breakpoint
CREATE INDEX "idx_escalation_sla" ON "erp"."supplier_escalation" USING btree ("tenant_id","resolve_by_at");