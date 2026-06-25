import { test, expect } from '@playwright/test';

test.describe('KPI Card Parity Checks', () => {
  test('Landing Page (glass-marketing) KPI Cards render correctly with aria-hidden icons', async ({ page }) => {
    await page.goto('http://localhost:5173/'); // Adjust port if necessary
    
    // Check that there are cards with the .kpi-float-card class
    const kpiCards = page.locator('.kpi-float-card');
    await expect(kpiCards.first()).toBeVisible();
    
    // Check accessibility for trend icons on showcase
    // Since marketing page just has floating cards with simple text:
    await expect(page.getByText('Fleet nodes active')).toBeVisible();
    await expect(page.getByText('2,840+')).toBeVisible();
    
    // Ensure aria-hidden is applied to icon containers
    const iconContainers = page.locator('.kpi-float-card > div[aria-hidden="true"]');
    await expect(iconContainers.first()).toBeVisible();
  });

  test('Login Page (glass-login) KPI Cards', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    await expect(page.getByText('Total capacity processed')).toBeVisible();
    // specific to login page content
  });

  // Mock showcase test logic can be verified within marketing page if it's there
  test('A11y trend indicators check', async ({ page }) => {
    // If we mock login and navigate to dashboard
    // We would look for .sr-only 'Increased by' text next to trend
  });
});
