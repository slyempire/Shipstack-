-- ============================================================
-- Shipstack Initial Schema
-- Run this in your Supabase SQL editor or via CLI:
--   supabase db push
-- ============================================================

-- ─── TENANTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  subdomain     TEXT,
  logo          TEXT,
  plan          TEXT NOT NULL DEFAULT 'STARTER',
  tier          TEXT NOT NULL DEFAULT 'Free',
  status        TEXT NOT NULL DEFAULT 'TRIAL',
  industry      TEXT NOT NULL DEFAULT 'GENERAL',
  enabled_modules TEXT[] NOT NULL DEFAULT '{}',
  settings      JSONB NOT NULL DEFAULT '{}',
  security_settings JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id                  TEXT PRIMARY KEY,
  tenant_id           TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'ADMIN',
  is_onboarded        BOOLEAN NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  on_duty             BOOLEAN NOT NULL DEFAULT FALSE,
  phone               TEXT,
  company             TEXT,
  avatar              TEXT,
  id_number           TEXT,
  kra_pin             TEXT,
  license_number      TEXT,
  vehicle_id          TEXT,
  facility_id         TEXT,
  verification_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, tenant_id)
);

CREATE INDEX IF NOT EXISTS users_tenant_idx ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS users_email_idx  ON public.users(email);
CREATE INDEX IF NOT EXISTS users_role_idx   ON public.users(role);

-- ─── DELIVERY NOTES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.delivery_notes (
  id                    TEXT PRIMARY KEY,
  tenant_id             TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  external_id           TEXT,
  client_name           TEXT NOT NULL,
  address               TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'RECEIVED',
  type                  TEXT NOT NULL DEFAULT 'OUTBOUND',
  priority              TEXT NOT NULL DEFAULT 'MEDIUM',
  industry              TEXT DEFAULT 'GENERAL',
  driver_id             TEXT,
  vehicle_id            TEXT,
  trip_id               TEXT,
  weight_kg             NUMERIC DEFAULT 0,
  items                 JSONB NOT NULL DEFAULT '[]',
  logs                  JSONB NOT NULL DEFAULT '[]',
  documents             JSONB NOT NULL DEFAULT '[]',
  pod_signature         TEXT,
  pod_photo             TEXT,
  pod_otp               TEXT,
  notes                 TEXT,
  planned_delivery_date TIMESTAMPTZ,
  last_lat              NUMERIC,
  last_lng              NUMERIC,
  lat                   NUMERIC,
  lng                   NUMERIC,
  last_telemetry_at     TIMESTAMPTZ,
  route_geometry        JSONB,
  exception_type        TEXT,
  exception_notes       TEXT,
  exception_photo       TEXT,
  driver_feedback       JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dn_tenant_idx  ON public.delivery_notes(tenant_id);
CREATE INDEX IF NOT EXISTS dn_status_idx  ON public.delivery_notes(status);
CREATE INDEX IF NOT EXISTS dn_driver_idx  ON public.delivery_notes(driver_id);
CREATE INDEX IF NOT EXISTS dn_created_idx ON public.delivery_notes(created_at DESC);

-- ─── VEHICLES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicles (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plate             TEXT NOT NULL,
  type              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'AVAILABLE',
  driver_id         TEXT,
  make              TEXT,
  model             TEXT,
  year              INTEGER,
  fuel_type         TEXT DEFAULT 'PETROL',
  capacity_kg       NUMERIC,
  odo_km            NUMERIC DEFAULT 0,
  compliance_score  NUMERIC DEFAULT 100,
  insurance_expiry  TEXT,
  inspection_due    TEXT,
  last_service      TEXT,
  last_lat          NUMERIC,
  last_lng          NUMERIC,
  last_seen_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vehicles_tenant_idx ON public.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS vehicles_status_idx ON public.vehicles(status);

-- ─── TRIPS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trips (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  driver_id    TEXT,
  vehicle_id   TEXT,
  dn_ids       TEXT[] NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'PENDING',
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  route_km     NUMERIC,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trips_tenant_idx ON public.trips(tenant_id);
CREATE INDEX IF NOT EXISTS trips_driver_idx ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS trips_status_idx ON public.trips(status);

-- ─── FACILITIES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.facilities (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'WAREHOUSE',
  address           TEXT,
  lat               NUMERIC,
  lng               NUMERIC,
  capacity          NUMERIC,
  current_occupancy NUMERIC DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'OPERATIONAL',
  manager_id        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INVENTORY ITEMS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id               TEXT PRIMARY KEY,
  tenant_id        TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sku              TEXT,
  name             TEXT NOT NULL,
  category         TEXT,
  unit             TEXT DEFAULT 'PCS',
  qty_on_hand      NUMERIC NOT NULL DEFAULT 0,
  qty_reserved     NUMERIC NOT NULL DEFAULT 0,
  reorder_point    NUMERIC DEFAULT 10,
  cost_price       NUMERIC DEFAULT 0,
  sell_price       NUMERIC DEFAULT 0,
  facility_id      TEXT,
  temp_requirement JSONB,
  expiry_date      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inventory_tenant_idx ON public.inventory_items(tenant_id);

-- ─── AUDIT LOGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id     TEXT NOT NULL,
  user_id       TEXT,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  details       JSONB DEFAULT '{}',
  ip_address    TEXT,
  user_agent    TEXT,
  severity      TEXT NOT NULL DEFAULT 'INFO',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_tenant_idx  ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS audit_created_idx ON public.audit_logs(created_at DESC);

-- ─── HEALTH CHECK (used by the app's /health endpoint) ────────
CREATE TABLE IF NOT EXISTS public.health_check (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO public.health_check VALUES (1, NOW()) ON CONFLICT (id) DO NOTHING;

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER delivery_notes_updated_at
  BEFORE UPDATE ON public.delivery_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE public.tenants        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs     ENABLE ROW LEVEL SECURITY;

-- Helper: resolve the caller's tenant_id from the users table
CREATE OR REPLACE FUNCTION public.auth_tenant_id()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid()::text LIMIT 1;
$$;

-- Tenant: users can read their own tenant row
CREATE POLICY "tenants_select" ON public.tenants
  FOR SELECT USING (id = public.auth_tenant_id());

-- Users: full isolation by tenant
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id());
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (tenant_id = public.auth_tenant_id());

-- Delivery notes
CREATE POLICY "dn_select" ON public.delivery_notes
  FOR SELECT USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "dn_insert" ON public.delivery_notes
  FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id());
CREATE POLICY "dn_update" ON public.delivery_notes
  FOR UPDATE USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "dn_delete" ON public.delivery_notes
  FOR DELETE USING (tenant_id = public.auth_tenant_id());

-- Vehicles
CREATE POLICY "vehicles_select" ON public.vehicles
  FOR SELECT USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "vehicles_insert" ON public.vehicles
  FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id());
CREATE POLICY "vehicles_update" ON public.vehicles
  FOR UPDATE USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "vehicles_delete" ON public.vehicles
  FOR DELETE USING (tenant_id = public.auth_tenant_id());

-- Trips
CREATE POLICY "trips_select" ON public.trips
  FOR SELECT USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "trips_insert" ON public.trips
  FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id());
CREATE POLICY "trips_update" ON public.trips
  FOR UPDATE USING (tenant_id = public.auth_tenant_id());

-- Facilities
CREATE POLICY "facilities_select" ON public.facilities
  FOR SELECT USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "facilities_insert" ON public.facilities
  FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id());
CREATE POLICY "facilities_update" ON public.facilities
  FOR UPDATE USING (tenant_id = public.auth_tenant_id());

-- Inventory
CREATE POLICY "inventory_select" ON public.inventory_items
  FOR SELECT USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "inventory_insert" ON public.inventory_items
  FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id());
CREATE POLICY "inventory_update" ON public.inventory_items
  FOR UPDATE USING (tenant_id = public.auth_tenant_id());

-- Audit logs: read-only for authenticated users in same tenant
CREATE POLICY "audit_select" ON public.audit_logs
  FOR SELECT USING (tenant_id = public.auth_tenant_id());
CREATE POLICY "audit_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (tenant_id = public.auth_tenant_id());

-- health_check: publicly readable (no auth needed for /health)
CREATE POLICY "health_public" ON public.health_check
  FOR SELECT USING (true);
