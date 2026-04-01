import asyncio
from playwright.async_api import async_playwright
import os
import re

async def test_link_collection():
    session_path = "data/ferroalloy_session.json"
    url = "https://www.cnfeol.com/gao/list_p.aspx"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        if os.path.exists(session_path):
            context = await browser.new_context(storage_state=session_path)
        else:
            context = await browser.new_context()
            
        page = await context.new_page()
        print(f"Accessing list page: {url}...")
        await page.goto(url, wait_until="domcontentloaded")
        
        # Check for captcha or login
        content = await page.content()
        if "TencentCaptcha" in content:
            print("Still blocked by Captcha.")
            await page.screenshot(path="data/debug/list_captcha.png")
            await browser.close()
            return

        # Try multiple selectors for links
        # div.listItem a, ul.newsList li a, etc.
        links = []
        # Let's find all <a> tags that contain the typical report keywords
        all_as = await page.query_selector_all("a")
        for a in all_as:
            text = await a.inner_text()
            href = await a.get_attribute("href")
            if href and "p_" in href and any(kw in text for kw in ["行情汇总", "快报", "报价"]):
                links.append({"title": text, "href": href})
        
        print(f"Found {len(links)} candidate links on page 1.")
        for l in links[:5]:
            print(f" - {l['title']} -> {l['href']}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_link_collection())
