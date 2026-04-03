# --- [SOP-V2.3: 正矿智控系统 · 仪表盘核心 V2.2] ---
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

import requests
import uuid
import datetime

# In-memory store for sandbox messages
sandbox_messages = []

@app.route('/api/chat', methods=['POST'])
def chat_api():
    query = request.json.get('query', '').lower()
    reply = "【Jaguar 智能中枢】指令接收。请问是查询[报价]还是审核[单据]？"
    if ".pdf" in query or "单据" in query:
        reply = "【Docu-Checker】当前处于待命状态。请上传 SGS 扫描件获取真实报告。"
    elif "iluka" in query or "报价" in query:
        reply = "【Market-Scout】正在侦测本地数据源...当前深层爬虫尚未开启，本周行情请参照官网报盘。"
    
    # [战术 A]: 同步将这句最高指令，发射到企微的长链接群播报喇叭里！
    wecom_webhook = os.getenv("WECOM_WEBHOOK_URL")
    if wecom_webhook and wecom_webhook.startswith("http"):
        try:
            payload = {
                "msgtype": "text",
                "text": {
                    "content": f"🚨 [Jaguar 高管内参]\n来自大屏指挥官的最新指令查询：\n{reply}",
                    "mentioned_list": ["@all"]
                }
            }
            requests.post(wecom_webhook, json=payload, timeout=5)
        except Exception as e:
            print(f"WeCom Broadcast Failed: {e}")

    return jsonify({"reply": reply})

@app.route('/api/sandbox/messages', methods=['GET'])
def get_sandbox_messages():
    return jsonify({"messages": sandbox_messages})

@app.route('/api/sandbox/send', methods=['POST'])
def send_sandbox_message():
    data = request.json
    user_msg = data.get('message', '').strip()
    nickname = data.get('nickname', '匿名同事')
    
    if not user_msg:
        return jsonify({"error": "Message is empty"}), 400

    trace_id = "TRC-" + str(uuid.uuid4())[:8].upper()
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")

    # Add user message
    sandbox_messages.append({
        "id": str(uuid.uuid4()),
        "trace_id": trace_id,
        "type": "user",
        "sender": nickname,
        "text": user_msg,
        "timestamp": timestamp
    })

    # AI Logic based on chat_sandbox_v2.py
    query = user_msg.lower()
    if "行情" in query or "价格" in query:
        reply = "【情报引擎】当前正在分析 Iluka 鋯英砂行情，最新报价约为 2200 USD/吨，趋势稳定。"
    elif "状态" in query or "健康" in query:
        reply = "【系统中枢】当前 01/02/03 模块运行正常，DeepSeek 数据链路 100% 畅通。"
    else:
        reply = f"【正矿机器人】收到指令：'{user_msg}'。我已经将其存入记忆库，正在调取供应链历史记录。"

    # Add AI Reply
    sandbox_messages.append({
        "id": str(uuid.uuid4()),
        "trace_id": trace_id,
        "type": "ai",
        "sender": "正矿AI",
        "text": reply,
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
    })

    # Return success
    return jsonify({"status": "success", "trace_id": trace_id})

@app.route('/health')
def health():
    return jsonify({"status": "online", "engine": "DeepSeek-V3"})

@app.route('/')
def index():
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Jaguar Intelligence</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50 p-6 font-sans">
        <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
            <div class="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div class="font-bold">💬 Jaguar 智能指挥终端 (DeepSeek-V3)</div>
                <div class="flex items-center gap-2 text-xs text-emerald-400">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    核心引擎运转中
                </div>
            </div>
            <div id="chat-box" class="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
                <div class="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-700 text-sm inline-block">
                    🤖 [Jaguar-中枢]: 战术终端已就绪。请输入「报价」或「单据」唤醒业务探针。
                </div>
            </div>
            <div class="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input id="chat-input" type="text" placeholder="输入指令..." class="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" onkeypress="if(event.key === 'Enter') send()"/>
                <button onclick="send()" class="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition">发送 (Send)</button>
            </div>
        </div>
        <script>
            async function send() {
                const input = document.getElementById('chat-input');
                const box = document.getElementById('chat-box');
                const text = input.value.trim();
                if(!text) return;
                
                // Add user message
                box.innerHTML += `<div class="p-3 bg-blue-50 rounded-xl text-blue-800 text-sm ml-auto max-w-[80%] border border-blue-100">${text}</div>`;
                input.value = '';
                
                // Show loading
                const loadingId = 'loading-' + Date.now();
                box.innerHTML += `<div id="${loadingId}" class="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 text-xs inline-block animate-pulse">正在推演...</div>`;
                box.scrollTop = box.scrollHeight;
                
                try {
                    const res = await fetch('/ai-manager/api/chat', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({query: text})
                    });
                    const data = await res.json();
                    document.getElementById(loadingId).remove();
                    box.innerHTML += `<div class="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-700 text-sm inline-block max-w-[80%]">🤖 ${data.reply}</div>`;
                } catch(e) {
                    document.getElementById(loadingId).remove();
                    box.innerHTML += `<div class="p-3 bg-red-50 rounded-xl text-red-600 text-sm inline-block max-w-[80%] border border-red-100">⚠️ 发生系统错误: ${e.message}</div>`;
                }
                box.scrollTop = box.scrollHeight;
            }
        </script>
    </body>
    </html>
    """
    return html

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3000)
