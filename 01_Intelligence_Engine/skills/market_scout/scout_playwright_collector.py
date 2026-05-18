"""
Scout Playwright Collector — 会员专区数据抓取（服务器端）
复用已有登录态 session JSON，无需人工登录。
当 session 过期时，需重新运行 login_session.py 更新。
"""
import asyncio
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

from playwright.async_api import async_playwright
import pandas as pd

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# ===== 配置 =====
SESSION_DIR = os.getenv("SCOUT_SESSION_DIR", os.path.join(os.path.dirname(__file__), "data"))
SESSION_FILE = os.path.join(SESSION_DIR, "ferroalloy_session.json")
HISTORY_FILE = os.getenv(
    "SCOUT_HISTORY_FILE",
    os.path.join(os.path.dirname(__file__), "data", "market_indices_history.csv"),
)

# 会员专区需要登录才能访问的页面 URL（价格明细表）
MEMBER_PAGES = {
    "zircon": {
        "url": "https://www.cnfeol.com/gao/p_2528659.aspx",
        "index_name": "锆精矿(ZrSiO4 65%)",
    },
    "titanium": {
        "url": "https://www.cnfeol.com/tai/p_2528657.aspx",
        "index_name": "四川钛精矿(Ti>47%)",
    },
}


async def scrape_member_page(page, url: str, index_name: str) -> list[dict]:
    """抓取一个会员页面，返回 [{date, value}, ...]"""
    await page.goto(url, wait_until="domcontentloaded", timeout=60000)
    await asyncio.sleep(2)  # 等 JS 渲染

    content = await page.content()
    if "TencentCaptcha" in content:
        print(f"  ⚠️  {index_name}: 触发腾讯验证码，session 可能已过期")
        return []

    from bs4 import BeautifulSoup

    soup = BeautifulSoup(content, "lxml")
    tables = soup.select("table.dataListTable, table")
    results = []

    for table in tables[:2]:  # 取前两个表（通常是最新价格表）
        for tr in table.select("tr")[1:]:  # 跳过表头
            cols = tr.select("td")
            if len(cols) >= 2:
                date_str = cols[0].get_text(strip=True)
                value_str = cols[1].get_text(strip=True)
                try:
                    # 清洗日期格式：2024-01-15 或 2024/01/15
                    date_str = date_str.replace("/", "-")
                    value = float(value_str.replace(",", ""))
                    results.append({"date": date_str, "value": value, "index_name": index_name})
                except ValueError:
                    pass
    return results


async def run_playwright_collection() -> bool:
    """使用 Playwright + 已保存的 session 抓取会员数据"""
    if not os.path.exists(SESSION_FILE):
        print("[Scout-PW] 未找到 session 文件，跳过会员数据抓取")
        print(f"[Scout-PW] 请先运行: python scout_login.py 生成 {SESSION_FILE}")
        return False

    os.makedirs(os.path.dirname(HISTORY_FILE), exist_ok=True)

    print(f"[Scout-PW] 加载 session: {SESSION_FILE}")

    all_data = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            storage_state=SESSION_FILE,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        )
        # 防检测
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = await context.new_page()

        for key, info in MEMBER_PAGES.items():
            print(f"[Scout-PW] 抓取: {info['index_name']}")
            try:
                rows = await scrape_member_page(page, info["url"], info["index_name"])
                if rows:
                    print(f"  ✅ 获取 {len(rows)} 条记录")
                    all_data.extend(rows)
                else:
                    print(f"  ❌ 未获取到数据")
            except Exception as e:
                print(f"  ❌ 异常: {e}")

        await browser.close()

    if not all_data:
        print("[Scout-PW] 未抓到任何会员数据")
        return False

    # 合并到历史 CSV
    df = pd.DataFrame(all_data)
    df["index_id"] = "pw_" + df["index_name"]  # 加前缀区分来源

    if os.path.exists(HISTORY_FILE):
        existing = pd.read_csv(HISTORY_FILE)
        df = pd.concat([existing, df]).drop_duplicates(subset=["date", "index_id"])

    df = df.sort_values(by=["index_id", "date"], ascending=[True, False])
    df.to_csv(HISTORY_FILE, index=False)
    print(f"[Scout-PW] 已保存 {len(df)} 条记录到 {HISTORY_FILE}")
    return True


if __name__ == "__main__":
    success = asyncio.run(run_playwright_collection())
    sys.exit(0 if success else 1)
