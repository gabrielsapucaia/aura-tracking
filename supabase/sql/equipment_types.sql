-- Aura Dashboard Equipment Types schema + policies

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create type if not exists public.equipment_status as enum ('active', 'inactive');

create table if not exists public.equipment_types (
  id uuid primary key default gen_random_uuid(),
  seq_id bigint generated always as identity unique,
  name text not null unique,
  description text,
  status equipment_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_equipment_types_updated_at
before update on public.equipment_types
for each row execute procedure public.set_updated_at();

alter table public.equipment_types enable row level security;

create policy "equipment_types-select-authenticated"
  on public.equipment_types
  for select
  using (auth.uid() is not null);

create policy "equipment_types-admin-write"
  on public.equipment_types
  for all
  using (jwt_role() = 'admin')
  with check (jwt_role() = 'admin');