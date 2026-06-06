-- Create exports table
CREATE TABLE IF NOT EXISTS exports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  format      TEXT NOT NULL DEFAULT 'PDF',
  project     TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes  BIGINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own exports" ON exports;
CREATE POLICY "Users can read own exports"
  ON exports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own exports" ON exports;
CREATE POLICY "Users can insert own exports"
  ON exports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS exports_user_id_idx ON exports(user_id);

-- Create Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own folder
DROP POLICY IF EXISTS "exports_storage_upload" ON storage.objects;
CREATE POLICY "exports_storage_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "exports_storage_read" ON storage.objects;
CREATE POLICY "exports_storage_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "exports_storage_delete" ON storage.objects;
CREATE POLICY "exports_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
