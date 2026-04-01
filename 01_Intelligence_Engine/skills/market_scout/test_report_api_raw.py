import requests
import json
import os

def test_api_raw():
    session_path = "data/ferroalloy_session.json"
    url = "https://www.cnfeol.com/Data/ArticleList.ashx"
    
    cookies = {}
    if os.path.exists(session_path):
        with open(session_path, "r", encoding="utf-8") as f:
            state = json.load(f)
            for cookie in state.get('cookies', []):
                cookies[cookie['name']] = cookie['value']
    
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
    
    resp = requests.get(url, params=params, cookies=cookies, headers=headers)
    print("Content Type:", resp.headers.get("Content-Type"))
    print("Body Start:", resp.text[:500])

if __name__ == "__main__":
    test_api_raw()
