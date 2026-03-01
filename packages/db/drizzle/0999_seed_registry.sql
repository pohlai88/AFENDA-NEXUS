-- Seed Run Registry (Composite Uniqueness per Branch/Tenant)
-- Tracks database seeding runs for idempotency across Neon branches and tenants

CREATE TABLE IF NOT EXISTS platform.seed_run (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  seed_key TEXT NOT NULL,
  branch_name TEXT NOT NULL DEFAULT 'main',
  tenant_id UUID REFERENCES platform.tenant(id) ON DELETE CASCADE,
  seed_hash TEXT NOT NULL,
  seed_version TEXT NOT NULL,
  depth TEXT NOT NULL,
  months INTEGER NOT NULL,
  scenarios JSONB NOT NULL,
  created_by TEXT,
  seeded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Composite uniqueness: can seed different branches/tenants independently
  CONSTRAINT uq_seed_run_key_branch_tenant UNIQUE (seed_key, branch_name, tenant_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_seed_run_branch ON platform.seed_run(branch_name);
CREATE INDEX idx_seed_run_tenant ON platform.seed_run(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_seed_run_seeded_at ON platform.seed_run(seeded_at DESC);

-- Comments for documentation
COMMENT ON TABLE platform.seed_run IS 'Tracks database seeding runs for idempotency (per branch/tenant)';
COMMENT ON COLUMN platform.seed_run.seed_key IS 'Logical seed identifier (e.g. demo:v1)';
COMMENT ON COLUMN platform.seed_run.branch_name IS 'Neon branch name (from NEON_BRANCH_NAME or GIT_BRANCH env)';
COMMENT ON COLUMN platform.seed_run.tenant_id IS 'NULL for system seeds, tenant-specific otherwise';
COMMENT ON COLUMN platform.seed_run.seed_hash IS 'SHA256 hash of config (depth/months/scenarios/version)';
COMMENT ON COLUMN platform.seed_run.seed_version IS 'Semantic version of seed implementation';
COMMENT ON COLUMN platform.seed_run.depth IS 'Seeding depth: minimal | standard | comprehensive';
COMMENT ON COLUMN platform.seed_run.months IS 'Number of months of transactional data seeded';
COMMENT ON COLUMN platform.seed_run.scenarios IS 'Array of scenario names executed (e.g. ["baseline", "late-payments"])';
