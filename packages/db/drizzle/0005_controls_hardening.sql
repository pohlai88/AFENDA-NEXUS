-- Phase 8: Internal Controls & Data Architecture Hardening
-- Adds optimistic concurrency version columns to high-contention entities.
-- No new tables — ALTER statements only.

-- ─── DA-03: Optimistic concurrency columns ───────────────────────────────────

ALTER TABLE erp.gl_balance
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

ALTER TABLE erp.fiscal_period
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

ALTER TABLE erp.bank_reconciliation
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

ALTER TABLE erp.cost_allocation_run
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- ─── DA-09: Partition-ready indexes ──────────────────────────────────────────
-- These indexes support future RANGE partitioning on fiscal_period columns.
-- The actual PARTITION BY ALTER is data-volume-dependent and should be applied
-- per the computePartitionStrategy() output when row counts exceed thresholds.

CREATE INDEX IF NOT EXISTS idx_gl_journal_line_period
  ON erp.gl_journal_line (tenant_id, fiscal_period);

CREATE INDEX IF NOT EXISTS idx_gl_balance_period
  ON erp.gl_balance (tenant_id, fiscal_year, fiscal_period);
