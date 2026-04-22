import { 
  DeliveryNote, 
  DNStatus, 
  User, 
  UserRole,
  UserPreferences,
  Permission,
  Facility, 
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
  Task
} from './types';
import { telemetryService } from './services/socket';
import { supabase, isSupabaseConfigured } from './supabase';
import { sanitize, sanitizeObject, encryptData, decryptData } from './utils/security';
import { FrappeService } from './services/frappe';

const useFrappe = !!import.meta.env.VITE_FRAPPE_BASE_URL;
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
  } else {
    for (const key of API_CACHE.keys()) {
      if (key.startsWith(prefix)) API_CACHE.delete(key);
    }
  }
};

/**
 * Generic API Error Handler
 * Handles network errors, status codes, and unexpected failures.
 */
const handleApiError = (error: any, context: string) => {
  console.error(`[API ERROR] ${context}:`, error);
  
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

const initialUsers: User[] = [
  { id: 'u-1', name: 'Admin User', email: 'admin@shipstack.com', role: 'super_admin', company: 'Shipstack HQ', password: 'password', verificationStatus: 'VERIFIED', isOnboarded: true, tenantId: 'tenant-1' },
  { id: 'd-1', name: 'Driver John', email: 'pilot@shipstack.com', role: 'driver', company: 'Alpha Transporters', idNumber: '12345678', kraPin: 'A001234567Z', licenseNumber: 'DL-99221', onDuty: true, password: 'password', verificationStatus: 'VERIFIED', isOnboarded: true, tenantId: 'tenant-1' },
  { id: 'd-2', name: 'Driver Sarah', email: 'sarah@shipstack.com', role: 'driver', company: 'Beta Logistics', idNumber: '87654321', kraPin: 'B008765432X', licenseNumber: 'DL-88112', onDuty: false, password: 'password', verificationStatus: 'PENDING', isOnboarded: true, tenantId: 'tenant-1' },
  { id: 'd-3', name: 'Driver Mike', email: 'mike@shipstack.com', role: 'driver', company: 'Gamma Express', idNumber: '11223344', kraPin: 'C001122334Y', licenseNumber: 'DL-77334', onDuty: true, password: 'password', verificationStatus: 'VERIFIED', isOnboarded: true, tenantId: 'tenant-1' },
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
  }
];

const initialZones: Zone[] = [
  { id: 'z-1', name: 'Nairobi Central', description: 'CBD and surrounding areas', color: '#3b82f6' },
  { id: 'z-2', name: 'Westlands', description: 'Westlands, Parklands, and Highridge', color: '#10b981' },
  { id: 'z-3', name: 'Mombasa Road', description: 'Industrial Area and Mombasa Road corridor', color: '#f59e0b' },
  { id: 'z-4', name: 'Karen/Langata', description: 'Karen and Langata residential areas', color: '#8b5cf6' }
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
    tempRequirement: { min: 2, max: 6, current: 4.2 },
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
    tempRequirement: { min: -18, max: -12, current: -15.5 },
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
  }
];

const initialFacilities: Facility[] = [
  { id: 'f-1', name: 'Nairobi Main Hub', type: 'WAREHOUSE', lat: -1.286389, lng: 36.817223, address: 'Industrial Area', tenantId: 'tenant-1' },
  { id: 'f-2', name: 'Mombasa Port Hub', type: 'DISTRIBUTION_CENTER', lat: -4.0435, lng: 39.6682, address: 'Port Reitz', tenantId: 'tenant-1' },
  { id: 'f-3', name: 'Kisumu Depot', type: 'WAREHOUSE', lat: -0.1022, lng: 34.7617, address: 'Kondele', tenantId: 'tenant-1' }
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
    tempRequirement: { min: 2, max: 6 },
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
    tempRequirement: { min: -18, max: -12 },
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
  // --- Auth & Users ---
  async login(email: string, password?: string): Promise<{ user: User, token: string }> {
    const sanitizedEmail = sanitize(email);
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
        if (error.message !== 'Failed to fetch') throw error;
      }
    }

    // Demo bypass logic
    if (password === 'password' && (sanitizedEmail.includes('shipstack.com') || sanitizedEmail === 'admin@shipstack.com')) {
      const users = initialUsers;
      const user = users.find(u => u.email.toLowerCase() === sanitizedEmail.toLowerCase());
      if (user) {
        await logAudit('DEMO_LOGIN_BYPASS', { email: sanitizedEmail }, user.name);
        return { user, token: 'mock-jwt-token' };
      }
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password: password || '',
        });

        if (error) throw error;
        if (!data.user) throw new Error('Authentication failed');

        // Fetch user profile from local store or mock for now
        // In a real app, you'd fetch from a 'profiles' table in Supabase
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
          // Save to local store for demo purposes if not in DB
          const users = await api.getUsers();
          setStore('users', [...users, user]);
        }
        
        return { user, token: data.session?.access_token || '' };
      } catch (error: any) {
        console.error('Supabase Auth Error:', error);
        if (error.message !== 'Failed to fetch') {
          throw new Error(error.message || 'Authentication failed');
        }
        console.warn('Supabase unreachable, falling back to mock auth');
      }
    }

    // Fallback to mock logic if Supabase not configured
    try {
      const users = await api.getUsers();
      const sanitizedEmail = email.toLowerCase().trim();
      let user = users.find(u => u.email.toLowerCase() === sanitizedEmail);
      
      if (!user && (sanitizedEmail.includes('shipstack.com') || sanitizedEmail === 'admin@shipstack.com')) {
        user = {
          id: `u-demo-${Date.now()}`,
          name: sanitizedEmail.split('@')[0].toUpperCase(),
          email: sanitizedEmail,
          role: sanitizedEmail.includes('admin') ? 'ADMIN' : sanitizedEmail.includes('driver') ? 'DRIVER' : 'ADMIN',
          company: 'Shipstack Demo Corp',
          verificationStatus: 'VERIFIED',
          isOnboarded: true
        };
      }

      if (!user) throw new Error('User not found. Use a demo account or register.');
      if (password && user.password && user.password !== password && password !== 'password') {
        throw new Error('Invalid password');
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

        const user: User = { 
          id: authData.user.id, 
          ...sanitizedData, 
          role: 'tenant_admin', // Automatically set as tenant_admin
          isOnboarded: false, 
          onboardingStep: 1 
        };

        // Initialize a tenant for the new user
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

        // Save to local store for demo purposes
        const users = await api.getUsers();
        setStore('users', [...users, user]);
        
        return { user, token: authData.session?.access_token || '' };
      } catch (error: any) {
        console.error('Supabase Registration Error:', error);
        if (error.message !== 'Failed to fetch') {
          throw new Error(error.message || 'Registration failed');
        }
        console.warn('Supabase unreachable, falling back to mock registration');
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

  async completeOnboarding(userId: string): Promise<void> {},

  async getUsers(tenantId: string = 'tenant-1', requesterRole?: UserRole): Promise<User[]> {
    if (requesterRole) checkRole(requesterRole, ['ADMIN', 'DISPATCHER', 'FINANCE']);
    const cacheKey = `users_all_${tenantId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

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
    
    const sanitizedData = sanitizeObject(data);
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
    const users = await api.getUsers(tenantId);
    const updated = users.map(u => u.id === id ? { ...u, ...sanitizedData } : u);
    setStore('users', [...getStore('users', initialUsers).filter(u => u.tenantId !== tenantId), ...updated]);
    clearCache(`users_all_${tenantId}`);
    clearCache(`user_${id}`);
    return updated.find(u => u.id === id) || { id, ...sanitizedData } as User;
  },

  async deleteUser(id: string, tenantId: string = 'tenant-1'): Promise<void> {
    clearCache(`users_all_${tenantId}`);
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
  async getDeliveryNotes(tenantId: string = 'tenant-1', user?: User): Promise<DeliveryNote[]> {
    const cacheKey = `dns_all_${tenantId}_${user?.id || 'anon'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

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

    let all: DeliveryNote[] = getStore('delivery_notes', initialDeliveryNotes);
    
    // Enforce tenant isolation
    all = all.filter(dn => !dn.tenantId || dn.tenantId === tenantId);
    
    // Apply client-side search
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
    clearCache(`dns_all_${tenantId}`);
    
    if (canUseFrappe()) {
      try {
        const newDn = await FrappeService.createDoc<DeliveryNote>('Delivery Note', { ...sanitizedData, tenant_id: tenantId });
        await logAudit('CREATE_DN', { id: newDn.id, externalId: newDn.externalId, tenantId });
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
    return newDn;
  },

  async updateDeliveryNote(id: string, data: Partial<DeliveryNote>, requestId?: string): Promise<DeliveryNote> {
    if (!checkIdempotency(requestId)) {
      const dns = await api.getDeliveryNotes();
      return dns.find(d => d.id === id)!;
    }
    const sanitizedData = sanitizeObject(data);
    
    if (canUseFrappe()) {
      try {
        const updated = await FrappeService.updateDoc<DeliveryNote>('Delivery Note', id, sanitizedData);
        await logAudit('UPDATE_DN', { id, data: sanitizedData });
        return updated;
      } catch (err) {
        console.warn('Frappe updateDeliveryNote failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }

    const dns = await api.getDeliveryNotes();
    const updated = dns.map(d => d.id === id ? { ...d, ...sanitizedData } : d);
    setStore('delivery_notes', updated);
    return updated.find(u => u.id === id)!;
  },

  async generateSampleData(): Promise<void> {
    await logAudit('GENERATE_SAMPLE_DATA', { timestamp: new Date().toISOString() });
    
    // Clear existing data to avoid duplicates in demo mode
    clearCache();
    
    // Populate with initial data sets
    setStore('delivery_notes', initialDeliveryNotes);
    setStore('vehicles', initialVehicles);
    setStore('facilities', initialFacilities);
    setStore('users', initialUsers);
    setStore('inventory', initialInventory);
    setStore('zones', initialZones);
    setStore('orders', initialOrders);
    
    return new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing
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

  async updateDNStatus(id: string, status: DNStatus, metadata: any = {}, user?: string): Promise<void> {
    if (canUseFrappe()) {
      try {
        await FrappeService.callMethod('shipstack.api.update_dn_status', {
          id,
          status,
          metadata,
          user
        });
        await logAudit('UPDATE_DN_STATUS', { id, status, metadata }, user);
        return;
      } catch (err) {
        console.warn('Frappe updateDNStatus failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }

    const dns = await api.getDeliveryNotes();
    const updated = dns.map(d => {
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

  async batchUpdateStatus(ids: string[], status: DNStatus, metadata: any = {}, user?: string): Promise<void> {
    for (const id of ids) {
      await api.updateDNStatus(id, status, metadata, user);
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
    clearCache(`facilities_all_${tenantId}`);
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

  // --- Tenant Management ---
  async getTenant(id: string): Promise<Tenant | null> {
    return getStore('tenant', null);
  },

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    try {
      const sanitizedData = sanitizeObject(data);
      const current = await api.getTenant(id);
      const updated = { ...(current || {}), ...sanitizedData } as Tenant;
      
      // Ensure enabledModules is always an array
      if (!Array.isArray(updated.enabledModules)) {
        updated.enabledModules = ['dispatch', 'fleet', 'finance', 'orders'];
      }
      
      setStore('tenant', updated);
      await logAudit('UPDATE_TENANT', { id, modules: updated.enabledModules });
      return updated;
    } catch (err) {
      console.error('api.updateTenant failed:', err);
      throw err;
    }
  },

  async getDrivers(tenantId: string = 'tenant-1'): Promise<User[]> {
    const users = await api.getUsers(tenantId);
    return users.filter(u => u.role === 'DRIVER');
  },

  async getVehicles(tenantId: string = 'tenant-1'): Promise<Vehicle[]> {
    const cacheKey = `vehicles_all_${tenantId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

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
    const current = await api.getVehicles(tenantId);
    const updated = current.map(v => v.id === id ? { ...v, ...sanitizedData } : v);
    setStore('vehicles', updated);
    return updated.find(v => v.id === id)!;
  },

  async deleteVehicle(id: string, tenantId: string = 'tenant-1'): Promise<void> {
    clearCache(`vehicles_all_${tenantId}`);
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

  async getTrips(): Promise<Trip[]> {
    const cacheKey = 'trips_all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (canUseFrappe()) {
      try {
        const data = await FrappeService.getList<Trip>('Trip');
        setCached(cacheKey, data);
        return data;
      } catch (err) {
        console.warn('Frappe getTrips failed, falling back to local store', err);
        isFrappeHealthy = false;
      }
    }
    const raw = getStore('trips', []);
    const rawArray = Array.isArray(raw) ? raw : [];
    const data = Array.from(new Map(rawArray.map(t => [t.id, t])).values());
    setCached(cacheKey, data);
    return data;
  },

  async reconcileTrip(tripId: string, data: { codCollected: number, returnedItemsCount: number }): Promise<void> {
    clearCache('trips');
    const trips = await api.getTrips();
    const updated = trips.map(t => t.id === tripId ? { ...t, ...data, status: 'RECONCILED' as const } : t);
    setStore('trips', updated);
  },

  async clockIn(userId: string): Promise<void> {
    const users = await api.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, onDuty: true } : u);
    setStore('users', updated);
  },

  async clockOut(userId: string): Promise<void> {
    const users = await api.getUsers();
    const updated = users.map(u => u.id === userId ? { ...u, onDuty: false } : u);
    setStore('users', updated);
  },

  async createTrip(data: Omit<Trip, 'id' | 'status'>): Promise<Trip> {
    const sanitizedData = sanitizeObject(data);
    clearCache('trips');
    clearCache('dns');
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

  async deleteTrip(id: string): Promise<void> {
    clearCache('trips');
    clearCache('dns');
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

  async processImport(data: any[]): Promise<void> {
    const dns = await api.getDeliveryNotes();
    const newDns = data.map((d, i) => ({
      id: `dn-imp-${Date.now()}-${i}`,
      externalId: `IMP-${Math.random().toString(36).substring(7).toUpperCase()}`,
      status: DNStatus.RECEIVED,
      createdAt: new Date().toISOString(),
      logs: [],
      documents: [],
      ...d
    }));
    setStore('delivery_notes', [...dns, ...newDns]);
  },

  async getRoute(start: [number, number], end: [number, number]): Promise<any> {
    return { coordinates: [start, end] };
  },

  async updateTelemetry(dnId: string, lat: number, lng: number): Promise<void> {
    const dns = await api.getDeliveryNotes();
    const updated = dns.map(d => d.id === dnId ? { ...d, lastLat: lat, lastLng: lng, lastTelemetryAt: new Date().toISOString() } : d);
    setStore('delivery_notes', updated);
    
    // Emit real-time telemetry via Socket.io
    telemetryService.emitTelemetry(dnId, lat, lng);
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
  async getZones(): Promise<Zone[]> {
    const cacheKey = 'zones_all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const data = getStore('zones', initialZones);
    setCached(cacheKey, data);
    return data;
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

  async batchApproveOrders(ids: string[], requesterRole?: UserRole, requestId?: string): Promise<void> {
    if (requesterRole) checkRole(requesterRole, ['ADMIN', 'DISPATCHER']);
    if (!checkIdempotency(requestId)) return;
    const orders = await api.getOrders();
    const updated = orders.map(o => ids.includes(o.id) ? { ...o, status: 'APPROVED' as const, updatedAt: new Date().toISOString() } : o);
    setStore('orders', updated);
    
    // Automatically create DNs for approved orders
    for (const id of ids) {
      const order = orders.find(o => o.id === id);
      if (order) {
        await api.createDeliveryNote({
          externalId: order.externalId,
          clientName: order.customerName,
          status: DNStatus.RECEIVED,
          items: order.items,
          tenantId: order.tenantId
        }, order.tenantId, `dn-auto-${order.id}`);
      }
    }
  },

  async batchDisburseCommission(tripIds: string[], requesterRole?: UserRole, requestId?: string): Promise<void> {
    if (requesterRole) checkRole(requesterRole, ['ADMIN', 'FINANCE']);
    if (!checkIdempotency(requestId)) return;
    const trips = await api.getTrips();
    const updated = trips.map(t => tripIds.includes(t.id) ? { ...t, commissionStatus: 'DISBURSED' as const } : t);
    setStore('trips', updated);
    await logAudit('BATCH_PAYOUT', { count: tripIds.length, tripIds });
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
      const { error } = await supabase.from('_health_check').select('id').limit(1);
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

  async troubleshootSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      if (!supabase) return { success: false, message: 'Supabase client not initialized.' };

      // Check connection
      const { error: connError } = await supabase.from('health_check').select('count').limit(1);
      
      if (connError) {
        if (connError.code === 'PGRST116' || connError.code === '42P01') {
          // Table doesn't exist, this is actually "healthy" in terms of connectivity
          return { success: true, message: 'Supabase is reachable, but health_check table is missing (normal).' };
        }
        return { success: false, message: `Supabase error: ${connError.message}` };
      }

      return { success: true, message: 'Supabase connection is healthy.' };
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
      return orders[0]; // Return last created or similar
    }
    clearCache('orders');
    const orders = await api.getOrders(tenantId);
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      externalId: `SO-${Math.floor(Math.random() * 9000) + 1000}`,
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
      ...data
    } as Order;
    setStore('orders', [newOrder, ...getStore('orders', initialOrders)]);
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
  
  async addMaintenanceLog(log: Partial<MaintenanceLog>, requestId?: string): Promise<MaintenanceLog> {
    if (!checkIdempotency(requestId)) {
      const logs = await api.getMaintenanceLogs();
      return logs[0];
    }
    const logs = await api.getMaintenanceLogs();
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
      ...log
    } as MaintenanceLog;
    setStore('maintenance_logs', [newLog, ...logs]);
    
    // Update vehicle odometer and service dates if completed
    if (newLog.status === 'COMPLETED' && newLog.vehicleId) {
      const vehicles = await api.getVehicles();
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

  async addFuelLog(log: Partial<FuelLog>, requestId?: string): Promise<FuelLog> {
    if (!checkIdempotency(requestId)) {
      const logs = await api.getFuelLogs();
      return logs[0];
    }
    const logs = await api.getFuelLogs();
    const newLog: FuelLog = {
      id: `fuel-${Date.now()}`,
      vehicleId: '',
      driverId: '',
      date: new Date().toISOString(),
      amount: 0,
      cost: 0,
      odometerReading: 0,
      ...log
    } as FuelLog;
    setStore('fuel_logs', [newLog, ...logs]);

    // Update vehicle odometer
    if (newLog.vehicleId) {
      const vehicles = await api.getVehicles();
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

  async addInventoryItem(item: Partial<InventoryItem>, requestId?: string): Promise<InventoryItem> {
    if (!checkIdempotency(requestId)) {
      const inventory = await api.getInventory();
      return inventory[0];
    }
    clearCache('inventory');
    const inventory = await api.getInventory();
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
      ...item
    } as InventoryItem;
    setStore('inventory', [newItem, ...inventory]);
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

  async createBinLocation(data: Partial<BinLocation>, requestId?: string): Promise<BinLocation> {
    if (!checkIdempotency(requestId)) {
      const bins = getStore('bin_locations', initialBinLocations);
      return bins[0];
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
      ...data
    } as BinLocation;
    setStore('bin_locations', [...bins, newBin]);
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
    clearCache(`customers_all_${tenantId}`);
    const customers = await api.getCustomers(tenantId);
    const newCustomer = {
      id: `cust-${Date.now()}`,
      totalRevenue: 0,
      orderCount: 0,
      lastInteraction: new Date().toISOString(),
      tenantId,
      ...data
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
  async getTasks(): Promise<Task[]> {
    const cached = getCached('tasks');
    if (cached) return cached;

    try {
      const tasks: Task[] = JSON.parse(localStorage.getItem('shipstack_tasks') || '[]');
      setCached('tasks', tasks);
      return tasks;
    } catch (err) {
      return handleApiError(err, 'getTasks');
    }
  },

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    try {
      const newTask: Task = {
        ...task,
        id: `TASK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };
      const tasks = JSON.parse(localStorage.getItem('shipstack_tasks') || '[]');
      tasks.push(newTask);
      localStorage.setItem('shipstack_tasks', JSON.stringify(tasks));
      clearCache('tasks');
      return newTask;
    } catch (err) {
      return handleApiError(err, 'createTask');
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const tasks = JSON.parse(localStorage.getItem('shipstack_tasks') || '[]');
      const index = tasks.findIndex((t: Task) => t.id === id);
      if (index === -1) throw new Error('Task not found');
      
      tasks[index] = { ...tasks[index], ...updates };
      localStorage.setItem('shipstack_tasks', JSON.stringify(tasks));
      clearCache('tasks');
      return tasks[index];
    } catch (err) {
      return handleApiError(err, 'updateTask');
    }
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
  }
};

export const integrationsApi = api;
