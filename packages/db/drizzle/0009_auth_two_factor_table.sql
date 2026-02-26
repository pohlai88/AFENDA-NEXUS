-- Migration: 0009_auth_two_factor_table
-- Description: Create separate auth_two_factor table for Better Auth 2FA plugin.
--              Moves secret + backup_codes from auth_user to dedicated table.
-- Date: 2026-02-25

-- ── Create the twoFactor table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "platform"."auth_two_factor" (
    "id"            uuid    PRIMARY KEY DEFAULT uuid_generate_v7(),
    "secret"        text,
    "backup_codes"  text,
    "user_id"       uuid    NOT NULL REFERENCES "platform"."auth_user"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_auth_two_factor_user"
    ON "platform"."auth_two_factor" ("user_id");

-- ── Migrate existing 2FA data from auth_user → auth_two_factor ──────────────

INSERT INTO "platform"."auth_two_factor" ("user_id", "secret", "backup_codes")
SELECT "id", "two_factor_secret", "two_factor_backup_codes"
FROM "platform"."auth_user"
WHERE "two_factor_secret" IS NOT NULL
   OR "two_factor_backup_codes" IS NOT NULL;

-- ── Drop old columns from auth_user ─────────────────────────────────────────

ALTER TABLE "platform"."auth_user" DROP COLUMN IF EXISTS "two_factor_secret";
ALTER TABLE "platform"."auth_user" DROP COLUMN IF EXISTS "two_factor_backup_codes";
