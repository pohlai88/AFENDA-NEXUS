CREATE TYPE "public"."sender_type" AS ENUM('SUPPLIER', 'BUYER');--> statement-breakpoint
CREATE TABLE "erp"."supplier_message_thread" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"subject" varchar(255) NOT NULL,
	"last_message_at" timestamp with time zone NOT NULL,
	"last_message_by" uuid NOT NULL,
	"supplier_unread_count" integer DEFAULT 0 NOT NULL,
	"buyer_unread_count" integer DEFAULT 0 NOT NULL,
	"is_supplier_archived" boolean DEFAULT false NOT NULL,
	"is_buyer_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp"."supplier_message" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"body" text NOT NULL,
	"sender_type" "sender_type" NOT NULL,
	"sender_id" uuid NOT NULL,
	"read_at" timestamp with time zone,
	"read_by" uuid,
	"attachment_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"idempotency_key" varchar(64),
	"proof_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "erp"."supplier_message_thread" ADD CONSTRAINT "supplier_message_thread_case_id_supplier_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "erp"."supplier_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_message_thread" ADD CONSTRAINT "supplier_message_thread_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "erp"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp"."supplier_message" ADD CONSTRAINT "supplier_message_thread_id_supplier_message_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "erp"."supplier_message_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_message_thread_case" ON "erp"."supplier_message_thread" USING btree ("tenant_id","case_id");--> statement-breakpoint
CREATE INDEX "idx_message_thread_supplier" ON "erp"."supplier_message_thread" USING btree ("tenant_id","supplier_id");--> statement-breakpoint
CREATE INDEX "idx_message_thread_last_msg" ON "erp"."supplier_message_thread" USING btree ("tenant_id","last_message_at");--> statement-breakpoint
CREATE INDEX "idx_message_thread" ON "erp"."supplier_message" USING btree ("tenant_id","thread_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_message_sender" ON "erp"."supplier_message" USING btree ("tenant_id","sender_id");--> statement-breakpoint
CREATE INDEX "idx_message_idempotency" ON "erp"."supplier_message" USING btree ("idempotency_key");