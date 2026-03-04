import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # Helper to take screenshots
        async def snap(url, name_prefix):
            await page.goto(url)
            await page.wait_for_timeout(2000) # Wait for animations
            # Desktop
            await page.set_viewport_size({"width": 1280, "height": 800})
            await page.screenshot(path=f"{name_prefix}_desktop_updated.png")
            # Mobile
            await page.set_viewport_size({"width": 375, "height": 667})
            await page.screenshot(path=f"{name_prefix}_mobile_updated.png")

        await snap("http://localhost:8080/login", "login")
        await snap("http://localhost:8080/login-admin", "admin_login")
        await snap("http://localhost:8080/init-admin", "init_admin")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
