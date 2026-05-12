# --- [SOP-V2.3: 正矿企微机器人核心 · V2.3] ---
import os
import time
import logging
import hashlib
import xml.etree.ElementTree as ET
from flask import Flask, request, make_response
from openai import OpenAI

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","module":"%(module)s","message":"%(message)s"}'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

def verify_signature(token, signature, timestamp, nonce):
    """Verify WeCom callback signature."""
    if not all([token, signature, timestamp, nonce]):
        return False
    try:
        lst = sorted([token, timestamp, nonce])
        sha1 = hashlib.sha1(''.join(lst).encode('utf-8')).hexdigest()
        return sha1 == signature
    except Exception:
        return False

processed_msg_ids = set()

@app.route('/wecom/callback', methods=['GET', 'POST'])
@app.route('/wecom/', methods=['GET', 'POST'])
def wecom_gateway():
    if request.method == 'GET':
        token = os.getenv("WECHAT_TOKEN", "justmine_wecom_token")
        msg_signature = request.args.get('msg_signature', '')
        timestamp = request.args.get('timestamp', '')
        nonce = request.args.get('nonce', '')
        echo_str = request.args.get('echostr', '')

        if msg_signature:
            if verify_signature(token, msg_signature, timestamp, nonce):
                logger.info("WeCom URL verification passed")
                return echo_str
            return 'Signature verification failed', 403
        return echo_str if echo_str else 'Verification Check OK'

    try:
        xml_data = ET.fromstring(request.data)
        to_user = xml_data.find('ToUserName').text
        from_user = xml_data.find('FromUserName').text
        content = xml_data.find('Content')
        msg_id = xml_data.find('MsgId')

        if content is None:
            logger.warning("Received WeCom message without content")
            return make_response("")

        user_query = content.text

        if msg_id is not None:
            msg_id_text = msg_id.text
            if msg_id_text in processed_msg_ids:
                logger.info(f"Duplicate message ignored: {msg_id_text}")
                return make_response("")
            processed_msg_ids.add(msg_id_text)
            if len(processed_msg_ids) > 1000:
                oldest = next(iter(processed_msg_ids))
                processed_msg_ids.discard(oldest)

        logger.info(f"WeCom message from {from_user}: {user_query[:50]}")

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
    except ET.ParseError as e:
        logger.error(f"XML parse error: {e}")
        return make_response(""), 200
    except Exception as e:
        logger.error(f"WeCom gateway error: {e}")
        return make_response(""), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
