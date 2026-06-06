-- Oprava driftu: migrace 20260605160000 je v historii označena jako aplikovaná,
-- ale tabulka archetype_strategies v DB chybí (byla zřejmě odstraněna).
-- Dotaz na ni vracel 500 a rozbíjel stránku /dashboard/rezidenti.
-- Forward migrace, idempotentní (if not exists) — bezpečné i kdyby tabulka existovala.
create table if not exists archetype_strategies (
  id uuid primary key default gen_random_uuid(),
  archetype text not null check (archetype in ('skrblik', 'investor', 'technik', 'ekolog', 'lhostejny', 'novacek')),
  scenario_key text not null,
  strategies jsonb not null,
  generated_at timestamptz not null default now(),
  unique(archetype, scenario_key)
);
