import asyncio
import os
import json
import logging
from datetime import datetime
from mail_client import MailSentinelClient
from mail_processor import MailProcessor
# To load env from parent directory
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("MailSentinelService")

async def run_mail_sentinel():
    # Load .env from the openclaw-deployment root
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    load_dotenv(os.path.join(root_dir, ".env"))
    
    user = os.getenv("MAIL_USER")
    password = os.getenv("MAIL_PASS")
    imap_server = os.getenv("MAIL_IMAP_SERVER")
    smtp_server = os.getenv("MAIL_SMTP_SERVER")
    api_key = os.getenv("DEEPSEEK_API_KEY")
    interval = int(os.getenv("MAIL_CHECK_INTERVAL", 300))
    
    if not all([user, password, imap_server, smtp_server, api_key]):
        logger.error("Missing email configuration in .env. Mail Sentinel aborted.")
        return

    client = MailSentinelClient(user, password, imap_server, smtp_server)
    processor = MailProcessor(api_key)
    log_file = os.path.join(root_dir, "logs", "system.json.log")

    logger.info(f"Mail Sentinel started for {user}. Checking every {interval}s.")

    while True:
        try:
            logger.info("Scanning for unread emails...")
            unread = client.fetch_unread_emails()
            
            if not unread:
                logger.info("No new emails.")
            
            for mail in unread:
                logger.info(f"Processing email from {mail['from']}: {mail['subject']}")
                
                # AI Analysis
                analysis = await processor.analyze_and_draft(mail)
                logger.info(f"AI Intent: {analysis.get('intent')} | Action: {analysis.get('action')}")

                # Log to System Log (Simulated Dashboard Sync)
                log_entry = {
                    "timestamp": datetime.now().isoformat(),
                    "level": "INFO",
                    "message": f"📧 [Mail-Sentinel] 收到来自 {mail['from']} 的邮件，主题: {mail['subject']}。意图: {analysis.get('intent')}。",
                    "module": "mail_sentinel",
                    "role": "ai",
                    "trace_id": f"mail-{mail['id']}"
                }
                
                with open(log_file, "a", encoding="utf-8") as f:
                    f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

                # If action is reply and it's not a junk mail, draft can be sent or stored
                if analysis.get('action') == 'reply' and analysis.get('draft_reply'):
                    # For now, let's JUST log the draft to the dashboard logs instead of auto-sending
                    # In a real scenario, you'd call client.send_reply(...)
                    reply_log = {
                        "timestamp": datetime.now().isoformat(),
                        "level": "INFO",
                        "message": f"📝 [Mail-Sentinel] 拟定回复给 {mail['from']}：\n\n{analysis.get('draft_reply')}",
                        "module": "mail_sentinel",
                        "role": "ai",
                        "trace_id": f"mail-{mail['id']}-reply"
                    }
                    with open(log_file, "a", encoding="utf-8") as f:
                        f.write(json.dumps(reply_log, ensure_ascii=False) + "\n")
                
                # Mark as seen (Optional: default in imap_tools is usually handled)
            
        except Exception as e:
            logger.error(f"Error in Service Loop: {str(e)}")
            
        await asyncio.sleep(interval)

if __name__ == "__main__":
    asyncio.run(run_mail_sentinel())
