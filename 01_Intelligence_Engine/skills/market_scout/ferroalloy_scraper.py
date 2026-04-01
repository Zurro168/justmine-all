import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import os
import sys
from datetime import datetime

# Configure encoding for Windows
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
sys.stdout.reconfigure(encoding='utf-8')

def manual_table_format(rows):
    if not rows: return ""
    md = []
    for i, row in enumerate(rows):
        md.append("| " + " | ".join(row) + " |")
        if i == 0:
            md.append("| " + " | ".join(["---"] * len(row)) + " |")
    return "\n".join(md)

async def scrape_all_prices():
    session_path = "data/ferroalloy_session.json"
    if not os.path.exists(session_path):
        return "[Error] No session file found. Please run scripts/ferroalloy_edge_auto_wait.py once with user assistance."

    urls = {
        "锆系 (Zircon)": "https://www.cnfeol.com/gao/p_2528659.aspx",
        "钛系 (Titanium)": "https://www.cnfeol.com/tai/p_2528657.aspx",
        "钛矿外盘 (Titanium Ore)": "https://www.cnfeol.com/taikuang/p_2528335.aspx"
    }

    report = [f"# 🛡️ 正矿供应链 · 铁合金在线价格速递 ({datetime.now().strftime('%Y-%m-%d %H:%M')})"]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(
            storage_state=session_path,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0"
        )
        page = await context.new_page()
        await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        for category, url in urls.items():
            print(f"Fetching {category}...")
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                await asyncio.sleep(5)
                
                content = await page.content()
                if "TencentCaptcha" in content:
                    report.append(f"\n## ⚠️ {category}\n> [!WARNING]\n> 检测到人机验证(CAPTCHA)。请手动运行 `ferroalloy_edge_auto_wait.py` 更新会话。")
                    continue
                
                soup = BeautifulSoup(content, 'lxml')
                tables = soup.select("table")
                
                if not tables:
                    report.append(f"\n## 📊 {category}\n[抓取失败]：未找到结构化价格表格。")
                    continue

                report.append(f"\n## 📊 {category}")
                for i, table in enumerate(tables[:3]):
                    rows = []
                    for tr in table.select("tr"):
                        cols = [td.get_text(strip=True).replace("|", " ") for td in tr.select("td, th")]
                        if any(cols):
                            rows.append(cols)
                    
                    if rows:
                        report.append(f"\n### {category} 明细 {i+1}")
                        report.append(manual_table_format(rows))

            except Exception as e:
                report.append(f"\n## ❌ {category}\n[异常]：{str(e)}")

        await browser.close()
    
    return "\n".join(report)

if __name__ == "__main__":
    final_report = asyncio.run(scrape_all_prices())
    print(final_report)
    
    os.makedirs("logs", exist_ok=True)
    with open(f"logs/market_report_{datetime.now().strftime('%Y%m%d_%H%M')}.md", "w", encoding="utf-8") as f:
        f.write(final_report)
