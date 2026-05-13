import os
import sys
import requests
import logging

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

logger = logging.getLogger("webhook_robot")


def send_wecom_message(content: str, mention_all: bool = False) -> dict:
    """Send a text message to a WeCom group via webhook."""
    webhook_url = os.getenv("WECOM_WEBHOOK_URL")
    if not webhook_url:
        logger.warning("WECOM_WEBHOOK_URL not configured")
        return {"status": "error", "reason": "Webhook URL not configured"}

    payload = {"msgtype": "text", "text": {"content": content}}
    if mention_all:
        payload["text"]["mentioned_list"] = ["@all"]

    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        response.raise_for_status()
        result = response.json()
        if result.get("errcode") == 0:
            logger.info("WeCom message sent successfully")
            return {"status": "ok"}
        else:
            return {"status": "error", "reason": result.get("errmsg", "Unknown error")}
    except Exception as e:
        logger.error(f"WeCom webhook failed: {e}")
        return {"status": "error", "reason": str(e)}


def send_risk_alert(title: str, details: str):
    """Send a formatted risk alert to WeCom group."""
    content = f"\U0001f6a8 [风控警报] {title}\n\n{details}"
    return send_wecom_message(content, mention_all=True)


if __name__ == "__main__":
    result = send_wecom_message("测试消息：正矿智控系统 webhook 连通性验证通过。")
    print(result)
