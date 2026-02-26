-- 0020: W2-10 — Approval policy versioning
-- Add version column to approval_policy, add policy snapshot columns to approval_request

ALTER TABLE "erp"."approval_policy"
  ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1;

ALTER TABLE "erp"."approval_request"
  ADD COLUMN IF NOT EXISTS "policy_id" uuid,
  ADD COLUMN IF NOT EXISTS "policy_version" integer;
