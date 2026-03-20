import { ModuleDefinition, ModuleId } from './types';

export const AVAILABLE_MODULES: ModuleDefinition[] = [
  {
    id: 'dispatch',
    name: 'Real-time Dispatch',
    description: 'Manage delivery notes, assign drivers, and track shipments in real-time with GPS telemetry.',
    icon: 'Truck',
    category: 'CORE'
  },
  {
    id: 'warehouse',
    name: 'Warehouse Management',
    description: 'Inventory tracking, bin locations, stock movements, and batch management.',
    icon: 'Package',
    category: 'CORE'
  },
  {
    id: 'orders',
    name: 'Order Management',
    description: 'Capture sales orders, manage customer approvals, and convert orders to delivery notes.',
    icon: 'ShoppingCart',
    category: 'CORE'
  },
  {
    id: 'fleet',
    name: 'Fleet & Compliance',
    description: 'Vehicle maintenance logs, NTSA inspection tracking, and driver compliance scores.',
    icon: 'ShieldCheck',
    category: 'ADD-ON'
  },
  {
    id: 'finance',
    name: 'Commercials & Invoicing',
    description: 'Automated billing, rate management, and M-Pesa integration for COD.',
    icon: 'CreditCard',
    category: 'ADD-ON'
  },
  {
    id: 'analytics',
    name: 'Operational Analytics',
    description: 'Advanced BI reports, driver performance metrics, and cost-per-km analysis.',
    icon: 'BarChart3',
    category: 'ADD-ON'
  },
  {
    id: 'driver-portal',
    name: 'Driver PWA',
    description: 'Mobile-first portal for drivers to manage their queue, capture POD, and report exceptions.',
    icon: 'Smartphone',
    category: 'PORTAL'
  },
  {
    id: 'facility-portal',
    name: 'Facility Portal',
    description: 'Simplified interface for warehouse hubs to confirm loading and unloading.',
    icon: 'Building2',
    category: 'PORTAL'
  },
  {
    id: 'client-portal',
    name: 'Client Tracking',
    description: 'Allow your customers to track their own deliveries and download signed PODs.',
    icon: 'Users',
    category: 'PORTAL'
  },
  {
    id: 'integrations',
    name: 'ERP Connectors',
    description: 'Sync data directly with SAP, Oracle, Odoo, or custom ERP systems via API.',
    icon: 'Link',
    category: 'ADD-ON'
  }
];

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
  'GENERAL': {
    modules: ['dispatch', 'fleet', 'driver-portal', 'analytics'],
    description: 'A balanced set of core features for standard logistics operations.'
  }
};
