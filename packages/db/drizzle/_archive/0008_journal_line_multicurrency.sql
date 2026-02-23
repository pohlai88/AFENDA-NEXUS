-- Migration: 0008_journal_line_multicurrency
-- Adds: currency_code, base_currency_amount to erp.gl_journal_line
-- Purpose: IAS 21 dual-amount journal lines (transaction currency + functional currency)
-- Date: 2026-02-23

-- ─── 1. Add currency_code column (nullable for backward compat, then backfill) ──
ALTER TABLE erp.gl_journal_line
  ADD COLUMN IF NOT EXISTS currency_code varchar(3);

-- ─── 2. Add base_currency_amount column (functional currency equivalent) ────────
-- When NULL, it means the line is already in base currency (debit/credit ARE the base amounts)
ALTER TABLE erp.gl_journal_line
  ADD COLUMN IF NOT EXISTS base_currency_debit bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_currency_credit bigint DEFAULT 0;

-- ─── 3. Backfill: set currency_code from the ledger's base_currency ─────────────
-- For existing rows, the transaction currency IS the base currency
UPDATE erp.gl_journal_line jl
SET currency_code = c.code
FROM erp.gl_journal j
JOIN erp.ledger l ON l.id = j.ledger_id
JOIN erp.currency c ON c.id = l.currency_id
WHERE jl.journal_id = j.id
  AND jl.currency_code IS NULL;

-- ─── 4. Backfill: base_currency amounts = transaction amounts for existing rows ──
UPDATE erp.gl_journal_line
SET base_currency_debit = debit,
    base_currency_credit = credit
WHERE base_currency_debit = 0 AND base_currency_credit = 0
  AND (debit > 0 OR credit > 0);

-- ─── 5. Set NOT NULL after backfill ─────────────────────────────────────────────
-- currency_code stays nullable for safety — new code always sets it
-- base_currency columns default to 0 which is safe

-- ─── 6. Index for currency-based queries ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_journal_line_currency
  ON erp.gl_journal_line (currency_code);
