-- ─────────────────────────────────────────────────────────────────────────────
-- v36 · Organisational Admin Backend
-- Adds: audit_logs, ban_records, system_announcements, admin_api_keys
-- Safe to re-run (idempotent).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. AUDIT LOGS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email   text,
  action        text NOT NULL,          -- e.g. 'user.ban', 'role.change', 'setting.update'
  resource_type text NOT NULL,          -- e.g. 'user', 'group', 'setting'
  resource_id   text,                   -- nullable (e.g. user UUID)
  old_value     jsonb,
  new_value     jsonb,
  ip_address    inet,
  user_agent    text,
  severity      text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  audit_logs IS 'Immutable admin audit trail — every destructive or privileged action is logged here.';
COMMENT ON COLUMN audit_logs.action IS 'Dot-namespaced action identifier, e.g. user.ban, group.delete.';
COMMENT ON COLUMN audit_logs.severity IS 'info=routine, warning=elevated risk, critical=destructive.';

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx     ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx    ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx  ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx   ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_all" ON audit_logs;
CREATE POLICY "audit_logs_admin_all" ON audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── 2. BAN RECORDS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ban_records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason        text NOT NULL,
  ban_type      text NOT NULL DEFAULT 'temporary' CHECK (ban_type IN ('temporary','permanent')),
  expires_at    timestamptz,            -- null = permanent
  appeal_note   text,
  appeal_status text DEFAULT 'none' CHECK (appeal_status IN ('none','pending','approved','rejected')),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  lifted_at     timestamptz,
  lifted_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE  ban_records IS 'Complete ban history — every ban/unban action with reason and expiry.';
COMMENT ON COLUMN ban_records.is_active IS 'True while ban is in effect. Set to false on unban or expiry.';

CREATE INDEX IF NOT EXISTS ban_records_user_idx   ON ban_records(user_id);
CREATE INDEX IF NOT EXISTS ban_records_active_idx ON ban_records(is_active) WHERE is_active = true;

ALTER TABLE ban_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ban_records_admin_all" ON ban_records;
CREATE POLICY "ban_records_admin_all" ON ban_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin','moderator')
    )
  );

DROP POLICY IF EXISTS "ban_records_user_own" ON ban_records;
CREATE POLICY "ban_records_user_own" ON ban_records
  FOR SELECT USING (user_id = auth.uid());

-- ── 3. SYSTEM ANNOUNCEMENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_announcements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  body        text NOT NULL,
  type        text NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','maintenance','feature','critical')),
  target      text NOT NULL DEFAULT 'all' CHECK (target IN ('all','pro','premium','admin')),
  is_active   boolean NOT NULL DEFAULT true,
  starts_at   timestamptz NOT NULL DEFAULT now(),
  ends_at     timestamptz,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  system_announcements IS 'Platform-wide messages shown in banners or notification centres.';
COMMENT ON COLUMN system_announcements.target IS 'Audience: all users, paid plans, or admins only.';

CREATE INDEX IF NOT EXISTS announcements_active_idx ON system_announcements(is_active, starts_at, ends_at);

ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_admin_all" ON system_announcements;
CREATE POLICY "announcements_admin_all" ON system_announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "announcements_user_read" ON system_announcements;
CREATE POLICY "announcements_user_read" ON system_announcements
  FOR SELECT USING (
    is_active = true
    AND (starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
    AND (
      target = 'all'
      OR (
        target IN ('pro','premium')
        AND EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.subscription_plan = target
        )
      )
    )
  );

-- ── 4. ADMIN API KEYS ─────────────────────────────────────────────────────────
-- For machine-to-machine admin API access (agent orchestration, CI scripts)
CREATE TABLE IF NOT EXISTS admin_api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  key_hash    text NOT NULL UNIQUE,     -- bcrypt/sha256 hash — never store plaintext
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_used_at timestamptz,
  expires_at  timestamptz,
  is_active   boolean NOT NULL DEFAULT true,
  scopes      text[] NOT NULL DEFAULT '{}',  -- ['users:read', 'users:write', etc.]
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  admin_api_keys IS 'API keys for programmatic admin access (agents, CI). Keys are hashed — plaintext never stored.';
COMMENT ON COLUMN admin_api_keys.scopes IS 'Granular permission scopes, e.g. users:read, groups:write, audit:read.';

ALTER TABLE admin_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_api_keys_admin_all" ON admin_api_keys;
CREATE POLICY "admin_api_keys_admin_all" ON admin_api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ── 5. PROFILES COLUMNS (idempotent) ──────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
  CHECK (account_status IN ('active','suspended','banned','pending_verification'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes text;    -- internal admin notes on user

COMMENT ON COLUMN profiles.account_status IS 'User account lifecycle status — drives login access.';
COMMENT ON COLUMN profiles.is_banned IS 'Denormalized ban flag for fast RLS checks.';
COMMENT ON COLUMN profiles.notes IS 'Internal admin-only notes, not visible to the user.';

-- ── 6. GROUPS COLUMNS (idempotent) ────────────────────────────────────────────
ALTER TABLE groups ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active','archived','suspended'));
ALTER TABLE groups ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS admin_notes text;

COMMENT ON COLUMN groups.status IS 'Group lifecycle — admins can suspend or archive groups.';
COMMENT ON COLUMN groups.featured IS 'Pin group to featured section on discovery page.';
