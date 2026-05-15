import pandas as pd
import json
import os
from datetime import datetime, timedelta
import httpx
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Load configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "scout_config.json")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    CONFIG = json.load(f)

DATA_DIR = CONFIG["output_paths"].get("data_dir", "data/scout")
HISTORY_FILE = CONFIG["output_paths"].get("history_csv", os.path.join(DATA_DIR, "market_indices_history.csv"))
REPORTS_DIR = CONFIG["output_paths"].get("report_dir", "logs/scout_reports")
EXCEL_DIR = CONFIG["output_paths"].get("excel_dir", "data/scout/excel")
INDICES = CONFIG.get("market_indices", {})
NEWS_SOURCES = CONFIG.get("news_sources", {})

os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(EXCEL_DIR, exist_ok=True)

# 指数分类
UPSTREAM_ORE = ["钛矿综合指数", "四川钛精矿", "广东钛精矿", "金红石", "锆精矿", "独居石"]
DOWNSTREAM = ["高钛 slag", "钛白粉综合指数", "钛白粉(金红石型)"]
SHIPPING = ["波罗的海干散货指数", "巴拿马型运费指数"]


async def generate_daily_scout_report():
    if not os.path.exists(HISTORY_FILE):
        return "ERROR: History file not found. Please run scout_collector.py first."

    df = pd.read_csv(HISTORY_FILE)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='date', ascending=False)

    latest_date = df['date'].max()
    latest_data = df[df['date'] == latest_date]
    prev_date = df[df['date'] < latest_date]['date'].max()
    prev_data = df[df['date'] == prev_date] if pd.notna(prev_date) else None

    def get_change(idx_name):
        curr = latest_data[latest_data['index_name'] == idx_name]['value'].values
        if len(curr) == 0:
            return None, None
        curr_val = curr[0]
        if prev_data is not None:
            prev_vals = prev_data[prev_data['index_name'] == idx_name]['value'].values
            prev_val = prev_vals[0] if len(prev_vals) > 0 else curr_val
        else:
            prev_val = curr_val
        change_pct = ((curr_val - prev_val) / prev_val * 100) if prev_val != 0 else 0
        return curr_val, change_pct

    # Section 1: 上游矿产品价格
    ore_lines = []
    for idx_name in UPSTREAM_ORE:
        curr, change = get_change(idx_name)
        if curr is None:
            continue
        arrow = "📈" if change > 0 else "📉" if change < 0 else "➖"
        ore_lines.append(f"- {idx_name}：**{curr:.1f}** {arrow}{abs(change):.2f}%")

    # Section 2: 下游产品价格
    down_lines = []
    for idx_name in DOWNSTREAM:
        curr, change = get_change(idx_name)
        if curr is None:
            continue
        arrow = "📈" if change > 0 else "📉" if change < 0 else "➖"
        down_lines.append(f"- {idx_name}：**{curr:.1f}** {arrow}{abs(change):.2f}%")

    # Section 3: 国际海运
    ship_lines = []
    for idx_name in SHIPPING:
        curr, change = get_change(idx_name)
        if curr is None:
            continue
        arrow = "🚢" if change > 0 else "⚓" if change < 0 else "➖"
        ship_lines.append(f"- {idx_name}：**{curr:.1f}** {arrow}{abs(change):.2f}%")

    # Section 4 & 5: AI 综合研判（大厂动态 + 产区新闻 + 行情点评）
    summary_parts = []
    for section, items in [("上游矿价", ore_lines), ("下游产品", down_lines), ("国际海运", ship_lines)]:
        if items:
            summary_parts.append(f"[{section}]\n" + "\n".join(items))

    all_data_text = "\n\n".join(summary_parts)

    ai_insight = ""
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if api_key:
        try:
            headers = {"Authorization": f"Bearer {api_key}"}
            prompt = (
                f"你是正矿供应链的 Scout（全球锆钛矿市场分析师），日期：{latest_date.strftime('%Y-%m-%d')}。\n\n"
                f"今日行情数据：\n{all_data_text}\n\n"
                f"关注的大厂：{', '.join(NEWS_SOURCES.get('major_companies', []))}\n"
                f"关注的产区：{', '.join(NEWS_SOURCES.get('mine_regions', []))}\n\n"
                f"请生成一份《正矿供应链·锆钛行情日报》，要求：\n"
                f"1. 对今日行情进行点评，指出市场异动或趋势\n"
                f"2. 结合大厂动态（Iluka/Rio Tinto/Tronox 等近期动作）进行分析\n"
                f"3. 结合主要产区（尼日利亚/莫桑比克/澳大利亚等）政策物流风险\n"
                f"4. 给出具体的采购/入场建议（分值 1-10，10 为强烈建议入场）\n"
                f"5. 语言精炼专业，适合早间快报推送到企微群"
            )
            payload = {
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": "你是正矿供应链的首席锆钛市场分析师，擅长数据驱动的行情研判。"},
                    {"role": "user", "content": prompt}
                ]
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post("https://api.deepseek.com/chat/completions", headers=headers, json=payload, timeout=30.0)
                ai_insight = resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            ai_insight = f"AI 分析暂时不可用：{str(e)}"

    final_report = (
        f"# 正矿供应链 · 锆钛行情日报 ({latest_date.strftime('%Y-%m-%d')})\n\n"
        f"## 上游矿产\n" + "\n".join(ore_lines) + "\n\n"
        f"## 下游产品\n" + "\n".join(down_lines) + "\n\n"
        f"## 国际海运\n" + "\n".join(ship_lines) + "\n\n"
        f"## AI 综合研判\n{ai_insight}\n\n"
        f"--- \n*由 Scout 自动引擎生成于 {datetime.now().strftime('%H:%M:%S')}*"
    )

    report_path = os.path.join(REPORTS_DIR, f"scout_daily_{latest_date.strftime('%Y%m%d')}.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(final_report)

    # 推送到企微 Webhook (Kit 群)
    wecom_webhook = os.getenv("WECOM_WEBHOOK_URL")
    if wecom_webhook and wecom_webhook.startswith("http"):
        try:
            wecom_headers = {"Content-Type": "application/json"}
            payload = {"msgtype": "markdown", "markdown": {"content": final_report}}
            async with httpx.AsyncClient() as client:
                res = await client.post(wecom_webhook, headers=wecom_headers, json=payload, timeout=10.0)
                if res.status_code == 200:
                    print(f"[{datetime.now()}] Report pushed to Kit group.")
                else:
                    print(f"[{datetime.now()}] Push failed: {res.status_code} - {res.text}")
        except Exception as e:
            print(f"[{datetime.now()}] Push exception: {e}")
    else:
        print(f"[{datetime.now()}] WECOM_WEBHOOK_URL not set or invalid.")

    return final_report


def generate_monthly_summary_excel():
    if not os.path.exists(HISTORY_FILE):
        return False

    df = pd.read_csv(HISTORY_FILE)
    df['date'] = pd.to_datetime(df['date'])
    df['year_month'] = df['date'].dt.to_period('M').astype(str)

    monthly_avg = df.groupby(['index_name', 'year_month'])['value'].mean().reset_index()
    pivot_df = monthly_avg.pivot(index='index_name', columns='year_month', values='value')

    excel_path = os.path.join(EXCEL_DIR, f"scout_monthly_summary_3years_{datetime.now().strftime('%Y%m%d')}.xlsx")

    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        pivot_df.to_excel(writer, sheet_name='月度汇总')

    print(f"Excel report generated: {excel_path}")
    return excel_path


if __name__ == "__main__":
    import asyncio
    asyncio.run(generate_daily_scout_report())
    generate_monthly_summary_excel()
