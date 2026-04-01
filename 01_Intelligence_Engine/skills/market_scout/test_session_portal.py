import asyncio
from playwright.async_api import async_playwright
import os
import json

async def test_session_history():
    session_path = "data/ferroalloy_session.json"
    if not os.path.exists(session_path):
        print("No session file found.")
        return

    async with async_playwright() as p:
        # Use Chromium with the session
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(storage_state=session_path)
        page = await context.new_page()
        
        # Try to go to a product history page or the chart tool
        # Example: Zircon Sand Australian 66%
        # Let's try to just see if we are logged in on the data portal
        print("Navigating to data.cnfeol.com...")
        await page.goto("https://data.cnfeol.com/chartv2/", wait_until="networkidle")
        
        # Check for user info or if we can see the chart
        content = await page.content()
        is_logged_in = "退出" in content or "会员" in content
        print(f"Logged in detected: {is_logged_in}")
        
        # Take a screenshot to verify state
        await page.screenshot(path="data/debug/data_portal_test.png")
        
        # Try to find a data table if present
        tables = await page.query_selector_all("table")
        print(f"Tables found: {len(tables)}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_session_history())
