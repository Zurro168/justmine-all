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

os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(EXCEL_DIR, exist_ok=True)

async def generate_daily_scout_report():
    if not os.path.exists(HISTORY_FILE):
        return "ERROR: History file not found. Please run scout_collector.py first."
    
    df = pd.read_csv(HISTORY_FILE)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='date', ascending=False)
    
    latest_date = df['date'].max()
    latest_data = df[df['date'] == latest_date]
    
    # Get previous available day for comparison
    prev_date = df[df['date'] < latest_date]['date'].max()
    prev_data = df[df['date'] == prev_date]
    
    report_items = []
    for code, name in latest_data.groupby('index_id').first()['index_name'].to_dict().items():
        curr_val = latest_data[latest_data['index_id'] == code]['value'].values[0]
        prev_val = prev_data[prev_data['index_id'] == code]['value'].values[0] if code in prev_data['index_id'].values else curr_val
        change = ((curr_val - prev_val) / prev_val * 100) if prev_val != 0 else 0
        trend_icon = "📈" if change > 0 else "📉" if change < 0 else "➖"
        
        report_items.append(f"- **{name}**: {curr_val:.2f} (对比上日: {trend_icon} {change:+.2f}%)")
    
    summary_text = "\n".join(report_items)
    
    # AI Summary
    api_key = os.getenv("DEEPSEEK_API_KEY")
    ai_insight = ""
    if api_key:
        try:
            headers = {"Authorization": f"Bearer {api_key}"}
            prompt = f"这是最新的锆钛铁合金行情指数（{latest_date.strftime('%Y-%m-%d')}）：\n{summary_text}\n请作为Scout（侦察兵）给出一条简短精悍、具备专业深度的行情点评，指出市场异动或趋势提示。回复必须极其简洁，适合早间快报推送。"
            payload = {
                "model": "deepseek-chat",
                "messages": [{"role": "system", "content": "你是由正矿/自华系统调用的专业行情侦察兵AI。"}, {"role": "user", "content": prompt}]
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post("https://api.deepseek.com/chat/completions", headers=headers, json=payload, timeout=20.0)
                ai_insight = resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            ai_insight = f"AI 对抗性干扰：{str(e)}"
    
    final_report = f"# 🕵️ Scout 锆钛早间行情报告 ({latest_date.strftime('%Y-%m-%d')})\n\n" \
                  f"## 📊 核心指数实时快报\n{summary_text}\n\n" \
                  f"## 💡 深度研判\n{ai_insight}\n\n" \
                  f"--- \n*本报告由 Scout 自动引擎生成于 {datetime.now().strftime('%H:%M:%S')}*"
    
    report_path = os.path.join(REPORTS_DIR, f"scout_daily_{latest_date.strftime('%Y%m%d')}.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(final_report)
        
    return final_report

def generate_monthly_summary_excel():
    if not os.path.exists(HISTORY_FILE): return False
    
    df = pd.read_csv(HISTORY_FILE)
    df['date'] = pd.to_datetime(df['date'])
    df['year_month'] = df['date'].dt.to_period('M').astype(str)
    
    # Compute monthly average for each index
    monthly_avg = df.groupby(['index_name', 'year_month'])['value'].mean().reset_index()
    
    # Pivot for horizontal view (Year-Month as Columns, Indices as Rows)
    pivot_df = monthly_avg.pivot(index='index_name', columns='year_month', values='value')
    
    # Save to Excel
    excel_path = os.path.join(EXCEL_DIR, f"scout_monthly_summary_3years_{datetime.now().strftime('%Y%m%d')}.xlsx")
    
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        pivot_df.to_excel(writer, sheet_name='月度汇总')
        
    print(f"Excel report generated: {excel_path}")
    return excel_path

if __name__ == "__main__":
    import asyncio
    asyncio.run(generate_daily_scout_report())
    generate_monthly_summary_excel()
