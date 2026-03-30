import { chromium } from 'playwright';

async function run() {
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
    window.localStorage.setItem('center_id', '00000000-0000-0000-0000-000000000000');
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`BROWSER ERROR: ${msg.text()}`);
    }
  });

  page.on('response', async response => {
    if (response.status() >= 400) {
      console.log(`HTTP ERROR ${response.status()}: ${response.url()}`);
      try {
        const body = await response.json();
        console.log('Response body:', JSON.stringify(body));
      } catch (e) {}
    }
  });

  console.log('Navigating to /register...');
  await page.goto('http://localhost:8080/#/register', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'register_fixed.png' });

  console.log('Navigating to /homework...');
  await page.goto('http://localhost:8080/#/homework', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'homework_fixed.png' });

  await browser.close();
}

run().catch(console.error);
