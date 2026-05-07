-- ============================================================
-- SplitwiseR — Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text unique not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Groups ──────────────────────────────────────────────────
create table groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  type        text not null default 'other' check (type in ('trip','home','community','other')),
  description text,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── Group Members ───────────────────────────────────────────
create table group_members (
  id        uuid primary key default uuid_generate_v4(),
  group_id  uuid not null references groups(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('admin','member')),
  joined_at timestamptz default now(),
  unique (group_id, user_id)
);

-- ─── Expenses ────────────────────────────────────────────────
create table expenses (
  id         uuid primary key default uuid_generate_v4(),
  group_id   uuid not null references groups(id) on delete cascade,
  paid_by    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  amount     numeric(10,2) not null check (amount > 0),
  category   text not null default 'other'
             check (category in ('food','transport','home','entertainment','community','other')),
  notes      text,
  date       date not null default current_date,
  created_at timestamptz default now()
);

-- ─── Expense Splits ──────────────────────────────────────────
create table expense_splits (
  id          uuid primary key default uuid_generate_v4(),
  expense_id  uuid not null references expenses(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  amount      numeric(10,2) not null check (amount >= 0),
  settled     boolean not null default false,
  settled_at  timestamptz,
  unique (expense_id, user_id)
);

-- ─── Community Fees ──────────────────────────────────────────
create table community_fees (
  id          uuid primary key default uuid_generate_v4(),
  group_id    uuid not null references groups(id) on delete cascade,
  name        text not null,
  amount      numeric(10,2) not null check (amount > 0),
  frequency   text not null default 'monthly'
              check (frequency in ('monthly','quarterly','annually','one_time')),
  description text,
  active      boolean not null default true,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz default now()
);

-- ─── Settlements ─────────────────────────────────────────────
create table settlements (
  id           uuid primary key default uuid_generate_v4(),
  group_id     uuid not null references groups(id) on delete cascade,
  from_user_id uuid not null references profiles(id) on delete cascade,
  to_user_id   uuid not null references profiles(id) on delete cascade,
  amount       numeric(10,2) not null check (amount > 0),
  settled_at   timestamptz default now()
);

-- ─── Row Level Security ──────────────────────────────────────
alter table profiles       enable row level security;
alter table groups         enable row level security;
alter table group_members  enable row level security;
alter table expenses       enable row level security;
alter table expense_splits enable row level security;
alter table community_fees enable row level security;
alter table settlements    enable row level security;

-- Profiles: users can read all, write their own
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Groups: only members can see
create policy "groups_select" on groups for select
  using (exists (select 1 from group_members where group_id = groups.id and user_id = auth.uid()));
create policy "groups_insert" on groups for insert with check (created_by = auth.uid());
create policy "groups_update" on groups for update
  using (exists (select 1 from group_members where group_id = groups.id and user_id = auth.uid() and role = 'admin'));

-- Group members
create policy "members_select" on group_members for select
  using (exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid()));
create policy "members_insert" on group_members for insert
  with check (
    user_id = auth.uid() or
    exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid() and gm.role = 'admin')
  );

-- Expenses
create policy "expenses_select" on expenses for select
  using (exists (select 1 from group_members where group_id = expenses.group_id and user_id = auth.uid()));
create policy "expenses_insert" on expenses for insert
  with check (exists (select 1 from group_members where group_id = expenses.group_id and user_id = auth.uid()));

-- Expense splits
create policy "splits_select" on expense_splits for select
  using (exists (
    select 1 from expenses e
    join group_members gm on gm.group_id = e.group_id
    where e.id = expense_splits.expense_id and gm.user_id = auth.uid()
  ));
create policy "splits_insert" on expense_splits for insert with check (true);
create policy "splits_update" on expense_splits for update
  using (user_id = auth.uid() or exists (
    select 1 from expenses e
    join group_members gm on gm.group_id = e.group_id
    where e.id = expense_splits.expense_id and gm.user_id = auth.uid() and gm.role = 'admin'
  ));

-- Community fees
create policy "fees_select" on community_fees for select
  using (exists (select 1 from group_members where group_id = community_fees.group_id and user_id = auth.uid()));
create policy "fees_insert" on community_fees for insert
  with check (exists (select 1 from group_members where group_id = community_fees.group_id and user_id = auth.uid() and role = 'admin'));
create policy "fees_update" on community_fees for update
  using (exists (select 1 from group_members where group_id = community_fees.group_id and user_id = auth.uid() and role = 'admin'));

-- Settlements
create policy "settlements_select" on settlements for select
  using (from_user_id = auth.uid() or to_user_id = auth.uid());
create policy "settlements_insert" on settlements for insert
  with check (from_user_id = auth.uid());

-- ─── Indexes ─────────────────────────────────────────────────
create index on group_members (user_id);
create index on group_members (group_id);
create index on expenses (group_id);
create index on expenses (paid_by);
create index on expenses (date desc);
create index on expense_splits (expense_id);
create index on expense_splits (user_id);
create index on community_fees (group_id);
create index on settlements (from_user_id);
create index on settlements (to_user_id);
