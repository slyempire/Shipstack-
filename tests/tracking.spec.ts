import { test, expect } from '@playwright/test';

/**
 * Public package tracking — no auth required. A customer with a tracking
 * link must always get a working page.
 */

test.describe('Public tracking', () => {
  test('tracking page renders a search/lookup input', async ({ page }) => {
    await page.goto('/#/track');
    await expect(page.locator('input').first()).toBeVisible({ timeout: 15_000 });
  });

  test('tracking an unknown ID does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/#/track/DOES-NOT-EXIST-123');
    // Page must render (not white-screen); unknown IDs show a not-found state
    await expect(page.locator('#root, body > div').first()).not.toBeEmpty();
    expect(errors, `Runtime errors: ${errors.join('; ')}`).toHaveLength(0);
  });
});
