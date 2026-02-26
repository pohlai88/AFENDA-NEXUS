-- 0011_approval_workflow.sql
-- GAP-A2: Multi-level approval workflow tables
-- Configurable approval policies, requests, and steps for threshold-based routing.
-- Manual migration (drizzle-kit broken by BigInt serialization issue).

-- Add PENDING_APPROVAL to the journal_status enum for approval workflow support
ALTER TYPE journal_status ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL' BEFORE 'POSTED';

CREATE TABLE erp.approval_policy (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL,
  company_id uuid,
  entity_type text NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE erp.approval_request (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  requested_by text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'PENDING',
  current_step_index int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz
);

CREATE TABLE erp.approval_step (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  request_id uuid NOT NULL REFERENCES erp.approval_request(id),
  step_index int NOT NULL,
  approver_id text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  decided_at timestamptz,
  reason text,
  delegated_to text
);

-- Indexes
CREATE INDEX idx_approval_policy_tenant_entity ON erp.approval_policy (tenant_id, entity_type);
CREATE INDEX idx_approval_request_entity ON erp.approval_request (tenant_id, entity_type, entity_id);
CREATE INDEX idx_approval_request_status ON erp.approval_request (tenant_id, status);
CREATE INDEX idx_approval_step_approver ON erp.approval_step (approver_id, status);
CREATE INDEX idx_approval_step_request ON erp.approval_step (request_id);

-- RLS
ALTER TABLE erp.approval_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.approval_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp.approval_step ENABLE ROW LEVEL SECURITY;

CREATE POLICY approval_policy_tenant_isolation ON erp.approval_policy
  USING (tenant_id = erp.current_tenant_id());

CREATE POLICY approval_request_tenant_isolation ON erp.approval_request
  USING (tenant_id = erp.current_tenant_id());

-- approval_step uses request_id FK; RLS is enforced via the parent request's tenant isolation
-- For direct queries, join through approval_request.
