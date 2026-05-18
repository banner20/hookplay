-- HookForge — initial schema
-- Run in the Supabase SQL editor or via `supabase db push`.

-- ─── Projects table ─────────────────────────────────────────────────────────
CREATE TABLE projects (
  id            UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT          NOT NULL DEFAULT 'Untitled Project',
  hook_config   JSONB         NOT NULL DEFAULT '{}',
  video_path    TEXT,
  video_name    TEXT,
  video_duration REAL,
  created_at    TIMESTAMPTZ   DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ   DEFAULT now() NOT NULL
);

-- ─── Row-Level Security ──────────────────────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their projects"
  ON projects
  FOR ALL
  USING       (auth.uid() = user_id)
  WITH CHECK  (auth.uid() = user_id);

-- ─── Auto-update updated_at ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── Storage ─────────────────────────────────────────────────────────────────
-- Run these steps in the Supabase dashboard → Storage, or via the CLI:
--
--   supabase storage create videos --public false
--
-- Then add storage policies (dashboard → Storage → videos → Policies):
--
-- INSERT policy  — authenticated users can upload to their own folder:
--   (bucket_id = 'videos') AND (auth.uid()::text = (storage.foldername(name))[1])
--
-- SELECT policy  — authenticated users can read their own files:
--   (bucket_id = 'videos') AND (auth.uid()::text = (storage.foldername(name))[1])
--
-- DELETE policy  — same as SELECT.
