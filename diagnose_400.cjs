const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Mock authentication
  await page.addInitScript(() => {
    const authData = {
      user: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'test@example.com',
        role: 'center',
        center_id: '00000000-0000-0000-0000-000000000000'
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };
    window.localStorage.setItem('auth_user', JSON.stringify(authData));
    // Mocking center data to avoid 404/400 on initial fetch if possible
    window.localStorage.setItem('center_id', '00000000-0000-0000-0000-000000000000');
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    }
  });

  page.on('requestfailed', request => {
    console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`HTTP ERROR ${response.status()}: ${response.url()}`);
      response.json().then(json => console.log('Response body:', JSON.stringify(json))).catch(() => {});
    }
  });

  console.log('Navigating to /register...');
  try {
    await page.goto('http://localhost:8080/#/register', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('Register page loaded.');
    await page.screenshot({ path: 'register_diag.png' });
  } catch (e) {
    console.log('Navigation to /register failed:', e.message);
  }

  console.log('Navigating to /homework...');
  try {
    await page.goto('http://localhost:8080/#/homework', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('Homework page loaded.');
    await page.screenshot({ path: 'homework_diag.png' });
  } catch (e) {
    console.log('Navigation to /homework failed:', e.message);
  }

  await browser.close();
})();
