import asyncio
from playwright.async_api import async_playwright
import os
import json

async def test_api_playwright():
    session_path = "data/ferroalloy_session.json"
    url = "https://www.cnfeol.com/Data/ArticleList.ashx?lType=ListJsonCombine&pSize=20&cCode=MP-6&sCode=020000000000000&gCode=&pIndex=1"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        if os.path.exists(session_path):
            context = await browser.new_context(storage_state=session_path)
        else:
            context = await browser.new_context()
            
        page = await context.new_page()
        
        # Set headers to match browser
        await context.set_extra_http_headers({
            "Referer": "https://www.cnfeol.com/gao/list_p.aspx",
            "X-Requested-With": "XMLHttpRequest"
        })
        
        print(f"Requesting API via playwright context: {url}")
        # Use page.request for API calls in the same context
        resp = await page.request.get(url)
        print(f"Status: {resp.status}")
        if resp.status == 200:
            text = await resp.text()
            print(f"Body snippet (first 200 chars): {text[:200]}")
            if text:
                try:
                    data = await resp.json()
                    print(f"Successfully parsed JSON. Items: {len(data.get('list', []))}")
                except:
                    print("Failed to parse JSON, testing if it is a string representation.")
        else:
            print("Failed. Status:", resp.status)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_api_playwright())
