-- v33: Student Annual Verification + Digital Certificates
-- Run via Supabase SQL Editor or Supabase CLI

-- ─── Student verification records ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution     TEXT NOT NULL,
  enrollment_proof TEXT,               -- URL to uploaded document
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  verified_by     UUID REFERENCES auth.users(id),
  verified_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL, -- set to 1 year from approved_at
  academic_year   TEXT NOT NULL,        -- e.g. '2025-2026'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sv_user_id   ON student_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sv_status    ON student_verifications(status);
CREATE INDEX IF NOT EXISTS idx_sv_expires   ON student_verifications(expires_at);

-- ─── Digital certificates ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_name    TEXT NOT NULL,
  issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  graduation_year INT,
  gpa             NUMERIC(3,2),
  achievements    TEXT[],              -- array of achievement labels
  pdf_url         TEXT,               -- link to generated PDF in Supabase Storage
  blockchain_hash TEXT,               -- optional: SHA-256 hash for immutability
  revoked         BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_reason  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_user_id ON certificates(user_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE student_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates          ENABLE ROW LEVEL SECURITY;

-- Users can see and insert their own verifications
DROP POLICY IF EXISTS "sv_select_own"  ON student_verifications;
DROP POLICY IF EXISTS "sv_insert_own"  ON student_verifications;
DROP POLICY IF EXISTS "sv_admin_all"   ON student_verifications;
CREATE POLICY "sv_select_own"  ON student_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sv_insert_own"  ON student_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sv_admin_all"   ON student_verifications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can read their own certificates; admin can do anything
DROP POLICY IF EXISTS "cert_select_own" ON certificates;
DROP POLICY IF EXISTS "cert_admin_all"  ON certificates;
CREATE POLICY "cert_select_own" ON certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cert_admin_all"  ON certificates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Auto-expire approved verifications after 1 year ─────────────────────────
-- Run via Supabase pg_cron (or Vercel cron hitting /api/cron/expire-verifications)
-- SELECT cron.schedule('expire-student-verifications', '0 3 * * *',
--   $$UPDATE student_verifications SET status='expired' WHERE status='approved' AND expires_at < NOW()$$);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_sv_updated_at ON student_verifications;
CREATE TRIGGER set_sv_updated_at
  BEFORE UPDATE ON student_verifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
