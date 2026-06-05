create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  address text,
  units integer,
  floors integer,
  year_built integer,
  zastavena_plocha numeric,
  energy_grade text,
  insulated boolean,
  new_windows boolean,
  selected_renovations text[],
  monthly_per_unit numeric,
  total_cost numeric,
  final_rent numeric,
  rent_years integer,
  window_count integer,
  capped_by_max boolean,
  created_at timestamptz not null default now()
);
