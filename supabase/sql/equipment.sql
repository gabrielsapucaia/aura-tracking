-- Aura Dashboard Equipment schema + policies

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  seq_id bigint generated always as identity unique,
  name text not null,
  type_id uuid references public.equipment_types(id) on delete set null,
  status equipment_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_equipment_updated_at
before update on public.equipment
for each row execute procedure public.set_updated_at();

alter table public.equipment enable row level security;

create policy "equipment-select-authenticated"
  on public.equipment
  for select
  using (auth.uid() is not null);

create policy "equipment-admin-write"
  on public.equipment
  for all
  using (jwt_role() = 'admin')
  with check (jwt_role() = 'admin');

create or replace function public.toggle_equipment_status(eq_id uuid)
returns equipment
language plpgsql
security definer
set search_path = public as $$
declare
  role_claim text := jwt_role();
  result equipment;
begin
  if role_claim <> 'admin' then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  update public.equipment
    set status = case when status = 'active' then 'inactive' else 'active' end
    where id = eq_id
    returning * into result;

  return result;
end;
$$;

grant execute on function public.toggle_equipment_status(uuid) to authenticated;