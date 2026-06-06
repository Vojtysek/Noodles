-- User-created archetype types, isolated per authenticated user.
-- Mirrors the built-in Archetype shape from lib/archetypes.ts plus user_id.
create table if not exists user_archetypes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subtitle text not null,
  description text not null,
  profile jsonb not null,
  image_path text,
  ai_hint text,
  created_at timestamptz not null default now()
);

create index if not exists user_archetypes_user_id_idx on user_archetypes(user_id);

alter table user_archetypes enable row level security;

drop policy if exists "user_archetypes_select_own" on user_archetypes;
create policy "user_archetypes_select_own"
  on user_archetypes for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_archetypes_insert_own" on user_archetypes;
create policy "user_archetypes_insert_own"
  on user_archetypes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_archetypes_update_own" on user_archetypes;
create policy "user_archetypes_update_own"
  on user_archetypes for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_archetypes_delete_own" on user_archetypes;
create policy "user_archetypes_delete_own"
  on user_archetypes for delete to authenticated
  using (auth.uid() = user_id);
