-- Aura Tracking releases schema + policies

create table if not exists public.releases (
  id bigint primary key generated always as identity,
  quota integer not null,
  sequence integer not null,
  material_type_id bigint references public.material_types(id) on delete cascade,
  planned_mass decimal(10,2),
  model_grade decimal(10,2),
  planned_grade decimal(10,2),
  status equipment_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_releases_updated_at
before update on public.releases
for each row execute procedure public.set_updated_at();

alter table public.releases enable row level security;

create policy "releases-select-authenticated"
  on public.releases
  for select
  using (auth.uid() is not null);

create policy "releases-admin-write"
  on public.releases
  for all
  using (jwt_role() = 'admin')
  with check (jwt_role() = 'admin');