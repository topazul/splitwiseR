-- ============================================================
-- SplitwiseR — Friends Feature Migration
-- Run this in: Supabase Dashboard > SQL Editor > New query
-- ============================================================

create table friendships (
  id          uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (requester_id, addressee_id)
);

create index on friendships (requester_id);
create index on friendships (addressee_id);
create index on friendships (status);

alter table friendships enable row level security;

-- Anyone can see friendships they are part of
create policy "friendships_select" on friendships for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());

-- Only the requester can create a friendship request
create policy "friendships_insert" on friendships for insert
  with check (requester_id = auth.uid());

-- Only the addressee can accept/decline; requester can delete
create policy "friendships_update" on friendships for update
  using (addressee_id = auth.uid());

create policy "friendships_delete" on friendships for delete
  using (requester_id = auth.uid() or addressee_id = auth.uid());