create table personas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Nová persona',
  unit text not null default '—',
  status text not null default 'ceka' check (status in ('zpracovano', 'ceka')),
  sentiment text not null default 'vaha' check (sentiment in ('podporuje', 'vaha', 'proti')),
  brief text not null,
  structured jsonb,
  created_at timestamptz not null default now()
);
