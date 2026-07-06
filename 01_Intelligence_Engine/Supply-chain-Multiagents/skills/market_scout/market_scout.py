import os
import requests
from openai import OpenAI

# ==========================================
# 💎 正矿智控 · 行情侦察兵 (DeepSeek-V3 引擎)
# ==========================================

# 从 03_Operations_Hub/env.justmine 自动读取
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

def fetch_market_indices():
    # 模拟抓取逻辑 (锆钛、硅铁、锰铁)
    print("📡 正在抓取行情动态...")
    # 这里我们已将模型从 gemini-1.5 替换为 deepseek-chat
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": "请分析当前锆钛市场动态"}]
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    report = fetch_market_indices()
    print(f"📊 正矿最新行情报告: \n{report}")
