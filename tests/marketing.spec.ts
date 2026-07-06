import { test, expect } from '@playwright/test';

/**
 * Marketing smoke tests — the public pages must render without errors.
 * These are the first pages a prospect sees; a blank screen here is a
 * launch blocker regardless of backend state.
 */

const PUBLIC_ROUTES = [
  { path: '/#/', name: 'Landing' },
  { path: '/#/product', name: 'Product' },
  { path: '/#/pricing', name: 'Pricing' },
  { path: '/#/solutions', name: 'Solutions' },
  { path: '/#/about', name: 'About' },
  { path: '/#/contact', name: 'Contact' },
  { path: '/#/legal/privacy', name: 'Privacy Policy' },
  { path: '/#/legal/terms', name: 'Terms of Service' },
  { path: '/#/legal/cookie', name: 'Cookie Policy' }
];

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} page renders`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(route.path);
    // The SPA shell must mount something beyond the loading spinner
    await expect(page.locator('#root, [id=root], body > div').first()).not.toBeEmpty();
    // No uncaught runtime errors during initial render
    expect(errors, `Runtime errors on ${route.name}: ${errors.join('; ')}`).toHaveLength(0);
  });
}

test('unknown route falls back to landing page', async ({ page }) => {
  await page.goto('/#/this-route-does-not-exist');
  await page.waitForURL(/#\/$/);
});
