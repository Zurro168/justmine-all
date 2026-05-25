from apscheduler.schedulers.asyncio import AsyncIOScheduler
import asyncio
import json
from datetime import datetime
import os
import sys
import traceback

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scout_collector import run_scout_collection
from scout_playwright_collector import run_playwright_collection
from scout_report_engine import generate_daily_scout_report, generate_monthly_summary_excel

async def daily_task_flow():
    print(f"[{datetime.now()}] Starting scheduled Scout market data task...")

    # 1. 采集公开行情数据（httpx，无需登录）
    public_ok = False
    try:
        print(f"[{datetime.now()}] [Step 1] Fetching public market indices via httpx...")
        public_ok = await run_scout_collection(years=3)
        print(f"[{datetime.now()}] [Step 1] Public data: {'OK' if public_ok else 'FAILED'}")
    except Exception as e:
        print(f"[{datetime.now()}] [Step 1] ERROR: {e}")
        traceback.print_exc()

    # 2. 采集会员专区数据（Playwright + session，需登录）
    member_ok = False
    try:
        print(f"[{datetime.now()}] [Step 2] Fetching member data via Playwright...")
        member_ok = await run_playwright_collection()
        print(f"[{datetime.now()}] [Step 2] Member data: {'OK' if member_ok else 'SKIPPED (no session)'}")
    except Exception as e:
        print(f"[{datetime.now()}] [Step 2] ERROR: {e}")
        traceback.print_exc()
        # Don't crash — continue to report generation

    # 3. 生成日报（只要有公开数据就生成）
    if public_ok:
        try:
            print(f"[{datetime.now()}] [Step 3] Generating daily report...")
            md_report = await generate_daily_scout_report()
            print(f"[{datetime.now()}] [Step 3] Daily MD Report generated.")
        except Exception as e:
            print(f"[{datetime.now()}] [Step 3] ERROR: {e}")
            traceback.print_exc()

        # 4. 生成月度 Excel 汇总
        try:
            excel_path = generate_monthly_summary_excel()
            print(f"[{datetime.now()}] [Step 4] Monthly Excel Summary generated at: {excel_path}")
        except Exception as e:
            print(f"[{datetime.now()}] [Step 4] ERROR: {e}")
            traceback.print_exc()
    else:
        print(f"[{datetime.now()}] Collection failed, skipping reports.")

    print(f"[{datetime.now()}] Daily task flow complete.")


async def main():
    # Load configuration
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scout_config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    scheduler = AsyncIOScheduler(timezone='Asia/Shanghai')

    # Schedule from config
    hour = config["schedule"].get("hour", 8)
    minute = config["schedule"].get("minute", 30)
    scheduler.add_job(daily_task_flow, 'cron', hour=hour, minute=minute)

    # Run once immediately on startup only if configured
    run_on_startup = os.getenv("RUN_SCOUT_ON_STARTUP", "false").lower() == "true"
    if run_on_startup:
        print("Initializing Scout Service (Immediate Run)...")
        await daily_task_flow()
    else:
        print("Initializing Scout Service (Waiting for scheduled run)...")

    print(f"Scout Scheduler started. Running every day at {hour:02d}:{minute:02d} AM Beijing Time.")
    scheduler.start()

    # Keep the service running
    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
