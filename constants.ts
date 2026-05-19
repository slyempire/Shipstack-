
import { ModuleId, IndustryType } from './types';

export const ROLE_MODULES: any = {
  ADMIN: ['dashboard', 'dispatch', 'fleet', 'finance', 'crm', 'driver-portal', 'facility-portal', 'client-portal', 'analytics', 'integrations'],
  tenant_admin: ['dashboard', 'dispatch', 'fleet', 'finance', 'crm', 'driver-portal', 'facility-portal', 'client-portal', 'analytics', 'integrations'],
  super_admin: ['dashboard', 'dispatch', 'fleet', 'finance', 'crm', 'driver-portal', 'facility-portal', 'client-portal', 'analytics', 'integrations'],
  DISPATCHER: ['dashboard', 'dispatch', 'fleet', 'crm'],
  FINANCE: ['dashboard', 'finance', 'crm'],
  WAREHOUSE: ['dashboard', 'warehouse'],
  DRIVER: ['driver-portal'],
  CLIENT: ['client-portal'],
} as any;

export const INDUSTRY_MODULE_MAPPING: Record<IndustryType, ModuleId[]> = {
  HEALTHCARE: ['dashboard', 'dispatch', 'warehouse', 'orders', 'crm', 'vertical-healthcare', 'vertical-coldchain', 'analytics'],
  PHARMA: ['dashboard', 'dispatch', 'warehouse', 'orders', 'crm', 'vertical-healthcare', 'vertical-coldchain', 'analytics'],
  MEDICAL: ['dashboard', 'dispatch', 'warehouse', 'orders', 'crm', 'vertical-healthcare', 'vertical-coldchain', 'analytics'],
  AGRICULTURE: ['dashboard', 'dispatch', 'fleet', 'crm', 'vertical-agriculture', 'analytics'],
  RETAIL: ['dashboard', 'dispatch', 'warehouse', 'orders', 'crm', 'vertical-retail', 'analytics'],
  'E-COMMERCE': ['dashboard', 'dispatch', 'warehouse', 'orders', 'crm', 'vertical-ecommerce', 'analytics'],
  FOOD: ['dashboard', 'dispatch', 'warehouse', 'orders', 'crm', 'vertical-coldchain', 'analytics'],
  CONSTRUCTION: ['dashboard', 'dispatch', 'fleet', 'crm', 'vertical-construction', 'analytics'],
  MANUFACTURING: ['dashboard', 'dispatch', 'warehouse', 'orders', 'crm', 'analytics'],
  PROCESSING: ['dashboard', 'dispatch', 'warehouse', 'orders', 'crm', 'analytics'],
  GENERAL: ['dashboard', 'dispatch', 'fleet', 'warehouse', 'orders', 'crm', 'analytics', 'integrations']
};

export const MODULE_DETAILS: Record<ModuleId, { name: string, description: string, icon: string, path?: string }> = {
  dashboard: { name: 'Overview', description: 'Real-time operations summary', icon: 'LayoutDashboard' },
  dispatch: { name: 'Dispatch Board', description: 'Route planning and assignments', icon: 'Route' },
  warehouse: { name: 'Hubs & Inventory', description: 'Storage and hub operations', icon: 'Package' },
  orders: { name: 'Order Central', description: 'Customer requests and fulfillment', icon: 'ShoppingBag' },
  fleet: { name: 'Vehicles Hub', description: 'Asset tracking and maintenance', icon: 'Truck' },
  finance: { name: 'Billing & Finance', description: 'Invoicing and revenue', icon: 'DollarSign' },
  crm: { name: 'Customers & CRM', description: 'Client management hub', icon: 'Users' },
  analytics: { name: 'Analytics Hub', description: 'Performance and insights', icon: 'BarChart3' },
  integrations: { name: 'Marketplace', path: '/admin/marketplace', icon: 'Layers', description: 'Add-on modules' },
  'driver-portal': { name: 'Drivers', description: 'Field agent management', icon: 'User' },
  'facility-portal': { name: 'Facilities', description: 'Hub and cross-dock portal', icon: 'Building' },
  'client-portal': { name: 'Client Portal', description: 'Customer tracking interface', icon: 'Globe' },
  'vertical-healthcare': { name: 'Healthcare', description: 'Medical logistics suite', icon: 'Stethoscope' },
  'vertical-agriculture': { name: 'Agriculture', description: 'Farm-to-market tracking', icon: 'Sprout' },
  'vertical-ecommerce': { name: 'E-commerce', description: 'Last-mile delivery tools', icon: 'ShoppingCart' },
  'vertical-retail': { name: 'Retail', description: 'Store replenishment', icon: 'ShoppingBag' },
  'vertical-coldchain': { name: 'Cold Chain', description: 'Temperature monitoring', icon: 'Snowflake' },
  'vertical-construction': { name: 'Construction', description: 'Heavy equipment logistics', icon: 'Hammer' },
  'addon-cortex-ai': { name: 'Cortex AI', description: 'Demand forecasting', icon: 'BrainCircuit' },
  'addon-advanced-analytics': { name: 'Advanced IQ', description: 'Custom BI reports', icon: 'Zap' },
  'addon-route-optimizer': { name: 'Pathfinder', description: 'Route optimization', icon: 'Navigation' },
  'addon-customer-portal': { name: 'Premium Portal', description: 'Branded experience', icon: 'Sparkles' },
  'addon-driver-app-pro': { name: 'Driver Pro', description: 'Advanced field tools', icon: 'Smartphone' },
  'integration-frappe-erp': { name: 'Frappe ERP', description: 'ERP synchronization', icon: 'RefreshCw' },
  'integration-quickbooks': { name: 'QuickBooks', description: 'Accounting sync', icon: 'Calculator' },
  'integration-shopify': { name: 'Shopify', description: 'E-commerce sync', icon: 'ShoppingBag' },
  'integration-mpesa': { name: 'M-Pesa', description: 'Payment settlement', icon: 'Phone' },
  'integration-stripe': { name: 'Stripe', description: 'Global billing', icon: 'CreditCard' },
  'compliance-gdpr-toolkit': { name: 'GDPR Shield', description: 'Privacy tools', icon: 'ShieldCheck' },
  'compliance-iso-28000': { name: 'ISO-28000', description: 'Security suite', icon: 'ShieldAlert' },
  'hardware-obd-pro': { name: 'OBD-II Pro', description: 'Engine diagnostics', icon: 'Cpu' },
  'hardware-asset-tag': { name: 'Asset Tag', description: 'Package tracking', icon: 'Tag' },
  'hardware-vision-ai': { name: 'Vision AI', description: 'Dash-cam suite', icon: 'Eye' },
  'core-dashboard': { name: 'System', description: 'Root overview', icon: 'Shield' },
  'core-dispatch': { name: 'Core Dispatch', description: 'Routing engine', icon: 'Route' },
  'core-fleet': { name: 'Core Fleet', description: 'Vehicle registry', icon: 'Truck' },
  'core-trips': { name: 'Core Trips', description: 'Trip management', icon: 'Map' },
  'core-invoicing': { name: 'Core Billing', description: 'Standard invoices', icon: 'FileText' },
  'security-suite': { name: 'Security Suite', description: 'Advanced security control', icon: 'Shield' },
  'security-rbac': { name: 'RBAC Protocols', description: 'Role based access control', icon: 'Lock' },
  'security-diagnostics': { name: 'Diagnostics', description: 'System health monitoring', icon: 'Activity' },
  'security-audit': { name: 'Audit Logs', description: 'System trace and trails', icon: 'History' },
};

export const MODULE_ORDER: ModuleId[] = [
  'dashboard',
  'orders',
  'dispatch',
  'fleet',
  'warehouse',
  'crm',
  'finance',
  'driver-portal',
  'client-portal',
  'analytics',
  'integrations'
];

export const AVAILABLE_MODULES: any[] = Object.entries(MODULE_DETAILS).map(([id, details]: [any, any]) => ({
  id,
  ...details
}));
