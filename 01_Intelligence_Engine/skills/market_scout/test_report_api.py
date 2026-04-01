import requests
import json
import os

def test_api():
    session_path = "data/ferroalloy_session.json"
    url = "https://www.cnfeol.com/Data/ArticleList.ashx"
    
    # Load cookies from Playwright session file
    cookies = {}
    if os.path.exists(session_path):
        with open(session_path, "r", encoding="utf-8") as f:
            state = json.load(f)
            for cookie in state.get('cookies', []):
                cookies[cookie['name']] = cookie['value']
    
    # Test for Zircon
    params = {
        "lType": "ListJsonCombine",
        "pSize": "20",
        "cCode": "MP-6",
        "sCode": "020000000000000",
        "pIndex": "1"
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://www.cnfeol.com/gao/list_p.aspx"
    }
    
    print(f"Testing API: {url} with cookies...")
    try:
        resp = requests.get(url, params=params, headers=headers, cookies=cookies, timeout=20)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            # The subagent said it returns ListJsonCombine
            # Let's count items
            items = data.get("List", [])
            print(f"Found {len(items)} items in JSON.")
            if items:
                print("First item:", items[0].get("Title"), "ID:", items[0].get("Id"))
        else:
            print("Response text:", resp.text[:200])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
