import os
import sys
import requests
import logging

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

logger = logging.getLogger("notion_bridge")


def query_customers(database_id=None, filter_params=None):
    """Query Notion CRM for customer records."""
    api_key = os.getenv("NOTION_API_KEY")
    if not api_key:
        logger.warning("NOTION_API_KEY not configured")
        return []

    db_id = database_id or os.getenv("NOTION_DATABASE_ID")
    if not db_id:
        logger.warning("NOTION_DATABASE_ID not configured")
        return []

    url = f"https://api.notion.com/v1/databases/{db_id}/query"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
    }

    body = {}
    if filter_params:
        body["filter"] = filter_params

    try:
        response = requests.post(url, headers=headers, json=body, timeout=30)
        response.raise_for_status()
        data = response.json()
        results = []
        for row in data.get("results", []):
            props = row.get("properties", {})
            name = ""
            for k, v in props.items():
                if v.get("type") == "title":
                    title_items = v.get("title", [])
                    if title_items:
                        name = title_items[0].get("plain_text", "")
            results.append({"id": row["id"], "name": name, "properties": props})
        return results
    except Exception as e:
        logger.error(f"Notion query failed: {e}")
        return []


if __name__ == "__main__":
    customers = query_customers()
    print(f"Found {len(customers)} customers in Notion CRM")
    for c in customers[:3]:
        print(f"  - {c['name']}")
