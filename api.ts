import { 
  DeliveryNote, 
  DNStatus, 
  User, 
  UserRole,
  RoleDefinition,
  UserPreferences,
  Permission,
  Facility,
  Bay,
  BayStatus,
  Vehicle,
  VehicleType,
  Trip, 
  OperationalMetrics, 
  ImportLog, 
  LogisticsDocument,
  LogisticsDocumentType, 
  LogisticsDocumentStatus,
  ERPConnector,
  SyncLog,
  APIKey,
  WebhookSubscription,
  ImportPreviewRow,
  ImportBatch,
  IntegrationLog,
  HealthMetrics,
  VehicleInspection,
  Notification,
  Zone,
  DeliveryItem,
  LogisticsType,
  MaintenanceLog,
  FuelLog,
  Order,
  AnalyticsReport,
  InventoryItem,
  WarehouseMovement,
  BinLocation,
  Tenant,
  PermissionRequest,
  ModuleId,
  TelemetryPoint,
  SafetyEventType,
  DriverApplication,
  Priority,
  IndustryType,
  Task,
  LogisticsException,
  ExceptionType,
  ExceptionStatus,
  ColdChainLog,
  JourneyMilestone
} from './types';
import { telemetryService } from './services/socket';
import { supabase, isSupabaseConfigured } from './supabase';
import { sanitize, sanitizeObject, encryptData, decryptData } from './utils/security';
import { FrappeService } from './services/frappe';
import { cacheService } from './services/redis';

// Onboarding -> tenant.settings customization tables. Kept here so the same
// mapping is used regardless of which UI calls completeOnboarding (the
// in-app onboarding flow today; potentially admin "Reset tenant" later).
const REGION_DEFAULTS: Record<string, { currency: string; timezone: string }> = {
  'East Africa':     { currency: 'KES', timezone: 'Africa/Nairobi' },
  'Central Africa':  { currency: 'XAF', timezone: 'Africa/Kinshasa' },
  'South Africa':    { currency: 'ZAR', timezone: 'Africa/Johannesburg' },
  'Pan-African HUB': { currency: 'USD', timezone: 'UTC' },
};

const SIZE_TO_DENSITY: Record<string, 'compact' | 'standard' | 'comfortable'> = {
  '1-10 Units':      'compact',
  '11-50 Units':     'standard',
  '50-100 Units':    'standard',
  'Enterprise 100+': 'comfortable',
};

// We no longer expose Frappe URL to the client. The backend handles the proxy.
const useFrappe = true; // Enabled by default, health check will verify availability
let isFrappeHealthy = true;

const canUseFrappe = () => useFrappe && isFrappeHealthy;

// --- Caching Layer ---
const API_CACHE = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

const getCached = (key: string) => {
  const cached = API_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCached = (key: string, data: any) => {
  API_CACHE.set(key, { data, timestamp: Date.now() });
};

const clearCache = (prefix?: string) => {
  if (!prefix) {
    API_CACHE.clear();
    console.log('[CACHE] Full cache cleared');
  } else {
    let count = 0;
    for (const key of API_CACHE.keys()) {
      if (key.startsWith(prefix)) {
        API_CACHE.delete(key);
        count++;
      }
    }
    console.log(`[CACHE] Cleared ${count} items with prefix: ${prefix}`);
  }
};

const clearAllCache = () => clearCache();

/**
 * Generic API Error Handler
 * Handles network errors, status codes, and unexpected failures.
 */
const handleApiError = (error: any, context: string) => {
  const errorMsg = error?.message?.toLowerCase() || String(error).toLowerCase();
  const isNetworkError = errorMsg.includes('fetch') || errorMsg.includes('network') || error.status === 0;

  if (!isNetworkError) {
    console.error(`[API ERROR] ${context}:`, error);
  }
  
  if (!navigator.onLine) {
    throw new Error('Network error: Please check your internet connection.');
  }

  if (error.status === 401) {
    throw new Error('Unauthorized: Session expired or invalid credentials.');
  }

  if (error.status === 403) {
    throw new Error('Forbidden: You do not have permission to perform this action.');
  }

  if (error.status === 400 && error.details) {
    const details = error.details.map((d: any) => `${d.path}: ${d.message}`).join(', ');
    throw new Error(`Validation Error: ${details}`);
  }

  throw new Error(error.message || `An unexpected error occurred in ${context}.`);
};

/**
 * Role-Based Access Control Helper
 * Ensures the requester has the necessary role to access a resource.
 */
const checkRole = (role: string | undefined, allowed: string[]) => {
  if (!role) {
    throw new Error('Unauthorized: Authentication required.');
  }
  
  const normalizedRole = role.trim().toLowerCase();
  const normalizedAllowed = allowed.map(r => r.trim().toLowerCase());
  
  // Super Admin - God mode in mock API
  if (normalizedRole === 'super_admin') return;

  // Direct match
  if (normalizedAllowed.includes(normalizedRole)) return;
  
  // Common role group mappings
  const isAdminAllowed = normalizedAllowed.includes('admin') || normalizedAllowed.includes('tenant_admin');
  const isFinanceAllowed = normalizedAllowed.includes('finance') || normalizedAllowed.includes('finance_manager');
  const isDispatcherAllowed = normalizedAllowed.includes('dispatcher') || normalizedAllowed.includes('operations_manager');

  // Admin Group Access
  if (isAdminAllowed && ['admin', 'tenant_admin', 'super_admin'].includes(normalizedRole)) return;
  
  // Finance Group Access
  if (isFinanceAllowed && ['finance', 'finance_manager', 'super_admin', 'tenant_admin'].includes(normalizedRole)) return;

  // Ops Group Access
  if (isDispatcherAllowed && ['dispatcher', 'operations_manager', 'super_admin', 'tenant_admin'].includes(normalizedRole)) return;

  throw new Error(`Forbidden: Insufficient permissions to access this resource. (Role Detected: ${role}, Permissions Required: ${allowed.join(', ')})`);
};

/**
 * Audit Logger (ISO 27001 A.12.4)
 * Ensures all critical actions are logged for security and compliance.
 */
const logAudit = async (action: string, details: any, user: string = 'System') => {
  const log = {
    id: `audit-${Date.now()}`,
    action,
    details,
    user,
    timestamp: new Date().toISOString(),
  };
  
  const logs = getStore('audit_logs', []);
  const updatedLogs = [log, ...logs].slice(0, 100);
  setStore('audit_logs', updatedLogs);
  
  if (canUseFrappe()) {
    try {
      await FrappeService.callMethod('shipstack.api.log_audit', log);
    } catch (err) {
      console.warn('Frappe Audit Log failed, disabling Frappe integration', err);
      isFrappeHealthy = false;
    }
  }
};

const getStore = <T>(key: string, initial: T): T => {
  try {
    const data = localStorage.getItem(`shipstack_int_${key}`);
    if (!data) return initial;
    
    // Attempt to decrypt
    const decrypted = decryptData(data);
    if (decrypted === null) return initial;

    // Ensure type consistency for arrays
    if (Array.isArray(initial) && !Array.isArray(decrypted)) {
      console.warn(`Store for ${key} expected an array but got ${typeof decrypted}. Falling back to initial.`);
      return initial;
    }

    return decrypted as T;
  } catch (err) {
    console.warn(`Failed to parse store for ${key}`, err);
    return initial;
  }
};

const setStore = <T>(key: string, data: T) => {
  // Encrypt data before storing
  const encrypted = encryptData(data);
  localStorage.setItem(`shipstack_int_${key}`, encrypted);
};

const initialTenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Shipstack HQ',
    slug: 'shipstack-hq',
    subdomain: 'app',
    plan: 'ENTERPRISE',
    status: 'ACTIVE',
    industry: 'GENERAL',
    settings: {
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      primaryColor: '#0F2A44',
      onboardingCompleted: true
    },
    enabledModules: ['dashboard', 'dispatch', 'warehouse', 'orders', 'fleet', 'finance', 'analytics', 'integrations'],
    securitySettings: {
      auditLogging: true,
      twoFactorAuth: false,
      requireNTSAVerification: true
    },
    createdAt: new Date(Date.now() - 31536000000).toISOString()
  },
  {
    id: 'tenant-2',
    name: 'Alpha Transporters Ltd',
    slug: 'alpha-transporters',
    subdomain: 'alpha',
    plan: 'GROWTH',
    status: 'ACTIVE',
    industry: 'GENERAL',
    settings: {
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      primaryColor: '#1e293b',
      onboardingCompleted: true
    },
    enabledModules: ['dispatch', 'fleet', 'orders'],
    securitySettings: {
      auditLogging: true,
      twoFactorAuth: false,
      requireNTSAVerification: true
    },
    createdAt: new Date(Date.now() - 15552000000).toISOString()
  }
];

const initialUsers: User[] = [
  { id: 'u-admin-root', name: 'Joe Mugoh', email: 'joemugoh215@gmail.com', role: 'super_admin', company: 'Shipstack HQ', password: 'password', verificationStatus: 'VERIFIED', isOnboarded: true, tenantId: 'tenant-1' },
  { id: 'u-1', name: 'Admin User', email: 'admin@shipstack.com', role: 'super_admin', company: 'Shipstack HQ', password: 'password', verificationStatus: 'VERIFIED', isOnboarded: true, tenantId: 'tenant-1' },
  { id: 'd-1', name: 'Driver John', email: 'pilot@shipstack.com', role: 'driver', company: 'Alpha Transporters', idNumber: '12345678', kraPin: 'A001234567Z', licenseNumber: 'DL-99221', onDuty: true, password: 'password', verificationStatus: 'VERIFIED', isOnboarded: true, tenantId: 'tenant-1' },
  { id: 'd-2', name: 'Driver Sarah', email: 'sarah@shipstack.com', role: 'driver', company: 'Beta Logistics', idNumber: '87654321', kraPin: 'B008765432X', licenseNumber: 'DL-88112', onDuty: false, password: 'password', verificationStatus: 'PENDING', isOnboarded: true, tenantId: 'tenant-1' },
  { id: 'd-3', name: 'Driver Mike', email: 'mike@shipstack.com', role: 'driver', company: 'Gamma Express', idNumber: '11223344', kraPin: 'C001122334Y', licenseNumber: 'DL-77334', onDuty: true, password: 'password', verificationStatus: 'VERIFIED', isOnboarded: true, tenantId: 'tenant-1' },
  { id: 'd-4', name: 'Driver Kevin', email: 'kevin@shipstack.com', role: 'driver', company: 'Alpha Transporters', idNumber: '44332211', kraPin: 'D004433221W', licenseNumber: 'DL-66445', onDuty: true, password: 'password', verificationStatus: 'VERIFIED', isOnboarded: true, tenantId: 'tenant-1' },
  { id: 'f-1', name: 'Hub Manager', email: 'hub@shipstack.com', role: 'facility_operator', company: 'MEDS Central Hub', password: 'password', verificationStatus: 'VERIFIED', isOnboarded: true, tenantId: 'tenant-1' },
  { id: 'w-1', name: 'Warehouse Lead', email: 'warehouse@shipstack.com', role: 'facility_operator', company: 'MEDS Warehouse', password: 'password', verificationStatus: 'VERIFIED', isOnboarded: true, tenantId: 'tenant-1' },
  { id: 'fin-1', name: 'Finance Lead', email: 'finance@shipstack.com', role: 'finance_manager', company: 'Shipstack HQ', password: 'password', verificationStatus: 'VERIFIED', isOnboarded: true, tenantId: 'tenant-1' }
];

const initialOrders: Order[] = [
  {
    id: 'ord-1',
    externalId: 'SO-2001',
    customerId: 'cust-1',
    customerName: 'Naivas Supermarket',
    status: 'APPROVED',
    items: [
      { name: 'Fresh Milk 500ml', qty: 100, unit: 'unit', sku: 'FOOD-MLK-001' },
      { name: 'Maize Flour 2kg', qty: 50, unit: 'bale', sku: 'FOOD-MZE-002' }
    ],
    totalAmount: 45000,
    currency: 'KES',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    paymentStatus: 'PAID',
    fraudScore: 2,
    tenantId: 'tenant-1'
  },
  {
    id: 'ord-2',
    externalId: 'SO-2002',
    customerId: 'cust-2',
    customerName: 'Quickmart Retail',
    status: 'PENDING',
    items: [
      { name: 'Cooking Oil 3L', qty: 20, unit: 'box', sku: 'FOOD-OIL-003' }
    ],
    totalAmount: 12000,
    currency: 'KES',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paymentStatus: 'UNPAID',
    fraudScore: 8,
    tenantId: 'tenant-1'
  },
  {
    id: 'ord-3',
    externalId: 'SO-2003',
    customerId: 'cust-3',
    customerName: 'Chandaria Industries',
    status: 'APPROVED',
    items: [
      { name: 'Tissue Paper 2-Ply', qty: 1000, unit: 'roll', sku: 'HSE-TIS-001' }
    ],
    totalAmount: 85000,
    currency: 'KES',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
    paymentStatus: 'PAID',
    fraudScore: 1,
    tenantId: 'tenant-1'
  }
];

const initialMaintenanceLogs: MaintenanceLog[] = [
  {
    id: 'maint-1',
    vehicleId: 'v-1',
    tenantId: 'tenant-1',
    type: 'ROUTINE',
    description: 'Oil change and brake inspection',
    cost: 5500,
    date: new Date(Date.now() - 172800000).toISOString(),
    odometerReading: 12500,
    performedBy: 'Alpha Garage',
    nextServiceDate: new Date(Date.now() + 2592000000).toISOString(),
    status: 'COMPLETED'
  },
  {
    id: 'maint-2',
    vehicleId: 'v-3',
    tenantId: 'tenant-1',
    type: 'REPAIR',
    description: 'Tire replacement (Rear Left)',
    cost: 12000,
    date: new Date(Date.now() - 432000000).toISOString(),
    odometerReading: 45200,
    performedBy: 'City Tires Hub',
    status: 'COMPLETED'
  }
];

const initialZones: Zone[] = [
  { id: 'z-1', name: 'Nairobi Central', description: 'CBD and surrounding areas', color: '#3b82f6' },
  { id: 'z-2', name: 'Westlands', description: 'Westlands, Parklands, and Highridge', color: '#10b981' },
  { id: 'z-3', name: 'Mombasa Road', description: 'Industrial Area and Mombasa Road corridor', color: '#f59e0b' },
  { id: 'z-4', name: 'Karen/Langata', description: 'Karen and Langata residential areas', color: '#8b5cf6' },
  { id: 'z-5', name: 'Thika Road corridor', description: 'Roysambu to Juja', color: '#ec4899' }
];

const initialDeliveryNotes: DeliveryNote[] = [
  { 
    id: 'dn-1', externalId: 'FD-9001', type: LogisticsType.OUTBOUND, clientName: 'Naivas Supermarket', address: 'Westlands, Nairobi', 
    zoneId: 'z-2',
    status: DNStatus.READY_FOR_DISPATCH, priority: 'HIGH', industry: 'FOOD', createdAt: new Date().toISOString(), items: [
      { id: 'item-1', name: 'Fresh Milk 500ml', qty: 100, unit: 'unit', sku: 'FOOD-MLK-001', dimensions: { length: 20, width: 15, height: 10, unit: 'cm' } },
      { id: 'item-2', name: 'Yogurt 250ml', qty: 50, unit: 'unit', sku: 'FOOD-YGT-002', dimensions: { length: 30, width: 20, height: 15, unit: 'cm' } }
    ],
    weightKg: 150,
    isPerishable: true,
    tempRequirement: { min: 2, max: 8, current: 4.2, unit: 'C' },
    tempLogs: [
      { id: 't-0', dnId: 'dn-1', temperature: 4.5, timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'NORMAL' },
      { id: 't-1', dnId: 'dn-1', temperature: 4.2, timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'NORMAL' }
    ],
    lat: -1.265, lng: 36.800, 
    lastLat: -1.2863, lastLng: 36.8172, 
    notes: 'Cold chain mandatory. Deliver to loading bay 4.',
    logs: [], documents: [],
    tenantId: 'tenant-1'
  },
  { 
    id: 'dn-2', externalId: 'FD-9002', type: LogisticsType.OUTBOUND, clientName: 'Carrefour Junction', address: 'Ngong Rd, Nairobi', 
    zoneId: 'z-4',
    status: DNStatus.IN_TRANSIT, priority: 'MEDIUM', industry: 'FOOD', createdAt: new Date().toISOString(), items: [
      { id: 'item-3', name: 'Frozen Fish Fillet', qty: 30, unit: 'kg', sku: 'FOOD-FSH-003' }
    ],
    weightKg: 300,
    isPerishable: true,
    tempRequirement: { min: -18, max: -12, current: -15.5, unit: 'C' },
    tempLogs: [
      { id: 't-2', dnId: 'dn-2', temperature: -16.2, timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'NORMAL' },
      { id: 't-3', dnId: 'dn-2', temperature: -15.5, timestamp: new Date().toISOString(), status: 'NORMAL' }
    ],
    lat: -1.298, lng: 36.762,
    lastLat: -1.286, lastLng: 36.817,
    logs: [], documents: [],
    driverId: 'd-1', vehicleId: 'v-1',
    tenantId: 'tenant-1'
  },
  { 
    id: 'dn-3', externalId: 'FD-9003', type: LogisticsType.OUTBOUND, clientName: 'Local Duka - Mama Njeri', address: 'Pangani, Nairobi', 
    zoneId: 'z-1',
    priority: 'LOW', industry: 'FOOD', createdAt: new Date().toISOString(), items: [
      { id: 'item-4', name: 'Maize Flour 2kg', qty: 10, unit: 'bale', sku: 'FOOD-MZE-002' }
    ],
    weightKg: 240,
    lat: -1.260, lng: 36.840,
    lastLat: -1.286, lastLng: 36.817,
    status: DNStatus.EXCEPTION,
    logs: [
      { id: 'log-late-1', action: 'EXCEPTION: LATE', notes: 'Heavy traffic on Thika Road', user: 'System', timestamp: new Date().toISOString() }
    ],
    documents: [],
    tenantId: 'tenant-1'
  },
  { 
    id: 'dn-4', externalId: 'GEN-4001', type: LogisticsType.OUTBOUND, clientName: 'Tuskys HQ', address: 'Mombasa Rd, Nairobi', 
    zoneId: 'z-3',
    status: DNStatus.PENDING, priority: 'MEDIUM', industry: 'GENERAL', createdAt: new Date(Date.now() - 3600000).toISOString(), items: [
      { id: 'item-5', name: 'Office Chairs', qty: 25, unit: 'unit', sku: 'GEN-FRN-001' }
    ],
    weightKg: 450,
    lat: -1.321, lng: 36.855,
    lastLat: -1.286, lastLng: 36.817,
    logs: [], documents: [],
    tenantId: 'tenant-1'
  },
  { 
    id: 'dn-5', externalId: 'GEN-4002', type: LogisticsType.OUTBOUND, clientName: 'Safaricom House', address: 'Waiyaki Way, Nairobi', 
    zoneId: 'z-2',
    status: DNStatus.READY_FOR_DISPATCH, priority: 'HIGH', industry: 'GENERAL', createdAt: new Date().toISOString(), items: [
      { id: 'item-6', name: 'Fiber Cables 100m', qty: 10, unit: 'unit', sku: 'GEN-TEL-001' }
    ],
    weightKg: 80,
    lat: -1.263, lng: 36.786,
    lastLat: -1.286, lastLng: 36.817,
    logs: [], documents: [],
    tenantId: 'tenant-1'
  },
  { 
    id: 'dn-6', externalId: 'FD-9006', type: LogisticsType.OUTBOUND, clientName: 'Village Market - Organic Section', address: 'Limuru Rd, Nairobi', 
    zoneId: 'z-2',
    status: DNStatus.READY_FOR_DISPATCH, priority: 'HIGH', industry: 'FOOD', createdAt: new Date().toISOString(), items: [
      { id: 'item-7', name: 'Organic Avocado Box', qty: 15, unit: 'kg', sku: 'FOOD-AVO-001' },
      { id: 'item-8', name: 'Fresh Berries 250g', qty: 40, unit: 'unit', sku: 'FOOD-BRY-001' }
    ],
    weightKg: 85,
    isPerishable: true,
    tempRequirement: { min: 4, max: 10, current: 6.5, unit: 'C' },
    lat: -1.229, lng: 36.804,
    lastLat: -1.286, lastLng: 36.817,
    notes: 'Fragile handling required. Premium client.',
    logs: [], documents: [],
    tenantId: 'tenant-1'
  }
];

const initialVehicles: Vehicle[] = [
  { 
    id: 'v-1', plate: 'KCD 123A', type: VehicleType.LIGHT_TRUCK, capacityKg: 3000, status: 'ACTIVE', ownerId: 'Alpha Transporters',
    ntsaInspectionExpiry: '2026-12-31', insuranceExpiry: '2026-12-31', verificationStatus: 'VERIFIED', complianceScore: 98,
    tenantId: 'tenant-1'
  },
  { 
    id: 'v-2', plate: 'KDC 999B', type: VehicleType.MEDIUM_TRUCK, capacityKg: 7000, status: 'ACTIVE', ownerId: 'Beta Logistics',
    ntsaInspectionExpiry: '2023-01-01', insuranceExpiry: '2023-01-01', verificationStatus: 'REJECTED', complianceScore: 45,
    tenantId: 'tenant-1'
  },
  { 
    id: 'v-3', plate: 'KBA 555C', type: VehicleType.SMALL_VAN, capacityKg: 800, status: 'ACTIVE', ownerId: 'Alpha Transporters',
    ntsaInspectionExpiry: '2026-06-30', insuranceExpiry: '2026-06-30', verificationStatus: 'VERIFIED', complianceScore: 92,
    tenantId: 'tenant-1'
  },
  { 
    id: 'v-4', plate: 'KCC 777D', type: VehicleType.HEAVY_TRUCK, capacityKg: 28000, status: 'ACTIVE', ownerId: 'Gamma Express',
    ntsaInspectionExpiry: '2026-09-15', insuranceExpiry: '2026-09-15', verificationStatus: 'PENDING', complianceScore: 75,
    tenantId: 'tenant-1'
  },
  { 
    id: 'v-5', plate: 'KMCD 442X', type: VehicleType.BODA_BODA, capacityKg: 150, status: 'ACTIVE', ownerId: 'Boda Express',
    ntsaInspectionExpiry: '2026-05-20', insuranceExpiry: '2026-05-20', verificationStatus: 'VERIFIED', complianceScore: 88,
    tenantId: 'tenant-1'
  },
  { 
    id: 'v-6', plate: 'KTWA 112Y', type: VehicleType.TUK_TUK, capacityKg: 400, status: 'ACTIVE', ownerId: 'City TukTuks',
    ntsaInspectionExpiry: '2026-08-10', insuranceExpiry: '2026-08-10', verificationStatus: 'VERIFIED', complianceScore: 90,
    tenantId: 'tenant-1'
  },
  { 
    id: 'v-7', plate: 'KDE 332Z', type: VehicleType.LARGE_VAN, capacityKg: 2000, status: 'ACTIVE', ownerId: 'Beta Logistics',
    ntsaInspectionExpiry: '2026-11-05', insuranceExpiry: '2026-11-05', verificationStatus: 'VERIFIED', complianceScore: 95,
    tenantId: 'tenant-1'
  },
  { 
    id: 'v-8', plate: 'KDA 111F', type: VehicleType.REFRIGERATED_TRUCK, capacityKg: 5000, status: 'ACTIVE', ownerId: 'Alpha Transporters',
    ntsaInspectionExpiry: '2026-12-01', insuranceExpiry: '2026-12-01', verificationStatus: 'VERIFIED', complianceScore: 99,
    tenantId: 'tenant-1'
  }
];

const initialFacilities: Facility[] = [
  { id: 'f-1', name: 'Nairobi Main Hub', type: 'WAREHOUSE', lat: -1.286389, lng: 36.817223, address: 'Industrial Area, Lunga Lunga Rd', tenantId: 'tenant-1' },
  { id: 'f-2', name: 'Mombasa Port Hub', type: 'DISTRIBUTION_CENTER', lat: -4.0435, lng: 39.6682, address: 'Port Reitz, Mombasa', tenantId: 'tenant-1' },
  { id: 'f-3', name: 'Kisumu Depot', type: 'WAREHOUSE', lat: -0.1022, lng: 34.7617, address: 'Kondele, Kisumu', tenantId: 'tenant-1' },
  { id: 'f-4', name: 'Eldoret Fulfillment', type: 'DISTRIBUTION_CENTER', lat: 0.5143, lng: 35.2698, address: 'Uganda Rd, Eldoret', tenantId: 'tenant-1' }
];

const initialBays: Bay[] = [
  { id: 'b-f1-1', facilityId: 'f-1', tenantId: 'tenant-1', number: 1, status: BayStatus.LOADING,   dnId: 'DN-772', updatedAt: new Date().toISOString() },
  { id: 'b-f1-2', facilityId: 'f-1', tenantId: 'tenant-1', number: 2, status: BayStatus.EMPTY,                   updatedAt: new Date().toISOString() },
  { id: 'b-f1-3', facilityId: 'f-1', tenantId: 'tenant-1', number: 3, status: BayStatus.UNLOADING, dnId: 'DN-881', updatedAt: new Date().toISOString() },
  { id: 'b-f1-4', facilityId: 'f-1', tenantId: 'tenant-1', number: 4, status: BayStatus.RESERVED,  dnId: 'DN-902', updatedAt: new Date().toISOString() },
  { id: 'b-f1-5', facilityId: 'f-1', tenantId: 'tenant-1', number: 5, status: BayStatus.EMPTY,                   updatedAt: new Date().toISOString() },
  { id: 'b-f1-6', facilityId: 'f-1', tenantId: 'tenant-1', number: 6, status: BayStatus.LOADING,   dnId: 'DN-102', updatedAt: new Date().toISOString() },
  { id: 'b-f1-7', facilityId: 'f-1', tenantId: 'tenant-1', number: 7, status: BayStatus.EMPTY,                   updatedAt: new Date().toISOString() },
  { id: 'b-f1-8', facilityId: 'f-1', tenantId: 'tenant-1', number: 8, status: BayStatus.EMPTY,                   updatedAt: new Date().toISOString() },
];

const initialInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    sku: 'FOOD-MLK-001',
    name: 'Fresh Milk 500ml',
    category: 'Dairy',
    qty: 5000,
    unit: 'unit',
    minThreshold: 1000,
    warehouseId: 'f-1',
    binLocation: 'COLD-01-A',
    batchNumber: 'B-MLK-2024-03',
    expiryDate: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
    tempRequirement: { min: 2, max: 6, current: 4.2, unit: 'C' },
    status: 'IN_STOCK',
    tenantId: 'tenant-1'
  },
  {
    id: 'inv-2',
    sku: 'FOOD-MZE-002',
    name: 'Maize Flour 2kg',
    category: 'Dry Goods',
    qty: 120,
    unit: 'bale',
    minThreshold: 200,
    warehouseId: 'f-1',
    binLocation: 'DRY-04-C',
    status: 'LOW_STOCK',
    tenantId: 'tenant-1'
  },
  {
    id: 'inv-3',
    sku: 'FOOD-FSH-003',
    name: 'Frozen Fish Fillet',
    category: 'Frozen',
    qty: 45,
    unit: 'kg',
    minThreshold: 100,
    warehouseId: 'f-1',
    binLocation: 'FREEZE-02-B',
    batchNumber: 'F-FSH-99',
    expiryDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    tempRequirement: { min: -18, max: -12, unit: 'C' },
    status: 'LOW_STOCK',
    tenantId: 'tenant-1'
  }
];

const initialBinLocations: BinLocation[] = [
  { id: 'bin-1', code: 'A12B01', warehouseId: 'f-1', zone: 'A', aisle: '12', shelf: 'B', bin: '01', capacity: 100, currentFill: 45, isOccupied: true, type: 'PICKING', items: ['SKU-001'], tenantId: 'tenant-1' },
  { id: 'bin-2', code: 'A12B02', warehouseId: 'f-1', zone: 'A', aisle: '12', shelf: 'B', bin: '02', capacity: 100, currentFill: 0, isOccupied: false, type: 'BULK', items: [], tenantId: 'tenant-1' }
];

// --- Idempotency & Request Tracking ---
const PROCESSED_REQUESTS = new Set<string>();

// --- Utility Helpers ---
const toSnakeCase = (obj: any) => {
  const snakeObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = obj[key];
  }
  return snakeObj;
};

const toCamelCase = (obj: any) => {
  if (!obj) return obj;
  const camelObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
    camelObj[camelKey] = obj[key];
  }
  return camelObj;
};

/**
 * Ensures an operation is only performed once for a given request ID.
 * Returns true if the request is new, false if it has already been processed.
 */
const checkIdempotency = (requestId?: string): boolean => {
  if (!requestId) return true;
  if (PROCESSED_REQUESTS.has(requestId)) {
    console.warn(`[IDEMPOTENCY] Request ${requestId} already processed. Skipping.`);
    return false;
  }
  PROCESSED_REQUESTS.add(requestId);
  // Keep the set size manageable
  if (PROCESSED_REQUESTS.size > 1000) {
    const first = PROCESSED_REQUESTS.values().next().value;
    if (first !== undefined) PROCESSED_REQUESTS.delete(first);
  }
  return true;
};

export const api = {
  // --- Roles & Permissions ---
  async getRoles(tenantId: string = 'tenant-1'): Promise<RoleDefinition[]> {
    const cacheKey = `roles_all_${tenantId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const allRoles = getStore<RoleDefinition[]>('custom_roles', []);
    const filtered = allRoles.filter(r => !r.tenantId || r.tenantId === tenantId);
    setCached(cacheKey, filtered);
    return filtered;
  },

  async createRole(role: Partial<RoleDefinition>, tenantId: string = 'tenant-1'): Promise<RoleDefinition> {
    const roles = await api.getRoles(tenantId);
    const newRole: RoleDefinition = {
      role: `custom_${Date.now()}`,
      label: 'New Custom Role',
      description: 'Customized tenant role',
      permissions: [],
      isCustom: true,
      tenantId,
      ...role,
    };
    
    const allRoles = getStore<RoleDefinition[]>('custom_roles', []);
    setStore('custom_roles', [...allRoles, newRole]);
    clearCache('roles_all');
    await logAudit('CREATE_ROLE', { role: newRole.role, label: newRole.label });
    return newRole;
  },

  async updateRole(roleId: string, data: Partial<RoleDefinition>, tenantId: string = 'tenant-1'): Promise<RoleDefinition> {
    const allRoles = getStore<RoleDefinition[]>('custom_roles', []);
    const index = allRoles.findIndex(r => r.role === roleId && (!r.tenantId || r.tenantId === tenantId));
    
    if (index === -1) throw new Error('Role not found or access denied');
    
    const updatedRole = { ...allRoles[index], ...data };
    allRoles[index] = updatedRole;
    
    setStore('custom_roles', allRoles);
    clearCache('roles_all');
    await logAudit('UPDATE_ROLE', { role: roleId, changes: Object.keys(data) });
    return updatedRole;
  },

  async deleteRole(roleId: string, tenantId: string = 'tenant-1'): Promise<void> {
    const allRoles = getStore<RoleDefinition[]>('custom_roles', []);
    const filtered = allRoles.filter(r => !(r.role === roleId && (!r.tenantId || r.tenantId === tenantId)));
    
    setStore('custom_roles', filtered);
    clearCache('roles_all');
    await logAudit('DELETE_ROLE', { role: roleId });
  },

  // --- Auth & Users ---
  async login(email: string, password?: string): Promise<{ user: User, token: string }> {
    const rawEmail = email.trim();
    const normalizedEmail = rawEmail.toLowerCase();
    const sanitizedEmail = sanitize(normalizedEmail);
    const sanitizedPassword = password;

    if (canUseFrappe()) {
      try {
        const result = await FrappeService.callMethod<{ user: User, token: string }>('shipstack.api.login', {
          email: sanitizedEmail,
          password: sanitizedPassword
        });
        await logAudit('LOGIN_SUCCESS', { email: sanitizedEmail }, result.user.name);
        return result;
      } catch (error: any) {
        console.warn('Frappe login failed, disabling Frappe integration', error);
        isFrappeHealthy = false;
        // If it's a network error, we don't throw, we let it fallback to demo/supabase
        const isNetworkError = error.message?.toLowerCase().includes('failed to fetch');
        if (!isNetworkError) throw error;
      }
    }

    // Demo bypass logic - Priority check before hitting external services
    const isKnownDemoEmail = normalizedEmail.includes('shipstack.com') || 
                             normalizedEmail.includes('example.com') ||
                             normalizedEmail === 'joemugoh215@gmail.com' ||
                             normalizedEmail === 'admin@shipstack.com' ||
                             normalizedEmail.includes('pilot') ||
                             normalizedEmail.includes('hub') ||
                             normalizedEmail.includes('warehouse') ||
                             normalizedEmail.includes('finance');

    const allMockUsers = [...initialUsers, ...getStore<User[]>('users', [])];
    const mockUser = allMockUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    // If it's a known demo account or matches a mock user, bypass Supabase if configured for demo
    if (mockUser && (password === 'password' || !password || isKnownDemoEmail)) {
      await logAudit('DEMO_LOGIN_SUCCESS', { email: normalizedEmail }, mockUser.name);
      return { user: mockUser, token: 'mock-jwt-token' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password: password || 'password',
        });

        if (error) {
          const errorMessage = error.message?.toLowerCase() || '';
          
          // Enhanced detection for identity mismatches
          const isInvalidCredentials = errorMessage.includes('invalid') || 
                                        errorMessage.includes('credentials') ||
                                        errorMessage.includes('not found') ||
                                        error.status === 400 ||
                                        error.status === 401;
                                      
          if (isInvalidCredentials) {
            // Final fallback for recognized operational profiles even if Supabase rejects
            if (mockUser) {
              console.warn('[AUTH] Supabase verification bypass: applying local identity protocol for', normalizedEmail);
              return { user: mockUser, token: 'sk_local_' + btoa(normalizedEmail).substring(0, 16) };
            }
            throw new Error(`We couldn't find an account for '${sanitizedEmail}'. Check your email or sign up.`);
          }
          
          console.error('[AUTH] Gateway Failure:', error);
          if (mockUser) return { user: mockUser, token: 'sk_resilience_token' };
          throw new Error('Identity service unreachable. Deploying emergency access protocols...');
        }

        if (!data.user) throw new Error('Security profile retrieval failed');

        let user = await api.getUserById(data.user.id);
        
        if (!user) {
          user = {
            id: data.user.id,
            email: sanitizedEmail,
            name: sanitizedEmail.split('@')[0].toUpperCase(),
            role: sanitizedEmail.includes('admin') ? 'ADMIN' : 'ADMIN',
            company: 'Shipstack Corp',
            verificationStatus: 'VERIFIED',
            isOnboarded: true
          };
          const users = await api.getUsers();
          setStore('users', [...users, user]);
        }
        
        return { user, token: data.session?.access_token || '' };
      } catch (error: any) {
        // Fallback to error handling logic above if not already handled
        if (error.message?.includes('Identity verification failed')) throw error;
        
        console.error('[AUTH] Critical Auth Pipeline Exception:', error);
        if (mockUser) return { user: mockUser, token: 'mock-jwt-token' };
        throw error;
      }
    }

    // Secondary fallback to mock logic if Supabase not configured or failed to find user
    try {
      const users = await api.getUsers();
      const searchEmail = normalizedEmail;
      let user = users.find(u => u.email.toLowerCase() === searchEmail);
      
      if (!user && (searchEmail.includes('shipstack.com') || searchEmail === 'admin@shipstack.com')) {
        user = {
          id: `u-demo-${Date.now()}`,
          name: searchEmail.split('@')[0].toUpperCase(),
          email: searchEmail,
          role: searchEmail.includes('admin') ? 'ADMIN' : searchEmail.includes('driver') ? 'DRIVER' : 'ADMIN',
          company: 'Shipstack Demo Corp',
          verificationStatus: 'VERIFIED',
          isOnboarded: true
        };
      }

      if (!user) throw new Error('Identity profile not detected in the network. Ensure you have registered or use a demo operational ID.');
      if (password && user.password && user.password !== password && password !== 'password') {
        throw new Error('Security token verification failed. Access denied.');
      }
      
      return { user, token: 'mock-jwt-token' };
    } catch (error: any) {
      console.error('Auth Error:', error);
      throw new Error(error.message || 'Authentication failed');
    }
  },

  async loginWithGoogle(): Promise<{ user: User, token: string }> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Use demo login.');
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      
      // Note: Supabase OAuth redirect happens here, so we don't get the user immediately
      // The session will be handled by the auth state listener in App.tsx
      return { user: {} as User, token: '' };
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      throw new Error(error.message || 'Google Authentication failed');
    }
  },

  async resetPassword(email: string): Promise<void> {
    const sanitizedEmail = sanitize(email);
    
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
          redirectTo: `${window.location.origin}/#/reset-password`,
        });
        if (error) throw error;
        await logAudit('PASSWORD_RESET_REQUESTED', { email: sanitizedEmail });
      } catch (error: any) {
        console.error('Supabase Reset Password Error:', error);
        throw new Error(error.message || 'Failed to send reset password email');
      }
    } else {
      // Mock reset password
      await logAudit('DEMO_PASSWORD_RESET_MOCK', { email: sanitizedEmail });
      console.log(`[MOCK] Password reset link sent to ${sanitizedEmail}`);
    }
  },

  async updatePassword(password: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await logAudit('PASSWORD_UPDATED', {});
      } catch (error: any) {
        console.error('Supabase Update Password Error:', error);
        throw new Error(error.message || 'Failed to update password');
      }
    } else {
      // Mock update password
      await logAudit('DEMO_PASSWORD_UPDATE_MOCK', {});
      console.log('[MOCK] Password updated successfully');
    }
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut failed', err);
      }
    }
  },

  async register(data: any): Promise<{ user: User, token: string }> {
    const sanitizedData = sanitizeObject(data);
    
    if (isSupabaseConfigured) {
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: sanitizedData.email,
          password: sanitizedData.password,
        });

        if (error) throw error;
        if (!authData.user) throw new Error('Registration failed');

        const tenantId = `tenant-${Date.now()}`;
        const user: User = { 
          id: authData.user.id, 
          ...sanitizedData, 
          role: sanitizedData.role || 'tenant_admin',
          tenantId,
          isOnboarded: false, 
          onboardingStep: 1 
        };

        // Create profile in Supabase
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: authData.user.id,
              tenant_id: tenantId,
              email: sanitizedData.email,
              name: sanitizedData.name || sanitizedData.email.split('@')[0],
              role: sanitizedData.role || 'tenant_admin',
              company: sanitizedData.company,
              is_onboarded: false,
              onboarding_step: 1
            }]);
          
          if (profileError) throw profileError;
        } catch (dbErr) {
          console.error('Supabase Profile Creation Error:', dbErr);
          // We continue because the auth user is created, but this is a major issue
        }

        // Initialize a tenant for the new user
        const newTenant: Tenant = {
          id: tenantId,
          name: sanitizedData.company || 'New Organization',
          slug: (sanitizedData.company || 'org').toLowerCase().replace(/\s+/g, '-'),
          subdomain: (sanitizedData.company || 'org').toLowerCase().replace(/\s+/g, '-'),
          plan: 'GROWTH',
          status: 'ACTIVE',
          industry: 'GENERAL',
          settings: {
            currency: 'KES',
            timezone: 'Africa/Nairobi',
            primaryColor: '#0F2A44',
            onboardingCompleted: false,
          },
          enabledModules: ['dispatch', 'fleet', 'driver-portal', 'facility-portal', 'finance'],
          securitySettings: {
            auditLogging: true,
            twoFactorAuth: false,
            requireNTSAVerification: true,
          },
          createdAt: new Date().toISOString()
        };
        setStore('tenant', newTenant);

        // Save to local store for demo purposes
        const users = await api.getUsers();
        setStore('users', [...users, user]);
        
        return { user, token: authData.session?.access_token || '' };
      } catch (error: any) {
        const errorMessage = error.message?.toLowerCase() || '';
        const isRateLimit = errorMessage.includes('rate limit exceeded');
        const isInvalidEmail = errorMessage.includes('invalid') && errorMessage.includes('email');
        const isConnectivityError = errorMessage.includes('failed to fetch') || 
                                   errorMessage.includes('network error') ||
                                   error.status === 0;

        if (isRateLimit || isConnectivityError) {
          console.warn('Supabase issue during registration, falling back to mock registration for demo stability');
        } else if (isInvalidEmail) {
          throw new Error(`The identity profile for "${sanitizedData.email}" was rejected by the security gateway. Ensure the email is formatted correctly or try an alternative operational ID.`);
        } else {
          console.error('Supabase Registration Error:', error);
          // Standard register fallback for demo users if it fails in Supabase for any reason (e.g. user already exists)
          if (errorMessage.includes('already registered') || errorMessage.includes('exists')) {
             console.warn('User already exists in Supabase, using mock registration path to avoid blockers');
          } else {
             throw new Error(error.message || 'Registration failed');
          }
        }
      }
    }

    const user: User = { 
      id: `u-${Date.now()}`, 
      ...sanitizedData, 
      role: 'tenant_admin', // Automatically set as tenant_admin
      isOnboarded: false, 
      onboardingStep: 1 
    };

    // Initialize a tenant for the new user (demo mode)
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: sanitizedData.company || 'New Organization',
      slug: (sanitizedData.company || 'org').toLowerCase().replace(/\s+/g, '-'),
      subdomain: (sanitizedData.company || 'org').toLowerCase().replace(/\s+/g, '-'),
      plan: 'GROWTH',
      status: 'ACTIVE',
      industry: 'GENERAL',
      settings: {
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        primaryColor: '#0F2A44',
        onboardingCompleted: false,
      },
      enabledModules: ['dispatch', 'fleet', 'driver-portal', 'facility-portal', 'finance'],
      securitySettings: {
        auditLogging: true,
        twoFactorAuth: false,
        requireNTSAVerification: true,
      },
      createdAt: new Date().toISOString()
    };
    setStore('tenant', newTenant);

    const users = await api.getUsers();
    setStore('users', [...users, user]);
    return { user, token: 'mock-jwt-token' };
  },

  async completeOnboarding(
    userId: string,
    data: {
      industry: IndustryType;
      modules: ModuleId[];
      companyName?: string;
      region?: string;
      organizationSize?: string;
      plan?: Tenant['plan'];
    }
  ): Promise<Tenant> {
    const user = await api.getUserById(userId);
    if (!user) throw new Error('User not found');

    const tenantId = user.tenantId || `tenant-${Date.now()}`;

    // Update User
    await api.updateUser(userId, {
      isOnboarded: true,
      onboardingStep: 5,
      company: data.companyName || user.company
    }, tenantId);

    // Map region -> currency + timezone defaults, size -> dashboardDensity.
    // Falls back to East Africa / standard if onboarding skipped these (legacy
    // callers from before this change).
    const regionDefaults = REGION_DEFAULTS[data.region || ''] || REGION_DEFAULTS['East Africa'];
    const density = SIZE_TO_DENSITY[data.organizationSize || ''] || 'standard';

    // Update Tenant
    const tenant = getStore<Tenant | null>('tenant', null);
    const updatedTenant: Tenant = {
      ...(tenant || initialTenants[0]),
      id: tenantId,
      name: data.companyName || (tenant?.name || 'My Organization'),
      industry: data.industry,
      enabledModules: data.modules,
      plan: data.plan || tenant?.plan || initialTenants[0].plan,
      settings: {
        ...(tenant?.settings || initialTenants[0].settings),
        currency: regionDefaults.currency,
        timezone: regionDefaults.timezone,
        region: data.region,
        organizationSize: data.organizationSize,
        dashboardDensity: density,
        onboardingCompleted: true
      }
    };
    setStore('tenant', updatedTenant);

    // Also persist to tenants_list for getTenants/getTenant lookups
    const tenants = getStore('tenants_list', initialTenants);
    const exists = tenants.findIndex(t => t.id === tenantId);
    if (exists >= 0) {
      tenants[exists] = updatedTenant;
    } else {
      tenants.push(updatedTenant);
    }
    setStore('tenants_list', tenants);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('tenants')
          .upsert([{
            id: tenantId,
            name: updatedTenant.name,
            industry: updatedTenant.industry,
            plan: updatedTenant.plan,
            enabled_modules: updatedTenant.enabledModules,
            settings: updatedTenant.settings,
            status: 'ACTIVE'
          }]);
        if (error) console.warn('Supabase tenant upsert failed:', error);
      } catch (err) {
        console.warn('Supabase completeOnboarding persistence failed:', err);
      }
    }

    clearCache('tenant');
    clearCache('tenants_list');
    await logAudit(
      'ONBOARDING_COMPLETED',
      {
        industry: data.industry,
        modules: data.modules,
        region: data.region,
        organizationSize: data.organizationSize,
        plan: updatedTenant.plan,
      },
      user.name
    );
    return updatedTenant;
  },

  async getUsers(tenantId: string = 'tenant-1', requesterRole?: UserRole): Promise<User[]> {
    if (requesterRole) checkRole(requesterRole, ['ADMIN', 'DISPATCHER', 'FINANCE']);
    const cacheKey = `users_all_${tenantId}`;

    // 1. Try Redis Hot Cache
    const redisCache = await cacheService.get<User[]>(`hot_users_${tenantId}`);
    if (redisCache) return redisCache;

    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('tenant_id', tenantId);

        if (error) throw error;
        if (data && data.length > 0) {
          const users = data.map(u => toCamelCase(u));
          setCached(cacheKey, users);
          // Populate Redis Hot Cache (300s TTL)
          await cacheService.set(`hot_users_${tenantId}`, users, 300);
          return users;
        }
      } catch (err: any) {
        const isNetworkError = err.message?.toLowerCase().includes('failed to fetch') || err.status === 0;
        if (!isNetworkError) {
          console.warn('Supabase getUsers failed, falling back to local store', err);
        }
      }
    }

    if (canUseFrappe()) {
      try {
        const data = await FrappeService.getList<User>('User', { tenant_id: tenantId });
        setCached(cacheKey, data);
        return data;
      } catch (err) {
        console.warn('Frappe getUsers failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const allRaw = getStore('users', initialUsers);
    const allRawArray = Array.isArray(allRaw) ? allRaw : initialUsers;
    const all = Array.from(new Map(allRawArray.map(u => [u.id, u])).values());
    const filtered = all.filter(u => !u.tenantId || u.tenantId === tenantId);
    setCached(cacheKey, filtered);
    return filtered;
  },

  async getUserById(id: string): Promise<User | null> {
    const cacheKey = `user_${id}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          const user = toCamelCase(data);
          setCached(cacheKey, user);
          return user;
        }
      } catch (err: any) {
        const isNetworkError = err.message?.toLowerCase().includes('failed to fetch') || err.status === 0;
        if (!isNetworkError) {
          console.warn('Supabase getUserById failed', err);
        }
      }
    }

    const users = await api.getUsers();
    const user = users.find(u => u.id === id) || null;
    
    // If user not found in local store but we have a Supabase session, 
    // we should try to recover the user profile
    if (!user && isSupabaseConfigured) {
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser && sbUser.id === id) {
        const newUser: User = {
          id: sbUser.id,
          email: sbUser.email || '',
          name: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'User',
          role: 'ADMIN',
          isOnboarded: true,
          onboardingStep: 1,
          verificationStatus: 'VERIFIED',
          preferences: { 
            theme: 'LIGHT',
            notifications: { email: true, push: true, sms: false },
            highContrast: false,
            autoSync: true,
            language: 'en'
          }
        };
        const allUsers = await api.getUsers();
        if (allUsers.find(u => u.id === sbUser.id)) {
          return allUsers.find(u => u.id === sbUser.id)!;
        }
        setStore('users', [...allUsers, newUser]);
        return newUser;
      }
    } catch (err) {
      console.warn('Supabase getUser failed', err);
    }
  }

    return user;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const cacheKey = `user_email_${email}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (canUseFrappe()) {
      try {
        const data = await FrappeService.getList<User>('User', { email });
        const user = data[0] || null;
        setCached(cacheKey, user);
        return user;
      } catch (err) {
        console.warn('Frappe getUserByEmail failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }

    const users = await api.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    return user;
  },

  async createUser(data: any, tenantId: string = 'tenant-1', requestId?: string): Promise<User> {
    if (!checkIdempotency(requestId)) {
      const users = await api.getUsers(tenantId);
      return users[0];
    }
    const sanitizedData = { ...sanitizeObject(data), tenantId };
    clearCache('users');

    if (isSupabaseConfigured) {
      try {
        const { data: newUser, error } = await supabase
          .from('profiles')
          .insert([{
            id: sanitizedData.id || undefined,
            tenant_id: tenantId,
            name: sanitizedData.name,
            email: sanitizedData.email,
            role: sanitizedData.role,
            company: sanitizedData.company,
            phone: sanitizedData.phone,
            id_number: sanitizedData.idNumber,
            kra_pin: sanitizedData.kraPin,
            license_number: sanitizedData.licenseNumber,
            date_of_birth: sanitizedData.dateOfBirth,
            gender: sanitizedData.gender,
            nationality: sanitizedData.nationality,
            emergency_contact: sanitizedData.emergencyContact,
            emergency_phone: sanitizedData.emergencyPhone,
            address: sanitizedData.address,
            preferences: sanitizedData.preferences || {}
          }])
          .select()
          .single();

        if (error) throw error;
        return {
          ...newUser,
          idNumber: newUser.id_number,
          kraPin: newUser.kra_pin,
          licenseNumber: newUser.license_number,
          isOnboarded: newUser.is_onboarded,
          onboardingStep: newUser.onboarding_step,
          verificationStatus: newUser.verification_status
        };
      } catch (err) {
        console.warn('Supabase createUser failed, falling back to local store', err);
      }
    }

    if (canUseFrappe()) {
      try {
        const newUser = await FrappeService.createDoc<User>('User', sanitizedData);
        await logAudit('CREATE_USER', { id: newUser.id, email: newUser.email, tenantId });
        return newUser;
      } catch (err) {
        console.warn('Frappe createUser failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const newUser = { id: data.id || `u-${Date.now()}`, ...sanitizedData };
    const users = await api.getUsers(tenantId);
    setStore('users', [...getStore('users', initialUsers), newUser]);
    return newUser;
  },

  async updateUser(id: string, data: any, tenantId: string = 'tenant-1', requestId?: string): Promise<User> {
    if (!checkIdempotency(requestId)) {
      const users = await api.getUsers(tenantId);
      return users.find(u => u.id === id) || { id, ...data } as User;
    }
    
    const sanitizedData = sanitizeObject(data);

    if (isSupabaseConfigured) {
      try {
        const snakeUpdates: any = {
          updated_at: new Date().toISOString()
        };

        if (sanitizedData.name) snakeUpdates.name = sanitizedData.name;
        if (sanitizedData.email) snakeUpdates.email = sanitizedData.email;
        if (sanitizedData.role) snakeUpdates.role = sanitizedData.role;
        if (sanitizedData.company) snakeUpdates.company = sanitizedData.company;
        if (sanitizedData.phone) snakeUpdates.phone = sanitizedData.phone;
        if (sanitizedData.idNumber) snakeUpdates.id_number = sanitizedData.idNumber;
        if (sanitizedData.kraPin) snakeUpdates.kra_pin = sanitizedData.kraPin;
        if (sanitizedData.licenseNumber) snakeUpdates.license_number = sanitizedData.licenseNumber;
        if (sanitizedData.dateOfBirth) snakeUpdates.date_of_birth = sanitizedData.dateOfBirth;
        if (sanitizedData.gender) snakeUpdates.gender = sanitizedData.gender;
        if (sanitizedData.nationality) snakeUpdates.nationality = sanitizedData.nationality;
        if (sanitizedData.emergencyContact) snakeUpdates.emergency_contact = sanitizedData.emergencyContact;
        if (sanitizedData.emergencyPhone) snakeUpdates.emergency_phone = sanitizedData.emergencyPhone;
        if (sanitizedData.address) snakeUpdates.address = sanitizedData.address;
        if (sanitizedData.onDuty !== undefined) snakeUpdates.on_duty = sanitizedData.onDuty;
        if (sanitizedData.verificationStatus) snakeUpdates.verification_status = sanitizedData.verificationStatus;
        if (sanitizedData.isOnboarded !== undefined) snakeUpdates.is_onboarded = sanitizedData.isOnboarded;
        if (sanitizedData.preferences) snakeUpdates.preferences = sanitizedData.preferences;

        const { data: updatedUser, error } = await supabase
          .from('profiles')
          .update(snakeUpdates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return {
          ...updatedUser,
          idNumber: updatedUser.id_number,
          kraPin: updatedUser.kra_pin,
          licenseNumber: updatedUser.license_number,
          isOnboarded: updatedUser.is_onboarded,
          onboardingStep: updatedUser.onboarding_step,
          verificationStatus: updatedUser.verification_status
        };
      } catch (err) {
        console.warn('Supabase updateUser failed, falling back to local store', err);
      }
    }

    if (!id) {
      console.warn('updateUser called with undefined ID, attempting recovery...', data);
      const users = getStore('users', initialUsers);
      const currentUser = users.find((u: any) => u.email === data.email && (!u.tenantId || u.tenantId === tenantId));
      if (currentUser) {
        id = currentUser.id;
      } else if (users.length > 0) {
        id = users[0].id;
      } else {
        throw new Error('Cannot update user: ID is undefined and no users found in store');
      }
    }
    if (canUseFrappe()) {
      try {
        const updated = await FrappeService.updateDoc<User>('User', id, sanitizedData);
        await logAudit('UPDATE_USER', { id, data: sanitizedData, tenantId });
        return updated;
      } catch (err) {
        console.warn('Frappe updateUser failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const allUsers = getStore('users', initialUsers);
    const updatedAll = allUsers.map(u => u.id === id ? { ...u, ...sanitizedData } : u);
    setStore('users', updatedAll);
    clearCache(`users_all_${tenantId}`);
    clearCache(`user_${id}`);
    return updatedAll.find(u => u.id === id) || { id, ...sanitizedData } as User;
  },

  async deleteUser(id: string, tenantId: string = 'tenant-1'): Promise<void> {
    clearCache(`users_all_${tenantId}`);
    
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase deleteUser failed, falling back to local store', err);
      }
    }

    if (canUseFrappe()) {
      try {
        await FrappeService.deleteDoc('User', id);
        await logAudit('DELETE_USER', { id, tenantId });
        return;
      } catch (err) {
        console.warn('Frappe deleteUser failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const users = await api.getUsers(tenantId);
    const updated = users.filter(u => u.id !== id);
    setStore('users', [...getStore('users', initialUsers).filter(u => u.tenantId !== tenantId), ...updated]);
  },

  // --- Permission Requests ---
  async getPermissionRequests(requesterRole?: UserRole): Promise<PermissionRequest[]> {
    if (requesterRole) checkRole(requesterRole, ['ADMIN']);
    const cacheKey = 'permission_requests_all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    return getStore('permission_requests', []);
  },

  async createPermissionRequest(data: Partial<PermissionRequest>, requestId?: string): Promise<PermissionRequest> {
    if (!checkIdempotency(requestId)) {
      const requests = await api.getPermissionRequests();
      return requests[0];
    }
    const sanitizedData = sanitizeObject(data);
    const newRequest: PermissionRequest = {
      id: `req-${Date.now()}`,
      userId: sanitizedData.userId || '',
      userName: sanitizedData.userName || '',
      userEmail: sanitizedData.userEmail || '',
      moduleId: (sanitizedData.moduleId as ModuleId) || 'dispatch',
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      requestedPermission: (sanitizedData.requestedPermission as Permission) || 'dashboard:view',
      ...sanitizedData as any
    };

    const requests = await api.getPermissionRequests();
    setStore('permission_requests', [newRequest, ...requests]);
    return newRequest;
  },

  async updatePermissionRequest(id: string, data: Partial<PermissionRequest>): Promise<PermissionRequest> {
    const sanitizedData = sanitizeObject(data);
    const requests = await api.getPermissionRequests();
    const updated = requests.map(r => r.id === id ? { ...r, ...sanitizedData, updatedAt: new Date().toISOString() } : r);
    setStore('permission_requests', updated);
    return updated.find(r => r.id === id)!;
  },

  // --- Logistics ---
  async getDeliveryNote(id: string): Promise<DeliveryNote | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('delivery_notes')
          .select('*')
          .or(`id.eq.${id},dn_number.eq.${id}`)
          .single();

        if (error) throw error;
        if (!data) return null;

        return {
          ...data,
          externalId: data.dn_number,
          clientName: data.customer_name,
          address: data.delivery_address,
          routeGeometry: data.route_geometry,
          lastLat: data.last_lat,
          lastLng: data.last_lng,
          lastTelemetryAt: data.last_telemetry_at,
          scheduledDate: data.scheduled_date,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        } as DeliveryNote;
      } catch (err) {
        console.warn('Supabase getDeliveryNote failed', err);
      }
    }

    const all = await this.getDeliveryNotes();
    return all.find(dn => dn.id === id || dn.externalId === id) || null;
  },

  async verifyDocument(dnId: string, docId: string, verifierName: string): Promise<boolean> {
    const dns = await this.getDeliveryNotes();
    const dn = dns.find(d => d.id === dnId);
    if (!dn) return false;

    const docs = dn.documents.map(doc => 
      doc.id === docId 
        ? { ...doc, status: LogisticsDocumentStatus.VERIFIED, signedBy: verifierName, issuedAt: new Date().toISOString() } 
        : doc
    );

    await this.updateDeliveryNote(dnId, { 
      documents: docs,
      logs: [...(dn.logs || []), { 
        id: `log-${Date.now()}`, 
        timestamp: new Date().toISOString(), 
        action: 'DOCUMENT_VERIFIED', 
        user: verifierName, 
        notes: `Validated document ${docId}` 
      }]
    });

    // Add journey milestone
    await this.addJourneyMilestone(dnId, {
      type: 'COMPLIANCE_CHECK',
      status: 'VERIFIED',
      label: 'Document Verified',
      description: `Official verification of logistics documentation by ${verifierName}`,
      userName: verifierName
    });

    return true;
  },

  async addJourneyMilestone(dnId: string, milestone: Partial<JourneyMilestone>): Promise<boolean> {
    const dns = await this.getDeliveryNotes();
    const dn = dns.find(d => d.id === dnId);
    if (!dn) return false;

    const newMilestone: JourneyMilestone = {
      id: `milestone-${Date.now()}`,
      type: milestone.type || 'STATUS_CHANGE',
      status: milestone.status || 'ACTIVE',
      label: milestone.label || 'Update',
      description: milestone.description || 'Journey status updated',
      timestamp: new Date().toISOString(),
      ...milestone
    };

    const journey = [...(dn.journey || []), newMilestone];
    await this.updateDeliveryNote(dnId, { journey });
    return true;
  },

  async updateComplianceStatus(dnId: string, status: 'PENDING' | 'PASS' | 'FAIL' | 'REVIEW_REQUIRED', notes: string, user: string): Promise<boolean> {
    const dns = await this.getDeliveryNotes();
    const dn = dns.find(d => d.id === dnId);
    if (!dn) return false;

    await this.updateDeliveryNote(dnId, { 
      complianceStatus: status,
      logs: [...(dn.logs || []), { 
        id: `log-comp-${Date.now()}`, 
        timestamp: new Date().toISOString(), 
        action: 'COMPLIANCE_UPDATE', 
        user, 
        notes: `Compliance set to ${status}: ${notes}` 
      }]
    });

    await this.addJourneyMilestone(dnId, {
      type: 'COMPLIANCE_CHECK',
      status,
      label: 'Compliance Integrity Audit',
      description: `Terminal audit performed: ${notes}`,
      userName: user
    });

    return true;
  },

  async getDeliveryNotes(tenantId: string = 'tenant-1', user?: User): Promise<DeliveryNote[]> {
    const cacheKey = `dns_all_${tenantId}_${user?.id || 'anon'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('delivery_notes')
          .select('*')
          .eq('tenant_id', tenantId);

        if (error) throw error;
        
        const mapped = (data || []).map(dn => ({
          ...dn,
          externalId: dn.dn_number,
          clientName: dn.customer_name,
          address: dn.delivery_address,
          routeGeometry: dn.route_geometry,
          lastLat: dn.last_lat,
          lastLng: dn.last_lng,
          lastTelemetryAt: dn.last_telemetry_at,
          scheduledDate: dn.scheduled_date,
          createdAt: dn.created_at,
          updatedAt: dn.updated_at
        }));

        setCached(cacheKey, mapped);
        return mapped;
      } catch (err) {
        console.warn('Supabase getDeliveryNotes failed, falling back to other stores', err);
      }
    }

    if (canUseFrappe()) {
      try {
        const data = await FrappeService.getList<DeliveryNote>('Delivery Note', {
          owner: user?.email,
          tenant_id: tenantId
        });
        setCached(cacheKey, data);
        return data;
      } catch (err) {
        console.warn('Frappe getDeliveryNotes failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    
    const allRaw = getStore('delivery_notes', initialDeliveryNotes);
    const allRawArray = Array.isArray(allRaw) ? allRaw : initialDeliveryNotes;
    const all = Array.from(new Map(allRawArray.map(dn => [dn.id, dn])).values());
    // Filter by tenantId for isolation
    const filtered = all.filter(dn => !dn.tenantId || dn.tenantId === tenantId);
    setCached(cacheKey, filtered);
    return filtered;
  },

  async getDeliveryNotesPaged(page: number = 1, limit: number = 10, filters?: any): Promise<{ data: DeliveryNote[], total: number }> {
    const tenantId = filters?.tenantId || 'tenant-1';
    const cacheKey = `dns_paged_${tenantId}_${page}_${limit}_${JSON.stringify(filters)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('delivery_notes')
          .select('*', { count: 'exact' })
          .eq('tenant_id', tenantId);

        if (filters?.status && filters.status !== 'ALL') {
          query = query.eq('status', filters.status);
        }

        if (filters?.search) {
          query = query.or(`dn_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`);
        }

        const start = (page - 1) * limit;
        const { data, error, count } = await query
          .range(start, start + limit - 1)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const mapped = (data || []).map(dn => ({
          ...dn,
          externalId: dn.dn_number,
          clientName: dn.customer_name,
          address: dn.delivery_address,
          routeGeometry: dn.route_geometry,
          lastLat: dn.last_lat,
          lastLng: dn.last_lng,
          lastTelemetryAt: dn.last_telemetry_at,
          scheduledDate: dn.scheduled_date,
          createdAt: dn.created_at,
          updatedAt: dn.updated_at
        }));

        const result = { data: mapped, total: count || 0 };
        setCached(cacheKey, result);
        return result;
      } catch (err) {
        console.warn('Supabase getDeliveryNotesPaged failed, falling back to local store', err);
      }
    }

    if (canUseFrappe()) {
      try {
        const start = (page - 1) * limit;
        const frappeFilters: any = { tenant_id: tenantId };
        if (filters?.status && filters.status !== 'ALL') {
          frappeFilters.status = filters.status;
        }
        if (filters?.search) {
          frappeFilters.customer_name = ['like', `%${filters.search}%`];
        }

        const data = await FrappeService.getList<DeliveryNote>('Delivery Note', frappeFilters, ['*'], limit, start);
        // Estimate total if not provided by direct resource API
        const result = { data, total: data.length < limit ? start + data.length : start + limit + 100 };
        setCached(cacheKey, result);
        return result;
      } catch (err) {
        console.warn('Frappe getDeliveryNotesPaged failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }

    let all: DeliveryNote[] = getStore('delivery_notes', initialDeliveryNotes);
    
    // Enforce tenant isolation
    all = all.filter(dn => !dn.tenantId || dn.tenantId === tenantId);
    
    // Apply filters
    if (filters?.status && filters.status !== 'ALL') {
      all = all.filter(dn => dn.status === filters.status);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      all = all.filter(dn => dn.clientName.toLowerCase().includes(s) || dn.externalId.toLowerCase().includes(s));
    }
    
    const total = all.length;
    const start = (page - 1) * limit;
    const data = all.slice(start, start + limit);
    
    const result = { data, total };
    setCached(cacheKey, result);
    return result;
  },

  async createDeliveryNote(data: Partial<DeliveryNote>, tenantId: string = 'tenant-1', requestId?: string): Promise<DeliveryNote> {
    if (!checkIdempotency(requestId)) {
      const dns = await api.getDeliveryNotes(tenantId);
      return dns[0];
    }
    const sanitizedData = { ...sanitizeObject(data), tenantId };
    clearCache('dns'); // Clear all DNS related cache

    if (isSupabaseConfigured) {
      try {
        const { data: newDn, error } = await supabase
          .from('delivery_notes')
          .insert([{
            tenant_id: tenantId,
            dn_number: sanitizedData.externalId || `EXT-${Math.random().toString(36).substring(7).toUpperCase()}`,
            customer_name: sanitizedData.clientName,
            delivery_address: sanitizedData.address,
            status: sanitizedData.status || DNStatus.RECEIVED,
            priority: sanitizedData.priority || 'MEDIUM',
            items: sanitizedData.items || [],
            loading_point: sanitizedData.originAddress,
            destination: sanitizedData.address,
            scheduled_date: sanitizedData.plannedDeliveryDate,
            lat: sanitizedData.lat,
            lng: sanitizedData.lng,
            route_geometry: sanitizedData.routeGeometry
          }])
          .select()
          .single();

        if (error) throw error;
        const result = {
          ...newDn,
          externalId: newDn.dn_number,
          clientName: newDn.customer_name,
          address: newDn.delivery_address,
          routeGeometry: newDn.route_geometry
        };
        clearCache('dns');
        return result;
      } catch (err) {
        console.warn('Supabase createDeliveryNote failed, falling back to other stores', err);
      }
    }
    
    if (canUseFrappe()) {
      try {
        const newDn = await FrappeService.createDoc<DeliveryNote>('Delivery Note', { ...sanitizedData, tenant_id: tenantId });
        await logAudit('CREATE_DN', { id: newDn.id, externalId: newDn.externalId, tenantId });
        clearCache('dns');
        return newDn;
      } catch (err) {
        console.warn('Frappe createDeliveryNote failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }

    const current = await api.getDeliveryNotes(tenantId);
    const newDn: DeliveryNote = {
      id: data.id || `dn-${Date.now()}`,
      externalId: sanitizedData.externalId || `EXT-${Math.random().toString(36).substring(7).toUpperCase()}`,
      type: sanitizedData.type || LogisticsType.OUTBOUND,
      clientName: sanitizedData.clientName || '',
      address: sanitizedData.address || '',
      items: sanitizedData.items || [],
      status: sanitizedData.status || DNStatus.RECEIVED,
      priority: sanitizedData.priority || 'MEDIUM',
      industry: sanitizedData.industry || 'GENERAL',
      createdAt: new Date().toISOString(),
      tenantId,
      logs: [{ id: Date.now().toString(), action: 'Created', notes: 'Manual creation', user: 'Admin', timestamp: new Date().toISOString() }],
      documents: [],
      ...sanitizedData
    } as DeliveryNote;
    
    setStore('delivery_notes', [newDn, ...getStore('delivery_notes', initialDeliveryNotes)]);
    clearCache('dns');
    return newDn;
  },

  async updateDeliveryNote(id: string, data: Partial<DeliveryNote>, tenantId: string = 'tenant-1', requestId?: string): Promise<DeliveryNote> {
    if (!checkIdempotency(requestId)) {
      const dns = await api.getDeliveryNotes(tenantId);
      return dns.find(d => d.id === id)!;
    }
    const sanitizedData = { ...sanitizeObject(data), tenantId };
    clearCache('dns');
    clearCache(`dn_detail_${id}`);
    
    if (isSupabaseConfigured) {
      try {
        const updates: any = {
          updated_at: new Date().toISOString()
        };
        if (sanitizedData.externalId) updates.dn_number = sanitizedData.externalId;
        if (sanitizedData.clientName) updates.customer_name = sanitizedData.clientName;
        if (sanitizedData.address) updates.delivery_address = sanitizedData.address;
        if (sanitizedData.status) updates.status = sanitizedData.status;
        if (sanitizedData.priority) updates.priority = sanitizedData.priority;
        if (sanitizedData.items) updates.items = sanitizedData.items;
        if (sanitizedData.routeGeometry !== undefined) updates.route_geometry = sanitizedData.routeGeometry;
        if (sanitizedData.lastLat !== undefined) updates.last_lat = sanitizedData.lastLat;
        if (sanitizedData.lastLng !== undefined) updates.last_lng = sanitizedData.lastLng;
        if (sanitizedData.lastTelemetryAt !== undefined) updates.last_telemetry_at = sanitizedData.lastTelemetryAt;

        const { data: updatedDn, error } = await supabase
          .from('delivery_notes')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        const result = {
          ...updatedDn,
          externalId: updatedDn.dn_number,
          clientName: updatedDn.customer_name,
          address: updatedDn.delivery_address,
          routeGeometry: updatedDn.route_geometry
        };
        clearCache('dns');
        clearCache(`dn_detail_${id}`);
        return result;
      } catch (err) {
        console.warn('Supabase updateDeliveryNote failed, falling back to other stores', err);
      }
    }

    if (canUseFrappe()) {
      try {
        const updated = await FrappeService.updateDoc<DeliveryNote>('Delivery Note', id, sanitizedData);
        await logAudit('UPDATE_DN', { id, data: sanitizedData });
        clearCache('dns');
        clearCache(`dn_detail_${id}`);
        return updated;
      } catch (err) {
        console.warn('Frappe updateDeliveryNote failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }

    const dns = await api.getDeliveryNotes();
    const updated = dns.map(d => d.id === id ? { ...d, ...sanitizedData } : d);
    setStore('delivery_notes', updated);
    clearCache('dns');
    clearCache(`dn_detail_${id}`);
    return updated.find(u => u.id === id)!;
  },

  async updateDNItems(id: string, items: DeliveryItem[], user: string): Promise<void> {
    const dns = await api.getDeliveryNotes();
    const updated = dns.map(d => {
      if (d.id === id) {
        return { 
          ...d, 
          items,
          logs: [...(d.logs || []), { 
            id: `log-${Date.now()}`, 
            action: 'ITEMS_UPDATED', 
            notes: `Manifest items modified by ${user}`, 
            user, 
            timestamp: new Date().toISOString() 
          }]
        };
      }
      return d;
    });
    setStore('delivery_notes', updated);
  },

  async addDNException(id: string, type: string, notes: string, user: string): Promise<void> {
    const dns = await api.getDeliveryNotes();
    const updated = dns.map(d => {
      if (d.id === id) {
        const log = {
          id: `log-${Date.now()}`,
          action: `EXCEPTION: ${type}`,
          notes,
          user,
          timestamp: new Date().toISOString()
        };
        return { 
          ...d, 
          logs: [...(d.logs || []), log],
          status: type === 'LATE' ? DNStatus.EXCEPTION : d.status 
        };
      }
      return d;
    });
    setStore('delivery_notes', updated);
  },

  async updateDNStatus(id: string, status: DNStatus, metadata: any = {}, user?: string, tenantId: string = 'tenant-1'): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const updates: any = {
          status,
          updated_at: new Date().toISOString()
        };
        if (metadata.routeGeometry) updates.route_geometry = metadata.routeGeometry;
        if (metadata.notes) updates.notes = metadata.notes;

        const { error } = await supabase
          .from('delivery_notes')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId);

        if (error) throw error;
      } catch (err) {
        console.warn('Supabase updateDNStatus failed, falling back to other stores', err);
      }
    }

    if (canUseFrappe()) {
      try {
        await FrappeService.callMethod('shipstack.api.update_dn_status', {
          id,
          status,
          metadata,
          user,
          tenantId
        });
        await logAudit('UPDATE_DN_STATUS', { id, status, metadata, tenantId }, user);
        return;
      } catch (err) {
        console.warn('Frappe updateDNStatus failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }

    const dns = await api.getDeliveryNotes(tenantId);
    const updated = getStore('delivery_notes', initialDeliveryNotes).map(d => {
      if (d.id === id) {
        let routeData = metadata.routeGeometry;
        // Generate mock route if initializing trip
        if (status === DNStatus.IN_TRANSIT && !routeData && d.lat && d.lng) {
          routeData = { coordinates: [[d.lastLat || -1.286, d.lastLng || 36.817], [d.lat, d.lng]] };
        }
        return { 
          ...d, 
          ...metadata,
          routeGeometry: routeData || d.routeGeometry,
          status, 
          logs: [...(d.logs || []), { id: Date.now().toString(), action: `Status updated to ${status}`, notes: metadata.notes || '', user: user || 'System', timestamp: new Date().toISOString() }]
        };
      }
      return d;
    });
    setStore('delivery_notes', updated);
  },

  async logTemperature(dnId: string, temperature: number, user: string): Promise<ColdChainLog> {
    const dns = await api.getDeliveryNotes();
    const dn = dns.find(d => d.id === dnId);
    if (!dn) throw new Error('Delivery Note not found');
    
    const isAlert = dn.tempRequirement ? (temperature < dn.tempRequirement.min || temperature > dn.tempRequirement.max) : false;
    const status = isAlert ? 'CRITICAL' : (dn.tempRequirement && (temperature < dn.tempRequirement.min + 1 || temperature > dn.tempRequirement.max - 1) ? 'WARNING' : 'NORMAL');
    
    const log: ColdChainLog = {
      id: `tlog-${Date.now()}`,
      dnId,
      temperature,
      timestamp: new Date().toISOString(),
      status,
      isAlert
    };
    
    const updatedDns = dns.map(d => {
      if (d.id === dnId) {
        const logs = [...(d.tempLogs || []), log];
        const newLogs = [...(d.logs || [])];
        if (isAlert) {
          newLogs.push({
             id: `alert-${Date.now()}`,
             timestamp: new Date().toISOString(),
             action: 'TEMPERATURE_ALERT',
             notes: `CRITICAL temperature reading: ${temperature}°${d.tempRequirement?.unit || 'C'} detected. Threshold deviation!`,
             user: 'System Monitor'
          });
        }
        return { 
          ...d, 
          tempLogs: logs, 
          tempRequirement: d.tempRequirement ? { ...d.tempRequirement, current: temperature } : undefined,
          logs: newLogs
        };
      }
      return d;
    });
    
    setStore('delivery_notes', updatedDns);
    clearCache('dns');
    clearCache(`dn_detail_${dnId}`);
    return log;
  },

  async getColdChainHistory(dnId: string): Promise<ColdChainLog[]> {
    const dns = await api.getDeliveryNotes();
    const dn = dns.find(d => d.id === dnId);
    return dn?.tempLogs || [];
  },

  // --- Integrations (M-Pesa & eTIMS) ---
  // Removed duplicates, moved to end of api object

  // --- Telemetry ---
  async saveTelemetryPing(ping: Partial<TelemetryPoint & { tenantId: string, vehicleId: string, signature?: string }>): Promise<void> {
    // Also report via socket for real-time dashboard
    telemetryService.emitTelemetry(
      ping.tripId || 'unknown',
      ping.lat || 0,
      ping.lng || 0,
      ping.speed,
      ping.heading
    );
  },

  async logSafetyEvent(dnId: string, type: SafetyEventType, severity: string, metadata: any = {}): Promise<void> {
    const event = {
      id: `safety-${Date.now()}`,
      dnId,
      type,
      severity,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    await logAudit('SAFETY_EVENT', event);
  },

  async batchUpdateStatus(ids: string[], status: DNStatus, metadata: any = {}, user?: string, tenantId: string = 'tenant-1'): Promise<void> {
    for (const id of ids) {
      await api.updateDNStatus(id, status, metadata, user, tenantId);
    }
  },

  async getDriverTrips(driverId: string): Promise<DeliveryNote[]> {
    const dns = await api.getDeliveryNotes();
    return dns.filter(d => d.driverId === driverId || d.status === DNStatus.RECEIVED);
  },

  async getFacilities(tenantId: string = 'tenant-1'): Promise<Facility[]> {
    const cacheKey = `facilities_all_${tenantId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('tenant_id', tenantId);

        if (!error && data) {
          const facilities = data.map(f => toCamelCase(f));
          setCached(cacheKey, facilities);
          return facilities;
        }
      } catch (err) {
        console.warn('Supabase getFacilities failed', err);
      }
    }

    if (canUseFrappe()) {
      try {
        const data = await FrappeService.getList<Facility>('Facility', { tenant_id: tenantId });
        setCached(cacheKey, data);
        return data;
      } catch (err) {
        console.warn('Frappe getFacilities failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const all = getStore('facilities', initialFacilities);
    const filtered = all.filter(f => !f.tenantId || f.tenantId === tenantId);
    setCached(cacheKey, filtered);
    return filtered;
  },

  async createFacility(data: any, tenantId: string = 'tenant-1', requestId?: string): Promise<Facility> {
    if (!checkIdempotency(requestId)) {
      const facilities = await api.getFacilities(tenantId);
      return facilities[0];
    }
    const sanitizedData = { ...sanitizeObject(data), tenantId };
    clearCache('facilities');

    if (isSupabaseConfigured) {
      try {
        const { data: newF, error } = await supabase
          .from('facilities')
          .insert([{
            name: sanitizedData.name,
            type: sanitizedData.type,
            address: sanitizedData.address,
            lat: sanitizedData.lat,
            lng: sanitizedData.lng,
            tenant_id: tenantId
          }])
          .select()
          .single();

        if (error) throw error;
        return toCamelCase(newF);
      } catch (err) {
        console.warn('Supabase createFacility failed', err);
      }
    }

    if (canUseFrappe()) {
      try {
        const newF = await FrappeService.createDoc<Facility>('Facility', sanitizedData);
        await logAudit('CREATE_FACILITY', { id: newF.id, name: newF.name, tenantId });
        return newF;
      } catch (err) {
        console.warn('Frappe createFacility failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const current = await api.getFacilities(tenantId);
    const newF = { id: `f-${Date.now()}`, ...sanitizedData };
    setStore('facilities', [...getStore('facilities', initialFacilities), newF]);
    return newF;
  },

  async updateFacility(id: string, data: any, tenantId: string = 'tenant-1', requestId?: string): Promise<Facility> {
    if (!checkIdempotency(requestId)) {
      const facilities = await api.getFacilities(tenantId);
      return facilities.find(f => f.id === id)!;
    }
    const sanitizedData = sanitizeObject(data);
    clearCache('facilities');
    if (canUseFrappe()) {
      try {
        const updated = await FrappeService.updateDoc<Facility>('Facility', id, sanitizedData);
        await logAudit('UPDATE_FACILITY', { id, data: sanitizedData, tenantId });
        return updated;
      } catch (err) {
        console.warn('Frappe updateFacility failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const current = await api.getFacilities(tenantId);
    const updated = current.map(f => f.id === id ? { ...f, ...sanitizedData } : f);
    setStore('facilities', updated);
    return updated.find(f => f.id === id)!;
  },

  async deleteFacility(id: string, tenantId: string = 'tenant-1'): Promise<void> {
    clearCache('facilities');
    if (canUseFrappe()) {
      try {
        await FrappeService.deleteDoc('Facility', id);
        await logAudit('DELETE_FACILITY', { id, tenantId });
        return;
      } catch (err) {
        console.warn('Frappe deleteFacility failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const current = await api.getFacilities(tenantId);
    const updated = current.filter(f => f.id !== id);
    setStore('facilities', [...getStore('facilities', initialFacilities).filter(f => f.tenantId !== tenantId), ...updated]);
  },

  // --- Bay Management (per-facility loading docks) ---
  async getBays(facilityId: string, tenantId: string = 'tenant-1'): Promise<Bay[]> {
    const cacheKey = `bays_${facilityId}_${tenantId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('bays')
          .select('*')
          .eq('facility_id', facilityId)
          .eq('tenant_id', tenantId)
          .order('number', { ascending: true });
        if (error) throw error;
        if (data) {
          const mapped: Bay[] = data.map((row: any) => ({
            id: row.id,
            facilityId: row.facility_id,
            tenantId: row.tenant_id,
            number: row.number,
            status: row.status as BayStatus,
            dnId: row.dn_id || undefined,
            notes: row.notes || undefined,
            updatedAt: row.updated_at,
            updatedBy: row.updated_by || undefined,
          }));
          setCached(cacheKey, mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase getBays failed, falling back to local store', err);
      }
    }

    const all = getStore<Bay[]>('bays', initialBays);
    const filtered = all.filter(b => b.facilityId === facilityId && (!b.tenantId || b.tenantId === tenantId));
    setCached(cacheKey, filtered);
    return filtered;
  },

  async createBay(data: Partial<Bay>, tenantId: string = 'tenant-1', requestId?: string): Promise<Bay> {
    if (!checkIdempotency(requestId)) {
      const existing = getStore<Bay[]>('bays', initialBays);
      const match = existing.find(b => b.facilityId === data.facilityId && b.number === data.number);
      if (match) return match;
    }
    clearCache('bays');
    const newBay: Bay = {
      id: data.id || `bay-${Date.now()}`,
      facilityId: data.facilityId || '',
      tenantId: data.tenantId || tenantId,
      number: data.number ?? 0,
      status: (data.status as BayStatus) || BayStatus.EMPTY,
      dnId: data.dnId,
      notes: data.notes,
      updatedAt: new Date().toISOString(),
      updatedBy: data.updatedBy,
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('bays').insert([{
          id: newBay.id,
          facility_id: newBay.facilityId,
          tenant_id: newBay.tenantId,
          number: newBay.number,
          status: newBay.status,
          dn_id: newBay.dnId || null,
          notes: newBay.notes || null,
          updated_at: newBay.updatedAt,
          updated_by: newBay.updatedBy || null,
        }]);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase createBay failed, falling back to local store', err);
      }
    }

    const all = getStore<Bay[]>('bays', initialBays);
    setStore('bays', [...all, newBay]);
    await logAudit('CREATE_BAY', { id: newBay.id, facilityId: newBay.facilityId, number: newBay.number });
    return newBay;
  },

  async updateBay(id: string, data: Partial<Bay>, tenantId: string = 'tenant-1'): Promise<Bay> {
    clearCache('bays');
    const patch = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const dbPatch: any = { updated_at: patch.updatedAt };
        if (patch.status !== undefined) dbPatch.status = patch.status;
        if (patch.dnId !== undefined) dbPatch.dn_id = patch.dnId || null;
        if (patch.notes !== undefined) dbPatch.notes = patch.notes || null;
        if (patch.updatedBy !== undefined) dbPatch.updated_by = patch.updatedBy || null;
        if (patch.number !== undefined) dbPatch.number = patch.number;
        const { error } = await supabase.from('bays').update(dbPatch).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase updateBay failed, falling back to local store', err);
      }
    }

    const all = getStore<Bay[]>('bays', initialBays);
    const updated = all.map(b => b.id === id ? { ...b, ...patch } as Bay : b);
    setStore('bays', updated);
    const result = updated.find(b => b.id === id);
    if (!result) throw new Error(`Bay ${id} not found`);
    await logAudit('UPDATE_BAY', { id, patch });
    return result;
  },

  async deleteBay(id: string, tenantId: string = 'tenant-1'): Promise<void> {
    clearCache('bays');
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('bays').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase deleteBay failed, falling back to local store', err);
      }
    }
    const all = getStore<Bay[]>('bays', initialBays);
    setStore('bays', all.filter(b => b.id !== id));
    await logAudit('DELETE_BAY', { id });
  },

  // --- Tenant Management ---
  async getTenants(): Promise<Tenant[]> {
    return getStore('tenants_list', initialTenants);
  },

  async getTenant(id: string): Promise<Tenant | null> {
    if (id === 'current' || !id) {
      const persisted = getStore<Tenant | null>('tenant', null);
      if (persisted) return persisted;
      return initialTenants[0];
    }
    const tenants = await api.getTenants();
    return tenants.find(t => t.id === id) || (id === 'tenant-1' ? getStore('tenant', initialTenants[0]) : null);
  },

  async createTenant(data: Partial<Tenant>): Promise<Tenant> {
    const tenants = await api.getTenants();
    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: data.name || 'New Tenant',
      slug: (data.name || 'New Tenant').toLowerCase().replace(/\s+/g, '-'),
      plan: data.plan || 'GROWTH',
      status: 'ACTIVE',
      industry: data.industry || 'GENERAL',
      settings: data.settings || {
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        primaryColor: '#0F2A44',
        onboardingCompleted: false
      },
      enabledModules: data.enabledModules || ['dispatch', 'fleet', 'finance', 'orders'],
      securitySettings: data.securitySettings || {
        auditLogging: true,
        twoFactorAuth: false,
        requireNTSAVerification: true
      },
      createdAt: new Date().toISOString(),
      ...data
    } as Tenant;
    
    setStore('tenants_list', [newTenant, ...tenants]);
    await logAudit('CREATE_TENANT', { id: newTenant.id, name: newTenant.name });
    return newTenant;
  },

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    try {
      const sanitizedData = sanitizeObject(data);
      const tenants = await api.getTenants();
      const index = tenants.findIndex(t => t.id === id);
      
      let updated: Tenant;
      if (index !== -1) {
        updated = { ...tenants[index], ...sanitizedData } as Tenant;
        const newTenants = [...tenants];
        newTenants[index] = updated;
        setStore('tenants_list', newTenants);
      } else {
        // Fallback for current tenant store
        const current = getStore('tenant', initialTenants[0]);
        updated = { ...(current || {}), ...sanitizedData } as Tenant;
      }
      
      // Ensure enabledModules is always an array
      if (!Array.isArray(updated.enabledModules)) {
        updated.enabledModules = ['dispatch', 'fleet', 'finance', 'orders'];
      }
      
      // Also update the single "current" tenant store if it matches
      const currentTenant = getStore<Tenant | null>('tenant', null);
      if (currentTenant?.id === id) {
        setStore('tenant', updated);
      } else if (id === 'tenant-1' && !currentTenant) {
        setStore('tenant', updated);
      }
      
      await logAudit('UPDATE_TENANT', { id, modules: updated.enabledModules });
      return updated;
    } catch (err) {
      console.error('api.updateTenant failed:', err);
      throw err;
    }
  },

  async deleteTenant(id: string): Promise<void> {
    const tenants = await api.getTenants();
    const filtered = tenants.filter(t => t.id !== id);
    setStore('tenants_list', filtered);
    await logAudit('DELETE_TENANT', { id });
  },

  async getDrivers(tenantId: string = 'tenant-1'): Promise<User[]> {
    const users = await api.getUsers(tenantId);
    return users.filter(u => u.role === 'DRIVER');
  },

  async getVehicles(tenantId: string = 'tenant-1'): Promise<Vehicle[]> {
    const cacheKey = `vehicles_all_${tenantId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('tenant_id', tenantId);

        if (!error && data) {
          const vehicles = data.map(v => toCamelCase(v));
          setCached(cacheKey, vehicles);
          return vehicles;
        }
      } catch (err) {
        console.warn('Supabase getVehicles failed', err);
      }
    }

    if (canUseFrappe()) {
      try {
        const data = await FrappeService.getList<Vehicle>('Vehicle', { tenant_id: tenantId });
        setCached(cacheKey, data);
        return data;
      } catch (err) {
        console.warn('Frappe getVehicles failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const allRaw = getStore('vehicles', initialVehicles);
    const allRawArray = Array.isArray(allRaw) ? allRaw : initialVehicles;
    const all = Array.from(new Map(allRawArray.map(v => [v.id, v])).values());
    const filtered = all.filter(v => !v.tenantId || v.tenantId === tenantId);
    setCached(cacheKey, filtered);
    return filtered;
  },

  async createVehicle(data: any, tenantId: string = 'tenant-1', requestId?: string): Promise<Vehicle> {
    if (!checkIdempotency(requestId)) {
      const vehicles = await api.getVehicles(tenantId);
      return vehicles[0];
    }
    const sanitizedData = { ...sanitizeObject(data), tenantId };
    clearCache('vehicles');

    if (isSupabaseConfigured) {
      try {
        const { data: newV, error } = await supabase
          .from('vehicles')
          .insert([{
            plate: sanitizedData.plate,
            type: sanitizedData.type,
            capacity_kg: sanitizedData.capacityKg,
            status: sanitizedData.status || 'ACTIVE',
            tenant_id: tenantId,
            verification_status: sanitizedData.verificationStatus || 'PENDING',
            owner_id: sanitizedData.ownerId,
            logbook_number: sanitizedData.logbookNumber,
            chassis_number: sanitizedData.chassisNumber,
            engine_number: sanitizedData.engineNumber,
            ntsa_inspection_expiry: sanitizedData.ntsaInspectionExpiry,
            insurance_policy_number: sanitizedData.insurancePolicyNumber,
            insurance_expiry: sanitizedData.insuranceExpiry,
            compliance_score: sanitizedData.complianceScore || 0
          }])
          .select()
          .single();

        if (error) throw error;
        return toCamelCase(newV);
      } catch (err) {
        console.warn('Supabase createVehicle failed', err);
      }
    }

    if (canUseFrappe()) {
      try {
        const newV = await FrappeService.createDoc<Vehicle>('Vehicle', sanitizedData);
        await logAudit('CREATE_VEHICLE', { id: newV.id, plate: newV.plate, tenantId });
        return newV;
      } catch (err) {
        console.warn('Frappe createVehicle failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const current = await api.getVehicles(tenantId);
    const newV = { id: `v-${Date.now()}`, ...sanitizedData };
    setStore('vehicles', [...getStore('vehicles', initialVehicles), newV]);
    return newV;
  },

  async updateVehicle(id: string, data: any, tenantId: string = 'tenant-1', requestId?: string): Promise<Vehicle> {
    if (!checkIdempotency(requestId)) {
      const vehicles = await api.getVehicles(tenantId);
      return vehicles.find(v => v.id === id)!;
    }
    const sanitizedData = sanitizeObject(data);
    clearCache('vehicles');
    if (canUseFrappe()) {
      try {
        const updated = await FrappeService.updateDoc<Vehicle>('Vehicle', id, sanitizedData);
        await logAudit('UPDATE_VEHICLE', { id, data: sanitizedData, tenantId });
        return updated;
      } catch (err) {
        console.warn('Frappe updateVehicle failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const allVehicles = getStore('vehicles', initialVehicles);
    const updatedAll = allVehicles.map(v => v.id === id ? { ...v, ...sanitizedData } : v);
    setStore('vehicles', updatedAll);
    return updatedAll.find(v => v.id === id)!;
  },

  async deleteVehicle(id: string, tenantId: string = 'tenant-1'): Promise<void> {
    clearCache('vehicles');
    if (canUseFrappe()) {
      try {
        await FrappeService.deleteDoc('Vehicle', id);
        await logAudit('DELETE_VEHICLE', { id, tenantId });
        return;
      } catch (err) {
        console.warn('Frappe deleteVehicle failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const current = await api.getVehicles(tenantId);
    const updated = current.filter(v => v.id !== id);
    setStore('vehicles', [...getStore('vehicles', initialVehicles).filter(v => v.tenantId !== tenantId), ...updated]);
  },

  async getTrips(tenantId: string = 'tenant-1'): Promise<Trip[]> {
    const cacheKey = `trips_all_${tenantId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('tenant_id', tenantId);

        if (!error && data) {
          const trips = data.map(t => toCamelCase(t));
          setCached(cacheKey, trips);
          return trips;
        }
      } catch (err) {
        console.warn('Supabase getTrips failed', err);
      }
    }

    if (canUseFrappe()) {
      try {
        const data = await FrappeService.getList<Trip>('Trip', { tenant_id: tenantId });
        setCached(cacheKey, data);
        return data;
      } catch (err) {
        console.warn('Frappe getTrips failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const raw = getStore('trips', []);
    const rawArray = Array.isArray(raw) ? raw : [];
    const all = Array.from(new Map(rawArray.map(t => [t.id, t])).values()) as Trip[];
    const filtered = all.filter(t => !t.tenantId || t.tenantId === tenantId);
    setCached(cacheKey, filtered);
    return filtered;
  },

  async reconcileTrip(tripId: string, data: { codCollected: number, returnedItemsCount: number }): Promise<void> {
    clearCache('trips');
    const trips = await api.getTrips();
    const updated = trips.map(t => t.id === tripId ? { ...t, ...data, status: 'RECONCILED' as const } : t);
    setStore('trips', updated);
  },

  async clockIn(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ on_duty: true })
          .eq('id', userId);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase clockIn failed', err);
      }
    }

    const users = await api.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, onDuty: true } : u);
    setStore('users', updated);
  },

  async clockOut(userId: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ on_duty: false })
          .eq('id', userId);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase clockOut failed', err);
      }
    }

    const users = await api.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, onDuty: false } : u);
    setStore('users', updated);
  },

  async createTrip(data: Omit<Trip, 'id' | 'status'>, tenantId: string = 'tenant-1'): Promise<Trip> {
    const sanitizedData = { ...sanitizeObject(data), tenantId };
    clearCache('trips');
    clearCache('dns');

    if (isSupabaseConfigured) {
      try {
        const { data: newTrip, error } = await supabase
          .from('trips')
          .insert([{
            driver_id: sanitizedData.driverId,
            vehicle_id: sanitizedData.vehicleId,
            status: 'PENDING',
            dn_ids: sanitizedData.dnIds || [],
            tenant_id: tenantId,
            start_time: sanitizedData.startTime,
            end_time: sanitizedData.endTime
          }])
          .select()
          .single();

        if (error) throw error;
        
        // Update DNs to DISPATCHED status
        if (sanitizedData.dnIds && sanitizedData.dnIds.length > 0) {
          await api.batchUpdateStatus(sanitizedData.dnIds, DNStatus.DISPATCHED, { 
            driverId: sanitizedData.driverId, 
            vehicleId: sanitizedData.vehicleId 
          }, 'System Dispatcher', tenantId);
        }

        return toCamelCase(newTrip);
      } catch (err) {
        console.warn('Supabase createTrip failed', err);
      }
    }

    if (canUseFrappe()) {
      try {
        const newTrip = await FrappeService.callMethod<Trip>('shipstack.api.create_trip', sanitizedData);
        await logAudit('CREATE_TRIP', { id: newTrip.id, driverId: newTrip.driverId });
        return newTrip;
      } catch (err) {
        console.warn('Frappe createTrip failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const trips = await api.getTrips();
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      status: 'PENDING',
      ...sanitizedData
    };
    setStore('trips', [...trips, newTrip]);
    
    // Update DNs to DISPATCHED status
    if (sanitizedData.dnIds && sanitizedData.dnIds.length > 0) {
      await api.batchUpdateStatus(sanitizedData.dnIds, DNStatus.DISPATCHED, { 
        driverId: sanitizedData.driverId, 
        vehicleId: sanitizedData.vehicleId 
      }, 'System Dispatcher');
    }
    
    return newTrip;
  },

  async addDNsToTrip(tripId: string, dnIds: string[]): Promise<void> {
    clearCache('trips');
    clearCache('dns');
    const trips = await api.getTrips();
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      trip.dnIds = Array.from(new Set([...trip.dnIds, ...dnIds]));
      setStore('trips', [...trips]);
    }
  },

  async updateTrip(id: string, data: Partial<Trip>, tenantId: string = 'tenant-1'): Promise<Trip> {
    const sanitizedData = sanitizeObject(data);
    clearCache('trips');
    clearCache('dns');
    if (canUseFrappe()) {
      try {
        const updated = await FrappeService.updateDoc<Trip>('Trip', id, sanitizedData);
        await logAudit('UPDATE_TRIP', { id, data: sanitizedData });
        return updated;
      } catch (err) {
        console.warn('Frappe updateTrip failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const trips = await api.getTrips();
    const updated = trips.map(t => t.id === id ? { ...t, ...sanitizedData } : t);
    setStore('trips', updated);
    
    // If dnIds changed, we might need to update DN status, but for simplicity in this mock
    // we assume the caller handles DN status updates if needed or we just keep them as DISPATCHED.
    
    return updated.find(t => t.id === id)!;
  },

  async deleteTrip(id: string, tenantId: string = 'tenant-1'): Promise<void> {
    clearCache(`trips_all_${tenantId}`);
    clearCache(`dns_all_${tenantId}`);
    if (canUseFrappe()) {
      try {
        await FrappeService.callMethod('shipstack.api.delete_trip', { id });
        await logAudit('DELETE_TRIP', { id });
        return;
      } catch (err) {
        console.warn('Frappe deleteTrip failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const trips = await api.getTrips();
    const trip = trips.find(t => t.id === id);
    if (trip) {
      // Revert DNs to RECEIVED status
      await api.batchUpdateStatus(trip.dnIds, DNStatus.RECEIVED, { driverId: null, vehicleId: null }, 'System Dispatcher');
      setStore('trips', trips.filter(t => t.id !== id));
    }
  },

  async getOperationalMetrics(requesterRole?: UserRole): Promise<OperationalMetrics> {
    if (requesterRole) checkRole(requesterRole, ['ADMIN', 'DISPATCHER', 'FINANCE']);
    const cacheKey = 'metrics_operational';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const data = { dispatchTimeAvg: 18, completionRate: 94, exceptionRate: 3, telemetryLag: 4 };
    setCached(cacheKey, data);
    return data;
  },

  async getZoneMetrics(): Promise<{ name: string, count: number }[]> {
    const cacheKey = 'metrics_zones';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const [dns, zones] = await Promise.all([api.getDeliveryNotes(), api.getZones()]);
    const data = zones.map(z => ({
      name: z.name,
      count: dns.filter(dn => dn.zoneId === z.id).length
    }));
    setCached(cacheKey, data);
    return data;
  },

  async getImportLogs(): Promise<ImportLog[]> {
    return getStore('import_logs', [
      { id: 'il-1', filename: 'Manifest_Q1.csv', status: 'COMPLETED', recordsProcessed: 450, successCount: 442, errorCount: 8, timestamp: new Date().toISOString(), severity: 'info', message: 'Import completed successfully' }
    ]);
  },

  exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const val = row[header];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  async processFrappeStockImport(data: any[]): Promise<{ success: number; failed: number; errors: any[] }> {
    const inventory = await api.getInventory();
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    const newItems: InventoryItem[] = data.map((row, index) => {
      try {
        if (!row.item_code || !row.item_name) {
          throw new Error(`Row ${index + 1}: Missing mandatory fields (item_code or item_name)`);
        }

        success++;
        return {
          id: `inv-${row.item_code}`,
          sku: row.item_code,
          name: row.item_name,
          category: row.item_group || 'GENERAL',
          qty: parseFloat(row.opening_stock) || 0,
          unit: row.stock_uom || 'Nos',
          minThreshold: 10,
          warehouseId: row.warehouse || 'wh-1',
          status: 'IN_STOCK'
        } as InventoryItem;
      } catch (err: any) {
        failed++;
        errors.push({ row: index + 1, message: err.message });
        return null;
      }
    }).filter(Boolean) as InventoryItem[];

    setStore('inventory', [...inventory, ...newItems]);
    
    // Log the import
    const logs = await api.getImportLogs();
    const newLog: ImportLog = {
      id: `log-${Date.now()}`,
      severity: failed > 0 ? 'WARNING' : 'INFO',
      message: failed > 0 ? `Imported with ${failed} errors` : 'Successful bulk import',
      filename: 'frappe_stock_import.json',
      status: failed > 0 ? 'PARTIAL' : 'COMPLETED',
      recordsProcessed: data.length,
      successCount: success,
      errorCount: failed,
      timestamp: new Date().toISOString(),
      type: 'STOCK',
      errors: errors.length > 0 ? errors.map(e => e.message) : undefined
    };
    setStore('import_logs', [newLog, ...logs]);

    return { success, failed, errors };
  },

  async processImport(data: any[], tenantId: string = 'tenant-1'): Promise<void> {
    const dns = await api.getDeliveryNotes(tenantId);
    const newDns = data.map((d, i) => ({
      id: `dn-imp-${Date.now()}-${i}`,
      externalId: `IMP-${Math.random().toString(36).substring(7).toUpperCase()}`,
      status: DNStatus.RECEIVED,
      createdAt: new Date().toISOString(),
      tenantId,
      logs: [],
      documents: [],
      ...d
    }));
    setStore('delivery_notes', [...getStore('delivery_notes', initialDeliveryNotes), ...newDns]);
  },

  async getRoute(start: [number, number], end: [number, number]): Promise<any> {
    return { coordinates: [start, end] };
  },

  async updateTelemetry(dnId: string, lat: number, lng: number): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('delivery_notes')
          .update({
            last_lat: lat,
            last_lng: lng,
            last_telemetry_at: new Date().toISOString()
          })
          .eq('id', dnId);

        if (error) throw error;
      } catch (err) {
        console.warn('Supabase updateTelemetry failed', err);
      }
    }

    const dns = await api.getDeliveryNotes();
    const updated = dns.map(d => d.id === dnId ? { ...d, lastLat: lat, lastLng: lng, lastTelemetryAt: new Date().toISOString() } : d);
    setStore('delivery_notes', updated);
    
    // Emit real-time telemetry via Socket.io
    telemetryService.emitTelemetry(dnId, lat, lng);
    
    // Cache hot telemetry in Redis for high-speed retrieval (10 min TTL)
    await cacheService.set(`telemetry_${dnId}`, { lat, lng, timestamp: new Date().toISOString() }, 600);
  },

  async syncOfflineTelemetry(): Promise<void> {
    await telemetryService.syncOfflineQueue();
  },

  async generateDocument(dnId: string, type: LogisticsDocumentType, user: string): Promise<void> {
    const dns = await api.getDeliveryNotes();
    const updated = dns.map(d => d.id === dnId ? { 
      ...d, 
      documents: [...(d.documents || []), { 
        id: `doc-${Date.now()}`, type, status: LogisticsDocumentStatus.PENDING, issuedAt: new Date().toISOString(), verificationCode: Math.random().toString(36).substring(2, 8).toUpperCase() 
      }] 
    } : d);
    setStore('delivery_notes', updated);
  },

  async simulatePayment(dnId: string): Promise<void> {
    const dns = await api.getDeliveryNotes();
    const updated = dns.map(d => d.id === dnId ? { ...d, paymentStatus: 'PAID' as const, status: DNStatus.INVOICED } : d);
    setStore('delivery_notes', updated);
  },

  // --- Zones ---
  async getZones(tenantId: string = 'tenant-1'): Promise<Zone[]> {
    const cacheKey = `zones_all_${tenantId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('zones')
          .select('*')
          .eq('tenant_id', tenantId);

        if (!error && data) {
          const zones = data.map(z => toCamelCase(z));
          setCached(cacheKey, zones);
          return zones;
        }
      } catch (err) {
        console.warn('Supabase getZones failed', err);
      }
    }

    const all = getStore('zones', initialZones);
    const filtered = all.filter(z => !z.tenantId || z.tenantId === tenantId);
    setCached(cacheKey, filtered);
    return filtered;
  },

  async createZone(data: Partial<Zone>): Promise<Zone> {
    clearCache('zones');
    const zones = await api.getZones();
    const newZone: Zone = {
      id: `z-${Date.now()}`,
      name: data.name || 'New Zone',
      ...data
    };
    setStore('zones', [...zones, newZone]);
    return newZone;
  },

  async updateZone(id: string, data: Partial<Zone>): Promise<Zone> {
    clearCache('zones');
    const zones = await api.getZones();
    const updated = zones.map(z => z.id === id ? { ...z, ...data } : z);
    setStore('zones', updated);
    return updated.find(z => z.id === id)!;
  },

  async deleteZone(id: string): Promise<void> {
    clearCache('zones');
    const zones = await api.getZones();
    setStore('zones', zones.filter(z => z.id !== id));
  },

  // --- Connectors ---
  async getConnectors(): Promise<ERPConnector[]> {
    return getStore('connectors', [
      { 
        id: 'c-1', provider: 'SAP', name: 'Global ERP S/4HANA', status: 'CONNECTED', type: 'SAP',
        environment: 'PRODUCTION', lastSync: new Date().toISOString(),
        syncFrequency: '15M',
        entities: ['INVENTORY', 'ORDERS'],
        config: { endpoint: 'https://sap-api.enterprise.com', authType: 'OAUTH2' }
      },
      { 
        id: 'c-2', provider: 'ODOO', name: 'Regional Sales Odoo', status: 'DISCONNECTED', type: 'ODOO',
        environment: 'SANDBOX', syncFrequency: 'DAILY',
        entities: ['CLIENTS'],
        config: { endpoint: 'https://odoo-stage.net', authType: 'API_KEY' }
      }
    ]);
  },

  async createConnector(data: Partial<ERPConnector>): Promise<ERPConnector> {
    const connectors = await api.getConnectors();
    const newConnector: ERPConnector = {
      id: `c-${Date.now()}`,
      provider: 'CUSTOM',
      name: 'New Connector',
      status: 'DISCONNECTED',
      environment: 'SANDBOX',
      syncFrequency: 'MANUAL',
      entities: [],
      config: { endpoint: '', authType: 'API_KEY' },
      ...data
    } as ERPConnector;
    setStore('connectors', [...connectors, newConnector]);
    return newConnector;
  },

  async updateConnector(id: string, data: Partial<ERPConnector>): Promise<ERPConnector> {
    const connectors = await api.getConnectors();
    const updated = connectors.map(c => c.id === id ? { ...c, ...data } : c);
    setStore('connectors', updated);
    return updated.find(c => c.id === id)!;
  },

  async deleteConnector(id: string): Promise<void> {
    const connectors = await api.getConnectors();
    setStore('connectors', connectors.filter(c => c.id !== id));
  },

  async testConnector(id: string): Promise<{ success: boolean; latency: number; message: string }> {
    await new Promise(r => setTimeout(r, 1500));
    return { success: Math.random() > 0.2, latency: Math.floor(Math.random() * 200 + 50), message: "Handshake successful. Resource 'DeliveryNote' accessible." };
  },

  async getSyncLogs(connectorId?: string): Promise<SyncLog[]> {
    const logs: SyncLog[] = [
      { id: 'sl-1', connectorId: 'c-1', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'SUCCESS', entity: 'INVENTORY', recordsProcessed: 142, durationMs: 1240 },
      { id: 'sl-2', connectorId: 'c-1', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'PARTIAL', entity: 'ORDERS', recordsProcessed: 89, errors: ['Order #9921: Invalid SKU'], durationMs: 2100 },
      { id: 'sl-3', connectorId: 'c-2', timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'FAILED', entity: 'CLIENTS', recordsProcessed: 0, errors: ['401 Unauthorized'], durationMs: 150 }
    ];
    return connectorId ? logs.filter(l => l.connectorId === connectorId) : logs;
  },

  async triggerSync(id: string): Promise<void> {
    await new Promise(r => setTimeout(r, 3000));
    const connectors = await api.getConnectors();
    const updated = connectors.map(c => c.id === id ? { ...c, lastSync: new Date().toISOString(), status: 'CONNECTED' as const } : c);
    setStore('connectors', updated);
  },

  // --- Custom API Credentials ---
  async getAPIKeys(requesterRole?: UserRole): Promise<APIKey[]> {
    if (requesterRole) checkRole(requesterRole, ['ADMIN']);
    return getStore('api_keys', [
      { id: 'ak-1', name: 'ERP Principal Uplink', label: 'ERP Principal Uplink', key: 'sk_live_51...z7q', createdAt: new Date().toISOString(), status: 'ACTIVE', scopes: ['dn.write', 'dn.read'] }
    ]);
  },

  async createAPIKey(name: string, scopes: string[] = ['dn.read'], description?: string): Promise<APIKey> {
    const keys = await api.getAPIKeys();
    const newKey: APIKey = {
      id: `ak-${Date.now()}`,
      name,
      label: name,
      description,
      key: `SS_PUB_${Math.random().toString(36).substring(7).toUpperCase()}`,
      secret: `SS_SEC_${Math.random().toString(36).substring(2).toUpperCase()}${Math.random().toString(36).substring(2).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      scopes
    };
    setStore('api_keys', [...keys, newKey]);
    return newKey;
  },

  async revokeAPIKey(id: string): Promise<void> {
    const keys = await api.getAPIKeys();
    const updated = keys.map(k => k.id === id ? { ...k, status: 'REVOKED' as const } : k);
    setStore('api_keys', updated);
  },

  async batchApproveOrders(ids: string[], requesterRole?: UserRole, tenantId: string = 'tenant-1', requestId?: string): Promise<void> {
    if (requesterRole) checkRole(requesterRole, ['ADMIN', 'DISPATCHER']);
    if (!checkIdempotency(requestId)) return;
    const allOrders = getStore('orders', initialOrders);
    const updated = allOrders.map(o => ids.includes(o.id) ? { ...o, status: 'APPROVED' as const, updatedAt: new Date().toISOString() } : o);
    setStore('orders', updated);
    
    // Automatically create DNs for approved orders
    for (const id of ids) {
      const order = allOrders.find(o => o.id === id);
      if (order) {
        await api.createDeliveryNote({
          externalId: order.externalId,
          clientName: order.customerName,
          status: DNStatus.RECEIVED,
          items: order.items,
          tenantId: order.tenantId || tenantId
        }, order.tenantId || tenantId, `dn-auto-${order.id}`);
      }
    }
  },

  async batchDisburseCommission(tripIds: string[], requesterRole?: UserRole, tenantId: string = 'tenant-1', requestId?: string): Promise<void> {
    if (requesterRole) checkRole(requesterRole, ['ADMIN', 'FINANCE']);
    if (!checkIdempotency(requestId)) return;
    const allTrips = getStore('trips', []);
    const updated = allTrips.map(t => tripIds.includes(t.id) ? { ...t, commissionStatus: 'DISBURSED' as const } : t);
    setStore('trips', updated);
    await logAudit('BATCH_PAYOUT', { count: tripIds.length, tripIds, tenantId });
  },

  // --- Webhooks ---
  async getWebhooks(): Promise<WebhookSubscription[]> {
    return getStore('webhooks', []);
  },

  async createWebhook(data: { url: string; events: string[] }): Promise<WebhookSubscription> {
    const hooks = await api.getWebhooks();
    const newHook: WebhookSubscription = {
      id: `wh-${Date.now()}`,
      url: data.url,
      events: data.events as any,
      status: 'ACTIVE',
      isActive: true,
      secret: `wh_sec_${Math.random().toString(36).substring(7)}`,
      lastDeliveryStatus: 'SUCCESS'
    };
    setStore('webhooks', [...hooks, newHook]);
    return newHook;
  },

  // --- Imports ---
  async validateImport(file: File): Promise<ImportPreviewRow[]> {
    await new Promise(r => setTimeout(r, 1000));
    return [
      { id: 'ipr-1', index: 1, data: { externalId: 'INV-9001', clientName: 'City Gen', address: 'Plot 1' }, errors: {}, isValid: true },
      { id: 'ipr-2', index: 2, data: { externalId: '', clientName: 'Bad Order', address: 'None' }, errors: { externalId: 'Reference ID is required' }, isValid: false },
      { id: 'ipr-3', index: 3, data: { externalId: 'INV-9003', clientName: 'Central Health', address: 'Plot 45' }, errors: {}, isValid: true }
    ];
  },

  async startImport(fileId: string): Promise<ImportBatch> {
    const batch: ImportBatch = {
      id: `batch-${Date.now()}`,
      filename: 'Manifest_Q1.csv',
      status: 'COMPLETED',
      rowCount: 450,
      totalRows: 450,
      successCount: 442,
      errorCount: 8,
      createdBy: 'Admin User',
      timestamp: new Date().toISOString()
    };
    const batches = await api.getImportBatches();
    setStore('import_batches', [batch, ...batches]);
    return batch;
  },

  async getImportBatches(): Promise<ImportBatch[]> {
    return getStore('import_batches', []);
  },

  // --- Logs & Health ---
  async getIntegrationLogs(): Promise<IntegrationLog[]> {
    return [
      { id: 'log-1', timestamp: new Date().toISOString(), source: 'SAP', level: 'INFO', message: 'Order sync successful', correlationId: 'req_8829' },
      { id: 'log-2', timestamp: new Date(Date.now() - 3600000).toISOString(), source: 'Custom API', level: 'ERROR', message: 'Invalid signature on DN creation', correlationId: 'req_1102' }
    ];
  },

  // --- Health & Monitoring ---
  async checkSupabaseHealth(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { error } = await supabase.from('health_check').select('id').limit(1);
      // If error is 404 (table not found), it still means Supabase is reachable
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        console.error('Supabase Health Check Failed:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Supabase Connection Error:', err);
      return false;
    }
  },

  async generateTestTelemetry(): Promise<{ success: boolean; count: number }> {
    const tenantId = 'tenant-1';
    
    // 1. Ensure we have some facilities
    const currentFacilities = await this.getFacilities();
    if (currentFacilities.length === 0) {
      const demoFacility: Facility = {
        id: 'fac-main',
        tenantId,
        name: 'Central Distribution Hub',
        type: 'HUB',
        address: 'Enterprise Rd, Nairobi',
        lat: -1.2921,
        lng: 36.8219
      };
      const existingFacs = getStore('facilities', []);
      setStore('facilities', [...existingFacs, demoFacility]);
    }

    // 2. Ensure we have some vehicles
    const currentVehicles = await this.getVehicles();
    if (currentVehicles.length === 0) {
      const demoVehicle: Vehicle = {
        id: 'v-1',
        tenantId,
        plate: 'KDH 102Z',
        type: VehicleType.HEAVY_TRUCK,
        status: 'ACTIVE',
        capacityKg: 10000,
        verificationStatus: 'VERIFIED'
      };
      setStore('vehicles', [demoVehicle]);
    }

    // 3. Create test Delivery Notes
    const testDns: DeliveryNote[] = [
      {
        id: 'dn-test-1',
        tenantId,
        externalId: 'DN-9901',
        clientName: 'Alpha Retailers',
        address: 'Westlands Square, Nairobi',
        status: DNStatus.IN_TRANSIT,
        type: LogisticsType.OUTBOUND,
        priority: 'MEDIUM',
        plannedDeliveryDate: new Date().toISOString(),
        items: [{ id: 'i1', name: 'Electronics Cluster', qty: 5, unit: 'Units' }],
        documents: [],
        logs: [],
        journey: [],
        createdAt: new Date().toISOString()
      },
      {
        id: 'dn-test-2',
        tenantId,
        externalId: 'DN-9902',
        clientName: 'Bravo Pharma',
        address: 'Parklands, Nairobi',
        status: DNStatus.PENDING,
        type: LogisticsType.OUTBOUND,
        priority: 'HIGH',
        plannedDeliveryDate: new Date().toISOString(),
        items: [{ id: 'i2', name: 'Cold Chain Pack', qty: 2, unit: 'Units' }],
        documents: [],
        logs: [],
        journey: [],
        createdAt: new Date().toISOString()
      }
    ];

    const existingDns = await this.getDeliveryNotes(tenantId);
    // Filter out if they already exist
    const newDns = testDns.filter(t => !existingDns.find(e => e.externalId === t.externalId));
    
    if (newDns.length > 0) {
      const updatedDns = [...existingDns, ...newDns];
      setStore('delivery_notes', updatedDns);
      
      if (isSupabaseConfigured) {
        try {
          await supabase.from('delivery_notes').insert(newDns.map(dn => ({
            id: dn.id,
            tenant_id: dn.tenantId,
            dn_number: dn.externalId,
            customer_name: dn.clientName,
            delivery_address: dn.address,
            status: dn.status,
            last_lat: dn.lastLat,
            last_lng: dn.lastLng,
            created_at: dn.createdAt
          })));
        } catch (err) {
          console.warn('Supabase bulk insert failed during seeding', err);
        }
      }
    }

    return { success: true, count: newDns.length };
  },

  async troubleshootSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      if (!supabase) return { success: false, message: 'Supabase client not initialized.' };

      // Check connection
      const { error: connError } = await supabase.from('health_check').select('count').limit(1);
      
      if (connError) {
        if (connError.code === 'PGRST116' || connError.code === '42P01') {
          // Table doesn't exist, this is actually "healthy" in terms of connectivity
          return { success: true, message: 'Supabase is reachable, but some tables are missing. See SUPABASE_SETUP.md for SQL commands to initialize your database.' };
        }
        return { success: false, message: `Supabase error: ${connError.message}. Check if your project URL and Anon Key are correct.` };
      }

      return { success: true, message: 'Supabase connection is healthy and tables are initialized.' };
    } catch (err) {
      return { success: false, message: `Troubleshooting failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  },

  async getHealthMetrics(requesterRole?: UserRole): Promise<HealthMetrics> {
    if (requesterRole) checkRole(requesterRole, ['ADMIN', 'DISPATCHER']);
    const isSupabaseHealthy = await api.checkSupabaseHealth();
    const frappeStatus = await FrappeService.checkHealth();
    isFrappeHealthy = frappeStatus; // Update global state
    return { 
      ingestSuccessRate: 98.4, 
      webhookDeliveryRate: 99.2, 
      activeConnectors: 2, 
      totalErrors24h: 14,
      isSupabaseHealthy,
      isFrappeHealthy: frappeStatus
    };
  },

  // --- Driver Inspections & Notifications ---
  async getNotifications(userId: string): Promise<Notification[]> {
    return getStore(`notifications_${userId}`, [
      {
        id: 'n-1',
        tenantId: 'tenant-1',
        userId,
        title: 'New Assignment',
        message: 'You have been assigned to Trip TRP-9001',
        type: 'ASSIGNMENT',
        category: 'OPERATIONS',
        read: false,
        isRead: false,
        persistent: false,
        timestamp: new Date().toISOString(),
        link: '/driver/trips'
      }
    ]);
  },

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const notes = await api.getNotifications(userId);
    const updated = notes.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
    setStore(`notifications_${userId}`, updated);
  },

  async saveInspection(inspection: Omit<VehicleInspection, 'id' | 'timestamp'>): Promise<VehicleInspection> {
    const newInspection: VehicleInspection = {
      id: `insp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...inspection
    };
    const inspections = getStore('inspections', []);
    setStore('inspections', [newInspection, ...inspections]);

    // If inspection failed, create a notification
    if (newInspection.status === 'FAIL') {
      const notification: Notification = {
        id: `n-insp-${Date.now()}`,
        tenantId: 'tenant-1',
        userId: newInspection.driverId,
        title: 'Critical Inspection Failure',
        message: `Vehicle ${newInspection.vehicleId} failed safety check. Please contact maintenance.`,
        type: 'INSPECTION_FAILURE',
        category: 'SECURITY',
        read: false,
        isRead: false,
        persistent: true,
        timestamp: new Date().toISOString()
      };
      const notes = await api.getNotifications(newInspection.driverId);
      setStore(`notifications_${newInspection.driverId}`, [notification, ...notes]);
    }

    return newInspection;
  },

  async getInspections(vehicleId?: string): Promise<VehicleInspection[]> {
    const all = getStore('inspections', []);
    return vehicleId ? all.filter((i: VehicleInspection) => i.vehicleId === vehicleId) : all;
  },

  // --- Order Management ---
  async getOrders(tenantId: string = 'tenant-1'): Promise<Order[]> {
    const cacheKey = `orders_all_${tenantId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const all = getStore('orders', initialOrders);
    const filtered = all.filter(o => !o.tenantId || o.tenantId === tenantId);
    setCached(cacheKey, filtered);
    return filtered;
  },
  
  async createOrder(data: Partial<Order>, tenantId: string = 'tenant-1', requestId?: string): Promise<Order> {
    if (!checkIdempotency(requestId)) {
      const orders = await api.getOrders(tenantId);
      return orders[0];
    }
    const sanitizedData = { ...sanitizeObject(data), tenantId };

    if (isSupabaseConfigured) {
      try {
        const { data: newOrder, error } = await supabase
          .from('orders')
          .insert([{
            external_id: sanitizedData.externalId || `SO-${Math.floor(Math.random() * 9000) + 1000}`,
            customer_id: sanitizedData.customerId || 'cust-new',
            customer_name: sanitizedData.customerName || 'New Customer',
            status: sanitizedData.status || 'PENDING',
            items: sanitizedData.items || [],
            total_amount: sanitizedData.totalAmount || 0,
            currency: sanitizedData.currency || 'KES',
            payment_status: sanitizedData.paymentStatus || 'UNPAID',
            tenant_id: tenantId
          }])
          .select()
          .single();

        if (error) throw error;
        clearCache('orders');
        return toCamelCase(newOrder);
      } catch (err) {
        console.warn('Supabase createOrder failed', err);
      }
    }

    const orders = await api.getOrders(tenantId);
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      externalId: sanitizedData.externalId || `SO-${Math.floor(Math.random() * 9000) + 1000}`,
      customerId: 'cust-new',
      customerName: 'New Customer',
      status: 'PENDING',
      items: [],
      totalAmount: 0,
      currency: 'KES',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentStatus: 'UNPAID',
      fraudScore: 0,
      tenantId,
      ...sanitizedData
    } as Order;
    setStore('orders', [newOrder, ...getStore('orders', initialOrders)]);
    clearCache('orders');
    return newOrder;
  },

  async updateOrder(id: string, data: Partial<Order>, requestId?: string): Promise<Order> {
    if (!checkIdempotency(requestId)) {
      const orders = await api.getOrders();
      return orders.find(o => o.id === id)!;
    }
    clearCache('orders');
    const orders = await api.getOrders();
    const updated = orders.map(o => o.id === id ? { ...o, ...data, updatedAt: new Date().toISOString() } : o);
    setStore('orders', updated);
    return updated.find(o => o.id === id)!;
  },

  // --- Fleet Maintenance ---
  async getMaintenanceLogs(tenantId: string = 'tenant-1'): Promise<MaintenanceLog[]> {
    const all = getStore('maintenance_logs', initialMaintenanceLogs);
    return all.filter(m => !m.tenantId || m.tenantId === tenantId);
  },
  
  async addMaintenanceLog(log: Partial<MaintenanceLog>, tenantId: string = 'tenant-1', requestId?: string): Promise<MaintenanceLog> {
    if (!checkIdempotency(requestId)) {
      const logs = await api.getMaintenanceLogs(tenantId);
      return logs[0];
    }
    const logs = await api.getMaintenanceLogs(tenantId);
    const newLog: MaintenanceLog = {
      id: `maint-${Date.now()}`,
      vehicleId: '',
      type: 'ROUTINE',
      description: '',
      cost: 0,
      date: new Date().toISOString(),
      odometerReading: 0,
      performedBy: '',
      status: 'PENDING',
      tenantId,
      ...log
    } as MaintenanceLog;
    setStore('maintenance_logs', [newLog, ...getStore('maintenance_logs', [])]);
    
    // Update vehicle odometer and service dates if completed
    if (newLog.status === 'COMPLETED' && newLog.vehicleId) {
      const vehicles = await api.getVehicles(tenantId);
      const vehicle = vehicles.find(v => v.id === newLog.vehicleId);
      if (vehicle) {
        await api.updateVehicle(vehicle.id, {
          lastServiceDate: newLog.date,
          lastServiceOdometer: newLog.odometerReading,
          nextServiceDate: newLog.nextServiceDate,
          nextServiceOdometer: newLog.nextServiceOdometer,
          currentOdometer: Math.max(vehicle.currentOdometer || 0, newLog.odometerReading)
        }, `maint-update-${newLog.id}`);
      }
    }
    
    return newLog;
  },

  async getFuelLogs(tenantId: string = 'tenant-1'): Promise<FuelLog[]> {
    const all = getStore('fuel_logs', []);
    return all.filter(f => !f.tenantId || f.tenantId === tenantId);
  },

  async addFuelLog(log: Partial<FuelLog>, tenantId: string = 'tenant-1', requestId?: string): Promise<FuelLog> {
    if (!checkIdempotency(requestId)) {
      const logs = await api.getFuelLogs(tenantId);
      return logs[0];
    }
    const logs = await api.getFuelLogs(tenantId);
    const newLog: FuelLog = {
      id: `fuel-${Date.now()}`,
      vehicleId: '',
      driverId: '',
      date: new Date().toISOString(),
      amount: 0,
      cost: 0,
      odometerReading: 0,
      tenantId,
      ...log
    } as FuelLog;
    setStore('fuel_logs', [newLog, ...getStore('fuel_logs', [])]);

    // Update vehicle odometer
    if (newLog.vehicleId) {
      const vehicles = await api.getVehicles(tenantId);
      const vehicle = vehicles.find(v => v.id === newLog.vehicleId);
      if (vehicle) {
        await api.updateVehicle(vehicle.id, {
          currentOdometer: Math.max(vehicle.currentOdometer || 0, newLog.odometerReading)
        }, `fuel-update-${newLog.id}`);
      }
    }

    return newLog;
  },

  // --- Reports & Analytics ---
  async getAnalyticsReports(): Promise<AnalyticsReport[]> {
    return getStore('analytics_reports', []);
  },

  // --- Warehouse Management ---
  async getInventory(tenantId: string = 'tenant-1'): Promise<InventoryItem[]> {
    const cacheKey = `inventory_all_${tenantId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const all = getStore('inventory', initialInventory);
    const filtered = all.filter(i => !i.tenantId || i.tenantId === tenantId);
    setCached(cacheKey, filtered);
    return filtered;
  },

  async addInventoryItem(item: Partial<InventoryItem>, tenantId: string = 'tenant-1', requestId?: string): Promise<InventoryItem> {
    if (!checkIdempotency(requestId)) {
      const inventory = await api.getInventory(tenantId);
      return inventory[0];
    }
    const sanitizedData = { ...sanitizeObject(item), tenantId };
    clearCache(`inventory_all_${tenantId}`);

    if (isSupabaseConfigured) {
      try {
        const { data: newItem, error } = await supabase
          .from('inventory')
          .insert([{
            sku: sanitizedData.sku,
            name: sanitizedData.name,
            category: sanitizedData.category,
            qty: sanitizedData.qty || 0,
            unit: sanitizedData.unit,
            warehouse_id: sanitizedData.warehouseId || 'f-1',
            min_threshold: sanitizedData.minThreshold,
            status: sanitizedData.status || 'IN_STOCK',
            tenant_id: tenantId,
            expiry_date: sanitizedData.expiryDate
          }])
          .select()
          .single();

        if (error) throw error;
        return toCamelCase(newItem);
      } catch (err) {
        console.warn('Supabase addInventoryItem failed', err);
      }
    }

    const inventory = await api.getInventory(tenantId);
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: `SKU-${Math.random().toString(36).substring(7).toUpperCase()}`,
      name: '',
      category: 'GENERAL',
      qty: 0,
      unit: 'Units',
      minThreshold: 10,
      warehouseId: 'wh-1',
      status: 'IN_STOCK',
      ...sanitizedData
    } as InventoryItem;
    setStore('inventory', [newItem, ...getStore('inventory', initialInventory)]);
    return newItem;
  },

  async updateInventory(id: string, updates: Partial<InventoryItem>, tenantId: string = 'tenant-1', requestId?: string): Promise<InventoryItem> {
    if (!checkIdempotency(requestId)) {
      const items = await api.getInventory(tenantId);
      return items.find(i => i.id === id)!;
    }
    clearCache(`inventory_all_${tenantId}`);
    const items = await api.getInventory(tenantId);
    const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
    setStore('inventory', [...getStore('inventory', initialInventory).filter(i => i.tenantId !== tenantId), ...updated]);
    return updated.find(i => i.id === id)!;
  },

  async getWarehouseMovements(tenantId: string = 'tenant-1'): Promise<WarehouseMovement[]> {
    const all = getStore('warehouse_movements', []);
    return all.filter(m => !m.tenantId || m.tenantId === tenantId);
  },

  async recordMovement(movement: Omit<WarehouseMovement, 'id' | 'timestamp'>, tenantId: string = 'tenant-1', requestId?: string): Promise<WarehouseMovement> {
    if (!checkIdempotency(requestId)) {
      const movements = await api.getWarehouseMovements(tenantId);
      return movements[0];
    }
    const movements = await api.getWarehouseMovements(tenantId);
    const newMovement: WarehouseMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tenantId,
      ...movement
    };
    setStore('warehouse_movements', [newMovement, ...getStore('warehouse_movements', [])]);
    
    // Update inventory qty
    const items = await api.getInventory(tenantId);
    const item = items.find(i => i.id === movement.itemId);
    if (item) {
      const newQty = movement.type === 'IN' ? item.qty + (movement.qty || 0) : item.qty - (movement.qty || 0);
      await api.updateInventory(item.id, { qty: newQty }, tenantId, `mov-update-${newMovement.id}`);
    }
    
    return newMovement;
  },

  async getBinLocations(warehouseId: string, tenantId: string = 'tenant-1'): Promise<BinLocation[]> {
    const all = getStore('bin_locations', initialBinLocations);
    return all.filter(b => b.warehouseId === warehouseId && (!b.tenantId || b.tenantId === tenantId));
  },

  async createBinLocation(data: Partial<BinLocation>, tenantId: string = 'tenant-1', requestId?: string): Promise<BinLocation> {
    if (!checkIdempotency(requestId)) {
      const bins = await api.getBinLocations(data.warehouseId || 'f-1', tenantId);
      return bins[0];
    }
    const sanitizedData = { ...sanitizeObject(data), tenantId };
    
    if (isSupabaseConfigured) {
      try {
        const { data: newBin, error } = await supabase
          .from('bin_locations')
          .insert([{
            warehouse_id: sanitizedData.warehouseId || 'f-1',
            zone: sanitizedData.zone,
            aisle: sanitizedData.aisle,
            shelf: sanitizedData.shelf,
            bin: sanitizedData.bin,
            capacity: sanitizedData.capacity || 100,
            type: sanitizedData.type || 'PICKING',
            tenant_id: tenantId
          }])
          .select()
          .single();

        if (error) throw error;
        return toCamelCase(newBin);
      } catch (err) {
        console.warn('Supabase createBinLocation failed', err);
      }
    }

    const bins = getStore('bin_locations', initialBinLocations);
    const newBin: BinLocation = {
      id: `bin-${Date.now()}`,
      warehouseId: data.warehouseId || 'f-1',
      zone: data.zone || 'A',
      aisle: data.aisle || '01',
      shelf: data.shelf || 'A',
      bin: data.bin || '01',
      capacity: data.capacity || 100,
      currentFill: 0,
      isOccupied: false,
      type: 'PICKING',
      items: [],
      tenantId,
      ...sanitizedData
    } as BinLocation;
    setStore('bin_locations', [newBin, ...bins]);
    return newBin;
  },

  // --- CRM ---
  async getCustomers(tenantId: string = 'tenant-1'): Promise<any[]> {
    const cacheKey = `customers_all_${tenantId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const initialCustomers = [
      {
        id: 'c1',
        name: 'Global Retail Corp',
        email: 'ops@globalretail.com',
        phone: '+254 711 222 333',
        address: 'Mombasa Rd, Nairobi',
        status: 'ACTIVE',
        totalRevenue: 125000,
        orderCount: 450,
        lastInteraction: '2026-04-14T10:00:00Z',
        tenantId: 'tenant-1'
      },
      {
        id: 'c2',
        name: 'TechLogistics Ltd',
        email: 'contact@techlog.co.ke',
        phone: '+254 722 333 444',
        address: 'Westlands, Nairobi',
        status: 'ACTIVE',
        totalRevenue: 85000,
        orderCount: 280,
        lastInteraction: '2026-04-15T08:30:00Z',
        tenantId: 'tenant-1'
      }
    ];

    const all = getStore('customers', initialCustomers);
    const filtered = all.filter((c: any) => !c.tenantId || c.tenantId === tenantId);
    setCached(cacheKey, filtered);
    return filtered;
  },

  async createCustomer(data: any, tenantId: string = 'tenant-1', requestId?: string): Promise<any> {
    if (!checkIdempotency(requestId)) {
      const customers = await api.getCustomers(tenantId);
      return customers[0];
    }
    const sanitizedData = { ...sanitizeObject(data), tenantId };
    clearCache(`customers_all_${tenantId}`);

    if (isSupabaseConfigured) {
      try {
        const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert([{
            name: sanitizedData.name,
            email: sanitizedData.email,
            phone: sanitizedData.phone,
            address: sanitizedData.address,
            status: sanitizedData.status || 'ACTIVE',
            tenant_id: tenantId
          }])
          .select()
          .single();

        if (error) throw error;
        return toCamelCase(newCustomer);
      } catch (err) {
        console.warn('Supabase createCustomer failed', err);
      }
    }

    const customers = await api.getCustomers(tenantId);
    const newCustomer = {
      id: `cust-${Date.now()}`,
      totalRevenue: 0,
      orderCount: 0,
      lastInteraction: new Date().toISOString(),
      tenantId,
      ...sanitizedData
    };
    setStore('customers', [newCustomer, ...getStore('customers', [])]);
    return newCustomer;
  },

  async updateCustomer(id: string, data: any, requestId?: string): Promise<any> {
    if (!checkIdempotency(requestId)) {
      const customers = await api.getCustomers();
      return customers.find(c => c.id === id);
    }
    const customers = await api.getCustomers();
    const updated = customers.map(c => c.id === id ? { ...c, ...data } : c);
    setStore('customers', updated);
    clearCache('customers');
    return updated.find(c => c.id === id);
  },

  async deleteCustomer(id: string, requestId?: string): Promise<void> {
    if (!checkIdempotency(requestId)) return;
    const customers = await api.getCustomers();
    setStore('customers', customers.filter(c => c.id !== id));
    clearCache('customers');
  },

  // --- M-Pesa Integration ---
  async initiateMpesaPayment(phone: string, amount: number, reference: string): Promise<{ success: boolean; message: string; checkoutRequestId?: string; status?: string; receiptNumber?: string }> {
    console.log(`Initiating M-Pesa STK Push for ${phone}, amount: ${amount}, ref: ${reference}`);
    
    try {
      // Mock implementation calling endpoint
      const response = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount, reference })
      });
      
      // If endpoint doesn't exist (likely in this environment), we fallback to mock
      if (!response.ok && response.status !== 404) throw new Error('M-Pesa initiation failed');
      
      const result = response.ok ? await response.json() : {
        success: true,
        status: 'SUCCESS',
        message: 'STK Push initiated successfully. Please check your phone.',
        checkoutRequestId: `ws_CO_${Date.now()}`,
        receiptNumber: `MP-${Date.now()}`
      };

      await logAudit('MPESA_INITIATED', { phone, amount, reference, result });
      return result;
    } catch (error) {
      handleApiError(error, 'initiateMpesaPayment');
      throw error;
    }
  },

  // --- eTIMS Integration ---
  async generateEtimsInvoice(deliveryNoteId: string): Promise<{ success: boolean; invoiceNumber: string; cuInvoiceNumber: string; qrCodeUrl: string; kraResponse?: any }> {
    console.log(`Generating eTIMS invoice for DN: ${deliveryNoteId}`);
    
    try {
      // Mock eTIMS generation logic
      // In production, this would call the KRA VSCU/OSCU API or a middleware
      const invoiceNumber = `KRA-ETIMS-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://itax.kra.go.ke/KRA-Portal/invoiceVerify.htm?inv=${invoiceNumber}`;

      // Provision for KRA API integration
      const kraResponse = {
        status: 'SUCCESS',
        vscu_id: 'VSCU001',
        invoice_num: invoiceNumber,
        date_time: new Date().toISOString()
      };

      const result = {
        success: true,
        invoiceNumber,
        cuInvoiceNumber: invoiceNumber,
        qrCodeUrl,
        kraResponse
      };

      // Update DN with invoice info
      await api.updateDeliveryNote(deliveryNoteId, { 
        paymentStatus: 'PENDING',
        invoiceUrl: qrCodeUrl 
      });

      await logAudit('ETIMS_GENERATED', { deliveryNoteId, result });
      return result;
    } catch (error) {
      handleApiError(error, 'generateEtimsInvoice');
      throw error;
    }
  },

  // --- Driver Notifications (Firestore) ---
  async saveDriverNotification(userId: string, notification: Partial<Notification>): Promise<Notification> {
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      title: notification.title || 'New Notification',
      message: notification.message || '',
      type: notification.type || 'SYSTEM',
      isRead: false,
      timestamp: new Date().toISOString(),
      ...notification
    } as Notification;

    const notifications = getStore('driver_notifications', []);
    setStore('driver_notifications', [newNotification, ...notifications]);
    return newNotification;
  },

  // --- Driver Recruitment ---
  async getDriverApplications(): Promise<DriverApplication[]> {
    return getStore('driver_applications', []);
  },

  async createDriverApplication(data: Omit<DriverApplication, 'id' | 'status' | 'appliedAt' | 'requirements'>): Promise<DriverApplication> {
    const sanitizedData = sanitizeObject(data);
    const applications = await api.getDriverApplications();
    const newApp: DriverApplication = {
      id: `app-${Date.now()}`,
      status: 'PENDING',
      appliedAt: new Date().toISOString(),
      requirements: {
        documentsSubmitted: false,
        documentsVerified: false,
        backgroundCheckPassed: false,
        interviewPassed: false,
        trainingCompleted: false
      },
      ...sanitizedData
    } as DriverApplication;
    setStore('driver_applications', [newApp, ...applications]);
    return newApp;
  },

  async updateDriverApplicationStatus(id: string, status: DriverApplication['status'], notes?: string): Promise<void> {
    const applications = await api.getDriverApplications();
    const updated = applications.map(app => 
      app.id === id ? { ...app, status, notes: notes || app.notes } : app
    );
    setStore('driver_applications', updated);
    
    // If approved, we automatically create a user profile for the driver
    if (status === 'APPROVED') {
      const app = applications.find(a => a.id === id);
      if (app) {
        await api.createUser({
          name: app.name,
          email: app.email,
          phone: app.phone,
          role: 'DRIVER',
          idNumber: app.idNumber,
          kraPin: app.kraPin,
          licenseNumber: app.licenseNumber,
          verificationStatus: 'VERIFIED',
          isOnboarded: true,
          joinedAt: new Date().toISOString()
        });
      }
    }
  },

  async updateDriverApplicationRequirements(id: string, requirements: Partial<DriverApplication['requirements']>): Promise<void> {
    const applications = await api.getDriverApplications();
    const updated = applications.map(app => 
      app.id === id ? { ...app, requirements: { ...app.requirements, ...requirements } } : app
    );
    setStore('driver_applications', updated);
  },

  async getDriverNotifications(userId: string): Promise<Notification[]> {
    const all = getStore('driver_notifications', []);
    return all.filter(n => n.userId === userId);
  },

  // --- Task Management ---
  async getTasks(tenantId: string = 'tenant-1'): Promise<Task[]> {
    // 1. Try Redis Hot Cache
    const redisCache = await cacheService.get<Task[]>(`hot_tasks_${tenantId}`);
    if (redisCache) return redisCache;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('tenant_id', tenantId);

        if (error) throw error;
        const tasks = (data || []).map(t => toCamelCase(t));
        // Populate Redis Hot Cache (300s TTL)
        await cacheService.set(`hot_tasks_${tenantId}`, tasks, 300);
        return tasks;
      } catch (err) {
        console.warn('Supabase getTasks failed, falling back to local store', err);
      }
    }

    const cached = getCached(`tasks_${tenantId}`);
    if (cached) return cached;

    try {
      const allTasks: Task[] = JSON.parse(localStorage.getItem('shipstack_tasks') || '[]');
      const filtered = allTasks.filter(t => !t.tenantId || t.tenantId === tenantId);
      setCached(`tasks_${tenantId}`, filtered);
      return filtered;
    } catch (err) {
      return handleApiError(err, 'getTasks');
    }
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert([toSnakeCase(task)])
          .select()
          .single();

        if (error) throw error;
        return toCamelCase(data);
      } catch (err) {
        console.warn('Supabase createTask failed', err);
      }
    }

    try {
      const newTask: Task = {
        ...task,
        id: `TASK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const tasks = JSON.parse(localStorage.getItem('shipstack_tasks') || '[]');
      tasks.push(newTask);
      localStorage.setItem('shipstack_tasks', JSON.stringify(tasks));
      clearCache(`tasks_${task.tenantId}`);
      return newTask;
    } catch (err) {
      return handleApiError(err, 'createTask');
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (isSupabaseConfigured) {
      try {
        const snakeUpdates: any = toSnakeCase(updates);
        snakeUpdates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('tasks')
          .update(snakeUpdates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return toCamelCase(data);
      } catch (err) {
        console.warn('Supabase updateTask failed', err);
      }
    }

    try {
      const tasks = JSON.parse(localStorage.getItem('shipstack_tasks') || '[]');
      const index = tasks.findIndex((t: Task) => t.id === id);
      if (index === -1) throw new Error('Task not found');
      
      const tenantId = tasks[index].tenantId;
      tasks[index] = { 
        ...tasks[index], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('shipstack_tasks', JSON.stringify(tasks));
      clearCache(`tasks_${tenantId}`);
      return tasks[index];
    } catch (err) {
      return handleApiError(err, 'updateTask');
    }
  },

  async deleteTask(id: string, tenantId: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase deleteTask failed, falling back to local store', err);
      }
    }

    try {
      const tasks = JSON.parse(localStorage.getItem('shipstack_tasks') || '[]');
      const filtered = tasks.filter((t: Task) => t.id !== id);
      localStorage.setItem('shipstack_tasks', JSON.stringify(filtered));
      clearCache(`tasks_${tenantId}`);
    } catch (err) {
      return handleApiError(err, 'deleteTask');
    }
  },

  // --- Exception Management ---
  async getExceptions(tenantId: string = 'tenant-1'): Promise<LogisticsException[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('exceptions')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(e => ({
          ...e,
          dnId: e.dn_id,
          reportedBy: e.reported_by,
          reportedAt: e.created_at,
          resolvedBy: e.resolved_by,
          resolvedAt: e.resolved_at,
          resolutionNotes: e.resolution_notes
        }));
      } catch (err) {
        console.warn('Supabase getExceptions failed, falling back to local store', err);
      }
    }
    return getStore('exceptions', []);
  },

  async createException(data: Partial<LogisticsException>, requestId?: string): Promise<LogisticsException> {
    if (!checkIdempotency(requestId)) {
      const exs = await api.getExceptions(data.tenantId);
      return exs[0];
    }
    const sanitizedData = sanitizeObject(data);
    
    if (isSupabaseConfigured) {
      try {
        const { data: newEx, error } = await supabase
          .from('exceptions')
          .insert([{
            tenant_id: sanitizedData.tenantId,
            dn_id: sanitizedData.dnId,
            type: sanitizedData.type,
            severity: sanitizedData.severity || 'MEDIUM',
            status: sanitizedData.status || 'PENDING',
            description: sanitizedData.description,
            reported_by: sanitizedData.reportedBy,
          }])
          .select()
          .single();

        if (error) throw error;
        return {
          ...newEx,
          dnId: newEx.dn_id,
          reportedBy: newEx.reported_by,
          reportedAt: newEx.created_at
        };
      } catch (err) {
        console.warn('Supabase createException failed, falling back to local store', err);
      }
    }

    const ex: LogisticsException = {
      id: `ex-${Date.now()}`,
      reportedAt: new Date().toISOString(),
      status: ExceptionStatus.REPORTED,
      ...sanitizedData
    } as LogisticsException;
    
    const existing = getStore('exceptions', [] as LogisticsException[]);
    setStore('exceptions', [ex, ...existing]);
    return ex;
  },

  async updateException(id: string, data: Partial<LogisticsException>): Promise<LogisticsException> {
    const sanitizedData = sanitizeObject(data);

    if (isSupabaseConfigured) {
      try {
        const { data: updatedEx, error } = await supabase
          .from('exceptions')
          .update({
            status: sanitizedData.status,
            resolution_notes: sanitizedData.resolutionNotes,
            resolved_by: sanitizedData.resolvedBy,
            resolved_at: sanitizedData.resolvedAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return {
          ...updatedEx,
          dnId: updatedEx.dn_id,
          reportedBy: updatedEx.reported_by,
          reportedAt: updatedEx.created_at,
          resolvedBy: updatedEx.resolved_by,
          resolvedAt: updatedEx.resolved_at,
          resolutionNotes: updatedEx.resolution_notes
        };
      } catch (err) {
        console.warn('Supabase updateException failed, falling back to local store', err);
      }
    }

    const exs = getStore('exceptions', [] as LogisticsException[]);
    const updated = exs.map(e => e.id === id ? { ...e, ...sanitizedData } : e);
    setStore('exceptions', updated);
    return updated.find(e => e.id === id)!;
  },

  async resetData(): Promise<void> {
    localStorage.removeItem('shipstack_int_delivery_notes');
    localStorage.removeItem('shipstack_int_trips');
    localStorage.removeItem('shipstack_int_vehicles');
    localStorage.removeItem('shipstack_int_users');
    localStorage.removeItem('shipstack_int_import_batches');
    localStorage.removeItem('shipstack_int_connectors');
    localStorage.removeItem('shipstack_int_api_keys');
    localStorage.removeItem('shipstack_int_webhooks');
    localStorage.removeItem('shipstack_int_orders');
    localStorage.removeItem('shipstack_int_maintenance_logs');
    localStorage.removeItem('shipstack_int_analytics_reports');
    localStorage.removeItem('shipstack_int_inventory');
    localStorage.removeItem('shipstack_int_warehouse_movements');
    localStorage.removeItem('shipstack_int_bin_locations');
    window.location.reload();
  },

  getTenantPlan(): 'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE' {
    const tenant = getStore<Tenant | null>('tenant', null);
    return tenant?.plan || 'STARTER';
  },

  async loginDemo(): Promise<{ user: User, token: string }> {
    // Artificial delay for realism
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const demoUser: User = {
      id: 'demo-user-1',
      name: 'Demo Commander',
      email: 'admin@shipstack.com',
      role: 'ADMIN' as any,
      company: 'Shipstack SimOps',
      enabledModules: ['dashboard', 'dispatch', 'fleet', 'orders', 'warehouse', 'crm', 'analytics', 'integrations'] as any[],
      isOnboarded: true,
      verificationStatus: 'VERIFIED'
    };
    
    // Set mock token
    const token = 'sk_demo_' + btoa(JSON.stringify(demoUser)).substring(0, 32);
    
    // Set a matching mock tenant
    const demoTenant = {
      id: 'tenant-1',
      name: 'Shipstack SimOps Hub',
      slug: 'shipstack-demo',
      industry: 'GENERAL' as any,
      plan: 'ENTERPRISE' as any,
      status: 'ACTIVE' as any,
      enabledModules: demoUser.enabledModules,
      settings: {
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        primaryColor: '#0F2A44',
        onboardingCompleted: true
      }
    };
    
    // Persist to local store for useTenant hook
    setStore('tenant', demoTenant);
    setStore('tenants_list', [demoTenant]);
    localStorage.setItem('shipstack_tenant_id', 'tenant-1');
    localStorage.setItem('shipstack_demo_mode', 'true');
    
    return { user: demoUser, token };
  },

  async loginDriverDemo(): Promise<{ user: User, token: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const demoDriver: User = {
      id: 'd-1',
      name: 'John Maloba',
      email: 'pilot@shipstack.com',
      role: 'driver',
      company: 'Alpha Transporters',
      idNumber: '12345678',
      kraPin: 'A001234567Z',
      licenseNumber: 'DL-99221',
      onDuty: true,
      password: 'password',
      verificationStatus: 'VERIFIED',
      isOnboarded: true,
      tenantId: 'tenant-1',
      enabledModules: ['driver-portal', 'orders', 'fleet'] as any[]
    };

    const demoTenant = {
      id: 'tenant-1',
      name: 'Alpha Transporters',
      slug: 'alpha-transporters',
      industry: 'GENERAL' as any,
      plan: 'GROWTH' as any,
      status: 'ACTIVE' as any,
      enabledModules: ['driver-portal', 'orders', 'fleet'],
      settings: {
        currency: 'KES',
        timezone: 'Africa/Nairobi',
        primaryColor: '#0F2A44',
        onboardingCompleted: true
      }
    };

    setStore('tenant', demoTenant);
    setStore('tenants_list', [demoTenant]);
    localStorage.setItem('shipstack_tenant_id', 'tenant-1');
    localStorage.setItem('shipstack_demo_mode', 'true');

    return { user: demoDriver, token: 'demo-driver-token' };
  }
};

export const integrationsApi = api;
