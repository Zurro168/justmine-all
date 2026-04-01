# --- [SOP-V2.3: 正矿智控系统 · 仪表盘核心 V2.2] ---
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # 允许前端官网跨域调用

# --- 业务 Agent 核心路由 (NO HALLUCINATION) ---
@app.route('/api/chat', methods=['POST'])
def chat_api():
    query = request.json.get('query', '').lower()
    
    if ".pdf" in query or "单据" in query:
        return jsonify({"reply": "【Docu-Checker】当前处于待命状态。由于您尚未提供单证数据流，我无法进行审核。请上传 SGS 扫描件获取真实报告。"})
    
    elif "iluka" in query or "报价" in query:
        # 指向正统 02 模块数据源
        data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../02_Trade_Platform/src/data/market-data.json'))
        if os.path.exists(data_path):
            return jsonify({"reply": "【Market-Scout】正在侦测本地库...当前深层爬虫尚未开启，建议查看官网历史报盘。我拒绝提供虚假行情。"})
        return jsonify({"reply": "【Market-Scout】未能在 02 模块定位数据源。"})
            
    else:
        return jsonify({"reply": "【Nexus 智能中枢】指令接收。请进一步指明：是查询[报价]还是审核[单据]？"})

# --- 状态监测 (Health Check) ---
@app.route('/health')
def health():
    return jsonify({"status": "online", "engine": "DeepSeek-V3"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3000)
