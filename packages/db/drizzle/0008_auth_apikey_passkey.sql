-- Migration: 0008_auth_apikey_passkey
-- Description: Add API Key and Passkey plugin tables for Better Auth
-- Date: 2025-07-16

-- ── API Key Plugin ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "platform"."auth_apikey" (
    "id"                      uuid          PRIMARY KEY DEFAULT uuid_generate_v7(),
    "name"                    text,
    "start"                   text,
    "prefix"                  text,
    "key"                     text          NOT NULL,
    "user_id"                 uuid          NOT NULL REFERENCES "platform"."auth_user"("id") ON DELETE CASCADE,
    "refill_interval"         integer,
    "refill_amount"           integer,
    "last_refill_at"          timestamptz,
    "enabled"                 boolean       DEFAULT true,
    "rate_limit_enabled"      boolean       DEFAULT true,
    "rate_limit_time_window"  integer,
    "rate_limit_max"          integer,
    "request_count"           integer       DEFAULT 0,
    "remaining"               integer,
    "last_request"            timestamptz,
    "expires_at"              timestamptz,
    "created_at"              timestamptz   NOT NULL DEFAULT now(),
    "updated_at"              timestamptz   NOT NULL DEFAULT now(),
    "permissions"             text,
    "metadata"                text
);

CREATE INDEX IF NOT EXISTS "idx_auth_apikey_key"  ON "platform"."auth_apikey" ("key");
CREATE INDEX IF NOT EXISTS "idx_auth_apikey_user" ON "platform"."auth_apikey" ("user_id");

-- ── Passkey Plugin ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "platform"."auth_passkey" (
    "id"              uuid          PRIMARY KEY DEFAULT uuid_generate_v7(),
    "name"            text,
    "public_key"      text          NOT NULL,
    "user_id"         uuid          NOT NULL REFERENCES "platform"."auth_user"("id") ON DELETE CASCADE,
    "credential_id"   text          NOT NULL,
    "counter"         integer       NOT NULL,
    "device_type"     text          NOT NULL,
    "backed_up"       boolean       NOT NULL,
    "transports"      text,
    "created_at"      timestamptz   DEFAULT now(),
    "aaguid"          text
);

CREATE INDEX IF NOT EXISTS "idx_auth_passkey_user"       ON "platform"."auth_passkey" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_auth_passkey_credential" ON "platform"."auth_passkey" ("credential_id");
