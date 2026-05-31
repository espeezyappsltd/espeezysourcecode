-- Professional studio jobs: timeline, budget, milestones, delivery docs

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS budget_cents bigint NOT NULL DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'GBP';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS deadline_at timestamptz;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assigned_to text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS requirements_text text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS prd_text text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS receipt_number text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS last_delivered_at timestamptz;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS final_report_text text;

CREATE TABLE IF NOT EXISTS public.studio_job_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  due_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  sort_order int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_job_budget_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  label text NOT NULL,
  amount_cents bigint NOT NULL DEFAULT 0,
  entry_type text NOT NULL DEFAULT 'estimate'
    CHECK (entry_type IN ('estimate', 'actual', 'invoice', 'expense')),
  notes text DEFAULT '',
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_job_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  event_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL DEFAULT 'note'
    CHECK (kind IN ('kickoff', 'milestone', 'review', 'delivery', 'payment', 'note')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_job_delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sent_to text NOT NULL,
  invoice_number text,
  receipt_number text,
  delivery_status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_studio_job_milestones_job ON public.studio_job_milestones(job_id);
CREATE INDEX IF NOT EXISTS idx_studio_job_budget_job ON public.studio_job_budget_entries(job_id);
CREATE INDEX IF NOT EXISTS idx_studio_job_timeline_job ON public.studio_job_timeline_events(job_id);
CREATE INDEX IF NOT EXISTS idx_studio_job_delivery_job ON public.studio_job_delivery_logs(job_id);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_job_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_job_budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_job_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_job_delivery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobs_read ON public.jobs;
CREATE POLICY jobs_read ON public.jobs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS jobs_write ON public.jobs;
CREATE POLICY jobs_write ON public.jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS studio_job_milestones_all ON public.studio_job_milestones;
CREATE POLICY studio_job_milestones_all ON public.studio_job_milestones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS studio_job_milestones_read ON public.studio_job_milestones;
CREATE POLICY studio_job_milestones_read ON public.studio_job_milestones
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS studio_job_budget_all ON public.studio_job_budget_entries;
CREATE POLICY studio_job_budget_all ON public.studio_job_budget_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS studio_job_budget_read ON public.studio_job_budget_entries;
CREATE POLICY studio_job_budget_read ON public.studio_job_budget_entries
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS studio_job_timeline_all ON public.studio_job_timeline_events;
CREATE POLICY studio_job_timeline_all ON public.studio_job_timeline_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS studio_job_timeline_read ON public.studio_job_timeline_events;
CREATE POLICY studio_job_timeline_read ON public.studio_job_timeline_events
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS studio_job_delivery_read ON public.studio_job_delivery_logs;
CREATE POLICY studio_job_delivery_read ON public.studio_job_delivery_logs
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS studio_job_delivery_write ON public.studio_job_delivery_logs;
CREATE POLICY studio_job_delivery_write ON public.studio_job_delivery_logs
  FOR INSERT TO authenticated WITH CHECK (true);
