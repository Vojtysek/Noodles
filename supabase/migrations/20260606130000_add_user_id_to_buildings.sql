-- Tie buildings (the onboarding "project") to the authenticated user.
alter table buildings
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();

-- Safety net: make sure the other recently-added columns exist regardless of
-- migration-history drift on the remote.
alter table buildings add column if not exists costs_by_project jsonb;
alter table buildings add column if not exists selected_scenario text;

alter table buildings enable row level security;

drop policy if exists "buildings_select_own" on buildings;
create policy "buildings_select_own"
  on buildings for select
  using (auth.uid() = user_id);

drop policy if exists "buildings_insert_own" on buildings;
create policy "buildings_insert_own"
  on buildings for insert
  with check (auth.uid() = user_id);

drop policy if exists "buildings_update_own" on buildings;
create policy "buildings_update_own"
  on buildings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "buildings_delete_own" on buildings;
create policy "buildings_delete_own"
  on buildings for delete
  using (auth.uid() = user_id);
