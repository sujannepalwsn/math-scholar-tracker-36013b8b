import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 375, height: 667 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
});

test('Lesson Plan Modal Mobile Verification', async ({ page }) => {
  // Go to lesson plans page using mock auth
  await page.goto('http://localhost:8080/lesson-plans?mock_user=teacher');

  // Wait for page to load
  await page.waitForSelector('text=Lesson Hub');

  // Click Create Plan button
  await page.click('button:has-text("CREATE PLAN")');

  // Wait for dialog to open
  await page.waitForSelector('text=Construct New Lesson Plan');

  // Capture screenshot of the top-aligned modal
  await page.screenshot({ path: 'tests/screenshots/lesson-plan-modal-mobile.png', fullPage: false });

  // Verify it is at the top
  const dialog = await page.locator('[role="dialog"]');
  const box = await dialog.boundingBox();
  expect(box?.y).toBeLessThan(10); // Should be at the very top (top-0)

  console.log('Mobile Lesson Plan Modal verified at top of screen.');
});
