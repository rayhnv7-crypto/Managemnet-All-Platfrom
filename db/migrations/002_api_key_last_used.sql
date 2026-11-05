alter table public.api_keys add column if not exists last_used_at timestamptz;
