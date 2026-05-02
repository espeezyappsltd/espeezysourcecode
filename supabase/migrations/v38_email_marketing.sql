-- =============================================================================
-- v38: Email Marketing Campaigns & Server Error Log
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. MARKETING CAMPAIGNS — admin-created bulk email campaigns
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subject     TEXT NOT NULL,
  preview     TEXT,
  html_body   TEXT NOT NULL,
  text_body   TEXT,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','sent','failed')),
  sent_count  INTEGER NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at     TIMESTAMPTZ
);

COMMENT ON TABLE  public.marketing_campaigns IS 'Admin bulk-email campaigns sent to opted-in users.';
COMMENT ON COLUMN public.marketing_campaigns.status IS 'draft | sending | sent | failed';
COMMENT ON COLUMN public.marketing_campaigns.sent_count IS 'Number of recipients the email was dispatched to.';

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created ON public.marketing_campaigns(created_at DESC);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_campaigns_admin_all" ON public.marketing_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------------------------------------------------------------------------
-- 2. SERVER ERROR LOG — surface internal 500s to the admin dashboard
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.server_error_log (
  id          BIGSERIAL PRIMARY KEY,
  route       TEXT,
  method      TEXT,
  message     TEXT NOT NULL,
  stack       TEXT,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.server_error_log IS 'Captures internal server errors for admin inspection.';
COMMENT ON COLUMN public.server_error_log.route IS 'Next.js route that threw the error, e.g. /api/stripe/webhook';
COMMENT ON COLUMN public.server_error_log.message IS 'Error .message string';
COMMENT ON COLUMN public.server_error_log.stack IS 'Error .stack (truncated to first 2 KB)';

CREATE INDEX IF NOT EXISTS idx_server_error_log_created ON public.server_error_log(created_at DESC);

ALTER TABLE public.server_error_log ENABLE ROW LEVEL SECURITY;

-- Only admins may read; service-role inserts (no RLS check on INSERT for trusted server code)
CREATE POLICY "server_error_log_admin_read" ON public.server_error_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
