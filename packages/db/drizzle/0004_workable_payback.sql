CREATE TYPE "public"."notification_category" AS ENUM('APPROVAL', 'SYSTEM', 'FINANCE', 'ALERT', 'ACTIVITY');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'EMAIL', 'PUSH');--> statement-breakpoint
CREATE TYPE "public"."notification_severity" AS ENUM('INFO', 'WARNING', 'CRITICAL', 'SUCCESS');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('UNREAD', 'READ', 'ARCHIVED', 'DISMISSED');--> statement-breakpoint
CREATE TABLE "platform"."notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "notification_category" NOT NULL,
	"in_app" boolean DEFAULT true NOT NULL,
	"email" boolean DEFAULT false NOT NULL,
	"push" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."notification_preferences" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "platform"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(256) NOT NULL,
	"body" text,
	"category" "notification_category" DEFAULT 'SYSTEM' NOT NULL,
	"severity" "notification_severity" DEFAULT 'INFO' NOT NULL,
	"status" "notification_status" DEFAULT 'UNREAD' NOT NULL,
	"href" varchar(512),
	"icon" varchar(64),
	"metadata" jsonb,
	"source_type" varchar(64),
	"source_id" uuid,
	"read_at" timestamp with time zone,
	"dedupe_key" varchar(256),
	"dismissed_at" timestamp with time zone,
	"company_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "notification_prefs_user_idx" ON "platform"."notification_preferences" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "platform"."notifications" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "platform"."notifications" USING btree ("tenant_id","user_id","status");--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "platform"."notifications" USING btree ("tenant_id","user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_dismissed_idx" ON "platform"."notifications" USING btree ("tenant_id","user_id","dismissed_at");