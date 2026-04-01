import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  try {
    console.log('Visiting /login...');
    await page.goto('http://localhost:8080/#/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for animations
    await page.screenshot({ path: 'login_screenshot.png' });
    console.log('Screenshot saved to login_screenshot.png');
  } catch (e: any) {
    console.log('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
