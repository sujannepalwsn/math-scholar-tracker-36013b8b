import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['Pixel 5'],
});

test('Hero Slider Mobile Visibility and Swipe', async ({ page }) => {
  // Mock Supabase response for hero_slides
  await page.route('**/rest/v1/hero_slides*', async (route) => {
    const json = [
      {
        id: '1',
        title: 'Empower Your Institution',
        subtitle: 'A comprehensive, data-driven ecosystem.',
        media_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
        media_type: 'image',
        cta_text: 'Get Started',
        cta_link: '/getting-started',
        order_index: 0,
        is_active: true,
        overlay_opacity: 0.5,
        text_align: 'center'
      },
      {
        id: '2',
        title: 'Modern Learning',
        subtitle: 'Transforming education for the future.',
        media_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f',
        media_type: 'image',
        cta_text: 'Learn More',
        cta_link: '/about',
        order_index: 1,
        is_active: true,
        overlay_opacity: 0.5,
        text_align: 'center'
      }
    ];
    await route.fulfill({ json });
  });

  // We'll use the login page since that's where the slider is integrated
  await page.goto('http://localhost:8080/login');

  // Wait for the slider to be visible
  const slider = page.locator('.embla');
  await expect(slider).toBeVisible();

  // Take a screenshot of the initial state
  await page.screenshot({ path: 'verification/mobile_hero_initial.png' });

  // Find the slide content
  const slideContent = page.locator('.embla__slide').first();
  const initialTitle = await slideContent.locator('h1').innerText();
  console.log('Initial Title:', initialTitle);

  // Perform a swipe
  const box = await slider.boundingBox();
  if (box) {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Swipe left (to next slide)
    await page.mouse.move(centerX + 100, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX - 100, centerY, { steps: 20 });
    await page.mouse.up();
  }

  // Wait for transition
  await page.waitForTimeout(1000);

  // Take a screenshot after swipe
  await page.screenshot({ path: 'verification/mobile_hero_after_swipe.png' });
});
