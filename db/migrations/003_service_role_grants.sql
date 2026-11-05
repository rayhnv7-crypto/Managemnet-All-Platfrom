-- Ensure the backend service_role can access the application tables through PostgREST.
-- This is safe with RLS enabled: service_role bypasses RLS by design.
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;
