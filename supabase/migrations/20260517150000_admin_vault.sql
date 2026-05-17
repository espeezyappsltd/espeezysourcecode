-- Admin private vault: folders, files, sharing (5GB per staff member).

INSERT INTO storage.buckets (id, name, public, file_size_limit)
SELECT 'admin-vault', 'admin-vault', false, 104857600
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'admin-vault');

CREATE TABLE IF NOT EXISTS public.admin_vault_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.admin_members(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.admin_vault_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_vault_folders_name_len CHECK (char_length(name) BETWEEN 1 AND 120)
);

CREATE TABLE IF NOT EXISTS public.admin_vault_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.admin_members(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.admin_vault_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_vault_files_size_nonneg CHECK (size_bytes >= 0)
);

CREATE TABLE IF NOT EXISTS public.admin_vault_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL CHECK (resource_type IN ('file', 'folder')),
  resource_id uuid NOT NULL,
  shared_by uuid NOT NULL REFERENCES public.admin_members(id) ON DELETE CASCADE,
  shared_with uuid NOT NULL REFERENCES public.admin_members(id) ON DELETE CASCADE,
  permission text NOT NULL DEFAULT 'read' CHECK (permission IN ('read', 'write')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource_type, resource_id, shared_with)
);

CREATE INDEX IF NOT EXISTS admin_vault_folders_owner_idx ON public.admin_vault_folders (owner_id, parent_id);
CREATE INDEX IF NOT EXISTS admin_vault_files_owner_idx ON public.admin_vault_files (owner_id, folder_id);
CREATE INDEX IF NOT EXISTS admin_vault_shares_with_idx ON public.admin_vault_shares (shared_with);

CREATE OR REPLACE FUNCTION public.admin_vault_used_bytes(p_owner uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(size_bytes), 0)::bigint FROM public.admin_vault_files WHERE owner_id = p_owner;
$$;

CREATE OR REPLACE FUNCTION public.enforce_admin_vault_quota()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  cap bigint := 5368709120; -- 5GB
  used bigint;
BEGIN
  SELECT public.admin_vault_used_bytes(NEW.owner_id) INTO used;
  IF used + NEW.size_bytes > cap THEN
    RAISE EXCEPTION 'Vault quota exceeded (5GB per admin)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_vault_quota ON public.admin_vault_files;
CREATE TRIGGER admin_vault_quota
  BEFORE INSERT OR UPDATE OF size_bytes ON public.admin_vault_files
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_admin_vault_quota();

ALTER TABLE public.admin_vault_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_vault_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_vault_shares ENABLE ROW LEVEL SECURITY;

-- Folders: owner full access; shared read/write via shares
DROP POLICY IF EXISTS admin_vault_folders_owner ON public.admin_vault_folders;
CREATE POLICY admin_vault_folders_owner ON public.admin_vault_folders
  FOR ALL TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.admin_vault_shares s
      WHERE s.resource_type = 'folder' AND s.resource_id = admin_vault_folders.id
        AND s.shared_with = auth.uid()
    )
  )
  WITH CHECK (owner_id = auth.uid());

-- Files: owner or share
DROP POLICY IF EXISTS admin_vault_files_access ON public.admin_vault_files;
CREATE POLICY admin_vault_files_access ON public.admin_vault_files
  FOR ALL TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.admin_vault_shares s
      WHERE s.resource_type = 'file' AND s.resource_id = admin_vault_files.id
        AND s.shared_with = auth.uid()
    )
  )
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS admin_vault_shares_owner ON public.admin_vault_shares;
CREATE POLICY admin_vault_shares_owner ON public.admin_vault_shares
  FOR ALL TO authenticated
  USING (shared_by = auth.uid() OR shared_with = auth.uid())
  WITH CHECK (shared_by = auth.uid());

-- Storage objects: path prefix = admin member id
DROP POLICY IF EXISTS admin_vault_storage_owner ON storage.objects;
CREATE POLICY admin_vault_storage_owner ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'admin-vault'
    AND EXISTS (SELECT 1 FROM public.admin_members am WHERE am.id = auth.uid() AND am.is_active)
    AND name LIKE auth.uid()::text || '/%'
  )
  WITH CHECK (
    bucket_id = 'admin-vault'
    AND EXISTS (SELECT 1 FROM public.admin_members am WHERE am.id = auth.uid() AND am.is_active)
    AND name LIKE auth.uid()::text || '/%'
  );
