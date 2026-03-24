import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Desktop
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})
        await page.goto('http://localhost:8080/login', wait_until='networkidle')
        await page.screenshot(path='desktop_header_final.png')

        # Mobile
        await page.set_viewport_size({'width': 375, 'height': 667})
        await page.goto('http://localhost:8080/login', wait_until='networkidle')
        await page.screenshot(path='mobile_header_final.png')

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
