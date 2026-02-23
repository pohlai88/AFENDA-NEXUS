-- Migration: 0007_outbox_notify
-- Adds: LISTEN/NOTIFY trigger on erp.outbox for real-time event processing
-- Date: 2026-02-23

-- ─── Trigger function: notify on outbox insert ──────────────────────────────
CREATE OR REPLACE FUNCTION erp.outbox_notify()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('outbox_new', NEW.id::text);
  RETURN NEW;
END;
$$;

-- ─── Trigger: fire after each insert on erp.outbox ─────────────────────────
DROP TRIGGER IF EXISTS trg_outbox_notify ON erp.outbox;
CREATE TRIGGER trg_outbox_notify
  AFTER INSERT ON erp.outbox
  FOR EACH ROW
  EXECUTE FUNCTION erp.outbox_notify();

-- ─── Grants ─────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION erp.outbox_notify() TO app_runtime;
