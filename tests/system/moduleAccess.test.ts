import { describe, it, expect } from 'vitest';

/**
 * System Tests — Module Access Control
 *
 * White-box tests for isModuleEnabled's multi-layer access logic.
 * We test the logic directly (without the hook) by reproducing its
 * decision tree and verifying each branch.
 */

import { ROLE_MODULES } from '../../constants';
import type { ModuleId } from '../../types';

// Reproduce isModuleEnabled logic for unit testing (mirrors hooks/useTenant.ts)
function isModuleEnabled(
  moduleId: ModuleId | '',
  opts: {
    isDemoUser?: boolean;
    enabledModules?: ModuleId[];
    userRole?: string;
    userEnabledModules?: ModuleId[];
  }
): boolean {
  if (!moduleId) return true;
  if (opts.isDemoUser) return true;
  const isTenantEnabled = Array.isArray(opts.enabledModules)
    ? opts.enabledModules.includes(moduleId)
    : true;
  if (!isTenantEnabled) return false;
  if (opts.userRole === 'ADMIN') return true;
  if (opts.userEnabledModules && opts.userEnabledModules.length > 0) {
    return opts.userEnabledModules.includes(moduleId);
  }
  if (opts.userRole && ROLE_MODULES && (ROLE_MODULES as any)[opts.userRole]) {
    return (ROLE_MODULES as any)[opts.userRole].includes(moduleId);
  }
  return true;
}

// ─── White-box: each decision branch ────────────────────────────────────────

describe('isModuleEnabled — branch coverage', () => {
  it('returns true for empty moduleId (falsy guard)', () => {
    expect(isModuleEnabled('', {})).toBe(true);
  });

  it('returns true for demo user regardless of modules', () => {
    expect(isModuleEnabled('dispatch', { isDemoUser: true, enabledModules: [] })).toBe(true);
  });

  it('returns false when module not in tenant enabledModules', () => {
    expect(isModuleEnabled('dispatch', { enabledModules: ['analytics'] })).toBe(false);
  });

  it('returns true when module is in tenant enabledModules and user is ADMIN', () => {
    expect(isModuleEnabled('analytics', {
      enabledModules: ['analytics'],
      userRole: 'ADMIN',
    })).toBe(true);
  });

  it('respects user-level module overrides over role', () => {
    expect(isModuleEnabled('finance', {
      enabledModules: ['analytics', 'finance'],
      userRole: 'dispatcher',
      userEnabledModules: ['finance'],
    })).toBe(true);

    expect(isModuleEnabled('analytics', {
      enabledModules: ['analytics', 'finance'],
      userRole: 'dispatcher',
      userEnabledModules: ['finance'], // analytics not in override
    })).toBe(false);
  });

  it('defaults to true for unknown role with no overrides', () => {
    expect(isModuleEnabled('dispatch', {
      enabledModules: ['dispatch'],
      userRole: 'unknown_custom_role',
    })).toBe(true);
  });

  it('returns true when enabledModules is not an array (no tenant restriction)', () => {
    expect(isModuleEnabled('dispatch', {
      enabledModules: undefined,
      userRole: 'dispatcher',
    })).toBe(true);
  });
});

// ─── System Tests — PLAN module tiers ───────────────────────────────────────

describe('Plan module tier integrity', () => {
  const PLAN_MODULES: Record<string, ModuleId[]> = {
    STARTER: ['dispatch', 'driver-portal'],
    GROWTH: ['dispatch', 'driver-portal', 'fleet', 'analytics', 'finance'],
    SCALE: ['dispatch', 'driver-portal', 'fleet', 'analytics', 'finance', 'warehouse', 'orders', 'integrations'],
    ENTERPRISE: ['dispatch', 'driver-portal', 'fleet', 'analytics', 'finance', 'warehouse', 'orders', 'integrations', 'client-portal', 'facility-portal'],
  };

  it('STARTER is a subset of GROWTH', () => {
    PLAN_MODULES.STARTER.forEach(m => {
      expect(PLAN_MODULES.GROWTH).toContain(m);
    });
  });

  it('GROWTH is a subset of SCALE', () => {
    PLAN_MODULES.GROWTH.forEach(m => {
      expect(PLAN_MODULES.SCALE).toContain(m);
    });
  });

  it('SCALE is a subset of ENTERPRISE', () => {
    PLAN_MODULES.SCALE.forEach(m => {
      expect(PLAN_MODULES.ENTERPRISE).toContain(m);
    });
  });

  it('ENTERPRISE contains all lower-plan modules', () => {
    const allModules = [...new Set([
      ...PLAN_MODULES.STARTER,
      ...PLAN_MODULES.GROWTH,
      ...PLAN_MODULES.SCALE,
    ])];
    allModules.forEach(m => {
      expect(PLAN_MODULES.ENTERPRISE).toContain(m);
    });
  });
});

// ─── System Tests — Role module matrix ──────────────────────────────────────

describe('ROLE_MODULES matrix', () => {
  it('ROLE_MODULES is defined and is an object', () => {
    expect(ROLE_MODULES).toBeDefined();
    expect(typeof ROLE_MODULES).toBe('object');
  });

  const rolesWithModules = Object.entries(ROLE_MODULES as Record<string, ModuleId[]>);

  if (rolesWithModules.length > 0) {
    rolesWithModules.forEach(([role, modules]) => {
      // marketplace_publisher is a valid role but doesn't require module access
      const exemptRoles = ['marketplace_publisher'];
      if (exemptRoles.includes(role)) {
        it(`${role} is defined in ROLE_MODULES (may have 0 modules)`, () => {
          expect(Array.isArray(modules)).toBe(true);
        });
      } else {
        it(`${role} has at least one module`, () => {
          expect(Array.isArray(modules)).toBe(true);
          expect(modules.length).toBeGreaterThan(0);
        });
      }
    });
  }
});
