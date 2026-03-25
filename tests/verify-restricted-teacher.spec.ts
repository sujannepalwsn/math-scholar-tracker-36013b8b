import { test, expect } from '@playwright/test';

test('Restricted teacher should not see all grades in attendance', async ({ page }) => {
  // Mock the auth_user to be a teacher with no scope mode explicitly set (should default to restricted)
  const mockTeacher = {
    id: 'teacher-uuid',
    username: 'teacher@test.com',
    role: 'teacher',
    center_id: 'center-uuid',
    teacher_id: 'teacher-profile-uuid',
    teacher_name: 'Test Teacher'
  };

  await page.goto('http://localhost:8080/');
  await page.evaluate((user) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }, mockTeacher);

  // Go to attendance page
  await page.goto('http://localhost:8080/teacher/take-attendance');

  // Check if "All Grades" is NOT present in the grade filter
  const selectTrigger = page.locator('button:has-text("Select Grade")');
  if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      const allGradesOption = page.locator('span:has-text("All Grades")');
      await expect(allGradesOption).not.toBeVisible();
  }

  // Verify the dashboard loads without 400 errors in console (we can check console logs)
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('400')) {
      errors.push(msg.text());
    }
  });

  await page.goto('http://localhost:8080/teacher-dashboard');
  // Wait a bit for queries to fire
  await page.waitForTimeout(2000);

  expect(errors).toEqual([]);
});
