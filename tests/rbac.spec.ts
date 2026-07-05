import { test, expect, Page } from '@playwright/test';

/**
 * RBAC access matrix — role/route combinations that must hold.
 * These encode the contract between ROLE_DEFINITIONS (constants/rbac.ts)
 * and the route guards in App.tsx. If a case here fails, either a role
 * lost a permission it needs or a route gate is out of sync with the
 * permission matrix.
 */

const CASES: Array<{ role: string; route: string; expect: 'allowed' | 'denied' }> = [
  // Every operational role can open the page its job depends on
  { role: 'dispatcher', route: '/#/admin/dispatch', expect: 'allowed' },
  { role: 'tenant_admin', route: '/#/admin/recruitment', expect: 'allowed' },
  { role: 'facility_operator', route: '/#/admin', expect: 'allowed' },
  { role: 'finance_manager', route: '/#/admin/billing', expect: 'allowed' },
  { role: 'analyst', route: '/#/admin/analytics', expect: 'allowed' },
  // Personal pages are open to every authenticated role
  { role: 'driver', route: '/#/profile', expect: 'allowed' },
  { role: 'client', route: '/#/profile', expect: 'allowed' },
  // Portal roles stay out of the admin console
  { role: 'driver', route: '/#/admin', expect: 'denied' },
  { role: 'driver', route: '/#/admin/trip/trip-1', expect: 'denied' },
  { role: 'client', route: '/#/admin', expect: 'denied' },
];

async function loginAs(page: Page, role: string) {
  const auth = {
    state: {
      user: { id: 'u-t', email: 't@s.com', name: 'Test User', role, tenantId: 'tenant-1', verificationStatus: 'VERIFIED', isOnboarded: true },
      token: 'mock-jwt-token', isAuthenticated: true, currentUserRole: role,
      currentUserPermissions: [], customRoles: []
    }, version: 0
  };
  const tenant = {
    state: {
      currentTenant: {
        id: 'tenant-1', name: 'T', plan: 'ENTERPRISE', status: 'ACTIVE', industry: 'GENERAL',
        enabledModules: ['dashboard', 'dispatch', 'warehouse', 'orders', 'fleet', 'finance', 'analytics', 'integrations', 'facility-portal', 'driver-portal', 'client-portal'],
        settings: { currency: 'KES', timezone: 'Africa/Nairobi', primaryColor: '#0F2A44' }
      }, theme: {}
    }, version: 0
  };
  await page.addInitScript(({ a, t }) => {
    localStorage.setItem('shipstack_demo_mode', 'true');
    localStorage.setItem('shipstack-auth-storage', JSON.stringify(a));
    localStorage.setItem('shipstack-tenant-storage', JSON.stringify(t));
    localStorage.setItem('shipstack_onboarding_complete', 'true');
    localStorage.setItem('shipstack_cookie_consent', 'declined');
  }, { a: auth, t: tenant });
}

for (const c of CASES) {
  test(`${c.role} → ${c.route} is ${c.expect}`, async ({ page }) => {
    await loginAs(page, c.role);
    await page.goto(c.route);
    await page.waitForTimeout(2500);

    const deniedLocator = page.locator("text=/don't have access|access denied|access restricted/i");
    if (c.expect === 'denied') {
      // Denied means: the access-denied view OR a redirect away from the route
      const denied = await deniedLocator.count();
      const stillThere = page.url().includes(c.route.replace('/#', ''));
      expect(denied > 0 || !stillThere, `expected ${c.role} to be blocked from ${c.route}`).toBe(true);
    } else {
      await expect(deniedLocator).toHaveCount(0);
      expect(page.url()).toContain(c.route.replace('/#', ''));
    }
  });
}
