import { test, expect, Page } from '@playwright/test';

/**
 * Auth & RBAC critical-path tests (TEST_PLAN.md TC-01/TC-02).
 *
 * Login uses the mock-data fallback (no Frappe in the test environment:
 * api.login catches the ERP failure and matches against seeded users).
 * RBAC tests inject persisted auth state directly, mirroring tests/smoke.spec.ts.
 */

async function injectAuth(page: Page, user: Record<string, unknown>) {
  const authPersist = {
    state: {
      user: { tenantId: 'tenant-1', verificationStatus: 'VERIFIED', isOnboarded: true, ...user },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      currentUserRole: user.role,
      currentUserPermissions: [],
      customRoles: []
    },
    version: 0
  };
  await page.addInitScript((auth) => {
    localStorage.setItem('shipstack_demo_mode', 'true');
    localStorage.setItem('shipstack-auth-storage', JSON.stringify(auth));
  }, authPersist);
}

test.describe('Authentication', () => {
  test('login page renders with email and password fields', async ({ page }) => {
    await page.goto('/#/login');
    await expect(page.getByPlaceholder('Email')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('admin can log in with mock credentials and reach /admin', async ({ page }) => {
    await page.goto('/#/login');
    await page.getByPlaceholder('Email').fill('admin@shipstack.com');
    await page.getByPlaceholder('Password').fill('password');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/#\/admin/, { timeout: 20_000 });
  });

  test('unauthenticated user cannot reach /admin', async ({ page }) => {
    await page.goto('/#/admin');
    // ProtectedRoute must bounce to login (or at minimum never render the dashboard)
    await page.waitForURL(/#\/(login|$)/, { timeout: 15_000 });
  });
});

test.describe('Role-based access control', () => {
  test('driver role is blocked from admin dashboard (TC-01)', async ({ page }) => {
    await injectAuth(page, {
      id: 'd-1',
      email: 'pilot@shipstack.com',
      name: 'Driver John',
      role: 'driver'
    });
    await page.goto('/#/admin');

    // RoleGuard should show an access error or redirect — the admin
    // dashboard content must NOT appear.
    const blocked = page.locator('text=/access|denied|permission|restricted|clearance/i').first();
    await expect(blocked).toBeVisible({ timeout: 15_000 });
  });

  test('driver role can reach the driver portal', async ({ page }) => {
    await injectAuth(page, {
      id: 'd-1',
      email: 'pilot@shipstack.com',
      name: 'Driver John',
      role: 'driver',
      onDuty: false
    });
    await page.goto('/#/driver');
    // Driver portal entry step renders (session init / check-in)
    await expect(page.locator('text=/initialize|check.?in|session/i').first()).toBeVisible({ timeout: 15_000 });
  });
});
