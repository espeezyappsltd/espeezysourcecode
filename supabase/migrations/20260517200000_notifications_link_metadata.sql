-- Notification deep links and structured payload (marketplace invoices, peer messages, tasks)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

COMMENT ON COLUMN public.notifications.link IS 'In-app route for notification action (e.g. /marketplace/invoice/uuid).';
COMMENT ON COLUMN public.notifications.metadata IS 'Structured payload (sender_id, listing_id, purchase_id, etc.).';
