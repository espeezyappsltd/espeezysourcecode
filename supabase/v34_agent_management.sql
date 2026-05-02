OUL-- v34: Agent Management System
-- Adds agents and agent_tasks tables for the admin agent control centre

-- Agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  specialisation TEXT NOT NULL CHECK (specialisation IN ('frontend','backend','devops')),
  role         TEXT NOT NULL CHECK (role IN ('builder','validator')),
  pair_id      UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','training')),
  system_prompt TEXT,
  capabilities TEXT[] DEFAULT '{}',
  tasks_completed INT DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent tasks table
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  priority          TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status            TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','review','done','blocked')),
  assigned_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  depends_on        UUID[] DEFAULT '{}',
  output_artifacts  JSONB DEFAULT '[]',
  logs              TEXT DEFAULT '',
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON public.agent_tasks(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON public.agent_tasks(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS agents_updated_at ON public.agents;
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS agent_tasks_updated_at ON public.agent_tasks;
CREATE TRIGGER agent_tasks_updated_at BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS: only admins can manage agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- Allow admins (service role / admin role) full access
-- For simplicity: allow authenticated users with role='admin' to read/write
CREATE POLICY agents_admin_all ON public.agents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY agent_tasks_admin_all ON public.agent_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed the 6 initial agents
INSERT INTO public.agents (name, specialisation, role, status, capabilities, system_prompt)
VALUES
  ('Alpha', 'frontend', 'builder', 'active',
   ARRAY['React','Next.js','Tailwind','Framer Motion','Accessibility'],
   'You are Alpha, the frontend UI architect. Build React/Next.js components following the design system in BRAND_IDENTITY.md. Prioritise accessibility, performance, and mobile-first layouts.'),
  ('Beta', 'frontend', 'validator', 'active',
   ARRAY['Playwright','Lighthouse','WCAG','Visual Regression','Cross-browser'],
   'You are Beta, the frontend validator. Review all UI built by Alpha. Write Playwright tests, run Lighthouse audits, and check WCAG 2.1 AA compliance.'),
  ('Gamma', 'backend', 'builder', 'active',
   ARRAY['Next.js API','Supabase','PostgreSQL','RLS','Stripe','Webhooks'],
   'You are Gamma, the API engineer. Build Next.js API routes, Supabase queries, RLS policies, and database migrations following existing patterns in the codebase.'),
  ('Delta', 'backend', 'validator', 'active',
   ARRAY['Security','OWASP','SQL Injection','Rate Limiting','Load Testing','k6'],
   'You are Delta, the backend security validator. Audit all API routes built by Gamma for OWASP Top 10 vulnerabilities, validate RLS policies, and write k6 load test scripts.'),
  ('Epsilon', 'devops', 'builder', 'active',
   ARRAY['GitHub Actions','Vercel','CI/CD','Environment Config','Monitoring'],
   'You are Epsilon, the infrastructure engineer. Build GitHub Actions workflows, Vercel configurations, and monitoring setups.'),
  ('Zeta', 'devops', 'validator', 'active',
   ARRAY['Secret Scanning','Cost Optimisation','Uptime','Disaster Recovery','Dependencies'],
   'You are Zeta, the DevOps security and reliability validator. Scan for credential leaks, analyse cloud costs, and document disaster recovery procedures.')
ON CONFLICT DO NOTHING;

-- Set pair assignments
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Beta')  WHERE name = 'Alpha';
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Alpha') WHERE name = 'Beta';
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Delta') WHERE name = 'Gamma';
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Gamma') WHERE name = 'Delta';
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Zeta')   WHERE name = 'Epsilon';
UPDATE public.agents SET pair_id = (SELECT id FROM public.agents WHERE name = 'Epsilon') WHERE name = 'Zeta';
