import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`PAGE ERROR: ${err.message}`);
  });

  try {
    console.log('Visiting /getting-started...');
    await page.goto('http://localhost:8080/#/getting-started', { waitUntil: 'networkidle' });
    const content = await page.content();
    console.log('Page title:', await page.title());
    if (content.includes('id="root"')) {
        const rootContent = await page.evaluate(() => document.getElementById('root')?.innerHTML);
        console.log('Root innerHTML length:', rootContent?.length);
        if (!rootContent || rootContent.length === 0) {
            console.log('Root is empty! JS execution failed.');
        }
    }
    await page.screenshot({ path: 'getting_started_diagnosis.png' });
  } catch (e: any) {
    console.log('Navigation failed:', e.message);
  } finally {
    await browser.close();
  }
})();
