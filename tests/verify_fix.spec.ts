import { test, expect } from '@playwright/test';

test('verify teacher dashboard discipline widget no 400 error', async ({ page }) => {
  // Mock auth user (Restricted Teacher)
  const mockUser = {
    id: '58782b19-fd56-4520-b8dc-5a0e57b5fa5a',
    email: 'teacher@test.com',
    role: 'teacher',
    teacher_id: '62c62390-8a44-4be3-98e9-32f37c0fe455',
    center_id: '9721d262-6355-4117-a274-42609be08c1d',
    teacher_scope_mode: 'restricted'
  };

  await page.addInitScript((user) => {
    window.localStorage.setItem('auth_user', JSON.stringify(user));
  }, mockUser);

  // Monitor for console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || (msg.type() === 'warning' && msg.text().includes('400'))) {
      errors.push(msg.text());
    }
  });

  await page.goto('http://localhost:8080/teacher-dashboard');

  // Wait for some time for queries to fire
  await page.waitForTimeout(5000);

  // Check if any 400 errors were logged
  const badRequests = errors.filter(e => e.includes('400') || e.includes('Bad Request'));
  console.log('Detected console errors:', badRequests);

  if (badRequests.length > 0) {
     throw new Error(`Detected 400 Bad Request errors: ${badRequests.join('\n')}`);
  }

  // Take a screenshot of the dashboard
  await page.screenshot({ path: '/home/jules/verification/teacher_dashboard_fixed.png', fullPage: true });
});
