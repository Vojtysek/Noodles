-- Create invoices table (versioned after the latest remote migration to avoid
-- a timestamp collision; fully idempotent + additive so it is safe to re-run
-- even if an invoices table already exists from a parallel migration).
CREATE TABLE IF NOT EXISTS invoices (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name            TEXT NOT NULL,
  storage_path         TEXT NOT NULL,
  mime_type            TEXT NOT NULL,
  size_bytes           BIGINT NOT NULL,
  summary              TEXT,
  extracted            JSONB,
  summary_generated_at TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Additive: ensure the optional AI-summary columns exist even if the table
-- was previously created without them.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS extracted JSONB;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS summary_generated_at TIMESTAMPTZ;

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own invoices" ON invoices;
CREATE POLICY "Users can read own invoices"
  ON invoices FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;
CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);

-- Create Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own folder
DROP POLICY IF EXISTS "invoices_storage_upload" ON storage.objects;
CREATE POLICY "invoices_storage_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "invoices_storage_read" ON storage.objects;
CREATE POLICY "invoices_storage_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "invoices_storage_delete" ON storage.objects;
CREATE POLICY "invoices_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
