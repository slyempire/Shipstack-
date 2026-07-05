
import { Permission, RoleDefinition, SystemRole, UserRole } from '../types';

export const ROLE_DEFINITIONS: Record<SystemRole, RoleDefinition> = {
  super_admin: {
    role: 'super_admin',
    label: 'Super Admin',
    description: 'Platform-level administrator with access to all tenants and internal platform settings.',
    permissions: [
      'dashboard:view', 'dashboard:export',
      'trips:view', 'trips:create', 'trips:edit', 'trips:delete', 'trips:assign',
      'dispatch:view', 'dispatch:manage', 'dispatch:assign',
      'fleet:view', 'fleet:manage', 'fleet:all',
      'maintenance:view', 'maintenance:manage',
      'finance:view', 'finance:manage',
      'invoicing:view', 'invoicing:all', 'billing:view', 'billing:all',
      'rates:view', 'rates:all', 'subscription:view', 'subscription:manage',
      'users:view', 'users:invite', 'users:edit', 'users:delete',
      'roles:view', 'roles:create', 'roles:edit',
      'warehouse:view', 'warehouse:manage', 'warehouse:all',
      'orders:view', 'orders:create', 'orders:edit', 'orders:delete',
      'analytics:view', 'analytics:export', 'analytics:all',
      'data_ingress:view', 'data_ingress:manage',
      'audit:view', 'audit:export',
      'marketplace:view', 'marketplace:install', 'marketplace:uninstall', 'marketplace:publish', 'marketplace:review',
      'crm:view', 'crm:manage',
      'exceptions:view', 'exceptions:resolve',
      'recruitment:all', 'tracking:view',
      'tasks:view', 'tasks:manage'
    ]
  },
  tenant_admin: {
    role: 'tenant_admin',
    label: 'Tenant Admin',
    description: 'Full administrative access for a specific tenant.',
    permissions: [
      'dashboard:view', 'dashboard:export',
      'trips:view', 'trips:create', 'trips:edit', 'trips:delete', 'trips:assign',
      'dispatch:view', 'dispatch:manage', 'dispatch:assign',
      'fleet:view', 'fleet:manage', 'fleet:all',
      'maintenance:view', 'maintenance:manage',
      'finance:view', 'finance:manage',
      'invoicing:view', 'invoicing:all', 'billing:view', 'billing:all',
      'rates:view', 'rates:all', 'subscription:view',
      'users:view', 'users:invite', 'users:edit', 'users:delete', 'users:manage',
      'roles:view', 'roles:create', 'roles:edit',
      'warehouse:view', 'warehouse:manage', 'warehouse:all',
      'orders:view', 'orders:create', 'orders:edit', 'orders:delete',
      'analytics:view', 'analytics:export',
      'data_ingress:view', 'data_ingress:manage',
      'audit:view', 'security:view',
      'marketplace:view', 'marketplace:install', 'marketplace:uninstall',
      'crm:view', 'crm:manage',
      'exceptions:view', 'exceptions:resolve',
      'recruitment:all', 'subscription:manage',
      'tracking:view',
      'tasks:view', 'tasks:manage'
    ]
  },
  operations_manager: {
    role: 'operations_manager',
    label: 'Operations Manager',
    description: 'Manages the day-to-day logistics operations, trips, and dispatch.',
    permissions: [
      'dashboard:view',
      'trips:view', 'trips:create', 'trips:edit', 'trips:assign',
      'dispatch:view', 'dispatch:manage', 'dispatch:assign',
      'fleet:view',
      'exceptions:view', 'exceptions:resolve',
      'analytics:view',
      'warehouse:view', 'warehouse:manage',
      'orders:view', 'orders:edit',
      'crm:view',
      'users:view',
      'tracking:view',
      'tasks:view', 'tasks:manage'
    ]
  },
  dispatcher: {
    role: 'dispatcher',
    label: 'Dispatcher',
    description: 'Responsible for assigning trips and managing the live dispatch grid.',
    permissions: [
      'dashboard:view',
      'trips:view', 'trips:create', 'trips:assign',
      'dispatch:view', 'dispatch:manage', 'dispatch:assign',
      'fleet:view',
      'orders:view',
      'warehouse:view',
      'exceptions:view', 'exceptions:resolve',
      'tracking:view',
      'tasks:view', 'tasks:manage'
    ]
  },
  finance_manager: {
    role: 'finance_manager',
    label: 'Finance Manager',
    description: 'Manages billing, invoicing, and financial reporting.',
    permissions: [
      'dashboard:view',
      'finance:view', 'finance:manage',
      'invoicing:view', 'invoicing:all',
      'billing:view', 'billing:all',
      'rates:view', 'rates:all',
      'subscription:view',
      'analytics:view',
      'orders:view'
    ]
  },
  fleet_manager: {
    role: 'fleet_manager',
    label: 'Fleet Manager',
    description: 'Manages vehicles, maintenance, and driver assignments.',
    permissions: [
      'dashboard:view',
      'fleet:view', 'fleet:manage', 'fleet:all',
      'maintenance:view', 'maintenance:manage',
      'trips:view',
      'analytics:view',
      'tasks:view', 'tasks:manage'
    ]
  },
  recruiter: {
    role: 'recruiter',
    label: 'Recruiter',
    description: 'Manages driver onboarding and recruitment pipeline.',
    permissions: [
      'dashboard:view',
      'recruitment:all',
      'users:view',
      'tasks:view', 'tasks:manage'
    ]
  },
  analyst: {
    role: 'analyst',
    label: 'Analyst',
    description: 'Focuses on data analysis, reporting, and audit logs.',
    permissions: [
      'dashboard:view', 'dashboard:export',
      'analytics:view', 'analytics:export', 'analytics:all',
      'data_ingress:view',
      'audit:view'
    ]
  },
  driver: {
    role: 'driver',
    label: 'Driver',
    description: 'Limited access to own trips and basic portal features.',
    permissions: [
      'trips:view',
      'tracking:view'
    ]
  },
  client: {
    role: 'client',
    label: 'Client',
    description: 'Access to the client portal for order tracking and placement.',
    permissions: [
      'orders:view', 'orders:create',
      'tracking:view'
    ]
  },
  facility_operator: {
    role: 'facility_operator',
    label: 'Facility Operator',
    description: 'Manages warehouse operations and localized orders.',
    permissions: [
      'dashboard:view',
      'warehouse:view', 'warehouse:manage', 'warehouse:all',
      'orders:view'
    ]
  },
  marketplace_publisher: {
    role: 'marketplace_publisher',
    label: 'Marketplace Publisher',
    description: 'Publishes and manages own modules in the marketplace.',
    permissions: [
      'marketplace:view', 'marketplace:publish'
    ]
  },
  support_agent: {
    role: 'support_agent',
    label: 'Support Agent',
    description: 'View-only access for troubleshooting and support.',
    permissions: [
      'dashboard:view',
      'trips:view',
      'dispatch:view',
      'fleet:view',
      'warehouse:view',
      'orders:view',
      'users:view',
      'exceptions:view', 'exceptions:resolve',
      'tracking:view',
      'analytics:view'
    ]
  }
};

// Mirrors the RoleGuard permissions on each route in App.tsx — keep the two
// in sync when adding routes. (App.tsx route guards are the enforcement
// point; this map exists for nav helpers via canAccessRoute.)
export const ROUTE_PERMISSION_MAP: Record<string, Permission[]> = {
  '/admin': ['dashboard:view'],
  '/admin/dispatch': ['dispatch:manage'],
  '/admin/queue': ['dispatch:view'],
  '/admin/tracking': ['tracking:view'],
  '/admin/exceptions': ['exceptions:view'],
  '/admin/trip': ['trips:view'],
  '/admin/fleet': ['fleet:manage'],
  '/admin/warehouse': ['warehouse:view'],
  '/admin/orders': ['orders:view'],
  '/admin/billing': ['finance:manage'],
  '/admin/rates': ['rates:all'],
  '/admin/subscription': ['subscription:manage'],
  '/admin/users': ['users:manage'],
  '/admin/security': ['security:view'],
  '/admin/marketplace': ['marketplace:view'],
  '/admin/ingress': ['data_ingress:view'],
  '/admin/analytics': ['analytics:view'],
  '/admin/recruitment': ['recruitment:all'],
  '/admin/tasks': ['tasks:view'],
  '/admin/crm': ['crm:manage']
};

export const hasPermission = (userRole: UserRole, permission: Permission, customRoles?: RoleDefinition[]): boolean => {
  if (!userRole) return false;
  
  // Normalize role for comparison
  const normalizedRole = userRole.toLowerCase();

  // Check super_admin first (god mode)
  if (normalizedRole === 'super_admin') return true;

  // Check custom roles if provided
  if (customRoles) {
    const customRole = customRoles.find(r => r.role.toLowerCase() === normalizedRole);
    if (customRole) {
       if (customRole.permissions.includes(permission)) return true;
       // Custom role inheritance
       if (customRole.inherits) {
         return customRole.inherits.some(inheritedRole => hasPermission(inheritedRole, permission, customRoles));
       }
    }
  }

  // Check standard role definitions
  const roleDef = ROLE_DEFINITIONS[normalizedRole as SystemRole];
  if (!roleDef) {
    // Legacy support for common uppercase aliases
    const legacyRoleDef = ROLE_DEFINITIONS[userRole as SystemRole]; 
    if (!legacyRoleDef) return false;
    if (legacyRoleDef.permissions.includes(permission)) return true;
    return false;
  }

  // Direct check
  if (roleDef.permissions.includes(permission)) return true;

  // Inheritance check
  if (roleDef.inherits) {
    return roleDef.inherits.some(inheritedRole => hasPermission(inheritedRole, permission, customRoles));
  }

  return false;
};

export const getPermissionsForRole = (role: UserRole, customRoles?: RoleDefinition[]): Permission[] => {
  const roleDef = ROLE_DEFINITIONS[role as SystemRole] || customRoles?.find(r => r.role === role);
  if (!roleDef) return [];

  let permissions = [...roleDef.permissions];
  if (roleDef.inherits) {
    roleDef.inherits.forEach(inheritedRole => {
      permissions = [...new Set([...permissions, ...getPermissionsForRole(inheritedRole, customRoles)])];
    });
  }

  return permissions;
};

export const canAccessRoute = (userRole: UserRole, route: string, customRoles?: RoleDefinition[]): boolean => {
  if (userRole === 'super_admin') return true;
  
  const requiredPermissions = ROUTE_PERMISSION_MAP[route] || ROUTE_PERMISSION_MAP[route.split('?')[0]];
  if (!requiredPermissions) return true; // Public or unguarded route

  return requiredPermissions.every(permission => hasPermission(userRole, permission, customRoles));
};

export const getRoleInheritanceChain = (role: UserRole, customRoles?: RoleDefinition[]): UserRole[] => {
  const roleDef = ROLE_DEFINITIONS[role as SystemRole] || customRoles?.find(r => r.role === role);
  if (!roleDef || !roleDef.inherits) return [role];

  let chain = [role];
  roleDef.inherits.forEach(inheritedRole => {
    chain = [...new Set([...chain, ...getRoleInheritanceChain(inheritedRole, customRoles)])];
  });
  
  return chain;
};
