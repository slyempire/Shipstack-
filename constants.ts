import { ModuleDefinition, ModuleId, UserRole } from './types';
import { CORE_MODULES, MARKETPLACE_MODULES } from './constants/modules';

export const ROLE_MODULES: Record<UserRole, ModuleId[]> = {
  'super_admin':        ['dispatch', 'warehouse', 'orders', 'fleet', 'finance', 'driver-portal', 'facility-portal', 'client-portal', 'analytics', 'integrations'],
  'tenant_admin':       ['dispatch', 'warehouse', 'orders', 'fleet', 'finance', 'driver-portal', 'facility-portal', 'client-portal', 'analytics', 'integrations'],
  'operations_manager': ['dispatch', 'warehouse', 'orders', 'fleet', 'analytics'],
  'dispatcher':         ['dispatch', 'fleet', 'orders', 'analytics'],
  'finance_manager':    ['finance', 'orders', 'analytics'],
  'fleet_manager':      ['fleet', 'analytics'],
  'recruiter':          ['analytics'],
  'analyst':            ['analytics', 'integrations'],
  'driver':             ['driver-portal'],
  'client':             ['client-portal', 'orders'],
  'facility_operator':  ['facility-portal', 'warehouse', 'orders'],
  'marketplace_publisher': [],
  'support_agent':      ['dispatch', 'warehouse', 'orders', 'fleet', 'analytics'],
  // Legacy role aliases
  'ADMIN':       ['dispatch', 'warehouse', 'orders', 'fleet', 'finance', 'driver-portal', 'facility-portal', 'client-portal', 'analytics', 'integrations'],
  'DISPATCHER':  ['dispatch', 'fleet', 'orders', 'analytics'],
  'FINANCE':     ['finance', 'orders', 'analytics'],
  'FACILITY':    ['facility-portal', 'warehouse', 'orders'],
  'DRIVER':      ['driver-portal'],
  'CLIENT':      ['client-portal', 'orders'],
  'WAREHOUSE':   ['warehouse', 'orders']
};

// All modules — used by PaywallView / ModuleLockedView to display module info
export const AVAILABLE_MODULES: ModuleDefinition[] = [...CORE_MODULES, ...MARKETPLACE_MODULES];

export const INDUSTRY_TEMPLATES: Record<string, { modules: ModuleId[], description: string }> = {
  'MEDICAL':      { modules: ['dispatch', 'warehouse', 'fleet', 'driver-portal', 'facility-portal', 'analytics'], description: 'Optimized for temperature-controlled logistics and strict compliance tracking.' },
  'PHARMA':       { modules: ['dispatch', 'warehouse', 'fleet', 'driver-portal', 'analytics', 'integrations'], description: 'Focused on batch/lot tracking, expiry management, and GxP compliance.' },
  'MANUFACTURING':{ modules: ['dispatch', 'warehouse', 'orders', 'finance', 'integrations', 'analytics'], description: 'Focus on raw material tracking, production orders, and ERP synchronization.' },
  'FOOD':         { modules: ['dispatch', 'warehouse', 'orders', 'driver-portal', 'client-portal', 'finance'], description: 'Streamlined for high-volume distribution and direct-to-customer tracking.' },
  'RETAIL':       { modules: ['dispatch', 'warehouse', 'orders', 'finance', 'client-portal', 'analytics'], description: 'Optimized for store replenishment, inventory visibility, and sales order management.' },
  'CONSTRUCTION': { modules: ['dispatch', 'fleet', 'facility-portal', 'analytics', 'integrations'], description: 'Focus on heavy asset management, site delivery tracking, and fuel monitoring.' },
  'E-COMMERCE':   { modules: ['dispatch', 'orders', 'finance', 'driver-portal', 'client-portal', 'analytics'], description: 'Designed for last-mile delivery, M-Pesa COD, and real-time customer tracking.' },
  'PROCESSING':   { modules: ['dispatch', 'warehouse', 'fleet', 'facility-portal', 'analytics', 'integrations'], description: 'Designed for multi-facility operations and heavy asset management.' },
  'HEALTHCARE':   { modules: ['dispatch', 'warehouse', 'fleet', 'driver-portal', 'facility-portal', 'analytics'], description: 'Optimized for temperature-controlled logistics and strict compliance tracking.' },
  'GENERAL':      { modules: ['dispatch', 'fleet', 'driver-portal', 'analytics'], description: 'A balanced set of core features for standard logistics operations.' },
};

// Core modules included per plan (upgrades are additive)
export const PLAN_MODULES: Record<'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE', ModuleId[]> = {
  'STARTER':    ['dispatch', 'warehouse'],
  'GROWTH':     ['dispatch', 'warehouse', 'orders', 'driver-portal', 'client-portal', 'fleet', 'finance'],
  'SCALE':      ['dispatch', 'warehouse', 'orders', 'driver-portal', 'client-portal', 'facility-portal', 'fleet', 'finance', 'analytics', 'integrations'],
  'ENTERPRISE': ['dispatch', 'warehouse', 'orders', 'driver-portal', 'client-portal', 'facility-portal', 'fleet', 'finance', 'analytics', 'integrations'],
};

// Numeric rank for plan comparison (higher = more access)
export const PLAN_HIERARCHY: Record<string, number> = {
  'STARTER': 0, 'GROWTH': 1, 'SCALE': 2, 'ENTERPRISE': 3
};

export const PLAN_PRICING: Record<'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE', {
  monthlyUSD: number;
  deliveriesPerMonth: number;
  label: string;
  tagline: string;
}> = {
  'STARTER':    { monthlyUSD: 49,  deliveriesPerMonth: 200,    label: 'Starter',    tagline: 'Get moving fast' },
  'GROWTH':     { monthlyUSD: 149, deliveriesPerMonth: 1000,   label: 'Growth',     tagline: 'Scale your ops' },
  'SCALE':      { monthlyUSD: 349, deliveriesPerMonth: 5000,   label: 'Scale',      tagline: 'Full-stack logistics' },
  'ENTERPRISE': { monthlyUSD: 999, deliveriesPerMonth: 999999, label: 'Enterprise', tagline: 'Unlimited + dedicated SLA' },
};

// Minimum plan required for a marketplace module by its tier field
export const MODULE_TIER_MIN_PLAN: Record<string, 'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE'> = {
  'free':         'STARTER',
  'starter':      'STARTER',
  'professional': 'GROWTH',
  'enterprise':   'SCALE',
  'custom':       'ENTERPRISE',
};

// Minimum plan required per core moduleId (used by ModuleGuard paywall check)
export const CORE_MODULE_MIN_PLAN: Partial<Record<ModuleId, 'STARTER' | 'GROWTH' | 'SCALE' | 'ENTERPRISE'>> = {
  'dispatch':        'STARTER',
  'warehouse':       'STARTER',
  'orders':          'GROWTH',
  'driver-portal':   'GROWTH',
  'client-portal':   'GROWTH',
  'fleet':           'GROWTH',
  'finance':         'GROWTH',
  'facility-portal': 'SCALE',
  'analytics':       'SCALE',
  'integrations':    'SCALE',
};
