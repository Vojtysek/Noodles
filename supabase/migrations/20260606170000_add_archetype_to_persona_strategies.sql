-- Add archetype support to persona_strategies table
-- This allows storing strategies for archetypes (not just personas)

-- 1. Add nullable archetype column
alter table persona_strategies
  add column archetype text;

-- 2. Make persona_id nullable (archetypes don't have persona records)
alter table persona_strategies
  alter column persona_id drop not null;

-- 3. Add partial unique constraint for archetype+project_id combos
alter table persona_strategies
  add constraint persona_strategies_archetype_project_id_key
  unique (archetype, project_id);
-- Note: PostgreSQL unique constraints allow multiple NULLs by default,
-- so this only enforces uniqueness when both archetype and project_id are non-null.
-- We simulate a partial unique by relying on this NULL behaviour.

-- 4. Add check: either persona_id or archetype must be set
alter table persona_strategies
  add constraint persona_strategies_persona_or_archetype_check
  check (persona_id is not null or archetype is not null);
