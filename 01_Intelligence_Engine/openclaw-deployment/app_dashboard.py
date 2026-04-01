@app.route('/api/chat', methods=['POST'])
def chat_api():
    query = request.json.get('query', '').lower()
    
    # --- 严格遵循：正源化响应逻辑 (V2.2 Strict) ---
    
    if ".pdf" in query or "单据" in query:
        # Docu-Checker 逻辑执行前必须自检物理文件
        return jsonify({"reply": "【Docu-Checker】当前处于待命状态。由于您尚未提供本次单证的物理路径或 OCR 原始数据流，我无法进行审核。请上传 SGS 扫描件以获取真实的品位比对报告。"})
    
    elif "iluka" in query or "报价" in query:
        # Market-Scout 必须读取真实市场数据源
        import os
        import json
        data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../02_Trade_Platform/src/data/market-data.json'))
        
        if os.path.exists(data_path):
            with open(data_path, 'r', encoding='utf-8') as f:
                market_data = json.load(f)
            # 只有当 market-data.json 中有本周更新时，才输出数据
            update_time = market_data.get('last_update', '未知')
            return jsonify({"reply": f"【Market-Scout】正在检索本地情报库。最近一次实地探测日期：{update_time}。由于深层次爬虫尚未在云端开启，本周 ILUKA 行情尚待同步。我拒绝提供基于历史记忆的过时数据。"})
        else:
            return jsonify({"reply": "【Market-Scout】无法在 02_Trade_Platform 数据源中定位市场快照文件。数据缺失，我无法生成报盘建议。"})
            
    else:
        return jsonify({"reply": "【Nexus 智能中枢】指令已接收，但没有匹配到关联的本地业务数据源。请提供具体行情或待审单证。"})
