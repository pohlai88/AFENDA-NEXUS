CREATE TYPE "public"."announcement_severity" AS ENUM('INFO', 'WARNING', 'CRITICAL');--> statement-breakpoint
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
ALTER TABLE "erp"."portal_announcement" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_announcement_tenant_active" ON "erp"."portal_announcement" USING btree ("tenant_id","archived_at","valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "idx_announcement_pinned" ON "erp"."portal_announcement" USING btree ("tenant_id","pinned","archived_at");--> statement-breakpoint
CREATE INDEX "idx_announcement_severity" ON "erp"."portal_announcement" USING btree ("tenant_id","severity");
