import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Smoke tests for the lifecycle-improvements PR:
 *   1. Facility bay management persists across reload (Bay CRUD + UI cycle).
 *   2. Driver clock-in queues when offline and drains via syncService when
 *      the browser comes back online (runOrQueue + processUpdate path).
 *   3. Supabase realtime subscription mounts cleanly when configured.
 *
 * Instead of driving the LoginView (which has async demo logins, role guards,
 * module guards, and tenant requirements), we inject Zustand persist state
 * directly into localStorage before navigating to the portal. This matches
 * the shape produced by a real demo login and is what the persist middleware
 * rehydrates from on every reload, so the rest of the app sees a logged-in
 * tenant with all modules enabled.
 */

type FakeRole = 'facility' | 'driver' | 'admin';

interface FakeAuthBundle {
  role: FakeRole;
}

const PORTAL_PATH: Record<FakeRole, string> = {
  facility: '/#/facility',
  driver: '/#/driver',
  admin: '/#/admin',
};

const ROLE_CONFIG = {
  facility: {
    id: 'f-1',
    email: 'hub@shipstack.com',
    name: 'Hub Manager',
    role: 'facility_operator',
    facilityId: 'f-1',
    company: 'MEDS Central Hub',
  },
  driver: {
    id: 'd-1',
    email: 'pilot@shipstack.com',
    name: 'Driver John',
    role: 'driver',
    onDuty: false,
    company: 'Alpha Transporters',
  },
  admin: {
    id: 'u-1',
    email: 'admin@shipstack.com',
    name: 'Admin User',
    role: 'super_admin',
    company: 'Shipstack HQ',
  },
} as const;

/**
 * Inject persisted Zustand state via `page.addInitScript` so it lands in
 * localStorage *before* the app's persist middleware rehydrates. Required
 * because the app uses HashRouter; navigating between hash routes doesn't
 * cause a full page reload, so localStorage written after page load isn't
 * picked up.
 *
 * Sets `shipstack_demo_mode=true` so ModuleGuard bypasses module checks
 * (see components/ModuleGuard/index.tsx:28-34) and ProtectedRoute treats
 * the session as authenticated.
 */
async function loginAs(page: Page, { role }: FakeAuthBundle) {
  const cfg = ROLE_CONFIG[role];
  const user = {
    ...cfg,
    tenantId: 'tenant-1',
    verificationStatus: 'VERIFIED',
    isOnboarded: true,
  };

  const authPersist = {
    state: {
      user,
      token: 'mock-jwt-token',
      isAuthenticated: true,
      currentUserRole: cfg.role,
      currentUserPermissions: [],
      customRoles: [],
    },
    version: 0,
  };

  const tenantPersist = {
    state: {
      currentTenant: {
        id: 'tenant-1',
        name: 'Shipstack HQ',
        slug: 'shipstack-hq',
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        industry: 'GENERAL',
        enabledModules: [
          'dashboard', 'dispatch', 'warehouse', 'orders', 'fleet', 'finance',
          'analytics', 'integrations', 'facility-portal', 'driver-portal',
          'client-portal',
        ],
        settings: { currency: 'KES', timezone: 'Africa/Nairobi', primaryColor: '#0F2A44' },
      },
      theme: { primaryColor: '#0F2A44' },
    },
    version: 0,
  };

  await page.addInitScript((payload) => {
    // Only set the auth / tenant / demo-mode keys. Do NOT touch data keys
    // (e.g. shipstack_int_bays) because addInitScript runs on every navigation
    // including reload(), and wiping data keys would defeat persistence tests.
    // Per-test isolation is handled by Playwright's default new-context-per-test.
    localStorage.setItem('shipstack_demo_mode', 'true');
    localStorage.setItem('shipstack-auth-storage', JSON.stringify(payload.auth));
    localStorage.setItem('shipstack-tenant-storage', JSON.stringify(payload.tenant));
  }, { auth: authPersist, tenant: tenantPersist });

  await page.goto(PORTAL_PATH[role]);
}

test.describe('Facility bay management (feat/facility)', () => {
  test('bay status cycles on click and persists across reload', async ({ page }) => {
    await loginAs(page, { role: 'facility' });

    // The portal renders "Dock Bay Status" as the bay-grid heading.
    await expect(page.locator('text=Dock Bay Status')).toBeVisible({ timeout: 15_000 });

    // Pick bay 02, which the seed data places in EMPTY status.
    const bay02 = page.locator('button', { hasText: '02' }).first();
    await expect(bay02).toBeVisible();
    await expect(bay02).toContainText('EMPTY');

    // Click cycles: EMPTY -> RESERVED -> LOADING.
    await bay02.click();
    await expect(bay02).toContainText('RESERVED');

    await bay02.click();
    await expect(bay02).toContainText('LOADING');

    // Persistence check: reload and confirm bay 02 is still LOADING.
    await page.reload();
    await expect(page.locator('text=Dock Bay Status')).toBeVisible({ timeout: 15_000 });
    const bay02AfterReload = page.locator('button', { hasText: '02' }).first();
    await expect(bay02AfterReload).toContainText('LOADING');

    // Reset to EMPTY so the test is idempotent across local re-runs.
    await bay02AfterReload.click(); // UNLOADING
    await bay02AfterReload.click(); // MAINTENANCE
    await bay02AfterReload.click(); // EMPTY
    await expect(bay02AfterReload).toContainText('EMPTY');
  });

  test('Manage Bays modal can add and delete a bay', async ({ page }) => {
    await loginAs(page, { role: 'facility' });
    await expect(page.locator('text=Dock Bay Status')).toBeVisible({ timeout: 15_000 });

    // Open the modal.
    await page.locator('button:has-text("Manage Bays")').click();
    await expect(page.locator('text=Add, remove or reassign loading docks.')).toBeVisible();

    const initialDeleteButtons = await page.locator('button[title="Delete bay"]').count();

    // Add a bay; modal should grow by one row.
    await page.locator('button:has-text("Add Bay")').click();
    await expect.poll(() => page.locator('button[title="Delete bay"]').count())
      .toBe(initialDeleteButtons + 1);

    // Delete the freshly added row (last in the list).
    await page.locator('button[title="Delete bay"]').last().click();
    await expect.poll(() => page.locator('button[title="Delete bay"]').count())
      .toBe(initialDeleteButtons);

    // Close the modal.
    await page.locator('button:has-text("Done")').click();
    await expect(page.locator('text=Add, remove or reassign loading docks.')).not.toBeVisible();
  });
});

test.describe('Offline sync (fix/sync)', () => {
  test('clock-in queues to IndexedDB when offline and clears on reconnect', async ({ page, context }) => {
    await loginAs(page, { role: 'driver' });

    // Driver landing screen shows the CHECK_IN step ("Initialize Session.").
    // The user has onDuty=false in the injected state, so CHECK_IN is the entry.
    await expect(page.locator('text=Initialize').first()).toBeVisible({ timeout: 15_000 });

    // Go offline before clicking clock-in. runOrQueue should detect
    // navigator.onLine === false and enqueue instead of calling api.clockIn.
    await context.setOffline(true);

    await page.locator('button:has-text("Validate Identity")').click();

    // The portal advances to BRIEFING ("Safety & Protocol") either way.
    await expect(page.locator('text=Safety').first()).toBeVisible({ timeout: 10_000 });

    // Inspect IndexedDB directly to confirm the pending update landed.
    const pendingCount = await page.evaluate(async () => {
      return new Promise<number>((resolve, reject) => {
        const req = indexedDB.open('ShipstackOfflineDB');
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('pendingUpdates')) { resolve(0); return; }
          const tx = db.transaction('pendingUpdates', 'readonly');
          const countReq = tx.objectStore('pendingUpdates').count();
          countReq.onsuccess = () => resolve(countReq.result);
          countReq.onerror = () => reject(countReq.error);
        };
        req.onerror = () => reject(req.error);
      });
    });
    expect(pendingCount).toBeGreaterThanOrEqual(1);

    // Come back online; dispatch the 'online' event to wake syncService.
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // The sync should drain pendingUpdates within a few seconds.
    await expect.poll(async () => {
      return await page.evaluate(async () => {
        return new Promise<number>((resolve) => {
          const req = indexedDB.open('ShipstackOfflineDB');
          req.onsuccess = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('pendingUpdates')) { resolve(0); return; }
            const tx = db.transaction('pendingUpdates', 'readonly');
            const countReq = tx.objectStore('pendingUpdates').count();
            countReq.onsuccess = () => resolve(countReq.result);
            countReq.onerror = () => resolve(-1);
          };
          req.onerror = () => resolve(-1);
        });
      });
    }, { timeout: 20_000, intervals: [500, 1000, 2000] }).toBe(0);
  });
});

test.describe('Supabase realtime (feat/realtime)', () => {
  test('useRealtimeTable opens a realtime websocket when supabase is configured', async ({ page }) => {
    test.skip(!process.env.VITE_SUPABASE_URL, 'Supabase not configured in this environment');

    // supabase-js opens a WebSocket to /realtime/v1/websocket when any channel
    // subscribes. Listen for either the WS upgrade or any /realtime/v1/ request.
    const wsPromise = page.waitForRequest(req => req.url().includes('/realtime/v1/'), { timeout: 15_000 });

    await loginAs(page, { role: 'admin' });
    // DNQueue subscribes to delivery_notes + trips.
    await page.goto('/#/admin/queue');

    const wsReq = await wsPromise;
    expect(wsReq.url()).toContain('/realtime/v1/');
  });
});
