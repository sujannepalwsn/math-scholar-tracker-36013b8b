import { test, expect } from '@playwright/test';

test('verify attendance scope restriction', async ({ page }) => {
  // Mock auth state for teacher
  await page.addInitScript(() => {
    window.localStorage.setItem('auth_user', JSON.stringify({
      id: '62c62390-8a44-4be3-98e9-32f37c0fe455',
      role: 'teacher',
      center_id: '9721d262-6355-4117-a274-42609be08c1d',
      teacher_id: '62c62390-8a44-4be3-98e9-32f37c0fe455',
      teacher_scope_mode: 'restricted'
    }));
  });

  // Navigate to attendance page
  await page.goto('http://localhost:8080/#/teacher/take-attendance');

  // Wait for the Security Audit panel
  const auditPanel = page.locator('text=Security Audit: Assigned Scope');
  await expect(auditPanel).toBeVisible();

  // Get the text content to see assigned grades
  const auditText = await auditPanel.evaluate(el => el.parentElement?.innerText);
  console.log('Audit Text:', auditText);

  // Take a screenshot
  await page.screenshot({ path: 'attendance_scope_check.png' });

  // Verify that it contains 9 and 10, but NOT Nursery or 1
  expect(auditText).toContain('9');
  expect(auditText).toContain('10');
  expect(auditText).not.toContain('Nursery');
  expect(auditText).not.toContain('Grade 1');
});
