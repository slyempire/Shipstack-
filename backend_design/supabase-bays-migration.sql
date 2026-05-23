-- ============================================================================
-- Shipstack: bays table migration
-- ----------------------------------------------------------------------------
-- Adds persistent loading-dock state for the Facility Portal. Each row is one
-- physical bay at a facility, tracked through its operational lifecycle and
-- optionally linked to the Delivery Note (DN) currently occupying it.
--
-- Apply against the Supabase Postgres database. Idempotent (safe to re-run).
-- ============================================================================

create table if not exists public.bays (
  id           text primary key,
  facility_id  text not null references public.facilities(id) on delete cascade,
  tenant_id    text references public.tenants(id) on delete cascade,
  number       integer not null,
  status       text not null default 'EMPTY'
               check (status in ('EMPTY','RESERVED','LOADING','UNLOADING','MAINTENANCE')),
  dn_id        text references public.delivery_notes(id) on delete set null,
  notes        text,
  updated_at   timestamptz not null default now(),
  updated_by   text,
  unique (facility_id, number)
);

create index if not exists bays_facility_idx on public.bays (facility_id);
create index if not exists bays_tenant_idx   on public.bays (tenant_id);
create index if not exists bays_status_idx   on public.bays (status);

-- ----------------------------------------------------------------------------
-- Row-Level Security: tenants can only see their own bays.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Realtime: enable change broadcasts so the FacilityPortal (and the
-- useRealtimeTable hook) sees live status flips without polling.
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.bays;
