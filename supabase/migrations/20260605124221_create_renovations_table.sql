create table renovations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cost_czk numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

insert into renovations (name, cost_czk) values
  ('Kitchen remodel', 125000.00),
  ('Bathroom tiles', 48500.00),
  ('Floor replacement', 72000.00);
