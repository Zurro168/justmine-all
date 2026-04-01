import time
import schedule
from skills.market_scout.market_scout import fetch_market_indices

# ==========================================
# 💎 正矿智控 · 市场任务调度中心 (V2.2)
# ==========================================

def job():
    print("🔔 [定时任务] 开始抓取锆钛市场周报...")
    fetch_market_indices()

# 设置每小时抓取一次
schedule.every(1).hours.do(job)

if __name__ == "__main__":
    print("🚀 调度引擎已启动...")
    while True:
        schedule.run_pending()
        time.sleep(1)
