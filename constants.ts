import { ModuleDefinition, ModuleId, UserRole, Permission, SystemRole } from './types';
import { CORE_MODULES, MODULE_CATEGORIES } from './constants/modules';

export const ROLE_MODULES: Record<UserRole, ModuleId[]> = {
  'super_admin': ['dispatch', 'warehouse', 'orders', 'fleet', 'finance', 'driver-portal', 'facility-portal', 'client-portal', 'analytics', 'integrations'],
  'tenant_admin': ['dispatch', 'warehouse', 'orders', 'fleet', 'finance', 'driver-portal', 'facility-portal', 'client-portal', 'analytics', 'integrations'],
  'operations_manager': ['dispatch', 'warehouse', 'orders', 'fleet', 'analytics'],
  'dispatcher': ['dispatch', 'fleet', 'orders', 'analytics'],
  'finance_manager': ['finance', 'orders', 'analytics'],
  'fleet_manager': ['fleet', 'analytics'],
  'recruiter': ['analytics'],
  'analyst': ['analytics', 'integrations'],
  'driver': ['driver-portal'],
  'client': ['client-portal', 'orders'],
  'facility_operator': ['facility-portal', 'warehouse', 'orders'],
  'marketplace_publisher': [],
  'support_agent': ['dispatch', 'warehouse', 'orders', 'fleet', 'analytics'],
  // Legacy
  'ADMIN': ['dispatch', 'warehouse', 'orders', 'fleet', 'finance', 'driver-portal', 'facility-portal', 'client-portal', 'analytics', 'integrations'],
  'DISPATCHER': ['dispatch', 'fleet', 'orders', 'analytics'],
  'FINANCE': ['finance', 'orders', 'analytics'],
  'FACILITY': ['facility-portal', 'warehouse', 'orders'],
  'DRIVER': ['driver-portal'],
  'CLIENT': ['client-portal', 'orders'],
  'WAREHOUSE': ['warehouse', 'orders']
};

export const AVAILABLE_MODULES: ModuleDefinition[] = CORE_MODULES;

export const INDUSTRY_TEMPLATES: Record<string, { modules: ModuleId[], description: string }> = {
  'MEDICAL': {
    modules: ['dispatch', 'warehouse', 'fleet', 'driver-portal', 'facility-portal', 'analytics'],
    description: 'Optimized for temperature-controlled logistics and strict compliance tracking.'
  },
  'PHARMA': {
    modules: ['dispatch', 'warehouse', 'fleet', 'driver-portal', 'analytics', 'integrations'],
    description: 'Focused on batch/lot tracking, expiry management, and GxP compliance.'
  },
  'MANUFACTURING': {
    modules: ['dispatch', 'warehouse', 'orders', 'finance', 'integrations', 'analytics'],
    description: 'Focus on raw material tracking, production orders, and ERP synchronization.'
  },
  'FOOD': {
    modules: ['dispatch', 'warehouse', 'orders', 'driver-portal', 'client-portal', 'finance'],
    description: 'Streamlined for high-volume distribution and direct-to-customer tracking.'
  },
  'RETAIL': {
    modules: ['dispatch', 'warehouse', 'orders', 'finance', 'client-portal', 'analytics'],
    description: 'Optimized for store replenishment, inventory visibility, and sales order management.'
  },
  'CONSTRUCTION': {
    modules: ['dispatch', 'fleet', 'facility-portal', 'analytics', 'integrations'],
    description: 'Focus on heavy asset management, site delivery tracking, and fuel monitoring.'
  },
  'E-COMMERCE': {
    modules: ['dispatch', 'orders', 'finance', 'driver-portal', 'client-portal', 'analytics'],
    description: 'Designed for last-mile delivery, M-Pesa COD, and real-time customer tracking.'
  },
  'PROCESSING': {
    modules: ['dispatch', 'warehouse', 'fleet', 'facility-portal', 'analytics', 'integrations'],
    description: 'Designed for multi-facility operations and heavy asset management.'
  },
  'HEALTHCARE': {
    modules: ['dispatch', 'warehouse', 'fleet', 'driver-portal', 'facility-portal', 'analytics'],
    description: 'Optimized for temperature-controlled logistics and strict compliance tracking.'
  },
  'GENERAL': {
    modules: ['dispatch', 'fleet', 'driver-portal', 'analytics'],
    description: 'A balanced set of core features for standard logistics operations.'
  }
};

export const PLAN_MODULES: Record<'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE', ModuleId[]> = {
  'STARTER': ['dispatch', 'warehouse'],
  'GROWTH': ['dispatch', 'warehouse', 'orders', 'driver-portal', 'client-portal'],
  'SCALE': ['dispatch', 'warehouse', 'orders', 'driver-portal', 'client-portal', 'facility-portal', 'fleet', 'finance', 'analytics', 'integrations'],
  'ENTERPRISE': ['dispatch', 'warehouse', 'orders', 'driver-portal', 'client-portal', 'facility-portal', 'fleet', 'finance', 'analytics', 'integrations']
};
