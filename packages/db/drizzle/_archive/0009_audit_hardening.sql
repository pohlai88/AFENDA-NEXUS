-- Migration 0009: AIS Audit Hardening (P0/P1)
--
-- A-13: Add reversed_by_id column to gl_journal for bidirectional reversal linkage
-- A-04: Add FK constraint ensuring journal line accounts exist in the accounts table
--
-- Zero-downtime: all operations are additive (nullable column + FK NOT VALID + VALIDATE)

-- ── A-13: reversed_by_id on gl_journal ──────────────────────────────────────

ALTER TABLE erp.gl_journal
  ADD COLUMN IF NOT EXISTS reversed_by_id uuid;

-- Self-referential FK: reversal_of_id → gl_journal.id (already existed as column, add FK)
ALTER TABLE erp.gl_journal
  ADD CONSTRAINT fk_journal_reversal_of
  FOREIGN KEY (reversal_of_id) REFERENCES erp.gl_journal(id)
  NOT VALID;

ALTER TABLE erp.gl_journal
  VALIDATE CONSTRAINT fk_journal_reversal_of;

-- Self-referential FK: reversed_by_id → gl_journal.id
ALTER TABLE erp.gl_journal
  ADD CONSTRAINT fk_journal_reversed_by
  FOREIGN KEY (reversed_by_id) REFERENCES erp.gl_journal(id)
  NOT VALID;

ALTER TABLE erp.gl_journal
  VALIDATE CONSTRAINT fk_journal_reversed_by;

-- Index for reverse lookups
CREATE INDEX IF NOT EXISTS idx_journal_reversal_of
  ON erp.gl_journal (reversal_of_id) WHERE reversal_of_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_journal_reversed_by
  ON erp.gl_journal (reversed_by_id) WHERE reversed_by_id IS NOT NULL;

-- ── A-04: FK constraint journal_line.account_id → account.id ────────────────

ALTER TABLE erp.gl_journal_line
  ADD CONSTRAINT fk_journal_line_account
  FOREIGN KEY (account_id) REFERENCES erp.account(id)
  NOT VALID;

ALTER TABLE erp.gl_journal_line
  VALIDATE CONSTRAINT fk_journal_line_account;
