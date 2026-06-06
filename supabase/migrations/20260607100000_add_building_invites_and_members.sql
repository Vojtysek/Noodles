-- ============================================================
-- 1. building_invites
-- ============================================================
CREATE TABLE IF NOT EXISTS building_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(building_id, invited_email)
);

ALTER TABLE building_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "building_invites_insert_own" ON building_invites;
CREATE POLICY "building_invites_insert_own"
  ON building_invites FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

DROP POLICY IF EXISTS "building_invites_select_own" ON building_invites;
CREATE POLICY "building_invites_select_own"
  ON building_invites FOR SELECT
  USING (
    auth.uid() = created_by_user_id
    OR invited_email = auth.email()
  );

DROP POLICY IF EXISTS "building_invites_delete_own" ON building_invites;
CREATE POLICY "building_invites_delete_own"
  ON building_invites FOR DELETE
  USING (
    auth.uid() = created_by_user_id
    OR invited_email = auth.email()
  );

-- ============================================================
-- 2. building_members
-- ============================================================
CREATE TABLE IF NOT EXISTS building_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(building_id, user_id)
);

ALTER TABLE building_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "building_members_select_own" ON building_members;
CREATE POLICY "building_members_select_own"
  ON building_members FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "building_members_insert_own" ON building_members;
CREATE POLICY "building_members_insert_own"
  ON building_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. buildings — expand SELECT and UPDATE to include members;
--    DELETE stays owner-only
-- ============================================================
DROP POLICY IF EXISTS "buildings_select_own" ON buildings;
CREATE POLICY "buildings_select_own"
  ON buildings FOR SELECT
  USING (
    auth.uid() = user_id
    OR id IN (
      SELECT building_id FROM building_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "buildings_update_own" ON buildings;
CREATE POLICY "buildings_update_own"
  ON buildings FOR UPDATE
  USING (
    auth.uid() = user_id
    OR id IN (
      SELECT building_id FROM building_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR id IN (
      SELECT building_id FROM building_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "buildings_delete_own" ON buildings;
CREATE POLICY "buildings_delete_own"
  ON buildings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. personas — expand SELECT to include building members;
--    INSERT / UPDATE / DELETE stay owner-only
-- ============================================================
DROP POLICY IF EXISTS "personas_select_own" ON personas;
CREATE POLICY "personas_select_own"
  ON personas FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR user_id IN (
      SELECT buildings.user_id
      FROM buildings
      JOIN building_members ON buildings.id = building_members.building_id
      WHERE building_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. exports — expand SELECT to include building members
--    The original policy is named "Users can read own exports"
-- ============================================================
DROP POLICY IF EXISTS "Users can read own exports" ON exports;
CREATE POLICY "Users can read own exports"
  ON exports FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IN (
      SELECT buildings.user_id
      FROM buildings
      JOIN building_members ON buildings.id = building_members.building_id
      WHERE building_members.user_id = auth.uid()
    )
  );
