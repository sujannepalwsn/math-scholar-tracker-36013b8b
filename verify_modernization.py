
from playwright.sync_api import sync_playwright, expect

def verify_all_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create context with a larger viewport
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            # 1. Check Login Page (UI Modernization & Glassmorphism)
            page.goto("http://localhost:8080")
            page.wait_for_timeout(2000)
            page.screenshot(path="tests/screenshots/1_login_page.png")
            print("Captured Login Page")

            # 2. Check Dashboard (KPI Cards & Pulse Header) - We might need to mock auth in localStorage
            # Since the app uses localStorage, we can inject a mock user
            page.evaluate("""
                localStorage.setItem('auth_user', JSON.stringify({
                    id: 'mock-id',
                    username: 'admin',
                    role: 'center',
                    center_id: 'mock-center-id',
                    center_name: 'Math Scholar Academy'
                }));
            """)
            page.goto("http://localhost:8080/dashboard")
            page.wait_for_timeout(2000)
            page.screenshot(path="tests/screenshots/2_dashboard.png")
            print("Captured Dashboard")

            # 3. Check Inventory (Master-Detail)
            page.goto("http://localhost:8080/inventory")
            page.wait_for_timeout(2000)
            page.screenshot(path="tests/screenshots/3_inventory.png")
            print("Captured Inventory")

            # 4. Check Teacher Management (Master-Detail)
            page.goto("http://localhost:8080/staff-hr")
            page.wait_for_timeout(2000)
            page.screenshot(path="tests/screenshots/4_staff_hr.png")
            print("Captured Staff HR")

            # 5. Check About Institution (Parallax & Fixed Hooks)
            page.goto("http://localhost:8080/about-institution")
            page.wait_for_timeout(2000)
            page.screenshot(path="tests/screenshots/5_about_institution.png")
            print("Captured About Institution")

            # 6. Check Mobile Dialog (Top Alignment)
            iphone = p.devices['iPhone 12']
            mobile_context = browser.new_context(**iphone)
            mobile_page = mobile_context.new_page()
            mobile_page.goto("http://localhost:8080")
            mobile_page.evaluate("""
                localStorage.setItem('auth_user', JSON.stringify({
                    id: 'mock-id',
                    username: 'teacher',
                    role: 'teacher',
                    center_id: 'mock-center-id',
                    teacher_id: 'mock-teacher-id'
                }));
            """)
            mobile_page.goto("http://localhost:8080/lesson-plans")
            mobile_page.wait_for_timeout(2000)

            # Open the dialog
            create_btn = mobile_page.get_by_role("button", name="CREATE PLAN")
            if create_btn.is_visible():
                create_btn.click()
                mobile_page.wait_for_timeout(1000)
                mobile_page.screenshot(path="tests/screenshots/6_mobile_dialog.png")
                print("Captured Mobile Dialog")
            else:
                print("Create Plan button not found on mobile")

        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs("tests/screenshots", exist_ok=True)
    verify_all_changes()
