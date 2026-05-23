-- ============================================================================
-- Shipstack: bays table migration
-- ----------------------------------------------------------------------------
-- Adds persistent loading-dock state for the Facility Portal. Each row is one
-- physical bay at a facility, tracked through its operational lifecycle and
-- optionally linked to the Delivery Note (DN) currently occupying it.
--
-- Apply against the Supabase Postgres database. Idempotent (safe to re-run).
--
-- Design choices:
--   * facility_id and dn_id are stored as plain text, NOT foreign keys.
--     Shipstack's facilities and delivery_notes tables are optional in
--     SUPABASE_SETUP.md (the app falls back to localStorage), so making bays
--     hard-depend on them would force a particular setup order. The app
--     enforces the relationships in code.
--   * RLS policies reference public.profiles for tenant lookup; that table
--     IS required (it's the auth-state source of truth per SUPABASE_SETUP.md).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------
create table if not exists public.bays (
  id           text primary key,
  facility_id  text not null,
  tenant_id    text,
  number       integer not null,
  status       text not null default 'EMPTY'
               check (status in ('EMPTY','RESERVED','LOADING','UNLOADING','MAINTENANCE')),
  dn_id        text,
  notes        text,
  updated_at   timestamptz not null default now(),
  updated_by   text,
  unique (facility_id, number)
);

create index if not exists bays_facility_idx on public.bays (facility_id);
create index if not exists bays_tenant_idx   on public.bays (tenant_id);
create index if not exists bays_status_idx   on public.bays (status);

-- ---------------------------------------------------------------------------
-- 2. Row-Level Security: tenants can only see their own bays.
-- ---------------------------------------------------------------------------
alter table public.bays enable row level security;

drop policy if exists "bays_select_own_tenant" on public.bays;
create policy "bays_select_own_tenant" on public.bays
  for select using (
    tenant_id is null
    or tenant_id = coalesce(
      (auth.jwt() ->> 'tenant_id')::text,
      (select tenant_id from public.profiles where id = auth.uid())
    )
  );

drop policy if exists "bays_write_own_tenant" on public.bays;
create policy "bays_write_own_tenant" on public.bays
  for all using (
    tenant_id = coalesce(
      (auth.jwt() ->> 'tenant_id')::text,
      (select tenant_id from public.profiles where id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Realtime: enable change broadcasts so the FacilityPortal (and the
--    useRealtimeTable hook) sees live status flips without polling.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.bays;

-- ---------------------------------------------------------------------------
-- 4. Seed: 8 demo bays for facility 'f-1' / tenant 'tenant-1'. Mirrors the
--    initialBays constant in api.ts so the demo Facility Portal renders the
--    same grid against Supabase that it does against localStorage. Idempotent.
-- ---------------------------------------------------------------------------
insert into public.bays (id, facility_id, tenant_id, number, status, dn_id) values
  ('b-f1-1', 'f-1', 'tenant-1', 1, 'LOADING',   'DN-772'),
  ('b-f1-2', 'f-1', 'tenant-1', 2, 'EMPTY',     null),
  ('b-f1-3', 'f-1', 'tenant-1', 3, 'UNLOADING', 'DN-881'),
  ('b-f1-4', 'f-1', 'tenant-1', 4, 'RESERVED',  'DN-902'),
  ('b-f1-5', 'f-1', 'tenant-1', 5, 'EMPTY',     null),
  ('b-f1-6', 'f-1', 'tenant-1', 6, 'LOADING',   'DN-102'),
  ('b-f1-7', 'f-1', 'tenant-1', 7, 'EMPTY',     null),
  ('b-f1-8', 'f-1', 'tenant-1', 8, 'EMPTY',     null)
on conflict (id) do nothing;
