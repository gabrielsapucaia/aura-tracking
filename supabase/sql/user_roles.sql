-- Aura Tracking user roles + permissions bootstrap

create type if not exists public.user_role as enum ('admin', 'supervisor', 'user');

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_user_roles_updated_at
before update on public.user_roles
for each row execute procedure public.set_updated_at();

alter table public.user_roles enable row level security;

create policy "user_roles-self-read"
  on public.user_roles
  for select
  using (auth.uid() = user_id);

create policy "user_roles-admin-manage"
  on public.user_roles
  for all
  using (jwt_role() = 'admin')
  with check (jwt_role() = 'admin');

insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where id not in (select user_id from public.user_roles)
limit 1;
