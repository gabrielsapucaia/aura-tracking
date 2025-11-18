-- Aura Tracking material types schema + policies

-- Create the set_updated_at function if it doesn't exist
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- Create the jwt_role function if it doesn't exist
create or replace function public.jwt_role()
returns text language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::json->>'role', '')
$$;

create table if not exists public.material_types (
  id uuid primary key default gen_random_uuid(),
  seq_id bigint generated always as identity unique,
  name text not null unique,
  description text,
  status equipment_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_material_types_updated_at
before update on public.material_types
for each row execute procedure public.set_updated_at();

alter table public.material_types enable row level security;

create policy "material_types-select-authenticated"
  on public.material_types
  for select
  using (auth.uid() is not null);

create policy "material_types-admin-write"
  on public.material_types
  for all
  using (jwt_role() = 'admin')
  with check (jwt_role() = 'admin');