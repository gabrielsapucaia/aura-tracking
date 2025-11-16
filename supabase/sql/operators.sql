-- Aura Dashboard Operators schema + policies

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create type if not exists public.operator_status as enum ('active', 'inactive');

create table if not exists public.operators (
  id uuid primary key default gen_random_uuid(),
  seq_id bigint generated always as identity unique,
  name text not null,
  pin text not null check (pin ~ '^\\d{4}$'),
  status operator_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger trg_operators_updated_at
before update on public.operators
for each row execute procedure public.set_updated_at();

alter table public.operators enable row level security;

create or replace function public.jwt_role()
returns text language sql stable as $$
  select coalesce(current_setting('request.jwt.claims', true)::json->>'role', '')
$$;

create policy "operators-select-authenticated"
  on public.operators
  for select
  using (auth.uid() is not null);

create policy "operators-admin-write"
  on public.operators
  for all
  using (jwt_role() = 'admin')
  with check (jwt_role() = 'admin');

create or replace function public.toggle_operator_status(op_id uuid)
returns operators
language plpgsql
security definer
set search_path = public as $$
declare
  role_claim text := jwt_role();
  result operators;
begin
  if role_claim <> 'admin' then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  update public.operators
    set status = case when status = 'active' then 'inactive' else 'active' end
    where id = op_id
    returning * into result;

  return result;
end;
$$;

grant execute on function public.toggle_operator_status(uuid) to authenticated;
