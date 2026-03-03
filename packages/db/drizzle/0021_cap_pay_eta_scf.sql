-- SP-3005: CAP-PAY-ETA — supplier_payment_status_fact (§7.2)
-- SP-3008: CAP-SCF    — early_payment_offer (§5 Phase 1.4)
-- Migration: 0021_cap_pay_eta_scf

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE erp.payment_stage AS ENUM (
  'SCHEDULED',
  'APPROVED',
  'PROCESSING',
  'SENT',
  'CLEARED',
  'ON_HOLD',
  'REJECTED'
);

CREATE TYPE erp.payment_source AS ENUM (
  'BANK_FILE',
  'ERP',
  'MANUAL_OVERRIDE'
);

CREATE TYPE erp.hold_reason AS ENUM (
  'APPROVAL_PENDING',
  'COMPLIANCE_EXPIRED',
  'MISMATCH_3WAY',
  'BANK_REJECTED',
  'TAX_VALIDATION_FAILED',
  'PAYMENT_RUN_NOT_SCHEDULED',
  'MANUAL_HOLD',
  'FRAUD_SUSPICION'
);

-- ─── supplier_payment_status_fact ───────────────────────────────────────────

CREATE TABLE erp.supplier_payment_status_fact (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                UUID NOT NULL,
  payment_run_id           UUID NOT NULL,
  invoice_id               UUID,
  supplier_id              UUID NOT NULL,
  stage                    erp.payment_stage NOT NULL,
  previous_stage           erp.payment_stage,
  event_at                 TIMESTAMPTZ NOT NULL,
  source                   erp.payment_source NOT NULL,
  source_precedence        SMALLINT NOT NULL,
  reference                VARCHAR(255),
  hold_reason              erp.hold_reason,
  supplier_visible_label   VARCHAR(120),
  next_action_href         VARCHAR(512),
  note                     TEXT,
  linked_case_id           UUID,
  is_under_review          BOOLEAN NOT NULL DEFAULT false,
  hold_duration_days       INTEGER,
  created_by               UUID NOT NULL,
  created_by_type          erp.portal_actor_type NOT NULL DEFAULT 'SYSTEM',
  proof_payload_canonical  JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE erp.supplier_payment_status_fact ENABLE ROW LEVEL SECURITY;

-- Indexes (§7.2 indexing strategy)
CREATE INDEX sppsf_payment_run_idx ON erp.supplier_payment_status_fact (tenant_id, payment_run_id);
CREATE INDEX sppsf_invoice_idx     ON erp.supplier_payment_status_fact (tenant_id, invoice_id);
CREATE INDEX sppsf_supplier_idx    ON erp.supplier_payment_status_fact (tenant_id, supplier_id);
CREATE INDEX sppsf_case_idx        ON erp.supplier_payment_status_fact (linked_case_id) WHERE linked_case_id IS NOT NULL;
CREATE INDEX sppsf_event_at_idx    ON erp.supplier_payment_status_fact (tenant_id, payment_run_id, event_at);

-- ─── early_payment_offer (CAP-SCF P3) ───────────────────────────────────────

CREATE TABLE erp.early_payment_offer (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                     UUID NOT NULL,
  invoice_id                    UUID NOT NULL,
  supplier_id                   UUID NOT NULL,
  offer_expires_at              TIMESTAMPTZ NOT NULL,
  proposed_payment_date         TIMESTAMPTZ NOT NULL,
  original_due_date             TIMESTAMPTZ NOT NULL,
  discount_bps                  INTEGER NOT NULL,
  apr_bps                       INTEGER NOT NULL,
  pricing_type                  VARCHAR(10) NOT NULL DEFAULT 'APR',
  invoice_amount_minor          VARCHAR(30) NOT NULL,
  discount_amount_minor         VARCHAR(30) NOT NULL,
  net_payment_amount_minor      VARCHAR(30) NOT NULL,
  currency                      VARCHAR(3) NOT NULL,
  status                        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  accepted_at                   TIMESTAMPTZ,
  accepted_by_portal_user_id    UUID,
  gl_config_ref                 VARCHAR(100),
  is_immutable                  BOOLEAN NOT NULL DEFAULT false,
  created_by                    UUID NOT NULL,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE erp.early_payment_offer ENABLE ROW LEVEL SECURITY;

CREATE INDEX epo_invoice_idx  ON erp.early_payment_offer (tenant_id, invoice_id);
CREATE INDEX epo_supplier_idx ON erp.early_payment_offer (tenant_id, supplier_id);
CREATE INDEX epo_status_idx   ON erp.early_payment_offer (tenant_id, status);

-- ─── portal-registry update ─────────────────────────────────────────────────
-- SP-3005 (CAP-PAY-ETA supplier_payment_status_fact) → done
-- SP-3008 (CAP-SCF early_payment_offer)              → done
