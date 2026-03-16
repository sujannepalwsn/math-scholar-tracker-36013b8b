import { test, expect } from '@playwright/test';

test('verify inventory and transport pages', async ({ page }) => {
  await page.goto('http://localhost:8080/hr-management');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/hr_final.png' });

  await page.goto('http://localhost:8080/inventory');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/inventory_final.png' });

  await page.goto('http://localhost:8080/transport');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/transport_final.png' });

  await page.goto('http://localhost:8080/center-dashboard');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'verification/dashboard_final.png' });
});
