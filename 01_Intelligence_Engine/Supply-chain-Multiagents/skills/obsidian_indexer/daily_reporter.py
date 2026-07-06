import os
from datetime import datetime

# ==========================================
# 💎 正矿智控 · Obsidian 日报生成器 (V2.2)
# ==========================================

def save_daily_report(content):
    date_str = datetime.now().strftime("%Y-%m-%d")
    report_path = f"01_Intelligence_Engine/Daily_Logs/{date_str}_行情简报.md"
    
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# 📊 正矿智控 · 每日商业脑路图\n")
        f.write(f"生成日期: {datetime.now()}\n\n")
        f.write(content)
    print(f"✅ 日报已存入 Obsidian 归档: {report_path}")
