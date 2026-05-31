-- Studio job document files (requirements.txt, PRD.md) in Supabase Storage

CREATE TABLE IF NOT EXISTS public.studio_job_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('requirements', 'prd')),
  storage_path text NOT NULL,
  filename text NOT NULL,
  content_type text,
  size_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studio_job_documents_job ON public.studio_job_documents(job_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_studio_job_documents_job_kind_path
  ON public.studio_job_documents(job_id, kind, storage_path);

ALTER TABLE public.studio_job_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS studio_job_documents_read ON public.studio_job_documents;
CREATE POLICY studio_job_documents_read ON public.studio_job_documents
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS studio_job_documents_write ON public.studio_job_documents;
CREATE POLICY studio_job_documents_write ON public.studio_job_documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'studio-job-docs',
  'studio-job-docs',
  false,
  5242880,
  ARRAY['text/plain', 'text/markdown', 'text/x-markdown', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS studio_job_docs_storage ON storage.objects;
CREATE POLICY studio_job_docs_storage ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'studio-job-docs')
  WITH CHECK (bucket_id = 'studio-job-docs');

DROP POLICY IF EXISTS studio_job_docs_storage_read ON storage.objects;
CREATE POLICY studio_job_docs_storage_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'studio-job-docs');
