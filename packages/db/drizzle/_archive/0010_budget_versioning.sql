-- Migration 0010: Budget Version Tracking (A-19)
--
-- Adds version + version_note columns to erp.budget_entry for audit-grade
-- budget revision history. Version auto-increments on upsert conflict.
--
-- Zero-downtime: additive nullable column + NOT NULL with static default

ALTER TABLE erp.budget_entry
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

ALTER TABLE erp.budget_entry
  ADD COLUMN IF NOT EXISTS version_note text;
