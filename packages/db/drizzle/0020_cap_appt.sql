-- CAP-APPT (P27): Appointment Scheduling — portal_meeting_request
-- Phase 1.2.6 | Migration 0020

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_request_status') THEN
    CREATE TYPE meeting_request_status AS ENUM (
      'REQUESTED',
      'CONFIRMED',
      'COMPLETED',
      'CANCELLED'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_type') THEN
    CREATE TYPE meeting_type AS ENUM (
      'VIRTUAL',
      'IN_PERSON'
    );
  END IF;
END $$;

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS erp.portal_meeting_request (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id           uuid        NOT NULL,
  requested_by        varchar(255) NOT NULL,
  supplier_id         varchar(36) NOT NULL,
  requested_with      varchar(36),
  meeting_type        meeting_type NOT NULL DEFAULT 'VIRTUAL',
  agenda              text        NOT NULL,
  location            varchar(500),
  proposed_times      jsonb       NOT NULL DEFAULT '[]',
  confirmed_time      timestamptz,
  duration_minutes    varchar(10)  NOT NULL DEFAULT '30',
  case_id             varchar(36),
  escalation_id       varchar(36),
  status              meeting_request_status NOT NULL DEFAULT 'REQUESTED',
  cancellation_reason text,
  buyer_notes         text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE erp.portal_meeting_request ENABLE ROW LEVEL SECURITY;

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_meeting_supplier
  ON erp.portal_meeting_request (tenant_id, supplier_id);

CREATE INDEX IF NOT EXISTS idx_meeting_status
  ON erp.portal_meeting_request (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_meeting_requested_with
  ON erp.portal_meeting_request (tenant_id, requested_with)
  WHERE requested_with IS NOT NULL;
