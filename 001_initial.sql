-- CLIPPER HUB initial schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.workspaces (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now());
create table if not exists public.connections (id uuid primary key default gen_random_uuid(), workspace_id uuid references public.workspaces(id) on delete cascade, provider text not null, status text not null default 'Pending', account_label text, token_encrypted jsonb, connected_at timestamptz, created_at timestamptz not null default now(), unique(provider));
create table if not exists public.oauth_states (state text primary key, provider text not null, code_verifier text, expires_at timestamptz not null, created_at timestamptz not null default now());
create table if not exists public.activity_logs (id uuid primary key default gen_random_uuid(), workspace_id uuid references public.workspaces(id) on delete cascade, event text not null, detail text, level text not null default 'info', created_at timestamptz not null default now());
create table if not exists public.posts (id uuid primary key default gen_random_uuid(), workspace_id uuid references public.workspaces(id) on delete cascade, caption text, media jsonb not null default '[]', platforms jsonb not null default '[]', status text not null default 'Draft', scheduled_at timestamptz, published_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.analytics_snapshots (id uuid primary key default gen_random_uuid(), workspace_id uuid references public.workspaces(id) on delete cascade, provider text not null, metric_date date not null, metrics jsonb not null default '{}', created_at timestamptz not null default now());
create table if not exists public.api_keys (id uuid primary key default gen_random_uuid(), workspace_id uuid references public.workspaces(id) on delete cascade, name text not null, key_hash text not null unique, key_prefix text not null, permissions text not null default 'read-only', revoked_at timestamptz, created_at timestamptz not null default now());
create table if not exists public.app_settings (key text primary key, value jsonb not null default '{}', updated_at timestamptz not null default now());
create index if not exists connections_provider_idx on public.connections(provider);
create index if not exists logs_created_idx on public.activity_logs(created_at desc);
create index if not exists posts_schedule_idx on public.posts(scheduled_at);
create index if not exists analytics_date_idx on public.analytics_snapshots(metric_date desc);
-- Access is server-only in this initial personal workspace setup. Do not expose service role key to browsers.
alter table public.connections enable row level security;
alter table public.oauth_states enable row level security;
alter table public.activity_logs enable row level security;
alter table public.posts enable row level security;
alter table public.analytics_snapshots enable row level security;
alter table public.api_keys enable row level security;
alter table public.app_settings enable row level security;
