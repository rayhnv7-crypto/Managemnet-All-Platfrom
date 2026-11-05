-- The event-trigger function is invoked by PostgreSQL DDL events, not the REST API.
-- Remove direct RPC execution rights from client roles while preserving the trigger itself.
revoke execute on function public.rls_auto_enable() from anon, authenticated;
