import asyncio
from playwright.async_api import async_playwright
import os

async def dump_list_html():
    session_path = "data/ferroalloy_session.json"
    url = "https://www.cnfeol.com/gao/list_p.aspx"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        if os.path.exists(session_path):
            context = await browser.new_context(storage_state=session_path)
        else:
            context = await browser.new_context()
        
        page = await context.new_page()
        await page.goto(url, wait_until="domcontentloaded")
        
        # Take a screenshot again to be sure
        await page.screenshot(path="data/debug/list_debug.png")
        
        # Dump the HTML of the main container
        # Usually it's in a div with some class
        content = await page.content()
        with open("data/debug/list_content.html", "w", encoding="utf-8") as f:
            f.write(content)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(dump_list_html())
