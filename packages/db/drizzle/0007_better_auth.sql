-- Better Auth tables in the platform schema.
-- Core: auth_user, auth_session, auth_account, auth_verification
-- Organization plugin: auth_organization, auth_member, auth_invitation
-- TwoFactor plugin: columns on auth_user (two_factor_secret, two_factor_backup_codes, two_factor_enabled)

CREATE TABLE "platform"."auth_user" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean NOT NULL DEFAULT false,
	"image" text,
	"two_factor_secret" text,
	"two_factor_backup_codes" text,
	"two_factor_enabled" boolean DEFAULT false,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_auth_user_email" ON "platform"."auth_user" USING btree ("email");
--> statement-breakpoint

CREATE TABLE "platform"."auth_session" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL REFERENCES "platform"."auth_user"("id") ON DELETE cascade,
	"active_organization_id" text,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_auth_session_token" ON "platform"."auth_session" USING btree ("token");
--> statement-breakpoint
CREATE INDEX "idx_auth_session_user" ON "platform"."auth_session" USING btree ("user_id");
--> statement-breakpoint

CREATE TABLE "platform"."auth_account" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "platform"."auth_user"("id") ON DELETE cascade,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone NOT NULL DEFAULT now(),
	"updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_auth_account_user" ON "platform"."auth_account" USING btree ("user_id");
--> statement-breakpoint

CREATE TABLE "platform"."auth_verification" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE "platform"."auth_organization" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"metadata" text,
	"created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_auth_org_slug" ON "platform"."auth_organization" USING btree ("slug");
--> statement-breakpoint

CREATE TABLE "platform"."auth_member" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "platform"."auth_organization"("id") ON DELETE cascade,
	"user_id" uuid NOT NULL REFERENCES "platform"."auth_user"("id") ON DELETE cascade,
	"role" text NOT NULL DEFAULT 'member',
	"created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_auth_member_org" ON "platform"."auth_member" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "idx_auth_member_user" ON "platform"."auth_member" USING btree ("user_id");
--> statement-breakpoint

CREATE TABLE "platform"."auth_invitation" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"organization_id" uuid NOT NULL REFERENCES "platform"."auth_organization"("id") ON DELETE cascade,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL DEFAULT 'pending',
	"expires_at" timestamp with time zone NOT NULL,
	"inviter_id" uuid NOT NULL REFERENCES "platform"."auth_user"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX "idx_auth_invitation_org" ON "platform"."auth_invitation" USING btree ("organization_id");
