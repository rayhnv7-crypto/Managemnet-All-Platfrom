-- Remove unnecessary TRUNCATE privileges from browser-facing Supabase roles.
-- RLS does not restrict TRUNCATE; keep this privilege exclusively for trusted server/admin roles.
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Ensure future public tables do not inherit TRUNCATE for these roles.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE ON TABLES FROM anon, authenticated;
