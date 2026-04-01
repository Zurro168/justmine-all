# --- [SOP-V2.3: 正矿企微机器人核心 · V2.2] ---
import os
import time
import xml.etree.ElementTree as ET
from flask import Flask, request, make_response
from openai import OpenAI

app = Flask(__name__)

# --- [DeepSeek-V3 脑核] ---
client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

@app.route('/wecom/callback', methods=['GET', 'POST'])
@app.route('/wecom/', methods=['GET', 'POST'])
def wecom_gateway():
    if request.method == 'GET':
        return request.args.get('echostr', 'Verification Check OK')

    try:
        xml_data = ET.fromstring(request.data)
        to_user = xml_data.find('ToUserName').text
        from_user = xml_data.find('FromUserName').text
        user_query = xml_data.find('Content').text

        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": user_query}]
        )
        reply_content = response.choices[0].message.content

        resp_xml = f"""<xml>
<ToUserName><![CDATA[{from_user}]]></ToUserName>
<FromUserName><![CDATA[{to_user}]]></FromUserName>
<CreateTime>{int(time.time())}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[{reply_content}]]></Content>
</xml>"""
        return make_response(resp_xml)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
