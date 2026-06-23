-- ============================================================
-- financing_leads — poptávky financování z Průvodce (hlavní funnel do banky)
-- ============================================================
CREATE TABLE IF NOT EXISTS financing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  building_id uuid REFERENCES buildings(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  note text,
  units integer,
  estimated_cost numeric,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE financing_leads ENABLE ROW LEVEL SECURITY;

-- Přihlášený uživatel může vytvořit poptávku pod svým účtem.
DROP POLICY IF EXISTS "financing_leads_insert_own" ON financing_leads;
CREATE POLICY "financing_leads_insert_own"
  ON financing_leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Uživatel vidí jen vlastní poptávky.
DROP POLICY IF EXISTS "financing_leads_select_own" ON financing_leads;
CREATE POLICY "financing_leads_select_own"
  ON financing_leads FOR SELECT
  USING (auth.uid() = user_id);
