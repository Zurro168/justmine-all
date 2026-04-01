import asyncio
from playwright.async_api import async_playwright
import os

async def check_report_page():
    session_path = "data/ferroalloy_session.json"
    url = "https://www.cnfeol.com/gao/p_2528659.aspx"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Try to load session
        if os.path.exists(session_path):
            print("Loading session...")
            context = await browser.new_context(storage_state=session_path)
        else:
            print("No session file found, using clean context.")
            context = await browser.new_context()
            
        page = await context.new_page()
        print(f"Navigating to {url}...")
        await page.goto(url, wait_until="networkidle")
        
        # Check if login or captcha
        content = await page.content()
        if "登录" in content and "退出" not in content:
            print("Detected Login Page or restricted access.")
        elif "TencentCaptcha" in content:
            print("Detected Captcha.")
        else:
            print("Page loaded successfully! Extracting table...")
            # Try to grab the tables
            tables = await page.query_selector_all("table")
            print(f"Found {len(tables)} tables.")
            if tables:
                table_text = await tables[0].inner_text()
                print("Table Sample:", table_text[:200])
        
        await page.screenshot(path="data/debug/scout_report_check.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(check_report_page())
