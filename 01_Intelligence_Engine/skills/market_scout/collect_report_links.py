import asyncio
from playwright.async_api import async_playwright
import os
import json
from datetime import datetime, timedelta
import re

async def collect_report_links(category_url, years=3):
    session_path = "data/ferroalloy_session.json"
    limit_date = datetime.now() - timedelta(days=365*years)
    
    links = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # We need the session to avoid captchas on the list page
        context = await browser.new_context(storage_state=session_path) if os.path.exists(session_path) else await browser.new_context()
        page = await context.new_page()
        
        page_num = 1
        keep_going = True
        
        print(f"Collecting reports from {category_url} back to {limit_date.strftime('%Y-%m-%d')}...")
        
        while keep_going:
            url = f"{category_url}?page={page_num}"
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                # Check for robot detection
                content = await page.content()
                if "TencentCaptcha" in content:
                    print("Captcha detected. Cannot proceed with automatic listing.")
                    break
                
                # Extract all <a> tags with report IDs
                # IDs are like p_2528659.aspx
                # Titles often contain the date or category name
                # Example: <a href="p_2528659.aspx" ...>3月17日锆系产品行情汇总</a>
                items = await page.query_selector_all("a[href^='p_']")
                if not items:
                    print(f"No more items found on page {page_num}.")
                    break
                
                found_in_page = 0
                for item in items:
                    title = await item.inner_text()
                    href = await item.get_attribute("href")
                    # Match dates in title: e.g. "3月17日" or "2024年3月17日"
                    date_match = re.search(r"(\d{1,2})月(\d{1,2})日", title)
                    if date_match:
                        # Guess the year based on current month/day
                        month = int(date_match.group(1))
                        day = int(date_match.group(2))
                        # For reports, the IDs are sequential, we can use them to help guess the year
                        # Or just stop when the ID sequence or list order seems too old
                        links.append({"title": title, "href": href})
                        found_in_page += 1
                
                print(f"Page {page_num}: Found {found_in_page} reports.")
                
                # Heuristic: stop after 50 pages or if we went back enough
                if page_num > 50:
                    break
                    
                page_num += 1
                
            except Exception as e:
                print(f"Error on page {page_num}: {e}")
                break
        
        await browser.close()
    return links

if __name__ == "__main__":
    # Test for Zirconium list
    links = asyncio.run(collect_report_links("https://www.cnfeol.com/gao/list_p.aspx", years=1))
    print(f"Total links found: {len(links)}")
    if links:
        print(f"Latest: {links[0]}")
        print(f"Oldest in sample: {links[-1]}")
