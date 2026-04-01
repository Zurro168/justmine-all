import os
import json
import asyncio
from mail_client import MailSentinelClient
from dotenv import load_dotenv

async def test_email_connection():
    # Load .env from the openclaw-deployment root
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    load_dotenv(os.path.join(root_dir, ".env"))
    
    user = os.getenv("MAIL_USER")
    password = os.getenv("MAIL_PASS")
    imap_server = os.getenv("MAIL_IMAP_SERVER")
    smtp_server = os.getenv("MAIL_SMTP_SERVER")
    
    print(f"--- Email Configuration Check ---")
    print(f"Target User: {user}")
    print(f"IMAP Server: {imap_server}")
    print(f"SMTP Server: {smtp_server}")
    print("---------------------------------")
    
    print("\n[1/2] Testing IMAP Connection (Fetching unread)...")
    try:
        # We manually use imap_tools here to see the raw error if any
        from imap_tools import MailBox, AND
        with MailBox(imap_server).login(user, password) as mailbox:
            count = len(list(mailbox.fetch(AND(seen=False))))
            print(f"SUCCESS! Successfully connected to IMAP. Found {count} unread emails.")
    except Exception as e:
        print(f"FAILED! IMAP connection error: {str(e)}")

    print("\n[2/2] Testing SMTP Connection (Simulating login)...")
    try:
        import smtplib
        # Try SSL on 465
        print(f"Connecting to {smtp_server}:465 (SSL)...")
        with smtplib.SMTP_SSL(smtp_server, 465, timeout=15) as smtp:
            smtp.login(user, password)
            print("SUCCESS! Successfully logged into SMTP on 465.")
    except Exception as e:
        print(f"FAILED! SMTP SSL error: {str(e)}")
        try:
            # Try STARTTLS on 587
            print(f"Connecting to {smtp_server}:587 (STARTTLS)...")
            with smtplib.SMTP(smtp_server, 587, timeout=15) as smtp:
                smtp.starttls()
                smtp.login(user, password)
                print("SUCCESS! Successfully logged into SMTP on 587.")
        except Exception as e2:
            print(f"FAILED! SMTP STARTTLS error: {str(e2)}")

if __name__ == "__main__":
    asyncio.run(test_email_connection())
