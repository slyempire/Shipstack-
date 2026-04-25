-- ============================================================
-- Shipstack GDPR / Compliance Schema Extensions
-- Run after 001_initial_schema.sql
-- ============================================================

-- ─── CONSENT RECORDS ─────────────────────────────────────────
-- Tracks explicit user consent to data processing activities.
CREATE TABLE IF NOT EXISTS public.consent_records (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL,
  consent_type    TEXT NOT NULL,  -- 'MARKETING' | 'ANALYTICS' | 'LOCATION_TRACKING' | 'DPA'
  granted         BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address      TEXT,
  user_agent      TEXT,
  version         TEXT NOT NULL DEFAULT '1.0',  -- policy version consented to
  granted_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS consent_tenant_idx  ON public.consent_records(tenant_id);
CREATE INDEX IF NOT EXISTS consent_user_idx    ON public.consent_records(user_id);
CREATE INDEX IF NOT EXISTS consent_type_idx    ON public.consent_records(consent_type);

-- ─── DATA SUBJECT REQUESTS ───────────────────────────────────
-- Tracks GDPR/KDPA data subject rights requests (access, deletion, export, restriction).
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  request_type    TEXT NOT NULL,  -- 'ACCESS' | 'ERASURE' | 'PORTABILITY' | 'RECTIFICATION' | 'RESTRICTION' | 'OBJECTION'
  status          TEXT NOT NULL DEFAULT 'PENDING',  -- 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_by          TIMESTAMPTZ NOT NULL,  -- 30-day legal deadline
  completed_at    TIMESTAMPTZ,
  rejection_reason TEXT,
  handled_by      TEXT,           -- staff user id
  details         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dsr_tenant_idx  ON public.data_subject_requests(tenant_id);
CREATE INDEX IF NOT EXISTS dsr_user_idx    ON public.data_subject_requests(user_id);
CREATE INDEX IF NOT EXISTS dsr_status_idx  ON public.data_subject_requests(status);
CREATE INDEX IF NOT EXISTS dsr_due_idx     ON public.data_subject_requests(due_by);

-- ─── DATA DELETION QUEUE ─────────────────────────────────────
-- Tracks accounts marked for deletion and their grace/hard-delete schedule.
CREATE TABLE IF NOT EXISTS public.deletion_queue (
  id                     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id              TEXT NOT NULL,
  user_id                TEXT NOT NULL,
  requested_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  grace_period_ends_at   TIMESTAMPTZ NOT NULL,    -- 30 days
  permanent_deletion_at  TIMESTAMPTZ NOT NULL,    -- 90 days
  recovered_at           TIMESTAMPTZ,             -- set if user cancels
  completed_at           TIMESTAMPTZ,             -- set after hard delete
  status                 TEXT NOT NULL DEFAULT 'PENDING'  -- 'PENDING' | 'RECOVERED' | 'COMPLETED'
);

CREATE INDEX IF NOT EXISTS deletion_status_idx  ON public.deletion_queue(status);
CREATE INDEX IF NOT EXISTS deletion_perm_idx    ON public.deletion_queue(permanent_deletion_at);

-- ─── ENCRYPTION METADATA ─────────────────────────────────────
-- Tracks which fields are encrypted and with which key version.
-- Enables key rotation without re-encrypting all data at once.
CREATE TABLE IF NOT EXISTS public.encryption_metadata (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  table_name    TEXT NOT NULL,
  column_name   TEXT NOT NULL,
  row_id        TEXT NOT NULL,
  key_version   INTEGER NOT NULL DEFAULT 1,
  algorithm     TEXT NOT NULL DEFAULT 'aes-256-gcm',
  encrypted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (table_name, column_name, row_id)
);

CREATE INDEX IF NOT EXISTS enc_table_idx ON public.encryption_metadata(table_name, column_name);

-- ─── DATA PROCESSING AGREEMENTS ─────────────────────────────
-- Records executed DPAs between Shipstack and customers (tenants).
CREATE TABLE IF NOT EXISTS public.data_processing_agreements (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id       TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  version         TEXT NOT NULL DEFAULT '1.0',
  executed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_by     TEXT NOT NULL,  -- user_id of the person who accepted
  ip_address      TEXT,
  document_url    TEXT,           -- S3 URL of the signed DPA PDF
  UNIQUE (tenant_id, version)
);

CREATE INDEX IF NOT EXISTS dpa_tenant_idx ON public.data_processing_agreements(tenant_id);

-- ─── SECURITY INCIDENTS ──────────────────────────────────────
-- Tracks data breaches and security incidents for regulatory reporting.
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id         TEXT,
  severity          TEXT NOT NULL DEFAULT 'LOW',  -- 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  incident_type     TEXT NOT NULL,                -- 'DATA_BREACH' | 'UNAUTHORISED_ACCESS' | 'SYSTEM_OUTAGE' | 'OTHER'
  description       TEXT NOT NULL,
  affected_users    INTEGER DEFAULT 0,
  data_types        TEXT[] DEFAULT '{}',          -- what personal data was involved
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contained_at      TIMESTAMPTZ,
  users_notified_at TIMESTAMPTZ,
  regulator_notified_at TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN' | 'CONTAINED' | 'RESOLVED' | 'REPORTED'
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS incidents_severity_idx ON public.security_incidents(severity);
CREATE INDEX IF NOT EXISTS incidents_status_idx   ON public.security_incidents(status);

-- ─── UPDATED_AT TRIGGERS ─────────────────────────────────────
CREATE OR REPLACE TRIGGER data_subject_requests_updated_at
  BEFORE UPDATE ON public.data_subject_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE public.consent_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_queue            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_processing_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents        ENABLE ROW LEVEL SECURITY;

-- Consent: tenants can only see their own consent records
CREATE POLICY "consent_select" ON public.consent_records
  FOR SELECT USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "consent_insert" ON public.consent_records
  FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id());
CREATE POLICY "consent_update" ON public.consent_records
  FOR UPDATE USING (tenant_id = public.auth_tenant_id());

-- DSR: tenants can only see their own requests
CREATE POLICY "dsr_select" ON public.data_subject_requests
  FOR SELECT USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "dsr_insert" ON public.data_subject_requests
  FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id());
CREATE POLICY "dsr_update" ON public.data_subject_requests
  FOR UPDATE USING (tenant_id = public.auth_tenant_id());

-- Deletion queue: user can only see their own record
CREATE POLICY "deletion_select" ON public.deletion_queue
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "deletion_insert" ON public.deletion_queue
  FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id());

-- DPA: tenant admins can see their DPA
CREATE POLICY "dpa_select" ON public.data_processing_agreements
  FOR SELECT USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "dpa_insert" ON public.data_processing_agreements
  FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id());

-- Security incidents: only accessible by super admins (enforce in app layer)
CREATE POLICY "incidents_select" ON public.security_incidents
  FOR SELECT USING (tenant_id = public.auth_tenant_id() OR tenant_id IS NULL);

-- ─── HELPER: Log a DSR with automatic due-by date ────────────
CREATE OR REPLACE FUNCTION public.log_data_subject_request(
  p_tenant_id   TEXT,
  p_user_id     TEXT,
  p_type        TEXT,   -- 'ACCESS' | 'ERASURE' | 'PORTABILITY' etc.
  p_details     JSONB DEFAULT '{}'
) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_id TEXT;
BEGIN
  INSERT INTO public.data_subject_requests
    (tenant_id, user_id, request_type, due_by, details)
  VALUES
    (p_tenant_id, p_user_id, p_type, NOW() + INTERVAL '30 days', p_details)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ─── VIEW: Overdue DSRs (for compliance dashboard) ──────────
CREATE OR REPLACE VIEW public.overdue_data_subject_requests AS
  SELECT *
  FROM   public.data_subject_requests
  WHERE  status NOT IN ('COMPLETED', 'REJECTED')
  AND    due_by < NOW();
