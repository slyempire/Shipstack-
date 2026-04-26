
// --- AUTH & RBAC ---
export type SystemRole = 
  | 'super_admin' 
  | 'tenant_admin' 
  | 'operations_manager' 
  | 'dispatcher' 
  | 'finance_manager' 
  | 'fleet_manager' 
  | 'recruiter' 
  | 'analyst' 
  | 'driver' 
  | 'client' 
  | 'facility_operator' 
  | 'marketplace_publisher' 
  | 'support_agent';

export type UserRole = SystemRole | 'ADMIN' | 'DISPATCHER' | 'FINANCE' | 'FACILITY' | 'DRIVER' | 'CLIENT' | 'WAREHOUSE';

export type Permission = 
  | 'dashboard:view' | 'dashboard:export'
  | 'trips:view' | 'trips:create' | 'trips:edit' | 'trips:delete' | 'trips:assign'
  | 'dispatch:view' | 'dispatch:manage' | 'dispatch:assign'
  | 'fleet:view' | 'fleet:manage' | 'fleet:all'
  | 'maintenance:view' | 'maintenance:manage'
  | 'finance:view' | 'finance:manage' 
  | 'invoicing:view' | 'invoicing:all' | 'billing:view' | 'billing:all'
  | 'rates:view' | 'rates:all' | 'subscription:view' | 'subscription:manage'
  | 'users:view' | 'users:invite' | 'users:edit' | 'users:delete' | 'users:manage'
  | 'roles:view' | 'roles:create' | 'roles:edit'
  | 'warehouse:view' | 'warehouse:manage' | 'warehouse:all'
  | 'orders:view' | 'orders:create' | 'orders:edit' | 'orders:delete'
  | 'analytics:view' | 'analytics:export' | 'analytics:all'
  | 'data_ingress:view' | 'data_ingress:manage'
  | 'audit:view' | 'audit:export' | 'security:view'
  | 'marketplace:view' | 'marketplace:install' | 'marketplace:uninstall' 
  | 'marketplace:publish' | 'marketplace:review'
  | 'crm:view' | 'crm:manage'
  | 'exceptions:view' | 'exceptions:resolve'
  | 'recruitment:all' | 'tracking:view';

export interface RoleDefinition {
  role: SystemRole;
  label: string;
  description: string;
  permissions: Permission[];
  inherits?: SystemRole[];
  isCustom?: boolean;
  tenantId?: string;
  allowedRoles?: UserRole[];
}

export interface PermissionRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  moduleId?: ModuleId;
  requestedPermission: Permission;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
  createdAt?: string;
  reason?: string;
  processedBy?: string;
}

// --- TENANT & SUBSCRIPTION ---
export type IndustryType = 
  | 'MEDICAL' | 'PHARMA' | 'MANUFACTURING' | 'FOOD' | 'RETAIL' | 'CONSTRUCTION' 
  | 'E-COMMERCE' | 'PROCESSING' | 'AGRICULTURE' | 'HEALTHCARE' | 'GENERAL';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  logo?: string;
  plan: 'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE';
  tier?: 'Free' | 'Starter' | 'Professional' | 'Enterprise';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'active' | 'trial';
  industry: IndustryType;
  settings: {
    currency: string;
    timezone: string;
    primaryColor: string;
    dispatchPhone?: string;
    allowSelfRegistration?: boolean;
    onboardingCompleted?: boolean;
    businessLogic?: {
      autoDispatch?: boolean;
      podRequirements?: ('SIGNATURE' | 'PHOTO' | 'OTP')[];
      lowStockThreshold?: number;
      defaultTaxRate?: number;
    };
  };
  enabledModules: ModuleId[]; 
  securitySettings: {
    auditLogging: boolean;
    twoFactorAuth: boolean;
    requireNTSAVerification: boolean;
  };
  createdAt: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: 'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE';
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
}

// --- MODULES ---
export type ModuleId = 
  | 'dashboard' | 'dispatch' | 'warehouse' | 'orders' | 'fleet' | 'finance' 
  | 'driver-portal' | 'facility-portal' | 'client-portal' | 'analytics' | 'integrations'
  | 'core-dashboard' | 'core-dispatch' | 'core-fleet' | 'core-trips' | 'core-invoicing'
  | 'vertical-healthcare' | 'vertical-agriculture' | 'vertical-ecommerce' | 'vertical-retail' 
  | 'vertical-coldchain' | 'vertical-construction' | 'addon-cortex-ai' | 'addon-advanced-analytics'
  | 'addon-route-optimizer' | 'addon-customer-portal' | 'addon-driver-app-pro' 
  | 'integration-frappe-erp' | 'integration-quickbooks' | 'integration-shopify' 
  | 'integration-mpesa' | 'integration-stripe' | 'compliance-gdpr-toolkit' | 'compliance-iso-28000';

export type ModuleStatus = 'active' | 'inactive' | 'trial' | 'suspended' | 'deprecated' | 'pending_review' | 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
export type ModuleCategory = 'core' | 'industry_vertical' | 'integration' | 'addon' | 'ai_feature' | 'compliance' | 'CORE' | 'ADD-ON' | 'PORTAL';
export type ModuleTier = 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: ModuleCategory;
  tier: ModuleTier;
  version: string;
  versions: Array<{ version: string; releaseDate: string; changelog: string }>;
  icon: any;
  tags: string[];
  publisher: { id: string; name: string; verified: boolean; logo?: string };
  pricing: { model: string; amount?: number; currency?: string; billingPeriod?: string; trialDays?: number };
  dependencies: any[]; 
  conflicts: string[];
  permissionScope: { requiredPermissions: Permission[]; grantedPermissions: Permission[] };
  routes: string[];
  isCore?: boolean;
  isFeatured?: boolean;
  status: ModuleStatus;
  createdAt: string;
  updatedAt: string;
  hooks: any;
  rating?: number;
  installCount?: number;
  screenshots?: string[];
}

export interface TenantModule {
  id: string;
  tenantId: string;
  moduleId: ModuleId;
  status: ModuleStatus;
  installedVersion: string;
  config?: Record<string, unknown>;
  installedAt: string;
  installedBy?: string;
  lastUpdatedAt?: string;
}

// --- LOGISTICS & OPERATIONS ---
export enum DNStatus {
  RECEIVED = 'RECEIVED',
  VALIDATED = 'VALIDATED',
  READY_FOR_DISPATCH = 'READY_FOR_DISPATCH',
  DISPATCHED = 'DISPATCHED',
  LOADED = 'LOADED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  INVOICED = 'INVOICED',
  EXCEPTION = 'EXCEPTION'
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export enum LogisticsType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export enum ExceptionType {
  DAMAGE = 'DAMAGE',
  SHORTAGE = 'SHORTAGE',
  REFUSAL = 'REFUSAL',
  WRONG_ITEM = 'WRONG_ITEM',
  TECHNICAL = 'TECHNICAL',
  LATE = 'LATE',
  WEATHER = 'WEATHER'
}

export enum ExceptionStatus {
  REPORTED = 'REPORTED',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED'
}

export interface DeliveryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  sku?: string;
  batchNumber?: string;
  expiryDate?: string;
  isHazardous?: boolean;
  hazardClass?: string;
  dimensions?: { l?: number; w?: number; h?: number; weight_kg?: number; length?: number; width?: number; height?: number; unit?: string };
  exceptionType?: ExceptionType;
  exceptionStatus?: ExceptionStatus;
  exceptionNotes?: string;
}

export interface DeliveryNote {
  id: string;
  externalId: string;
  tenantId?: string;
  type: LogisticsType;
  clientName: string;
  address: string;
  items: DeliveryItem[];
  status: DNStatus;
  priority: Priority;
  createdAt: string;
  lat?: number;
  lng?: number;
  driverId?: string;
  vehicleId?: string;
  podImageUrl?: string;
  signatureUrl?: string;
  industry?: IndustryType;
  // Missing properties from lint
  isDeviated?: boolean;
  lastLat?: number;
  lastLng?: number;
  routeGeometry?: any;
  logs?: Array<{ id?: string; timestamp: string; action: string; user?: string; notes?: string }>;
  zoneId?: string;
  documents?: any[];
  rate?: number;
  weightKg?: number;
  originName?: string;
  originAddress?: string;
  notes?: string;
  isPerishable?: boolean;
  tempRequirement?: string | { min: number; max: number; current?: number };
  paymentStatus?: 'PENDING' | 'COLLECTED' | 'REMITTED' | 'PAID' | 'UNPAID';
  facilityId?: string;
  plannedPickupTime?: string;
  plannedDeliveryDate?: string;
  lastTelemetryAt?: string;
  exceptionType?: ExceptionType;
  exceptionStatus?: ExceptionStatus;
  exceptionReason?: string;
  phone?: string;
  odometerStart?: number;
  invoiceUrl?: string;
  safetyScore?: number;
}

export interface Trip {
  id: string;
  externalId: string;
  routeTitle?: string;
  dnIds: string[];
  driverId: string;
  vehicleId: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'RECONCILED';
  priority: Priority;
  startTime?: string;
  endTime?: string;
  // Missing properties
  commissionStatus?: 'PENDING' | 'APPROVED' | 'PAID' | 'DISBURSED';
  commissionAmount?: number;
  codCollected?: number;
  allowanceAmount?: number;
  allowanceStatus?: 'PENDING' | 'APPROVED' | 'PAID' | 'DISBURSED';
  routeRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  routeGeometry?: any;
}

export interface Order {
  id: string;
  externalId: string;
  customerName: string;
  customerId?: string;
  totalAmount: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
  createdAt: string;
  updatedAt?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'VOID' | 'UNPAID';
  fraudScore?: number;
  items?: any[];
  tenantId?: string;
  currency?: string;
}

export interface WarehouseMovement {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'INBOUND' | 'OUTBOUND';
  items: Array<{ sku: string; qty: number }>;
  timestamp: string;
  tenantId?: string;
  itemId?: string;
  qty?: number;
  fromLocation?: string;
  toLocation?: string;
  notes?: string;
}

export interface BinLocation {
  id: string;
  code: string;
  zone?: string;
  capacity?: number;
  warehouseId?: string;
  aisle?: string;
  shelf?: string;
  bin?: string;
  type?: string;
  items?: string[];
  currentFill?: number;
  isOccupied?: boolean;
  tenantId?: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  qty: number;
  warehouseId: string;
  tenantId?: string;
  name?: string;
  expiryDate?: string;
  batchNumber?: string;
  category?: string;
  binLocation?: string;
  unit?: string;
  minThreshold?: number;
  tempRequirement?: string | { min: number; max: number; current?: number };
  status?: string;
}

export interface Zone {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

// --- FLEET ---
export enum VehicleType {
  BODA_BODA = 'Boda Boda (Motorcycle)',
  TUK_TUK = 'Tuk Tuk (Three-wheeler)',
  SMALL_VAN = 'Small Van (Probox/AD Van)',
  LARGE_VAN = 'Large Van (Hiace/Sprinter)',
  LIGHT_TRUCK = 'Light Truck (3-5 Tons)',
  MEDIUM_TRUCK = 'Medium Truck (7-10 Tons)',
  HEAVY_TRUCK = 'Heavy Truck (Prime Mover)',
  BICYCLE = 'Bicycle'
}

export interface Vehicle {
  id: string;
  plate: string;
  type: VehicleType;
  capacityKg: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  ownerId?: string;
  tenantId?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  // Missing properties
  nextServiceDate?: string;
  nextServiceOdometer?: number;
  fuelLevel?: number;
  ntsaInspectionExpiry?: string;
  insuranceExpiry?: string;
  currentOdometer?: number;
  logbookNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  speedGovernorId?: string;
  trackerId?: string;
  insurancePolicyNumber?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  complianceScore?: number;
  color?: string;
  yearOfManufacture?: number;
  ownerPin?: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: string;
  cost: number;
  date: string;
  tenantId?: string;
  status?: string;
  odometerReading?: number;
  nextServiceDate?: string;
  nextServiceOdometer?: number;
  description?: string;
  performedBy?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  amount: number;
  cost: number;
  date: string;
  driverId?: string;
  stationName?: string;
  odometerReading?: number;
}

export interface VehicleInspection {
  id: string;
  vehicleId: string;
  driverId?: string;
  status: 'PASS' | 'FAIL';
  date: string;
  timestamp?: string;
  photos?: string[] | Record<string, string>;
  items?: any;
}

// --- USERS ---
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system' | 'LIGHT' | 'DARK';
  notifications: boolean | { email: boolean; push: boolean; sms: boolean };
  language: string;
  autoSync?: boolean;
  highContrast?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isOnboarded?: boolean;
  tenantId?: string;
  avatar?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  // Other potential props used in CRM/Driver views
  phone?: string;
  idNumber?: string;
  kraPin?: string;
  licenseNumber?: string;
  onDuty?: boolean;
  transporterId?: string;
  enabledModules?: ModuleId[];
  address?: string;
  joinedAt?: string;
  company?: string;
  onboardingStep?: number;
  password?: string;
  facilityId?: string;
  preferences?: UserPreferences;
}

export interface DriverApplication {
  id: string;
  userId?: string;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'INTERVIEWING' | 'ONBOARDING';
  appliedAt: string;
  notes?: string;
  name?: string;
  email?: string;
  phone?: string;
  idNumber?: string;
  kraPin?: string;
  licenseNumber?: string;
  requirements?: Record<string, boolean>;
  experienceYears?: number;
  vehicleType?: VehicleType;
}

// --- DATA INGRESS & INTEGRATIONS ---
export interface ImportBatch { id: string; status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; rowCount: number; filename?: string; totalRows?: number; successCount?: number; errorCount?: number; createdBy?: string; timestamp?: string; }
export interface ImportLog { 
  id: string; 
  timestamp: string; 
  severity: string; 
  message: string; 
  type?: string;
  errors?: string[];
  filename?: string; 
  status?: string; 
  recordsProcessed?: number; 
  successCount?: number; 
  errorCount?: number; 
}
export interface ImportPreviewRow { id: string; index: number; data: any; isValid: boolean; errors: any; }
export interface ERPConnector { id: string; type: string; status: 'CONNECTED' | 'DISCONNECTED'; name?: string; provider?: string; environment?: string; syncFrequency?: string; config?: any; entities?: string[]; lastSync?: string; mapping?: any; }
export interface SyncLog { id: string; connectorId: string; status: 'SUCCESS' | 'FAILURE' | 'PARTIAL' | 'FAILED'; timestamp: string; entity?: string; recordsProcessed?: number; durationMs?: number; errors?: any; }
export interface APIKey { id: string; key: string; label: string; createdAt: string; name?: string; description?: string; status?: string; scopes?: string[]; secret?: string; }
export interface WebhookSubscription { id: string; url: string; events: string[]; status: 'ACTIVE' | 'INACTIVE'; isActive?: boolean; lastDeliveryStatus?: string; lastDeliveryAt?: string; secret?: string; }
export interface IntegrationLog { id: string; source: string; message: string; timestamp: string; level?: string; correlationId?: string; }

// --- ANALYTICS ---
export interface HealthMetrics {
  ingestSuccessRate: number;
  webhookDeliveryRate: number;
  activeConnectors: number;
  totalErrors24h: number;
  isSupabaseHealthy?: boolean;
  isFrappeHealthy?: boolean;
}

export interface OperationalMetrics {
  dispatchTimeAvg: number;
  completionRate: number;
  exceptionRate: number;
  telemetryLag: number;
}

export interface AnalyticsReport {
  id: string;
  title: string;
  data: any;
  generatedAt?: string;
  period?: string;
}

export type SafetyEventType = 'HARSH_BRAKING' | 'OVERSPEEDING' | 'DEVIATION' | 'GEOFENCE_EXIT' | 'SOS';

// --- SYSTEM ---
export interface Notification {
  id: string;
  tenantId: string;
  userId?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system' | 'ASSIGNMENT' | 'URGENT' | 'INSPECTION_FAILURE';
  category: 'BILLING' | 'SECURITY' | 'MODULES' | 'OPERATIONS' | 'GENERAL';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  isRead?: boolean;
  persistent: boolean;
  expiresAt?: string;
  link?: string;
  action?: { label: string; path: string };
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  address?: string;
  tenantId?: string;
}

export interface TelemetryPoint {
  tripId: string;
  lat: number;
  lng: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  coordinates?: [number, number];
}

export type LatLngTuple = [number, number];

export interface LogisticsDocument { id: string; type: LogisticsDocumentType; status: LogisticsDocumentStatus; url: string; verificationCode?: string; issuedAt?: string; signedBy?: string; }

export enum LogisticsDocumentType {
  POD = 'POD',
  INVOICE = 'INVOICE',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  INSPECTION = 'INSPECTION',
  LOADING_AUTHORITY = 'LOADING_AUTHORITY',
  MANIFEST = 'MANIFEST'
}

export enum LogisticsDocumentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export interface Task { id: string; title: string; status: string; priority: string; userId: string; tenantId: string; completed?: boolean; dueDate?: string; description?: string };

export type RouteOptimizationResult = { id: string; optimizedOrder: string[]; savings: number; metrics?: any; confidence?: number; processingTimeMs?: number };

export interface PublisherProfile {
  id: string;
  name: string;
  logo?: string;
  verified: boolean;
}
