create table if not exists public.staff (
  id uuid primary key,
  name text not null,
  active boolean not null default true
);

create table if not exists public.goal_settings (
  id int primary key,
  total_target_amount bigint not null default 0,
  start_date date not null,
  end_date date not null,
  holiday_dates date[] not null default '{}'
);

create table if not exists public.sales (
  id uuid primary key,
  staff_id uuid not null references public.staff(id),
  amount bigint not null,
  sales_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key,
  staff_id uuid not null references public.staff(id),
  checkin_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists sales_sales_date_idx on public.sales (sales_date);
create index if not exists checkins_checkin_date_idx on public.checkins (checkin_date);

insert into public.goal_settings (id, total_target_amount, start_date, end_date, holiday_dates)
values (1, 0, '2026-04-01', '2026-04-30', '{}')
on conflict (id) do nothing;

-- Security baseline: enforce RLS and remove direct API role access.
alter table public.staff enable row level security;
alter table public.goal_settings enable row level security;
alter table public.sales enable row level security;
alter table public.checkins enable row level security;

revoke all on table public.staff from anon, authenticated;
revoke all on table public.goal_settings from anon, authenticated;
revoke all on table public.sales from anon, authenticated;
revoke all on table public.checkins from anon, authenticated;
