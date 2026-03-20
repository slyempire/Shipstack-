
export type UserRole = 'ADMIN' | 'DISPATCHER' | 'FINANCE' | 'FACILITY' | 'DRIVER' | 'CLIENT' | 'WAREHOUSE';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type IndustryType = 
  | 'MEDICAL' 
  | 'PHARMA'
  | 'MANUFACTURING' 
  | 'FOOD' 
  | 'RETAIL'
  | 'CONSTRUCTION'
  | 'E-COMMERCE'
  | 'PROCESSING' 
  | 'GENERAL';

export type ModuleId = 
  | 'dispatch' 
  | 'warehouse' 
  | 'orders' 
  | 'fleet' 
  | 'finance' 
  | 'driver-portal' 
  | 'facility-portal' 
  | 'client-portal'
  | 'analytics'
  | 'integrations';

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  icon: string;
  category: 'CORE' | 'ADD-ON' | 'PORTAL';
  dependencies?: ModuleId[];
}

export interface Tenant {
  id: string;
  name: string;
  subdomain?: string;
  logo?: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  industry: IndustryType;
  settings: {
    currency: string;
    timezone: string;
    primaryColor?: string;
    allowSelfRegistration?: boolean;
    onboardingCompleted?: boolean;
  };
  enabledModules: ModuleId[]; 
  securitySettings: {
    auditLogging: boolean;
    twoFactorAuth: boolean;
    requireNTSAVerification: boolean;
  };
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
}

// --- Geography & Telemetry ---
export type LatLngTuple = [number, number];

export interface TelemetryPoint {
  tripId: string;
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

// --- Integration Base Types ---
export type ConnectorProvider = 'SAP' | 'ORACLE' | 'ODOO' | 'SAGE' | 'DYNAMICS' | 'CUSTOM';
export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';

export interface ERPConnector {
  id: string;
  provider: ConnectorProvider;
  name: string;
  status: IntegrationStatus;
  lastSync?: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  config: {
    endpoint: string;
    authType: 'OAUTH2' | 'API_KEY' | 'BASIC';
    clientId?: string;
    tenantId?: string;
    apiVersion?: string;
  };
}

// --- Custom API Credentials ---
export interface APIKey {
  id: string;
  name: string;
  key: string;
  secret?: string; // Only returned on creation
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  scopes: string[];
  description?: string;
}

// --- Webhooks ---
export type WebhookEvent = 
  | 'delivery_note.created' 
  | 'trip.started' 
  | 'trip.delivered' 
  | 'pod.available' 
  | 'exception.raised';

export interface WebhookSubscription {
  id: string;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
  secret: string;
  lastDeliveryStatus?: 'SUCCESS' | 'FAILURE';
  lastDeliveryAt?: string;
}

// --- Spreadsheet Imports ---
export interface ImportBatch {
  id: string;
  filename: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  totalRows: number;
  successCount: number;
  errorCount: number;
  createdBy: string;
  timestamp: string;
  errorLogUrl?: string;
}

export interface ImportPreviewRow {
  index: number;
  data: Record<string, any>;
  errors: Record<string, string>;
  isValid: boolean;
}

// --- Logs & Health ---
export interface IntegrationLog {
  id: string;
  timestamp: string;
  source: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  payload?: any;
  response?: any;
  correlationId: string;
}

export interface HealthMetrics {
  ingestSuccessRate: number; // Percentage
  webhookDeliveryRate: number;
  activeConnectors: number;
  totalErrors24h: number;
}

// --- Analytics & Operations ---
export interface OperationalMetrics {
  dispatchTimeAvg: number;
  completionRate: number;
  exceptionRate: number;
  telemetryLag: number;
}

export interface ImportLog {
  id: string;
  filename: string;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  recordsProcessed: number;
  successCount: number;
  errorCount: number;
  timestamp: string;
  type: 'STOCK' | 'ORDER' | 'DRIVER' | 'VEHICLE';
  errors?: Array<{ row: number; message: string }>;
}

// --- Governance & Documents ---
export enum DocumentType {
  MANIFEST = 'MANIFEST',
  LOADING_AUTHORITY = 'LOADING_AUTHORITY',
  DELIVERY_NOTE = 'DELIVERY_NOTE',
  POD = 'POD'
}

export enum DocumentStatus {
  ISSUED = 'ISSUED',
  SIGNED = 'SIGNED',
  VOID = 'VOID'
}

export interface LogisticsDocument {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  issuedAt: string;
  verificationCode: string;
  signedBy?: string;
}

// --- Exceptions ---
export enum ExceptionType {
  LATE = 'LATE',
  DAMAGED = 'DAMAGED',
  SHORTAGE = 'SHORTAGE'
}

export enum ExceptionStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

// --- Core Models ---
export interface DeliveryItem {
  name: string;
  qty: number;
  unit: string;
  sku?: string;
  batchNumber?: string;
  expiryDate?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'm' | 'in';
  };
  isHazardous?: boolean;
  hazardClass?: string;
  exceptionType?: 'DAMAGED' | 'MISSING' | 'WRONG_ITEM' | 'EXPIRED' | 'OTHER';
  exceptionStatus?: 'PENDING' | 'RESOLVED' | 'REJECTED';
  exceptionNotes?: string;
}

export interface Zone {
  id: string;
  name: string;
  description?: string;
  color?: string; // For map visualization
  boundary?: {
    type: 'Polygon';
    coordinates: LatLngTuple[][];
  };
}

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

export interface UserPreferences {
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  notifications: { email: boolean; push: boolean; sms: boolean };
  highContrast: boolean;
  autoSync: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  company?: string;
  tenantId?: string;
  facilityId?: string;
  isOnboarded?: boolean;
  onboardingStep?: number;
  preferences?: UserPreferences;
  phone?: string;
  idNumber?: string; // Kenyan National ID
  kraPin?: string; // KRA PIN
  licenseNumber?: string;
  onDuty?: boolean;
  transporterId?: string;
  password?: string;
  enabledModules?: ModuleId[]; // User-specific module overrides
  // Due Diligence
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verificationNotes?: string;
  documents?: Array<{ type: string; url: string; expiry?: string }>;
}

export interface Facility {
  id: string;
  name: string;
  type: 'WAREHOUSE' | 'DISTRIBUTION_CENTER' | 'PHARMACY' | 'HOSPITAL';
  lat: number;
  lng: number;
  address?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  type: VehicleType;
  capacityKg: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  ownerId?: string;
  // Kenyan Security & Traceability Data
  logbookNumber?: string;
  chassisNumber?: string;
  engineNumber?: string;
  ntsaInspectionExpiry?: string;
  speedGovernorId?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;
  trackerId?: string;
  ownerPin?: string;
  yearOfManufacture?: number;
  color?: string;
  // Due Diligence & Compliance
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  complianceScore?: number; // 0-100
}

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

export enum LogisticsType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

// --- Safety & Compliance ---
export type SafetyEventType = 'HARSH_BRAKING' | 'HARSH_ACCELERATION' | 'OVERSPEEDING' | 'FATIGUE_ALERT' | 'SOS' | 'GEOFENCE_VIOLATION';

export interface SafetyEvent {
  id: string;
  tripId?: string;
  driverId: string;
  type: SafetyEventType;
  timestamp: string;
  lat: number;
  lng: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: any;
}

export interface DeliveryNote {
  id: string;
  externalId: string;
  type: LogisticsType;
  clientName: string;
  address: string;
  originName?: string;
  originAddress?: string;
  zoneId?: string;
  items: DeliveryItem[];
  weightKg?: number;
  status: DNStatus;
  priority: Priority;
  industry?: IndustryType;
  createdAt: string;
  plannedDeliveryDate?: string;
  plannedPickupTime?: string;
  // Industry Specifics
  tempRequirement?: { min: number; max: number; current?: number }; // Medical/Food
  isPerishable?: boolean;
  expiryDate?: string;
  batchNumber?: string;
  // African Context
  mpesaTillNumber?: string;
  bodaFriendly?: boolean;
  phone?: string;
  driverId?: string;
  vehicleId?: string;
  facilityId?: string;
  rate?: number;
  notes?: string;
  exceptionReason?: string;
  exceptionType?: ExceptionType;
  exceptionStatus?: ExceptionStatus;
  podImageUrl?: string;
  signatureUrl?: string;
  lastLat?: number;
  lastLng?: number;
  lat?: number;
  lng?: number;
  odometerStart?: number;
  odometerEnd?: number;
  lastTelemetryAt?: string;
  routeGeometry?: {
    coordinates: LatLngTuple[];
  };
  logs: Array<{
    id: string;
    action: string;
    notes: string;
    user: string;
    timestamp: string;
  }>;
  documents: LogisticsDocument[];
  isDeviated?: boolean;
  paymentStatus?: 'UNPAID' | 'PAID' | 'PENDING';
  invoiceUrl?: string;
  // Safety Metrics
  safetyScore?: number;
  fatigueLevel?: number;
  driveTimeTotal?: number;
}

export interface Trip {
  id: string;
  externalId: string;
  routeTitle?: string;
  dnIds: string[];
  driverId: string;
  vehicleId: string;
  startTime?: string;
  endTime?: string;
  odometerStart?: number;
  odometerEnd?: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'RECONCILED';
  priority: Priority;
  codCollected?: number;
  returnedItemsCount?: number;
  allowanceAmount?: number;
  allowanceStatus?: 'PENDING' | 'DISBURSED' | 'FAILED';
  routeRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  routeGeometry?: {
    coordinates: LatLngTuple[];
  };
}

// --- Driver Portal Specifics ---
export interface VehicleInspection {
  id: string;
  driverId: string;
  vehicleId: string;
  timestamp: string;
  items: {
    tires: 'PASS' | 'FAIL';
    brakes: 'PASS' | 'FAIL';
    fluids: 'PASS' | 'FAIL';
    lights: 'PASS' | 'FAIL';
  };
  photos?: Record<string, string>; // item key -> base64/url
  notes?: string;
  status: 'PASS' | 'FAIL';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ASSIGNMENT' | 'URGENT' | 'INSPECTION_FAILURE' | 'SYSTEM';
  isRead: boolean;
  timestamp: string;
  link?: string;
}

// --- Fleet Maintenance ---
export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  type: 'ROUTINE' | 'REPAIR' | 'INSPECTION' | 'EMERGENCY';
  description: string;
  cost: number;
  date: string;
  odometerReading: number;
  performedBy: string;
  nextServiceDate?: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
}

// --- Order Management ---
export interface Order {
  id: string;
  externalId: string;
  customerId: string;
  customerName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
  items: DeliveryItem[];
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus: 'UNPAID' | 'PAID' | 'PARTIAL';
  notes?: string;
  fraudScore?: number; // 0-100
}

// --- Reports & BI ---
export interface AnalyticsReport {
  id: string;
  title: string;
  type: 'PERFORMANCE' | 'FINANCIAL' | 'OPERATIONAL' | 'COMPLIANCE';
  data: any;
  generatedAt: string;
  period: { start: string; end: string };
}

export interface PermissionRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  moduleId: ModuleId;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  adminNotes?: string;
}

// --- Warehouse Management ---
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  qty: number;
  unit: string;
  minThreshold: number;
  warehouseId: string;
  binLocation?: string;
  batchNumber?: string;
  expiryDate?: string;
  tempRequirement?: { min: number; max: number };
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
}

export interface WarehouseMovement {
  id: string;
  itemId: string;
  type: 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT' | 'TRANSFER';
  qty: number;
  fromLocation?: string;
  toLocation?: string;
  referenceId?: string; // Order ID or DN ID
  user: string;
  timestamp: string;
  notes?: string;
}

export interface BinLocation {
  id: string;
  warehouseId: string;
  zone: string;
  aisle: string;
  shelf: string;
  bin: string;
  capacity: number;
  currentFill: number;
  isOccupied: boolean;
  type: 'PICKING' | 'BULK' | 'BUFFER' | 'COLD_STORAGE' | 'HAZMAT';
  items?: string[];
}
