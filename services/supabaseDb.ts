/**
 * Supabase CRUD service — wraps all direct database access.
 * Handles camelCase ↔ snake_case mapping between TypeScript types and Postgres columns.
 * Used by api.ts as the second-tier (Frappe → Supabase → localStorage).
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import type { User, DeliveryNote, Vehicle, Tenant } from '../types';

// ─── Row → TypeScript mappers ──────────────────────────────────────────────

function userFromRow(row: any): User {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    email: row.email,
    role: row.role,
    isOnboarded: row.is_onboarded ?? false,
    onDuty: row.on_duty ?? false,
    phone: row.phone,
    company: row.company,
    avatar: row.avatar,
    idNumber: row.id_number,
    kraPin: row.kra_pin,
    licenseNumber: row.license_number,
    facilityId: row.facility_id,
    verificationStatus: row.verification_status ?? 'PENDING',
    joinedAt: row.created_at,
  } as User;
}

function userToRow(u: Partial<User>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (u.tenantId       !== undefined) row.tenant_id          = u.tenantId;
  if (u.name           !== undefined) row.name               = u.name;
  if (u.email          !== undefined) row.email              = u.email;
  if (u.role           !== undefined) row.role               = u.role;
  if (u.isOnboarded    !== undefined) row.is_onboarded       = u.isOnboarded;
  if (u.onDuty         !== undefined) row.on_duty            = u.onDuty;
  if (u.phone          !== undefined) row.phone              = u.phone;
  if (u.company        !== undefined) row.company            = u.company;
  if (u.avatar         !== undefined) row.avatar             = u.avatar;
  if (u.idNumber       !== undefined) row.id_number          = u.idNumber;
  if (u.kraPin         !== undefined) row.kra_pin            = u.kraPin;
  if (u.licenseNumber  !== undefined) row.license_number     = u.licenseNumber;
  if (u.facilityId     !== undefined) row.facility_id        = u.facilityId;
  if (u.verificationStatus !== undefined) row.verification_status = u.verificationStatus;
  return row;
}

function dnFromRow(row: any): DeliveryNote {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    externalId: row.external_id,
    clientName: row.client_name,
    address: row.address,
    status: row.status,
    type: row.type,
    priority: row.priority,
    industry: row.industry,
    driverId: row.driver_id,
    vehicleId: row.vehicle_id,
    tripId: row.trip_id,
    weightKg: row.weight_kg,
    items: row.items ?? [],
    logs: row.logs ?? [],
    documents: row.documents ?? [],
    podSignature: row.pod_signature,
    podPhoto: row.pod_photo,
    podOtp: row.pod_otp,
    notes: row.notes,
    plannedDeliveryDate: row.planned_delivery_date,
    lastLat: row.last_lat,
    lastLng: row.last_lng,
    lat: row.lat,
    lng: row.lng,
    lastTelemetryAt: row.last_telemetry_at,
    routeGeometry: row.route_geometry,
    exceptionType: row.exception_type,
    exceptionNotes: row.exception_notes,
    exceptionPhoto: row.exception_photo,
    driverFeedback: row.driver_feedback,
    createdAt: row.created_at,
  } as unknown as DeliveryNote;
}

function dnToRow(dn: Partial<DeliveryNote>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const d = dn as any;
  if (d.tenantId             !== undefined) row.tenant_id             = d.tenantId;
  if (d.externalId           !== undefined) row.external_id           = d.externalId;
  if (d.clientName           !== undefined) row.client_name           = d.clientName;
  if (d.address              !== undefined) row.address               = d.address;
  if (d.status               !== undefined) row.status                = d.status;
  if (d.type                 !== undefined) row.type                  = d.type;
  if (d.priority             !== undefined) row.priority              = d.priority;
  if (d.industry             !== undefined) row.industry              = d.industry;
  if (d.driverId             !== undefined) row.driver_id             = d.driverId;
  if (d.vehicleId            !== undefined) row.vehicle_id            = d.vehicleId;
  if (d.tripId               !== undefined) row.trip_id               = d.tripId;
  if (d.weightKg             !== undefined) row.weight_kg             = d.weightKg;
  if (d.items                !== undefined) row.items                 = d.items;
  if (d.logs                 !== undefined) row.logs                  = d.logs;
  if (d.documents            !== undefined) row.documents             = d.documents;
  if (d.podSignature         !== undefined) row.pod_signature         = d.podSignature;
  if (d.podPhoto             !== undefined) row.pod_photo             = d.podPhoto;
  if (d.podOtp               !== undefined) row.pod_otp               = d.podOtp;
  if (d.notes                !== undefined) row.notes                 = d.notes;
  if (d.plannedDeliveryDate  !== undefined) row.planned_delivery_date = d.plannedDeliveryDate;
  if (d.lastLat              !== undefined) row.last_lat              = d.lastLat;
  if (d.lastLng              !== undefined) row.last_lng              = d.lastLng;
  if (d.lat                  !== undefined) row.lat                   = d.lat;
  if (d.lng                  !== undefined) row.lng                   = d.lng;
  if (d.lastTelemetryAt      !== undefined) row.last_telemetry_at     = d.lastTelemetryAt;
  if (d.routeGeometry        !== undefined) row.route_geometry        = d.routeGeometry;
  if (d.exceptionType        !== undefined) row.exception_type        = d.exceptionType;
  if (d.exceptionNotes       !== undefined) row.exception_notes       = d.exceptionNotes;
  if (d.exceptionPhoto       !== undefined) row.exception_photo       = d.exceptionPhoto;
  if (d.driverFeedback       !== undefined) row.driver_feedback       = d.driverFeedback;
  return row;
}

function vehicleFromRow(row: any): Vehicle {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    plate: row.plate,
    type: row.type,
    status: row.status,
    driverId: row.driver_id,
    make: row.make,
    model: row.model,
    year: row.year,
    fuelType: row.fuel_type,
    capacityKg: row.capacity_kg,
    odoKm: row.odo_km,
    complianceScore: row.compliance_score,
    insuranceExpiry: row.insurance_expiry,
    inspectionDue: row.inspection_due,
    lastService: row.last_service,
    lastLat: row.last_lat,
    lastLng: row.last_lng,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
  } as unknown as Vehicle;
}

function vehicleToRow(v: Partial<Vehicle>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const d = v as any;
  if (d.tenantId        !== undefined) row.tenant_id        = d.tenantId;
  if (d.plate           !== undefined) row.plate            = d.plate;
  if (d.type            !== undefined) row.type             = d.type;
  if (d.status          !== undefined) row.status           = d.status;
  if (d.driverId        !== undefined) row.driver_id        = d.driverId;
  if (d.make            !== undefined) row.make             = d.make;
  if (d.model           !== undefined) row.model            = d.model;
  if (d.year            !== undefined) row.year             = d.year;
  if (d.fuelType        !== undefined) row.fuel_type        = d.fuelType;
  if (d.capacityKg      !== undefined) row.capacity_kg      = d.capacityKg;
  if (d.odoKm           !== undefined) row.odo_km           = d.odoKm;
  if (d.complianceScore !== undefined) row.compliance_score = d.complianceScore;
  if (d.insuranceExpiry !== undefined) row.insurance_expiry = d.insuranceExpiry;
  if (d.inspectionDue   !== undefined) row.inspection_due   = d.inspectionDue;
  if (d.lastService     !== undefined) row.last_service     = d.lastService;
  if (d.lastLat         !== undefined) row.last_lat         = d.lastLat;
  if (d.lastLng         !== undefined) row.last_lng         = d.lastLng;
  if (d.lastSeenAt      !== undefined) row.last_seen_at     = d.lastSeenAt;
  return row;
}

function tenantFromRow(row: any): Tenant {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    subdomain: row.subdomain,
    logo: row.logo,
    plan: row.plan,
    tier: row.tier,
    status: row.status,
    industry: row.industry,
    enabledModules: row.enabled_modules ?? [],
    settings: row.settings ?? {},
    securitySettings: row.security_settings ?? {},
    createdAt: row.created_at,
  } as Tenant;
}

function tenantToRow(t: Partial<Tenant>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (t.name             !== undefined) row.name              = t.name;
  if (t.slug             !== undefined) row.slug              = t.slug;
  if (t.subdomain        !== undefined) row.subdomain         = t.subdomain;
  if (t.logo             !== undefined) row.logo              = t.logo;
  if (t.plan             !== undefined) row.plan              = t.plan;
  if (t.tier             !== undefined) row.tier              = t.tier;
  if (t.status           !== undefined) row.status            = t.status;
  if (t.industry         !== undefined) row.industry          = t.industry;
  if (t.enabledModules   !== undefined) row.enabled_modules   = t.enabledModules;
  if (t.settings         !== undefined) row.settings          = t.settings;
  if (t.securitySettings !== undefined) row.security_settings = t.securitySettings;
  return row;
}

// ─── Guard: throw if Supabase not ready ───────────────────────────────────

function requireSupabase(): void {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured');
}

// ─── DeliveryNote CRUD ────────────────────────────────────────────────────

export async function dbGetDeliveryNotes(tenantId: string): Promise<DeliveryNote[]> {
  requireSupabase();
  const { data, error } = await supabase
    .from('delivery_notes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dnFromRow);
}

export async function dbGetDeliveryNote(id: string): Promise<DeliveryNote | null> {
  requireSupabase();
  const { data, error } = await supabase
    .from('delivery_notes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? dnFromRow(data) : null;
}

export async function dbCreateDeliveryNote(dn: Partial<DeliveryNote>): Promise<DeliveryNote> {
  requireSupabase();
  const row = dnToRow(dn);
  row.id = dn.id || `dn-${Date.now()}`;
  const { data, error } = await supabase
    .from('delivery_notes')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return dnFromRow(data);
}

export async function dbUpdateDeliveryNote(id: string, patch: Partial<DeliveryNote>): Promise<DeliveryNote> {
  requireSupabase();
  const { data, error } = await supabase
    .from('delivery_notes')
    .update(dnToRow(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return dnFromRow(data);
}

export async function dbDeleteDeliveryNote(id: string): Promise<void> {
  requireSupabase();
  const { error } = await supabase.from('delivery_notes').delete().eq('id', id);
  if (error) throw error;
}

// ─── User CRUD ────────────────────────────────────────────────────────────

export async function dbGetUsers(tenantId: string): Promise<User[]> {
  requireSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw error;
  return (data ?? []).map(userFromRow);
}

export async function dbGetUserById(id: string): Promise<User | null> {
  requireSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? userFromRow(data) : null;
}

export async function dbGetUserByEmail(email: string): Promise<User | null> {
  requireSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data ? userFromRow(data) : null;
}

export async function dbCreateUser(user: Partial<User>): Promise<User> {
  requireSupabase();
  const row = userToRow(user);
  row.id = (user as any).id || `u-${Date.now()}`;
  const { data, error } = await supabase
    .from('users')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return userFromRow(data);
}

export async function dbUpdateUser(id: string, patch: Partial<User>): Promise<User> {
  requireSupabase();
  const { data, error } = await supabase
    .from('users')
    .update(userToRow(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return userFromRow(data);
}

// ─── Vehicle CRUD ─────────────────────────────────────────────────────────

export async function dbGetVehicles(tenantId: string): Promise<Vehicle[]> {
  requireSupabase();
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('plate');
  if (error) throw error;
  return (data ?? []).map(vehicleFromRow);
}

export async function dbUpdateVehicle(id: string, patch: Partial<Vehicle>): Promise<Vehicle> {
  requireSupabase();
  const { data, error } = await supabase
    .from('vehicles')
    .update(vehicleToRow(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return vehicleFromRow(data);
}

export async function dbCreateVehicle(vehicle: Partial<Vehicle>): Promise<Vehicle> {
  requireSupabase();
  const row = vehicleToRow(vehicle);
  row.id = (vehicle as any).id || `v-${Date.now()}`;
  const { data, error } = await supabase
    .from('vehicles')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return vehicleFromRow(data);
}

// ─── Tenant CRUD ──────────────────────────────────────────────────────────

export async function dbGetTenant(id: string): Promise<Tenant | null> {
  requireSupabase();
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? tenantFromRow(data) : null;
}

export async function dbUpsertTenant(tenant: Partial<Tenant> & { id: string }): Promise<Tenant> {
  requireSupabase();
  const row = { id: tenant.id, ...tenantToRow(tenant) };
  const { data, error } = await supabase
    .from('tenants')
    .upsert(row)
    .select()
    .single();
  if (error) throw error;
  return tenantFromRow(data);
}

// ─── Audit Log ────────────────────────────────────────────────────────────

export async function dbInsertAuditLog(log: {
  tenantId: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  severity?: string;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('audit_logs').insert({
    tenant_id:     log.tenantId,
    user_id:       log.userId,
    action:        log.action,
    resource_type: log.resourceType,
    resource_id:   log.resourceId,
    details:       log.details ?? {},
    severity:      log.severity ?? 'INFO',
  });
  if (error) console.warn('[supabaseDb] audit log insert failed', error.message);
}
