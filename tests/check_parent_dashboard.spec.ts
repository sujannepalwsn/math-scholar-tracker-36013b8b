import { test, expect } from '@playwright/test';

test('Parent Dashboard loads and does not crash', async ({ page }) => {
  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`BROWSER PAGE ERROR: ${error.message}`);
  });

  await page.goto('http://localhost:5173/parent-dashboard');
  await page.waitForTimeout(5000);
});
