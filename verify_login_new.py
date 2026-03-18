from playwright.sync_api import sync_playwright, expect
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create directory for video
        os.makedirs("/home/jules/verification/video", exist_ok=True)
        context = browser.new_context(
            viewport={'width': 1280, 'height': 720},
            record_video_dir="/home/jules/verification/video"
        )
        page = context.new_page()

        try:
            # 1. Center Login
            print("Verifying Center Login...")
            page.goto("http://localhost:8081/login")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000) # Wait for animations/BG
            page.screenshot(path="verification_center.png")

            # 2. Admin Login
            print("Verifying Admin Login...")
            page.goto("http://localhost:8081/admin/login")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification_admin.png")

            # 3. Parent Login
            print("Verifying Parent Login...")
            page.goto("http://localhost:8081/parent/login")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification_parent.png")

            # 4. Teacher Login
            print("Verifying Teacher Login...")
            page.goto("http://localhost:8081/teacher/login")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification_teacher.png")

            # Check for mobile view of Center Login
            print("Verifying Mobile Center Login...")
            page.set_viewport_size({"width": 375, "height": 812})
            page.goto("http://localhost:8081/login")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification_mobile.png")

        except Exception as e:
            print(f"Error during verification: {e}")
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run()
