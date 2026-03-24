
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # We can't easily log in, but we can try to render the page by mocking localStorage
        context = await browser.new_context()
        page = await context.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        # Mock auth_user in localStorage
        await page.add_init_script("""
            localStorage.setItem('auth_user', JSON.stringify({
                id: 'test-parent-id',
                username: 'parent@test.com',
                role: 'parent',
                center_id: 'test-center-id',
                linked_students: []
            }));
        """)

        print("Navigating to Parent Dashboard...")
        try:
            await page.goto("http://localhost:8080/#/parent-dashboard", wait_until="networkidle", timeout=30000)
            await asyncio.sleep(5)
            await page.screenshot(path="parent_dashboard_debug.png")
            print("Screenshot saved.")
        except Exception as e:
            print(f"Error: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
