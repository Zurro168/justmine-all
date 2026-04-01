import os
from flask import Flask, request, Response
from openai import OpenAI # 我们使用 OpenAI 兼容模式调用 DeepSeek

app = Flask(__name__)

# --- 严格遵循：正源化 DeepSeek-V3 指向 (V2.3) ---
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com" # 或者您的中转 API 地址
)

@app.route('/wecom/callback', methods=['GET', 'POST'])
def wecom_callback():
    # 这里处理企微的 XML 报文解析逻辑 (此处省略解析细节，直接聚焦 AI 回复部分)
    # ...
    
    # --- 智控大脑 (DeepSeek 流) ---
    try:
        response = client.chat.completions.create(
            model="deepseek-chat", # 对应 DeepSeek-V3
            messages=[
                {"role": "system", "content": "你是正矿智控系统。你只回答基于 Iluka/SGS 实战的业务。由于你是通过 DeepSeek-V3 驱动，请确保回复严谨。"},
                {"role": "user", "content": "收到消息。"}
            ]
        )
        reply_content = response.choices[0].message.content
        return f"<xml><Content>{reply_content}</Content></xml>" # 示意 XML 回传
    except Exception as e:
        return f"<xml><Content>[系统通知] 探测到 403 模型耗尽，请确保 DEEPSEEK_API_KEY 已注入且余额充足。</Content></xml>"

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
