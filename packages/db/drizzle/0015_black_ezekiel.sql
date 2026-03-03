CREATE TABLE "platform"."seed_run" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"seed_key" text NOT NULL,
	"branch_name" text DEFAULT 'main' NOT NULL,
	"tenant_id" uuid,
	"seed_hash" text NOT NULL,
	"seed_version" text NOT NULL,
	"depth" text NOT NULL,
	"months" integer NOT NULL,
	"scenarios" jsonb NOT NULL,
	"created_by" text,
	"seeded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."seed_run" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform"."seed_run" ADD CONSTRAINT "seed_run_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "platform"."tenant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_seed_run_key_branch_tenant" ON "platform"."seed_run" USING btree ("seed_key","branch_name","tenant_id");--> statement-breakpoint
CREATE INDEX "idx_seed_run_branch" ON "platform"."seed_run" USING btree ("branch_name");--> statement-breakpoint
CREATE INDEX "idx_seed_run_tenant" ON "platform"."seed_run" USING btree ("tenant_id") WHERE "platform"."seed_run"."tenant_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_seed_run_seeded_at" ON "platform"."seed_run" USING btree ("seeded_at");