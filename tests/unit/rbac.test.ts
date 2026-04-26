import { describe, it, expect } from 'vitest';
import { hasPermission, getPermissionsForRole, ROLE_DEFINITIONS } from '../../constants/rbac';
import type { SystemRole, Permission } from '../../types';

// ─── Unit Tests ────────────────────────────────────────────────────────────────

describe('hasPermission — super_admin god mode', () => {
  it('grants every permission to super_admin', () => {
    const allPerms: Permission[] = ['dashboard:view', 'trips:delete', 'roles:create', 'audit:export'];
    allPerms.forEach(p => {
      expect(hasPermission('super_admin', p)).toBe(true);
    });
  });

  it('case-normalises super_admin', () => {
    expect(hasPermission('super_admin', 'analytics:all')).toBe(true);
  });
});

describe('hasPermission — role-based access', () => {
  it('grants tenant_admin full analytics access', () => {
    expect(hasPermission('tenant_admin', 'analytics:view')).toBe(true);
    expect(hasPermission('tenant_admin', 'analytics:export')).toBe(true);
  });

  it('denies dispatcher billing access', () => {
    expect(hasPermission('dispatcher', 'billing:all')).toBe(false);
    expect(hasPermission('dispatcher', 'finance:manage')).toBe(false);
  });

  it('grants dispatcher trip and dispatch assignment', () => {
    expect(hasPermission('dispatcher', 'trips:assign')).toBe(true);
    expect(hasPermission('dispatcher', 'dispatch:assign')).toBe(true);
    expect(hasPermission('dispatcher', 'dispatch:view')).toBe(true);
  });

  it('denies dispatcher dispatch:manage (elevated operation)', () => {
    expect(hasPermission('dispatcher', 'dispatch:manage')).toBe(false);
  });

  it('denies driver elevated permissions', () => {
    expect(hasPermission('driver', 'trips:delete')).toBe(false);
    expect(hasPermission('driver', 'users:invite')).toBe(false);
    expect(hasPermission('driver', 'analytics:view')).toBe(false);
  });

  it('denies client admin operations', () => {
    expect(hasPermission('client', 'users:delete')).toBe(false);
    expect(hasPermission('client', 'dispatch:manage')).toBe(false);
  });

  it('returns false for undefined role', () => {
    expect(hasPermission(undefined as any, 'dashboard:view')).toBe(false);
  });

  it('returns false for null role', () => {
    expect(hasPermission(null as any, 'dashboard:view')).toBe(false);
  });
});

// ─── White-box Tests — internal logic paths ─────────────────────────────────

describe('hasPermission — custom roles override', () => {
  it('grants permission via custom role definition', () => {
    const customRoles = [{
      role: 'dispatcher' as SystemRole,
      label: 'Dispatcher+',
      description: 'Extended dispatcher',
      permissions: ['billing:view' as Permission],
    }];
    expect(hasPermission('dispatcher', 'billing:view', customRoles)).toBe(true);
  });

  it('does not grant permission not in custom role', () => {
    const customRoles = [{
      role: 'dispatcher' as SystemRole,
      label: 'Dispatcher+',
      description: 'Extended dispatcher',
      permissions: ['billing:view' as Permission],
    }];
    expect(hasPermission('dispatcher', 'billing:all', customRoles)).toBe(false);
  });
});

describe('hasPermission — edge cases', () => {
  it('handles empty string permission gracefully', () => {
    expect(() => hasPermission('tenant_admin', '' as Permission)).not.toThrow();
  });

  it('returns false for completely unknown role', () => {
    expect(hasPermission('unknown_role' as SystemRole, 'dashboard:view')).toBe(false);
  });
});

// ─── System Tests — ROLE_DEFINITIONS completeness ───────────────────────────

describe('ROLE_DEFINITIONS completeness', () => {
  const requiredRoles: SystemRole[] = [
    'super_admin', 'tenant_admin', 'dispatcher', 'driver', 'client', 'facility_operator'
  ];

  requiredRoles.forEach(role => {
    it(`${role} has at least one permission defined`, () => {
      expect(ROLE_DEFINITIONS[role]).toBeDefined();
      expect(ROLE_DEFINITIONS[role].permissions.length).toBeGreaterThan(0);
    });
  });

  it('every role has label and description', () => {
    Object.values(ROLE_DEFINITIONS).forEach(def => {
      expect(def.label).toBeTruthy();
      expect(def.description).toBeTruthy();
    });
  });
});

describe('getPermissionsForRole', () => {
  it('returns empty array for unknown role', () => {
    expect(getPermissionsForRole('unknown' as SystemRole)).toEqual([]);
  });

  it('returns all permissions for tenant_admin', () => {
    const perms = getPermissionsForRole('tenant_admin');
    expect(perms.length).toBeGreaterThan(10);
    expect(perms).toContain('dashboard:view');
    expect(perms).toContain('analytics:view');
  });

  it('returns no duplicate permissions', () => {
    const perms = getPermissionsForRole('super_admin');
    const unique = new Set(perms);
    expect(perms.length).toBe(unique.size);
  });
});
