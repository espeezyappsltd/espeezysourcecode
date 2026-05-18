-- Hustle board: Espeezy credits payouts, escrow, applications, and trade ledger.

CREATE TABLE IF NOT EXISTS public.hustle_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  payout_cents integer NOT NULL DEFAULT 0,
  payout_credits integer NOT NULL DEFAULT 0 CHECK (payout_credits >= 0 AND payout_credits <= 100),
  escrow_credits integer NOT NULL DEFAULT 0 CHECK (escrow_credits >= 0),
  status text NOT NULL DEFAULT 'open',
  deadline timestamptz,
  connection_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hustle_tasks
  ADD COLUMN IF NOT EXISTS payout_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escrow_credits integer NOT NULL DEFAULT 0;

-- Backfill credits from legacy USD cents (~$0.50 per credit, min 1, max 100)
UPDATE public.hustle_tasks
SET payout_credits = LEAST(100, GREATEST(1, ROUND(payout_cents::numeric / 50)))
WHERE payout_credits = 0 AND payout_cents > 0;

CREATE TABLE IF NOT EXISTS public.hustle_task_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.hustle_tasks(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, applicant_id)
);

CREATE TABLE IF NOT EXISTS public.hustle_task_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.hustle_tasks(id) ON DELETE CASCADE,
  from_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  credits_amount integer NOT NULL CHECK (credits_amount > 0),
  kind text NOT NULL CHECK (kind IN ('escrow_in', 'release', 'refund')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hustle_task_applications_task_idx
  ON public.hustle_task_applications (task_id, status);

CREATE INDEX IF NOT EXISTS hustle_task_ledger_task_idx
  ON public.hustle_task_ledger (task_id, created_at DESC);

ALTER TABLE public.hustle_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hustle_task_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hustle_task_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hustle_tasks_read ON public.hustle_tasks;
CREATE POLICY hustle_tasks_read ON public.hustle_tasks
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS hustle_tasks_poster_write ON public.hustle_tasks;
CREATE POLICY hustle_tasks_poster_write ON public.hustle_tasks
  FOR ALL TO authenticated
  USING (poster_id = auth.uid())
  WITH CHECK (poster_id = auth.uid());

DROP POLICY IF EXISTS hustle_applications_read ON public.hustle_task_applications;
CREATE POLICY hustle_applications_read ON public.hustle_task_applications
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS hustle_applications_write ON public.hustle_task_applications;
CREATE POLICY hustle_applications_write ON public.hustle_task_applications
  FOR ALL TO authenticated
  USING (applicant_id = auth.uid())
  WITH CHECK (applicant_id = auth.uid());

-- Fund escrow from poster balance
CREATE OR REPLACE FUNCTION public.hustle_task_fund_escrow(p_task_id uuid, p_poster_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.hustle_tasks%ROWTYPE;
  v_amount integer;
  v_balance integer;
BEGIN
  SELECT * INTO v_task FROM public.hustle_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'task_not_found'; END IF;
  IF v_task.poster_id <> p_poster_id THEN RAISE EXCEPTION 'not_poster'; END IF;
  IF v_task.status NOT IN ('open', 'assigned') THEN RAISE EXCEPTION 'invalid_status'; END IF;

  v_amount := GREATEST(v_task.payout_credits, 0);
  IF v_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  IF v_task.escrow_credits >= v_amount THEN RAISE EXCEPTION 'already_funded'; END IF;

  SELECT espeezy_credits INTO v_balance FROM public.profiles WHERE id = p_poster_id FOR UPDATE;
  IF COALESCE(v_balance, 0) < v_amount THEN RAISE EXCEPTION 'insufficient_credits'; END IF;

  UPDATE public.profiles SET espeezy_credits = espeezy_credits - v_amount WHERE id = p_poster_id;
  UPDATE public.hustle_tasks
  SET escrow_credits = v_amount, updated_at = now()
  WHERE id = p_task_id;

  INSERT INTO public.hustle_task_ledger (task_id, from_user_id, credits_amount, kind)
  VALUES (p_task_id, p_poster_id, v_amount, 'escrow_in');

  RETURN jsonb_build_object(
    'escrow_credits', v_amount,
    'poster_credits', (SELECT espeezy_credits FROM public.profiles WHERE id = p_poster_id)
  );
END;
$$;

-- Release escrow to worker on approval
CREATE OR REPLACE FUNCTION public.hustle_task_release_payment(p_task_id uuid, p_poster_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.hustle_tasks%ROWTYPE;
  v_amount integer;
BEGIN
  SELECT * INTO v_task FROM public.hustle_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'task_not_found'; END IF;
  IF v_task.poster_id <> p_poster_id THEN RAISE EXCEPTION 'not_poster'; END IF;
  IF v_task.assignee_id IS NULL THEN RAISE EXCEPTION 'no_assignee'; END IF;
  IF v_task.status NOT IN ('submitted', 'approved') THEN RAISE EXCEPTION 'invalid_status'; END IF;

  v_amount := v_task.escrow_credits;
  IF v_amount <= 0 THEN RAISE EXCEPTION 'not_funded'; END IF;

  UPDATE public.profiles SET espeezy_credits = espeezy_credits + v_amount WHERE id = v_task.assignee_id;
  UPDATE public.hustle_tasks
  SET status = 'paid', escrow_credits = 0, updated_at = now()
  WHERE id = p_task_id;

  INSERT INTO public.hustle_task_ledger (task_id, from_user_id, to_user_id, credits_amount, kind)
  VALUES (p_task_id, p_poster_id, v_task.assignee_id, v_amount, 'release');

  RETURN jsonb_build_object(
    'status', 'paid',
    'worker_credits', (SELECT espeezy_credits FROM public.profiles WHERE id = v_task.assignee_id),
    'poster_credits', (SELECT espeezy_credits FROM public.profiles WHERE id = p_poster_id)
  );
END;
$$;

-- Refund escrow to poster on cancel
CREATE OR REPLACE FUNCTION public.hustle_task_refund_escrow(p_task_id uuid, p_poster_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task public.hustle_tasks%ROWTYPE;
  v_amount integer;
BEGIN
  SELECT * INTO v_task FROM public.hustle_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'task_not_found'; END IF;
  IF v_task.poster_id <> p_poster_id THEN RAISE EXCEPTION 'not_poster'; END IF;

  v_amount := v_task.escrow_credits;
  IF v_amount <= 0 THEN
    UPDATE public.hustle_tasks SET status = 'cancelled', updated_at = now() WHERE id = p_task_id;
    RETURN jsonb_build_object('status', 'cancelled', 'refunded', 0);
  END IF;

  UPDATE public.profiles SET espeezy_credits = espeezy_credits + v_amount WHERE id = p_poster_id;
  UPDATE public.hustle_tasks
  SET status = 'cancelled', escrow_credits = 0, updated_at = now()
  WHERE id = p_task_id;

  INSERT INTO public.hustle_task_ledger (task_id, from_user_id, to_user_id, credits_amount, kind)
  VALUES (p_task_id, NULL, p_poster_id, v_amount, 'refund');

  RETURN jsonb_build_object(
    'status', 'cancelled',
    'refunded', v_amount,
    'poster_credits', (SELECT espeezy_credits FROM public.profiles WHERE id = p_poster_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.hustle_task_fund_escrow(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hustle_task_release_payment(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hustle_task_refund_escrow(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hustle_task_fund_escrow(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.hustle_task_release_payment(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.hustle_task_refund_escrow(uuid, uuid) TO service_role;
