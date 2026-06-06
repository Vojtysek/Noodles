-- Add user_archetype_id so strategies can be cached for user-created archetypes,
-- following the same pattern as the archetype column added in 20260606170000.

-- 1. Add nullable FK column
alter table persona_strategies
  add column user_archetype_id uuid references user_archetypes(id) on delete cascade;

-- 2. Unique constraint for (user_archetype_id, project_id) pairs
alter table persona_strategies
  add constraint persona_strategies_user_archetype_project_id_key
  unique (user_archetype_id, project_id);
-- PostgreSQL unique constraints ignore NULLs, so this only fires when both are non-null.

-- 3. Extend the XOR check to cover the new column
alter table persona_strategies
  drop constraint persona_strategies_persona_or_archetype_check;

alter table persona_strategies
  add constraint persona_strategies_persona_or_archetype_check
  check (persona_id is not null or archetype is not null or user_archetype_id is not null);
