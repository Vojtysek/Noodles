-- Tie personas to authenticated users.
-- user_id is nullable to avoid breaking existing dev rows.
alter table personas
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table personas enable row level security;

drop policy if exists "personas_select_own" on personas;
create policy "personas_select_own"
  on personas for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "personas_insert_own" on personas;
create policy "personas_insert_own"
  on personas for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "personas_update_own" on personas;
create policy "personas_update_own"
  on personas for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "personas_delete_own" on personas;
create policy "personas_delete_own"
  on personas for delete to authenticated
  using (auth.uid() = user_id);
