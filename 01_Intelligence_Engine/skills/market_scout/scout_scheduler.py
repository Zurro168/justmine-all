from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio
import json
from datetime import datetime
import os
import sys

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scout_collector import run_scout_collection
from scout_report_engine import generate_daily_scout_report, generate_monthly_summary_excel

async def daily_task_flow():
    print(f"[{datetime.now()}] Starting scheduled Scout market data task...")
    
    # 1. Collect latest data
    # We update back to 3 years just in case, but daily it's fast
    success = await run_scout_collection(years=3)
    
    if success:
        # 2. Generate Daily Report (Markdown + AI Insight)
        md_report = await generate_daily_scout_report()
        print(f"[{datetime.now()}] Daily MD Report generated.")
        
        # 3. Generate Monthly Excel Summary
        excel_path = generate_monthly_summary_excel()
        print(f"[{datetime.now()}] Monthly Excel Summary generated at: {excel_path}")
    else:
        print(f"[{datetime.now()}] Collection failed, skipping reports.")

async def main():
    # Load configuration
    config_path = os.path.join(os.path.dirname(__file__), "scout_config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    
    scheduler = AsyncIOScheduler()
    
    # Schedule from config
    hour = config["schedule"].get("hour", 8)
    minute = config["schedule"].get("minute", 30)
    scheduler.add_job(daily_task_flow, 'cron', hour=hour, minute=minute)
    
    # Run once immediately on startup for verification
    print("Initializing Scout Service...")
    await daily_task_flow()
    
    print("Scout Scheduler started. Running every day at 08:30 AM.")
    scheduler.start()
    
    # Keep the service running
    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()

if __name__ == "__main__":
    asyncio.run(main())
