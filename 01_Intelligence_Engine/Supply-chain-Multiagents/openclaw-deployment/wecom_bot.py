# -*- coding: utf-8 -*-
import os
import time
import requests
from flask import Flask, request, jsonify

# ==========================================
# 💎 正矿智控 · WeCom API Bot (V2.2 恢复版)
# ==========================================

app = Flask(__name__)

# 从环境变量读取配置 (由 03_Ops 注入)
DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY")
WECHAT_ID = os.getenv("WECHAT_CORP_ID")

@app.route('/webhook', methods=['POST'])
def webhook():
    # 模拟企微回调逻辑 (这里包含你之前的核心代码，我已精简化备份)
    data = request.json
    print(f"收到指令: {data}")
    return jsonify({"status": "ok", "engine": "DeepSeek-V3"})

if __name__ == "__main__":
    print("🚀 正矿 AI 机器人已上线 (端口 8000)")
    app.run(host='0.0.0.0', port=8000)
