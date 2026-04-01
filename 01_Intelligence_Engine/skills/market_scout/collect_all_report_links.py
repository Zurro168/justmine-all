import asyncio
from playwright.async_api import async_playwright
import os
import json
from datetime import datetime
import re
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

async def collect_historical_links(category_name, list_url, years=3):
    session_path = "data/ferroalloy_session.json"
    target_links = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        if os.path.exists(session_path):
            context = await browser.new_context(storage_state=session_path)
        else:
            context = await browser.new_context()
        
        page = await context.new_page()
        
        # Paginate back
        page_num = 1
        stop_collecting = False
        
        print(f"[{category_name}] Starting link collection...")
        
        while not stop_collecting and page_num <= 50: # Cap at 50 pages for now
            current_url = f"{list_url}?page={page_num}" if page_num > 1 else list_url
            try:
                await page.goto(current_url, wait_until="domcontentloaded", timeout=30000)
                
                # Check for captcha
                content = await page.content()
                if "TencentCaptcha" in content:
                    print(f"[{category_name}] Page {page_num} blocked by captcha. Stopping.")
                    break
                
                # Extract links
                # Pattern: p_xxxxxx.aspx
                # Keywords: 行情汇总, 钛矿外盘报价
                found_in_page = 0
                links = await page.query_selector_all("a[href^='p_']")
                if not links:
                    # Try absolute links
                    links = await page.query_selector_all("a[href*='/p_']")
                
                for link in links:
                    title = await link.inner_text()
                    href = await link.get_attribute("href")
                    
                    if any(kw in title for kw in ["行情汇总", "外盘报价", "行情快报"]):
                        # Check date if possible
                        date_match = re.search(r"(\d{1,2})月(\d{1,2})日", title)
                        if date_match:
                            # If we see a 2022 date (optional check or just stop after N pages)
                            pass
                        
                        target_links.append({"title": title, "url": href, "category": category_name})
                        found_in_page += 1
                
                print(f"[{category_name}] Page {page_num}: Found {found_in_page} relevant reports.")
                if found_in_page == 0 and page_num > 5: # If multiple pages have nothing, stop
                    break
                
                page_num = page_num + 1
                await asyncio.sleep(1)
                
            except Exception as e:
                print(f"[{category_name}] Error on page {page_num}: {e}")
                break
                
        await browser.close()
    return target_links

async def run_collection():
    configs = [
        ("锆系", "https://www.cnfeol.com/gao/list_p.aspx"),
        ("钛系", "https://www.cnfeol.com/tai/list_p.aspx"),
        ("钛矿外盘", "https://www.cnfeol.com/taikuang/list_p.aspx")
    ]
    
    all_links = []
    for name, url in configs:
        links = await collect_historical_links(name, url)
        all_links.extend(links)
        
    os.makedirs("data/scout", exist_ok=True)
    with open("data/scout/historical_report_links.json", "w", encoding="utf-8") as f:
        json.dump(all_links, f, ensure_ascii=False, indent=2)
    
    print(f"Saved {len(all_links)} total links to data/scout/historical_report_links.json")

if __name__ == "__main__":
    asyncio.run(run_collection())
