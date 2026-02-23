-- 0003_roles_grants: Application runtime roles and expanded grants
-- Roles: app_runtime (NOLOGIN) + app_runtime_login (LOGIN NOINHERIT) + GRANT WITH SET TRUE
-- No passwords in migrations — passwords set via Neon console / neonctl.

-- ─── Roles ──────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_runtime_login') THEN
    CREATE ROLE app_runtime_login LOGIN NOINHERIT;
  END IF;
END
$$;

GRANT app_runtime TO app_runtime_login WITH SET TRUE;

-- ─── Schema Usage ───────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA platform TO app_runtime;
GRANT USAGE ON SCHEMA erp TO app_runtime;
GRANT USAGE ON SCHEMA audit TO app_runtime;

-- ─── Table Grants ───────────────────────────────────────────────────────────

-- Platform tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA platform TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA erp TO app_runtime;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA audit TO app_runtime;

-- ─── Sequence Grants ────────────────────────────────────────────────────────

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA platform TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA erp TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA audit TO app_runtime;

-- ─── Function Grants ────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION erp.current_tenant_id() TO app_runtime;
GRANT EXECUTE ON FUNCTION erp.current_user_id() TO app_runtime;

-- ─── Default Privileges (for future tables) ─────────────────────────────────

ALTER DEFAULT PRIVILEGES IN SCHEMA platform GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT SELECT, INSERT ON TABLES TO app_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA platform GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA erp GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
