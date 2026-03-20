
export type UserRole = 'ADMIN' | 'DISPATCHER' | 'FINANCE' | 'FACILITY' | 'DRIVER' | 'CLIENT';

export interface Tenant {
  id: string;
  name: string;
  subdomain?: string;
  logo?: string;
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  settings: {
    currency: string;
    timezone: string;
    primaryColor?: string;
    allowSelfRegistration?: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  company?: string;
  tenantId?: string;
  isOnboarded?: boolean;
}

export enum DNStatus {
  RECEIVED = 'RECEIVED',
  DISPATCHED = 'DISPATCHED',
  LOADED = 'LOADED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  INVOICED = 'INVOICED',
  EXCEPTION = 'EXCEPTION'
}

export interface DeliveryNote {
  id: string;
  externalId: string;
  clientName: string;
  address: string;
  items: Array<{ name: string; qty: number; unit: string }>;
  status: DNStatus;
  createdAt: string;
  plannedDeliveryDate?: string;
  driverId?: string;
  vehicleId?: string;
  facilityId?: string;
  rate?: number;
  notes?: string;
  exceptionReason?: string;
  podImageUrl?: string;
  signatureUrl?: string;
  lastLat?: number;
  lastLng?: number;
  odometerStart?: number;
  odometerEnd?: number;
}

export interface Trip {
  id: string;
  dnIds: string[];
  driverId: string;
  vehicleId: string;
  startTime?: string;
  endTime?: string;
  odometerStart?: number;
  odometerEnd?: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
}
