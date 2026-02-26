-- Migration: 0016_drop_legacy_auth
-- Description: Drop legacy Better Auth tables superseded by Neon Auth.
--              Tables were created in 0007, 0008, and 0009.
-- Date: 2026-02-26

-- Drop tables with foreign-key dependencies first, then parent tables.

DROP TABLE IF EXISTS "platform"."auth_invitation"   CASCADE;
DROP TABLE IF EXISTS "platform"."auth_member"       CASCADE;
DROP TABLE IF EXISTS "platform"."auth_organization" CASCADE;
DROP TABLE IF EXISTS "platform"."auth_two_factor"   CASCADE;
DROP TABLE IF EXISTS "platform"."auth_passkey"      CASCADE;
DROP TABLE IF EXISTS "platform"."auth_apikey"       CASCADE;
DROP TABLE IF EXISTS "platform"."auth_session"      CASCADE;
DROP TABLE IF EXISTS "platform"."auth_account"      CASCADE;
DROP TABLE IF EXISTS "platform"."auth_verification" CASCADE;
DROP TABLE IF EXISTS "platform"."auth_user"         CASCADE;
