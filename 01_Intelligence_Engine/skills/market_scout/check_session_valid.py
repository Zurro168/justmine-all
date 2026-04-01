import asyncio
from playwright.async_api import async_playwright
import os

async def check_session_validity():
    session_path = "data/ferroalloy_session.json"
    url = "https://www.cnfeol.com/gao/list_p.aspx"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        if os.path.exists(session_path):
            context = await browser.new_context(storage_state=session_path)
            print("Session file loaded.")
        else:
            context = await browser.new_context()
            print("No session file found.")
            
        page = await context.new_page()
        print(f"Checking {url}...")
        await page.goto(url, wait_until="networkidle")
        
        content = await page.content()
        if "登录" in content and "退出" not in content:
            print("RESULT: Session INVALID (Redirected to Login).")
        elif "退出" in content or "会员" in content:
            print("RESULT: Session VALID (Found 'Logout' or member link).")
        else:
            print("RESULT: UNKNOWN (Not finding common login/logout indicators).")
            # Look for article links
            links = await page.query_selector_all("a[href^='p_']")
            print(f"Found {len(links)} links on the page.")

        await page.screenshot(path="data/debug/session_check_result.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(check_session_validity())
