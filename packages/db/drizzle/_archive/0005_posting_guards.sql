-- 0005_posting_guards: Split posting triggers + full immutability on POSTED/REVERSED/VOIDED
-- BEFORE trigger: sets metadata (posted_at, posted_by)
-- DEFERRABLE AFTER trigger: validates journal balance (sum debits = sum credits)

-- ─── BEFORE trigger: posting metadata ───────────────────────────────────────

CREATE OR REPLACE FUNCTION erp.trg_journal_before_post()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Immutability: prevent updates on POSTED/REVERSED/VOIDED journals
  IF TG_OP = 'UPDATE' AND OLD.status IN ('POSTED', 'REVERSED', 'VOIDED') THEN
    -- Allow only status transitions: POSTED→REVERSED, POSTED→VOIDED
    IF NEW.status = OLD.status THEN
      RAISE EXCEPTION 'Cannot modify a % journal', OLD.status;
    END IF;
    IF OLD.status = 'POSTED' AND NEW.status NOT IN ('REVERSED', 'VOIDED') THEN
      RAISE EXCEPTION 'POSTED journal can only transition to REVERSED or VOIDED, not %', NEW.status;
    END IF;
    IF OLD.status IN ('REVERSED', 'VOIDED') THEN
      RAISE EXCEPTION 'Cannot change status of a % journal', OLD.status;
    END IF;
  END IF;

  -- Set posting metadata when transitioning to POSTED
  IF NEW.status = 'POSTED' AND (OLD IS NULL OR OLD.status <> 'POSTED') THEN
    NEW.posted_at := now();
    NEW.posted_by := erp.current_user_id();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_journal_before_post
  BEFORE INSERT OR UPDATE ON "erp"."gl_journal"
  FOR EACH ROW
  EXECUTE FUNCTION erp.trg_journal_before_post();

-- ─── DEFERRABLE AFTER trigger: balance validation ───────────────────────────

CREATE OR REPLACE FUNCTION erp.trg_journal_after_post()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_debit_sum bigint;
  v_credit_sum bigint;
BEGIN
  -- Only validate when journal is being posted
  IF NEW.status <> 'POSTED' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
  INTO v_debit_sum, v_credit_sum
  FROM "erp"."gl_journal_line"
  WHERE journal_id = NEW.id AND tenant_id = NEW.tenant_id;

  IF v_debit_sum <> v_credit_sum THEN
    RAISE EXCEPTION 'Journal % is unbalanced: debits=% credits=%',
      NEW.journal_number, v_debit_sum, v_credit_sum;
  END IF;

  IF v_debit_sum = 0 THEN
    RAISE EXCEPTION 'Journal % has no lines', NEW.journal_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_journal_after_post
  AFTER INSERT OR UPDATE ON "erp"."gl_journal"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION erp.trg_journal_after_post();

-- ─── Immutability on journal lines (prevent changes after posting) ──────────

CREATE OR REPLACE FUNCTION erp.trg_journal_line_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
  FROM "erp"."gl_journal"
  WHERE id = COALESCE(OLD.journal_id, NEW.journal_id)
    AND tenant_id = COALESCE(OLD.tenant_id, NEW.tenant_id);

  IF v_status IN ('POSTED', 'REVERSED', 'VOIDED') THEN
    RAISE EXCEPTION 'Cannot modify lines of a % journal', v_status;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_journal_line_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON "erp"."gl_journal_line"
  FOR EACH ROW
  EXECUTE FUNCTION erp.trg_journal_line_immutable();

-- ─── Grant execute on trigger functions ─────────────────────────────────────

GRANT EXECUTE ON FUNCTION erp.trg_journal_before_post() TO app_runtime;
GRANT EXECUTE ON FUNCTION erp.trg_journal_after_post() TO app_runtime;
GRANT EXECUTE ON FUNCTION erp.trg_journal_line_immutable() TO app_runtime;
