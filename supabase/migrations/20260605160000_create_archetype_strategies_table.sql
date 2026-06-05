-- Cache AI strategií pro vestavěné archetypy — nemají řádek v personas,
-- proto vlastní tabulka klíčovaná (archetype, scenario_key).
create table archetype_strategies (
  id uuid primary key default gen_random_uuid(),
  archetype text not null check (archetype in ('skrblik', 'investor', 'technik', 'ekolog', 'lhostejny', 'novacek')),
  scenario_key text not null,
  strategies jsonb not null,
  generated_at timestamptz not null default now(),
  unique(archetype, scenario_key)
);
