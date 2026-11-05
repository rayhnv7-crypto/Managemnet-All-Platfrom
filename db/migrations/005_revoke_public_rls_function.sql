-- The event-trigger function is invoked by PostgreSQL DDL events, not the REST API.
-- Remove all client/API execution rights while preserving PostgreSQL's event-trigger execution.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role;
grant execute on function public.rls_auto_enable() to postgres;
