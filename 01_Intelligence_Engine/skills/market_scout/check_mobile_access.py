import asyncio
from playwright.async_api import async_playwright
import os

async def check_mobile_report():
    url = "https://m.cnfeol.com/gao/p_2528659.aspx"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Emulate iPhone
        device = p.devices['iPhone 13']
        context = await browser.new_context(**device)
        page = await context.new_page()
        
        print(f"Navigating to mobile: {url}...")
        await page.goto(url, wait_until="networkidle")
        
        # Check content
        content = await page.content()
        if "TencentCaptcha" in content:
            print("Detected Captcha on Mobile too.")
        elif "会员" in content and "登录" in content:
            print("Detected Login requirement on Mobile.")
        else:
            print("Mobile page loaded! Checking for tables...")
            tables = await page.query_selector_all("table")
            print(f"Found {len(tables)} tables.")
            if tables:
                text = await tables[0].inner_text()
                print("Table Sample:", text[:200])
        
        await page.screenshot(path="data/debug/scout_mobile_check.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(check_mobile_report())
