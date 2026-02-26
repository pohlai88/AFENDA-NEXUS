-- 0012: Add correlation_id to outbox for end-to-end request tracing
-- Spans: web → API → DB tx → outbox row → worker handler
ALTER TABLE erp.outbox ADD COLUMN correlation_id UUID;
