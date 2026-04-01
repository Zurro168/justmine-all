# --- [SOP-V2.3: 正矿智控系统 · 仪表盘核心 V2.2] ---
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/chat', methods=['POST'])
def chat_api():
    query = request.json.get('query', '').lower()
    if ".pdf" in query or "单据" in query:
        return jsonify({"reply": "【Docu-Checker】当前处于待命状态。请上传 SGS 扫描件获取真实报告。"})
    elif "iluka" in query or "报价" in query:
        return jsonify({"reply": "【Market-Scout】正在侦测本地数据源...当前深层爬虫尚未开启，本周行情请参照官网报盘。"})
    else:
        return jsonify({"reply": "【Nexus 智能中枢】指令接收。请问是查询[报价]还是审核[单据]？"})

@app.route('/health')
def health():
    return jsonify({"status": "online", "engine": "DeepSeek-V3"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3000)
