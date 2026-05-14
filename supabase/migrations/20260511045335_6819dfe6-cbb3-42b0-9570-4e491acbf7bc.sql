create table public.mocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  score numeric not null default 0,
  total integer not null default 120,
  accuracy numeric not null default 0,
  percentile numeric not null default 0,
  rank integer,
  rank_mode text,
  cohort_size integer,
  sections jsonb not null default '[]'::jsonb,
  mock_date date not null default current_date,
  source text,
  mock_type text,
  difficulty text,
  tags text[] not null default array[]::text[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mocks_user_id_idx on public.mocks(user_id);
create index mocks_user_date_idx on public.mocks(user_id, mock_date desc);

alter table public.mocks enable row level security;

create policy "Users view own mocks" on public.mocks
  for select using (auth.uid() = user_id);
create policy "Users insert own mocks" on public.mocks
  for insert with check (auth.uid() = user_id);
create policy "Users update own mocks" on public.mocks
  for update using (auth.uid() = user_id);
create policy "Users delete own mocks" on public.mocks
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger mocks_set_updated_at
  before update on public.mocks
  for each row execute function public.set_updated_at();