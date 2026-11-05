-- Persist the X OAuth PKCE verifier alongside the one-time state.
-- The verifier is random, short-lived (10 minutes), and deleted on callback consumption.
alter table public.oauth_states add column if not exists code_verifier text;
