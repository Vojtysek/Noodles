create table persona_strategies (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references personas(id) on delete cascade,
  project_id text not null,
  strategies jsonb not null,
  generated_at timestamptz not null default now(),
  unique(persona_id, project_id)
);
