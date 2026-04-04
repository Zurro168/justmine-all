import requests
import pandas as pd
import json
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import os
import sys
import time

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Load configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "scout_config.json")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    CONFIG = json.load(f)

DATA_DIR = CONFIG["output_paths"].get("data_dir", "../data/scout")
HISTORY_FILE = CONFIG["output_paths"].get("history_csv", os.path.join(DATA_DIR, "market_indices_history.csv"))
INDICES = CONFIG.get("market_indices", {})
HISTORY_YEARS = CONFIG.get("history_years", 3)

from playwright.sync_api import sync_playwright

def fetch_page(index_code, page_index, start_date, end_date):
    """使用 Playwright 模拟浏览器请求 (防止被 index.cnfeol.com 拦截)"""
    url = f"https://index.cnfeol.com/IndexData.ashx?indexcode={index_code}&pageindex={page_index}&startDate={start_date}&endDate={end_date}"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # 模拟真实用户的 User-Agent
            page.set_extra_http_headers({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            })
            # 访问 URL 并等待响应 (如果是 ASHX 也要看返回内容)
            page.goto(url, wait_until="networkidle")
            
            # 获取文本内容 (假设它是 JSON)
            content = page.locator("body").inner_text()
            data = json.loads(content)
            return data
        except Exception as e:
            print(f"Playwright Error fetching {index_code}: {e}")
        finally:
            browser.close()
    return None

def parse_table_html(html):
    if not html: return []
    soup = BeautifulSoup(html, 'lxml')
    rows = []
    for tr in soup.select("tr")[1:]: # Skip header
        cols = tr.select("td")
        if len(cols) >= 2:
            date = cols[0].get_text(strip=True)
            value = cols[1].get_text(strip=True)
            try:
                rows.append({"date": date, "value": float(value)})
            except:
                pass
    return rows

def sync_index_history(index_code, name, start_years=3):
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=365*start_years)).strftime("%Y-%m-%d")
    
    all_data = []
    page = 1
    print(f"Syncing {name} ({index_code}) from {start_date} to {end_date}...")
    
    while True:
        data = fetch_page(index_code, page, start_date, end_date)
        if not data or 'tableHtml' not in data:
            print(f"  Reached end or error at page {page} for {index_code}")
            break
        
        page_data = parse_table_html(data['tableHtml'])
        if not page_data:
            print(f"  No more records on page {page} for {index_code}")
            break
        
        all_data.extend(page_data)
        print(f"  Fetched page {page}/{data.get('pageCount', '?')} ({len(page_data)} records)")
        
        # Check if we have more pages
        if page >= data.get('pageCount', 1):
            break
        
        page += 1
        time.sleep(1)
    
    if all_data:
        df = pd.DataFrame(all_data)
        df['index_id'] = index_code
        df['index_name'] = name
        return df
    return None

def run_scout_collection(years=3):
    os.makedirs(DATA_DIR, exist_ok=True)
    all_indices_df = []
    
    for code, name in INDICES.items():
        df = sync_index_history(code, name, years)
        if df is not None:
            all_indices_df.append(df)
            
    if all_indices_df:
        final_df = pd.concat(all_indices_df)
        # Handle duplicates and sort
        if os.path.exists(HISTORY_FILE):
            existing_df = pd.read_csv(HISTORY_FILE)
            final_df = pd.concat([existing_df, final_df]).drop_duplicates(subset=['date', 'index_id'])
            
        final_df = final_df.sort_values(by=['index_id', 'date'], ascending=[True, False])
        final_df.to_csv(HISTORY_FILE, index=False)
        print(f"Successfully updated {HISTORY_FILE}. Total records: {len(final_df)}")
        return True
    return False

if __name__ == "__main__":
    run_scout_collection(years=HISTORY_YEARS)
