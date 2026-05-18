-- Personal assets vault + storage accounting for My Assets and onboarding reports.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS storage_used bigint NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.personal_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  asset_type text NOT NULL DEFAULT 'file',
  asset_url text NOT NULL,
  preview_url text,
  category text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  size_bytes bigint NOT NULL DEFAULT 0,
  folder text NOT NULL DEFAULT '/',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS personal_assets_user_created_idx
  ON public.personal_assets (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS personal_assets_user_folder_idx
  ON public.personal_assets (user_id, folder);

ALTER TABLE public.personal_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS personal_assets_owner_select ON public.personal_assets;
CREATE POLICY personal_assets_owner_select ON public.personal_assets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS personal_assets_owner_insert ON public.personal_assets;
CREATE POLICY personal_assets_owner_insert ON public.personal_assets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS personal_assets_owner_update ON public.personal_assets;
CREATE POLICY personal_assets_owner_update ON public.personal_assets
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS personal_assets_owner_delete ON public.personal_assets;
CREATE POLICY personal_assets_owner_delete ON public.personal_assets
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.increment_storage_used(user_id uuid, amount bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF amount IS NULL OR amount <= 0 THEN
    RETURN;
  END IF;
  UPDATE public.profiles
  SET storage_used = COALESCE(storage_used, 0) + amount
  WHERE id = user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_storage_used(uuid, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_storage_used(uuid, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_storage_used(uuid, bigint) TO service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-assets', 'user-assets', true)
ON CONFLICT (id) DO NOTHING;
