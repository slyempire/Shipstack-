import { 
  DeliveryNote, 
  DNStatus, 
  User, 
  Facility, 
  Vehicle, 
  VehicleType,
  Trip, 
  OperationalMetrics, 
  ImportLog, 
  DocumentType, 
  DocumentStatus,
  ERPConnector,
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
  Order,
  AnalyticsReport,
  InventoryItem,
  WarehouseMovement,
  BinLocation,
  Tenant,
  PermissionRequest,
  ModuleId,
  TelemetryPoint,
  SafetyEventType
} from './types';
import { telemetryService } from './services/socket';
import { auth, db, isFirebaseConfigured, signInWithPopup, googleProvider } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit as firestoreLimit,
  startAfter,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firebaseErrors';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { sanitize, sanitizeObject, encryptData, decryptData } from './utils/security';
import { FrappeService } from './services/frappe';

const useFrappe = !!import.meta.env.VITE_FRAPPE_BASE_URL;

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
  setStore('audit_logs', [log, ...logs]);
  
  if (useFrappe) {
    try {
      await FrappeService.callMethod('shipstack.api.log_audit', log);
    } catch (err) {
      console.warn('Frappe Audit Log failed', err);
    }
  }
};

const getStore = <T>(key: string, initial: T): T => {
  try {
    const data = localStorage.getItem(`shipstack_int_${key}`);
    if (!data) return initial;
    
    // Attempt to decrypt
    const decrypted = decryptData(data);
    return decrypted !== null ? decrypted : initial;
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
  { id: 'u-1', name: 'Admin User', email: 'admin@shipstack.com', role: 'ADMIN', company: 'Shipstack HQ', password: 'password', verificationStatus: 'VERIFIED' },
  { id: 'd-1', name: 'Pilot John', email: 'pilot@shipstack.com', role: 'DRIVER', company: 'Alpha Transporters', idNumber: '12345678', kraPin: 'A001234567Z', licenseNumber: 'DL-99221', onDuty: true, password: 'password', verificationStatus: 'VERIFIED' },
  { id: 'd-2', name: 'Pilot Sarah', email: 'sarah@shipstack.com', role: 'DRIVER', company: 'Beta Logistics', idNumber: '87654321', kraPin: 'B008765432X', licenseNumber: 'DL-88112', onDuty: false, password: 'password', verificationStatus: 'PENDING' },
  { id: 'd-3', name: 'Pilot Mike', email: 'mike@shipstack.com', role: 'DRIVER', company: 'Gamma Express', idNumber: '11223344', kraPin: 'C001122334Y', licenseNumber: 'DL-77334', onDuty: true, password: 'password', verificationStatus: 'VERIFIED' },
  { id: 'f-1', name: 'Hub Manager', email: 'hub@shipstack.com', role: 'FACILITY', company: 'MEDS Central Hub', password: 'password', verificationStatus: 'VERIFIED' },
  { id: 'w-1', name: 'Warehouse Lead', email: 'warehouse@shipstack.com', role: 'WAREHOUSE', company: 'MEDS Warehouse', password: 'password', verificationStatus: 'VERIFIED' },
  { id: 'fin-1', name: 'Finance Lead', email: 'finance@shipstack.com', role: 'FINANCE', company: 'Shipstack HQ', password: 'password', verificationStatus: 'VERIFIED' }
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
    fraudScore: 2
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
    fraudScore: 8
  }
];

const initialMaintenanceLogs: MaintenanceLog[] = [
  {
    id: 'maint-1',
    vehicleId: 'v-1',
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
      { name: 'Fresh Milk 500ml', qty: 100, unit: 'unit', sku: 'FOOD-MLK-001', dimensions: { length: 20, width: 15, height: 10, unit: 'cm' } },
      { name: 'Yogurt 250ml', qty: 50, unit: 'unit', sku: 'FOOD-YGT-002', dimensions: { length: 30, width: 20, height: 15, unit: 'cm' } }
    ],
    weightKg: 150,
    isPerishable: true,
    tempRequirement: { min: 2, max: 6, current: 4.2 },
    lat: -1.265, lng: 36.800, 
    lastLat: -1.2863, lastLng: 36.8172, 
    notes: 'Cold chain mandatory. Deliver to loading bay 4.',
    logs: [], documents: [] 
  },
  { 
    id: 'dn-2', externalId: 'FD-9002', type: LogisticsType.OUTBOUND, clientName: 'Carrefour Junction', address: 'Ngong Rd, Nairobi', 
    zoneId: 'z-4',
    status: DNStatus.IN_TRANSIT, priority: 'MEDIUM', industry: 'FOOD', createdAt: new Date().toISOString(), items: [
      { name: 'Frozen Fish Fillet', qty: 30, unit: 'kg', sku: 'FOOD-FSH-003' }
    ],
    weightKg: 300,
    isPerishable: true,
    tempRequirement: { min: -18, max: -12, current: -15.5 },
    lat: -1.298, lng: 36.762,
    lastLat: -1.286, lastLng: 36.817,
    logs: [], documents: [],
    driverId: 'd-1', vehicleId: 'v-1'
  },
  { 
    id: 'dn-3', externalId: 'FD-9003', type: LogisticsType.OUTBOUND, clientName: 'Local Duka - Mama Njeri', address: 'Pangani, Nairobi', 
    zoneId: 'z-1',
    priority: 'LOW', industry: 'FOOD', createdAt: new Date().toISOString(), items: [
      { name: 'Maize Flour 2kg', qty: 10, unit: 'bale', sku: 'FOOD-MZE-002' }
    ],
    weightKg: 240,
    lat: -1.260, lng: 36.840,
    lastLat: -1.286, lastLng: 36.817,
    status: DNStatus.EXCEPTION,
    logs: [
      { id: 'log-late-1', action: 'EXCEPTION: LATE', notes: 'Heavy traffic on Thika Road', user: 'System', timestamp: new Date().toISOString() }
    ],
    documents: []
  }
];

const initialVehicles: Vehicle[] = [
  { 
    id: 'v-1', plate: 'KCD 123A', type: VehicleType.LIGHT_TRUCK, capacityKg: 3000, status: 'ACTIVE', ownerId: 'Alpha Transporters',
    ntsaInspectionExpiry: '2026-12-31', insuranceExpiry: '2026-12-31', verificationStatus: 'VERIFIED', complianceScore: 98
  },
  { 
    id: 'v-2', plate: 'KDC 999B', type: VehicleType.MEDIUM_TRUCK, capacityKg: 7000, status: 'ACTIVE', ownerId: 'Beta Logistics',
    ntsaInspectionExpiry: '2023-01-01', insuranceExpiry: '2023-01-01', verificationStatus: 'REJECTED', complianceScore: 45
  },
  { 
    id: 'v-3', plate: 'KBA 555C', type: VehicleType.SMALL_VAN, capacityKg: 800, status: 'ACTIVE', ownerId: 'Alpha Transporters',
    ntsaInspectionExpiry: '2026-06-30', insuranceExpiry: '2026-06-30', verificationStatus: 'VERIFIED', complianceScore: 92
  },
  { 
    id: 'v-4', plate: 'KCC 777D', type: VehicleType.HEAVY_TRUCK, capacityKg: 28000, status: 'ACTIVE', ownerId: 'Gamma Express',
    ntsaInspectionExpiry: '2026-09-15', insuranceExpiry: '2026-09-15', verificationStatus: 'PENDING', complianceScore: 75
  },
  { 
    id: 'v-5', plate: 'KMCD 442X', type: VehicleType.BODA_BODA, capacityKg: 150, status: 'ACTIVE', ownerId: 'Boda Express',
    ntsaInspectionExpiry: '2026-05-20', insuranceExpiry: '2026-05-20', verificationStatus: 'VERIFIED', complianceScore: 88
  },
  { 
    id: 'v-6', plate: 'KTWA 112Y', type: VehicleType.TUK_TUK, capacityKg: 400, status: 'ACTIVE', ownerId: 'City TukTuks',
    ntsaInspectionExpiry: '2026-08-10', insuranceExpiry: '2026-08-10', verificationStatus: 'VERIFIED', complianceScore: 90
  },
  { 
    id: 'v-7', plate: 'KDE 332Z', type: VehicleType.LARGE_VAN, capacityKg: 2000, status: 'ACTIVE', ownerId: 'Beta Logistics',
    ntsaInspectionExpiry: '2026-11-05', insuranceExpiry: '2026-11-05', verificationStatus: 'VERIFIED', complianceScore: 95
  }
];

const initialFacilities: Facility[] = [
  { id: 'f-1', name: 'Nairobi Main Hub', type: 'WAREHOUSE', lat: -1.286389, lng: 36.817223, address: 'Industrial Area' },
  { id: 'f-2', name: 'Mombasa Port Hub', type: 'DISTRIBUTION_CENTER', lat: -4.0435, lng: 39.6682, address: 'Port Reitz' },
  { id: 'f-3', name: 'Kisumu Depot', type: 'WAREHOUSE', lat: -0.1022, lng: 34.7617, address: 'Kondele' }
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
    status: 'IN_STOCK'
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
    status: 'LOW_STOCK'
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
    status: 'LOW_STOCK'
  }
];

const initialBinLocations: BinLocation[] = [
  { id: 'bin-1', warehouseId: 'f-1', zone: 'A', aisle: '12', shelf: 'B', bin: '01', capacity: 100, currentFill: 45, isOccupied: true, type: 'PICKING', items: ['SKU-001'] },
  { id: 'bin-2', warehouseId: 'f-1', zone: 'A', aisle: '12', shelf: 'B', bin: '02', capacity: 100, currentFill: 0, isOccupied: false, type: 'BULK', items: [] }
];

export const api = {
  // --- Auth & Users ---
  async login(email: string, password?: string): Promise<{ user: User, token: string }> {
    const sanitizedEmail = sanitize(email);
    const sanitizedPassword = password;

    if (useFrappe) {
      try {
        const result = await FrappeService.callMethod<{ user: User, token: string }>('shipstack.api.login', {
          email: sanitizedEmail,
          password: sanitizedPassword
        });
        await logAudit('LOGIN_SUCCESS', { email: sanitizedEmail }, result.user.name);
        return result;
      } catch (error: any) {
        await logAudit('LOGIN_FAILURE', { email: sanitizedEmail, error: error.message });
        throw error;
      }
    }

    if (!isFirebaseConfigured) {
      const users = await api.getUsers();
      let user = users.find(u => u.email.toLowerCase() === sanitizedEmail.toLowerCase());
      
      if (!user && (sanitizedEmail.includes('shipstack.com') || sanitizedEmail === 'admin@shipstack.com')) {
        user = {
          id: `u-demo-${Date.now()}`,
          name: sanitizedEmail.split('@')[0].toUpperCase(),
          email: sanitizedEmail,
          role: sanitizedEmail.includes('admin') ? 'ADMIN' : sanitizedEmail.includes('pilot') ? 'DRIVER' : 'ADMIN',
          company: 'Shipstack Demo Corp',
          verificationStatus: 'VERIFIED'
        };
      }

      if (!user) throw new Error('User not found. Use a demo account or register.');
      if (password && user.password && user.password !== password && password !== 'password') {
        throw new Error('Invalid password');
      }
      
      return { user, token: 'mock-jwt-token' };
    }

    if (isFirebaseConfigured) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
        const firebaseUser = userCredential.user;
        
        // Fetch user profile from Firestore
        let user = await api.getUserById(firebaseUser.uid);
        
        if (!user) {
          // If user document doesn't exist, try to find by email (for legacy or pre-created users)
          user = await api.getUserByEmail(sanitizedEmail);
          
          if (user) {
            // Update user document with UID as ID
            const updatedUser = { ...user, id: firebaseUser.uid };
            await setDoc(doc(db, 'users', firebaseUser.uid), updatedUser);
            user = updatedUser;
          } else {
            // Create a new user profile if it doesn't exist at all
            user = {
              id: firebaseUser.uid,
              email: sanitizedEmail,
              name: sanitizedEmail.split('@')[0].toUpperCase(),
              role: sanitizedEmail.includes('admin') ? 'ADMIN' : 'ADMIN',
              company: 'Shipstack Demo Corp',
              verificationStatus: 'VERIFIED',
              isOnboarded: false
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), user);
          }
        }
        
        return { user, token: await firebaseUser.getIdToken() };
      } catch (error: any) {
        console.error('Firebase Auth Error:', error);
        if (error.code === 'auth/operation-not-allowed') {
          throw new Error('Email/Password login is not enabled in Firebase Console. Please enable it or use Google Login.');
        }
        throw new Error(error.message || 'Authentication failed');
      }
    }

    try {
      // Restore mock authentication logic
      const users = await api.getUsers();
      const sanitizedEmail = email.toLowerCase().trim();
      let user = users.find(u => u.email.toLowerCase() === sanitizedEmail);
      
      if (!user && (sanitizedEmail.includes('shipstack.com') || sanitizedEmail === 'admin@shipstack.com')) {
        // Auto-create demo user if missing in local store but looks like a demo email
        user = {
          id: `u-demo-${Date.now()}`,
          name: sanitizedEmail.split('@')[0].toUpperCase(),
          email: sanitizedEmail,
          role: sanitizedEmail.includes('admin') ? 'ADMIN' : sanitizedEmail.includes('pilot') ? 'DRIVER' : 'ADMIN',
          company: 'Shipstack Demo Corp',
          verificationStatus: 'VERIFIED'
        };
      }

      if (!user) throw new Error('User not found. Use a demo account or register.');
      
      // In demo mode, we'll accept 'password' or the user's stored password
      if (password && user.password && user.password !== password && password !== 'password' && password !== 'google-oauth') {
        throw new Error('Invalid password');
      }
      
      return { user, token: 'mock-jwt-token' };
    } catch (error: any) {
      console.error('Auth Error:', error);
      throw new Error(error.message || 'Authentication failed');
    }
  },

  async loginWithGoogle(): Promise<{ user: User, token: string }> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Use demo login.');
    }

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const firebaseUser = userCredential.user;
      
      // Fetch user profile from Firestore
      let user = await api.getUserById(firebaseUser.uid);
      
      if (!user) {
        // Create a new user profile if it doesn't exist
        user = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0].toUpperCase() || 'NEW USER',
          role: 'ADMIN', // Default role for new Google users
          company: 'Shipstack Demo Corp',
          verificationStatus: 'VERIFIED',
          isOnboarded: false
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), user);
      }
      
      return { user, token: await firebaseUser.getIdToken() };
    } catch (error: any) {
      console.error('Google Auth Error Details:', {
        code: error.code,
        message: error.message,
        customData: error.customData,
        stack: error.stack
      });
      
      if (error.code === 'auth/internal-error') {
        throw new Error('Firebase Internal Error. This often happens if the domain is not authorized in the Firebase Console or if there is a configuration mismatch. Please check your Firebase settings.');
      }
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Authentication window was closed before completion.');
      }
      if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Authentication request was cancelled.');
      }
      
      throw new Error(error.message || 'Google Authentication failed');
    }
  },

  async logout(): Promise<void> {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
  },

  async register(data: any): Promise<{ user: User, token: string }> {
    const sanitizedData = sanitizeObject(data);
    
    if (!isFirebaseConfigured) {
      const user: User = { 
        id: `u-${Date.now()}`, 
        ...sanitizedData, 
        isOnboarded: false, 
        onboardingStep: 1 
      };
      const users = await api.getUsers();
      setStore('users', [...users, user]);
      return { user, token: 'mock-jwt-token' };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, sanitizedData.email, sanitizedData.password);
      const firebaseUser = userCredential.user;
      
      const user: User = { 
        id: firebaseUser.uid, 
        ...sanitizedData, 
        isOnboarded: false, 
        onboardingStep: 1 
      };

      // Save to Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), user);
      
      const token = await firebaseUser.getIdToken();
      return { user, token };
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password authentication is not enabled in your Firebase Console. Please go to Authentication > Sign-in method and enable "Email/Password".');
      }
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser?.uid}`);
      }
      throw new Error(error.message || 'Registration failed');
    }
  },

  async completeOnboarding(userId: string): Promise<void> {},

  async getUsers(): Promise<User[]> {
    const cacheKey = 'users_all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (useFrappe) {
      const data = await FrappeService.getList<User>('User');
      setCached(cacheKey, data);
      return data;
    }
    if (isFirebaseConfigured) {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setCached(cacheKey, data);
        return data;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    }
    return getStore('users', initialUsers);
  },

  async getUserById(id: string): Promise<User | null> {
    const cacheKey = `user_${id}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const user = { id: docSnap.id, ...docSnap.data() } as User;
          setCached(cacheKey, user);
          return user;
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${id}`);
      }
    }

    const users = await api.getUsers();
    return users.find(u => u.id === id) || null;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const cacheKey = `user_email_${email}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (useFrappe) {
      const data = await FrappeService.getList<User>('User', { email });
      const user = data[0] || null;
      setCached(cacheKey, user);
      return user;
    }

    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', email), firestoreLimit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const user = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;
        setCached(cacheKey, user);
        return user;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    }

    const users = await api.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    return user;
  },

  async createUser(data: any): Promise<User> {
    const sanitizedData = sanitizeObject(data);
    clearCache('users');
    if (useFrappe) {
      const newUser = await FrappeService.createDoc<User>('User', sanitizedData);
      await logAudit('CREATE_USER', { id: newUser.id, email: newUser.email });
      return newUser;
    }
    const newUser = { id: data.id || `u-${Date.now()}`, ...sanitizedData };
    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'users', newUser.id), newUser);
        await logAudit('CREATE_USER', { id: newUser.id, email: newUser.email });
        return newUser;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${newUser.id}`);
      }
    }
    const users = await api.getUsers();
    setStore('users', [...users, newUser]);
    return newUser;
  },

  async updateUser(id: string, data: any): Promise<User> {
    const sanitizedData = sanitizeObject(data);
    if (useFrappe) {
      const updated = await FrappeService.updateDoc<User>('User', id, sanitizedData);
      await logAudit('UPDATE_USER', { id, data: sanitizedData });
      return updated;
    }
    if (isFirebaseConfigured) {
      try {
        // Use setDoc with merge: true instead of updateDoc to handle non-existent documents
        await setDoc(doc(db, 'users', id), sanitizedData, { merge: true });
        const updatedDoc = await getDoc(doc(db, 'users', id));
        return updatedDoc.data() as User;
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
      }
    }
    const users = await api.getUsers();
    const updated = users.map(u => u.id === id ? { ...u, ...sanitizedData } : u);
    setStore('users', updated);
    return updated.find(u => u.id === id)!;
  },

  async deleteUser(id: string): Promise<void> {
    if (useFrappe) {
      await FrappeService.deleteDoc('User', id);
      await logAudit('DELETE_USER', { id });
      return;
    }
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'users', id));
        await logAudit('DELETE_USER', { id });
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
      }
    }
    const users = await api.getUsers();
    setStore('users', users.filter(u => u.id !== id));
  },

  // --- Permission Requests ---
  async getPermissionRequests(): Promise<PermissionRequest[]> {
    const cacheKey = 'permission_requests_all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (isFirebaseConfigured) {
      try {
        const snapshot = await getDocs(collection(db, 'permission_requests'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PermissionRequest));
        setCached(cacheKey, data);
        return data;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'permission_requests');
      }
    }
    return getStore('permission_requests', []);
  },

  async createPermissionRequest(data: Partial<PermissionRequest>): Promise<PermissionRequest> {
    const sanitizedData = sanitizeObject(data);
    const newRequest: PermissionRequest = {
      id: `req-${Date.now()}`,
      userId: sanitizedData.userId || '',
      userName: sanitizedData.userName || '',
      userEmail: sanitizedData.userEmail || '',
      moduleId: (sanitizedData.moduleId as ModuleId) || 'dispatch',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      ...sanitizedData
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'permission_requests', newRequest.id), newRequest);
        return newRequest;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `permission_requests/${newRequest.id}`);
      }
    }
    const requests = await api.getPermissionRequests();
    setStore('permission_requests', [newRequest, ...requests]);
    return newRequest;
  },

  async updatePermissionRequest(id: string, data: Partial<PermissionRequest>): Promise<PermissionRequest> {
    const sanitizedData = sanitizeObject(data);
    if (isFirebaseConfigured) {
      try {
        // Use setDoc with merge: true instead of updateDoc to handle non-existent documents
        await setDoc(doc(db, 'permission_requests', id), { ...sanitizedData, updatedAt: new Date().toISOString() }, { merge: true });
        const updatedDoc = await getDoc(doc(db, 'permission_requests', id));
        return updatedDoc.data() as PermissionRequest;
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `permission_requests/${id}`);
      }
    }
    const requests = await api.getPermissionRequests();
    const updated = requests.map(r => r.id === id ? { ...r, ...sanitizedData, updatedAt: new Date().toISOString() } : r);
    setStore('permission_requests', updated);
    return updated.find(r => r.id === id)!;
  },

  // --- Logistics ---
  async getDeliveryNotes(user?: User): Promise<DeliveryNote[]> {
    const cacheKey = `dns_all_${user?.id || 'anon'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (useFrappe) {
      const data = await FrappeService.getList<DeliveryNote>('Delivery Note', {
        owner: user?.email
      });
      setCached(cacheKey, data);
      return data;
    }
    if (isFirebaseConfigured) {
      try {
        const snapshot = await getDocs(collection(db, 'delivery_notes'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryNote));
        setCached(cacheKey, data);
        return data;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'delivery_notes');
      }
    }
    return getStore('delivery_notes', initialDeliveryNotes);
  },

  async getDeliveryNotesPaged(page: number = 1, limit: number = 10, filters?: any): Promise<{ data: DeliveryNote[], total: number }> {
    const cacheKey = `dns_paged_${page}_${limit}_${JSON.stringify(filters)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let all: DeliveryNote[] = [];
    if (isFirebaseConfigured) {
      try {
        // Optimization: Use Firestore queries for filtering if possible
        let q = query(collection(db, 'delivery_notes'), orderBy('createdAt', 'desc'));
        
        if (filters?.status) q = query(q, where('status', '==', filters.status));
        if (filters?.priority) q = query(q, where('priority', '==', filters.priority));
        if (filters?.industry) q = query(q, where('industry', '==', filters.industry));
        
        const snapshot = await getDocs(q);
        all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryNote));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'delivery_notes');
      }
    } else {
      all = getStore('delivery_notes', initialDeliveryNotes);
    }
    
    // Apply client-side search (Firestore doesn't support partial string search easily)
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

  async createDeliveryNote(data: Partial<DeliveryNote>): Promise<DeliveryNote> {
    const sanitizedData = sanitizeObject(data);
    clearCache('dns');
    
    if (useFrappe) {
      const newDn = await FrappeService.createDoc<DeliveryNote>('Delivery Note', sanitizedData);
      await logAudit('CREATE_DN', { id: newDn.id, externalId: newDn.externalId });
      return newDn;
    }

    const newDn: DeliveryNote = {
      id: data.id || `dn-${Date.now()}`,
      externalId: sanitizedData.externalId || `EXT-${Math.random().toString(36).substring(7).toUpperCase()}`,
      type: sanitizedData.type || LogisticsType.OUTBOUND,
      clientName: sanitizedData.clientName || '',
      address: sanitizedData.address || '',
      items: sanitizedData.items || [],
      status: DNStatus.RECEIVED,
      priority: sanitizedData.priority || 'MEDIUM',
      industry: sanitizedData.industry || 'GENERAL',
      createdAt: new Date().toISOString(),
      logs: [{ id: Date.now().toString(), action: 'Created', notes: 'Manual creation', user: 'Admin', timestamp: new Date().toISOString() }],
      documents: [],
      ...sanitizedData
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'delivery_notes', newDn.id), newDn);
        await logAudit('CREATE_DN', { id: newDn.id, externalId: newDn.externalId });
        return newDn;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `delivery_notes/${newDn.id}`);
      }
    }

    const dns = await api.getDeliveryNotes();
    setStore('delivery_notes', [newDn, ...dns]);
    return newDn;
  },

  async updateDeliveryNote(id: string, data: Partial<DeliveryNote>): Promise<DeliveryNote> {
    const sanitizedData = sanitizeObject(data);
    
    if (useFrappe) {
      const updated = await FrappeService.updateDoc<DeliveryNote>('Delivery Note', id, sanitizedData);
      await logAudit('UPDATE_DN', { id, data: sanitizedData });
      return updated;
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
    
    if (isFirebaseConfigured) {
      try {
        // For Firebase, we'll batch upload these
        const collections = [
          { name: 'delivery_notes', data: initialDeliveryNotes },
          { name: 'vehicles', data: initialVehicles },
          { name: 'facilities', data: initialFacilities },
          { name: 'users', data: initialUsers },
          { name: 'inventory', data: initialInventory },
          { name: 'zones', data: initialZones },
          { name: 'orders', data: initialOrders }
        ];
        
        for (const col of collections) {
          for (const item of col.data) {
            await setDoc(doc(db, col.name, item.id), item);
          }
        }
      } catch (error) {
        console.error('Failed to sync sample data to Firebase', error);
      }
    }
    
    return new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing
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
    if (useFrappe) {
      await FrappeService.callMethod('shipstack.api.update_dn_status', {
        id,
        status,
        metadata,
        user
      });
      await logAudit('UPDATE_DN_STATUS', { id, status, metadata }, user);
      return;
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
    if (isFirebaseConfigured) {
      try {
        const id = `ping-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await setDoc(doc(db, 'telemetry_pings', id), {
          ...ping,
          id,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        // Silent fail for telemetry to avoid blocking UI, but log it
        console.warn('Failed to save telemetry ping to Firestore', error);
      }
    }
    
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
    
    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'safety_events', event.id), event);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `safety_events/${event.id}`);
      }
    }
    
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

  async getFacilities(): Promise<Facility[]> {
    const cacheKey = 'facilities_all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (useFrappe) {
      const data = await FrappeService.getList<Facility>('Facility');
      setCached(cacheKey, data);
      return data;
    }
    const data = getStore('facilities', initialFacilities);
    setCached(cacheKey, data);
    return data;
  },

  async createFacility(data: any): Promise<Facility> {
    const sanitizedData = sanitizeObject(data);
    clearCache('facilities');
    if (useFrappe) {
      const newF = await FrappeService.createDoc<Facility>('Facility', sanitizedData);
      await logAudit('CREATE_FACILITY', { id: newF.id, name: newF.name });
      return newF;
    }
    const current = await api.getFacilities();
    const newF = { id: `f-${Date.now()}`, ...sanitizedData };
    setStore('facilities', [...current, newF]);
    return newF;
  },

  async updateFacility(id: string, data: any): Promise<Facility> {
    const sanitizedData = sanitizeObject(data);
    clearCache('facilities');
    if (useFrappe) {
      const updated = await FrappeService.updateDoc<Facility>('Facility', id, sanitizedData);
      await logAudit('UPDATE_FACILITY', { id, data: sanitizedData });
      return updated;
    }
    const current = await api.getFacilities();
    const updated = current.map(f => f.id === id ? { ...f, ...sanitizedData } : f);
    setStore('facilities', updated);
    return updated.find(f => f.id === id)!;
  },

  async deleteFacility(id: string): Promise<void> {
    clearCache('facilities');
    if (useFrappe) {
      await FrappeService.deleteDoc('Facility', id);
      await logAudit('DELETE_FACILITY', { id });
      return;
    }
    const current = await api.getFacilities();
    setStore('facilities', current.filter(f => f.id !== id));
  },

  // --- Tenant Management ---
  async getTenant(id: string): Promise<Tenant | null> {
    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'tenants', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() as Tenant : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `tenants/${id}`);
      }
    }
    return getStore('tenant', null);
  },

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const sanitizedData = sanitizeObject(data);
    if (isFirebaseConfigured) {
      try {
        // Use setDoc with merge: true instead of updateDoc to handle non-existent documents
        await setDoc(doc(db, 'tenants', id), sanitizedData, { merge: true });
        const updatedDoc = await getDoc(doc(db, 'tenants', id));
        return updatedDoc.data() as Tenant;
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `tenants/${id}`);
      }
    }
    const current = await api.getTenant(id);
    const updated = { ...current!, ...sanitizedData };
    setStore('tenant', updated);
    return updated;
  },

  async getDrivers(): Promise<User[]> {
    const users = await api.getUsers();
    return users.filter(u => u.role === 'DRIVER');
  },

  async getVehicles(): Promise<Vehicle[]> {
    const cacheKey = 'vehicles_all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (useFrappe) {
      const data = await FrappeService.getList<Vehicle>('Vehicle');
      setCached(cacheKey, data);
      return data;
    }
    const data = getStore('vehicles', initialVehicles);
    setCached(cacheKey, data);
    return data;
  },

  async createVehicle(data: any): Promise<Vehicle> {
    const sanitizedData = sanitizeObject(data);
    clearCache('vehicles');
    if (useFrappe) {
      const newV = await FrappeService.createDoc<Vehicle>('Vehicle', sanitizedData);
      await logAudit('CREATE_VEHICLE', { id: newV.id, plate: newV.plate });
      return newV;
    }
    const current = await api.getVehicles();
    const newV = { id: `v-${Date.now()}`, ...sanitizedData };
    setStore('vehicles', [...current, newV]);
    return newV;
  },

  async updateVehicle(id: string, data: any): Promise<Vehicle> {
    const sanitizedData = sanitizeObject(data);
    clearCache('vehicles');
    if (useFrappe) {
      const updated = await FrappeService.updateDoc<Vehicle>('Vehicle', id, sanitizedData);
      await logAudit('UPDATE_VEHICLE', { id, data: sanitizedData });
      return updated;
    }
    const current = await api.getVehicles();
    const updated = current.map(v => v.id === id ? { ...v, ...sanitizedData } : v);
    setStore('vehicles', updated);
    return updated.find(v => v.id === id)!;
  },

  async deleteVehicle(id: string): Promise<void> {
    clearCache('vehicles');
    if (useFrappe) {
      await FrappeService.deleteDoc('Vehicle', id);
      await logAudit('DELETE_VEHICLE', { id });
      return;
    }
    const current = await api.getVehicles();
    setStore('vehicles', current.filter(v => v.id !== id));
  },

  async getTrips(): Promise<Trip[]> {
    const cacheKey = 'trips_all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    if (useFrappe) {
      const data = await FrappeService.getList<Trip>('Trip');
      setCached(cacheKey, data);
      return data;
    }
    const data = getStore('trips', []);
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
    if (useFrappe) {
      const newTrip = await FrappeService.callMethod<Trip>('shipstack.api.create_trip', sanitizedData);
      await logAudit('CREATE_TRIP', { id: newTrip.id, driverId: newTrip.driverId });
      return newTrip;
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
    if (useFrappe) {
      await FrappeService.callMethod('shipstack.api.delete_trip', { id });
      await logAudit('DELETE_TRIP', { id });
      return;
    }
    const trips = await api.getTrips();
    const trip = trips.find(t => t.id === id);
    if (trip) {
      // Revert DNs to RECEIVED status
      await api.batchUpdateStatus(trip.dnIds, DNStatus.RECEIVED, { driverId: null, vehicleId: null }, 'System Dispatcher');
      setStore('trips', trips.filter(t => t.id !== id));
    }
  },

  async getOperationalMetrics(): Promise<OperationalMetrics> {
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
      { id: 'il-1', filename: 'Manifest_Q1.csv', status: 'COMPLETED', recordsProcessed: 450, successCount: 442, errorCount: 8, timestamp: new Date().toISOString(), type: 'ORDER' }
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
      filename: 'frappe_stock_import.json',
      status: failed > 0 ? 'PARTIAL' : 'COMPLETED',
      recordsProcessed: data.length,
      successCount: success,
      errorCount: failed,
      timestamp: new Date().toISOString(),
      type: 'STOCK',
      errors: errors.length > 0 ? errors : undefined
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

  async generateDocument(dnId: string, type: DocumentType, user: string): Promise<void> {
    const dns = await api.getDeliveryNotes();
    const updated = dns.map(d => d.id === dnId ? { 
      ...d, 
      documents: [...(d.documents || []), { 
        id: `doc-${Date.now()}`, type, status: DocumentStatus.ISSUED, issuedAt: new Date().toISOString(), verificationCode: Math.random().toString(36).substring(2, 8).toUpperCase() 
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
        id: 'c-1', provider: 'SAP', name: 'Global ERP S/4HANA', status: 'CONNECTED', 
        environment: 'PRODUCTION', lastSync: new Date().toISOString(),
        config: { endpoint: 'https://sap-api.enterprise.com', authType: 'OAUTH2' }
      },
      { 
        id: 'c-2', provider: 'ODOO', name: 'Regional Sales Odoo', status: 'ERROR', 
        environment: 'SANDBOX', config: { endpoint: 'https://odoo-stage.net', authType: 'API_KEY' }
      }
    ]);
  },

  async testConnector(id: string): Promise<{ success: boolean; latency: number; message: string }> {
    await new Promise(r => setTimeout(r, 1500));
    return { success: Math.random() > 0.2, latency: Math.floor(Math.random() * 200 + 50), message: "Handshake successful. Resource 'DeliveryNote' accessible." };
  },

  // --- Custom API Credentials ---
  async getAPIKeys(): Promise<APIKey[]> {
    return getStore('api_keys', [
      { id: 'ak-1', name: 'ERP Principal Uplink', key: 'sk_live_51...z7q', createdAt: new Date().toISOString(), status: 'ACTIVE', scopes: ['dn.write', 'dn.read'] }
    ]);
  },

  async createAPIKey(name: string, scopes: string[] = ['dn.read'], description?: string): Promise<APIKey> {
    const keys = await api.getAPIKeys();
    const newKey: APIKey = {
      id: `ak-${Date.now()}`,
      name,
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
      { index: 1, data: { externalId: 'INV-9001', clientName: 'City Gen', address: 'Plot 1' }, errors: {}, isValid: true },
      { index: 2, data: { externalId: '', clientName: 'Bad Order', address: 'None' }, errors: { externalId: 'Reference ID is required' }, isValid: false },
      { index: 3, data: { externalId: 'INV-9003', clientName: 'Central Health', address: 'Plot 45' }, errors: {}, isValid: true }
    ];
  },

  async startImport(fileId: string): Promise<ImportBatch> {
    const batch: ImportBatch = {
      id: `batch-${Date.now()}`,
      filename: 'Manifest_Q1.csv',
      status: 'COMPLETED',
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

  async getHealthMetrics(): Promise<HealthMetrics> {
    return { ingestSuccessRate: 98.4, webhookDeliveryRate: 99.2, activeConnectors: 2, totalErrors24h: 14 };
  },

  // --- Driver Inspections & Notifications ---
  async getNotifications(userId: string): Promise<Notification[]> {
    return getStore(`notifications_${userId}`, [
      {
        id: 'n-1',
        userId,
        title: 'New Assignment',
        message: 'You have been assigned to Trip TRP-9001',
        type: 'ASSIGNMENT',
        isRead: false,
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
        userId: newInspection.driverId,
        title: 'Critical Inspection Failure',
        message: `Vehicle ${newInspection.vehicleId} failed safety check. Please contact maintenance.`,
        type: 'INSPECTION_FAILURE',
        isRead: false,
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
  async getOrders(): Promise<Order[]> {
    const cacheKey = 'orders_all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const data = getStore('orders', initialOrders);
    setCached(cacheKey, data);
    return data;
  },
  
  async createOrder(data: Partial<Order>): Promise<Order> {
    clearCache('orders');
    const orders = await api.getOrders();
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
      ...data
    } as Order;
    setStore('orders', [newOrder, ...orders]);
    return newOrder;
  },

  // --- Fleet Maintenance ---
  async getMaintenanceLogs(): Promise<MaintenanceLog[]> {
    return getStore('maintenance_logs', initialMaintenanceLogs);
  },
  
  async addMaintenanceLog(log: Partial<MaintenanceLog>): Promise<MaintenanceLog> {
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
    return newLog;
  },

  // --- Reports & Analytics ---
  async getAnalyticsReports(): Promise<AnalyticsReport[]> {
    return getStore('analytics_reports', []);
  },

  // --- Warehouse Management ---
  async getInventory(): Promise<InventoryItem[]> {
    const cacheKey = 'inventory_all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const data = getStore('inventory', initialInventory);
    setCached(cacheKey, data);
    return data;
  },

  async addInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
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

  async updateInventory(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    clearCache('inventory');
    const items = await api.getInventory();
    const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
    setStore('inventory', updated);
    return updated.find(i => i.id === id)!;
  },

  async getWarehouseMovements(): Promise<WarehouseMovement[]> {
    return getStore('warehouse_movements', []);
  },

  async recordMovement(movement: Omit<WarehouseMovement, 'id' | 'timestamp'>): Promise<WarehouseMovement> {
    const movements = await api.getWarehouseMovements();
    const newMovement: WarehouseMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...movement
    };
    setStore('warehouse_movements', [newMovement, ...movements]);
    
    // Update inventory qty
    const items = await api.getInventory();
    const item = items.find(i => i.id === movement.itemId);
    if (item) {
      const newQty = movement.type === 'INBOUND' ? item.qty + movement.qty : item.qty - movement.qty;
      await api.updateInventory(item.id, { qty: newQty });
    }
    
    return newMovement;
  },

  async getBinLocations(warehouseId: string): Promise<BinLocation[]> {
    const all = getStore('bin_locations', initialBinLocations);
    return all.filter(b => b.warehouseId === warehouseId);
  },

  async createBinLocation(data: Partial<BinLocation>): Promise<BinLocation> {
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

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'notifications', newNotification.id), newNotification);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `notifications/${newNotification.id}`);
      }
    } else {
      const notifications = getStore('driver_notifications', []);
      setStore('driver_notifications', [newNotification, ...notifications]);
    }

    return newNotification;
  },

  async getDriverNotifications(userId: string): Promise<Notification[]> {
    if (isFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Notification);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
        return [];
      }
    } else {
      const all = getStore('driver_notifications', []);
      return all.filter(n => n.userId === userId);
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
  }
};

export const integrationsApi = api;
