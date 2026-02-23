-- 0002_context_helpers: Typed getter functions for RLS policies
-- These functions read SET LOCAL variables set by the application layer.

-- erp.current_tenant_id() — returns the tenant_id from session context
CREATE OR REPLACE FUNCTION erp.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid;
$$;

-- erp.current_user_id() — returns the user_id from session context
CREATE OR REPLACE FUNCTION erp.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid;
$$;

COMMENT ON FUNCTION erp.current_tenant_id() IS 'Returns tenant_id from SET LOCAL app.tenant_id — used in RLS policies';
COMMENT ON FUNCTION erp.current_user_id() IS 'Returns user_id from SET LOCAL app.user_id — used in RLS policies';
