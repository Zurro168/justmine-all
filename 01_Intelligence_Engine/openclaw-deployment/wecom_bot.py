# -*- coding: utf-8 -*-
# --- [SOP-V2.5: 正矿企微机器人·智能体中枢版] ---
import os
import time
import logging
import hashlib
import base64
import struct
import xml.etree.ElementTree as ET
from flask import Flask, request, make_response
from openai import OpenAI
from Crypto.Cipher import AES

# ─── LOGGING CONFIG ──────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","message":"%(message)s"}'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ─── WECOM CRYPTO UTILS ──────────────────────────────────────────────────────
class WXBizMsgCrypt:
    def __init__(self, token, encoding_aes_key, corp_id):
        self.token = token
        self.key = base64.b64decode(encoding_aes_key + "=")
        self.corp_id = corp_id

    def _get_signature(self, timestamp, nonce, encrypt_msg):
        v = sorted([self.token, timestamp, nonce, encrypt_msg])
        return hashlib.sha1(''.join(v).encode('utf-8')).hexdigest()

    def decrypt(self, encrypt_msg, msg_signature, timestamp, nonce):
        # 1. Verify Signature
        if msg_signature != self._get_signature(timestamp, nonce, encrypt_msg):
            return None, "Signature Verification Failed"
        
        # 2. AES Decrypt
        try:
            cipher = AES.new(self.key, AES.MODE_CBC, self.key[:16])
            plain_text = cipher.decrypt(base64.b64decode(encrypt_msg))
            # Remove PKCS7 padding
            pad = plain_text[-1]
            content = plain_text[16:-pad]
            # Unpack: random(16) + length(4) + msg + corp_id
            xml_len = struct.unpack(">I", content[:4])[0]
            xml_content = content[4:4+xml_len].decode('utf-8')
            from_corp_id = content[4+xml_len:].decode('utf-8')
            if from_corp_id != self.corp_id:
                return None, "CorpID Mismatch"
            return xml_content, None
        except Exception as e:
            return None, str(e)

    def encrypt(self, reply_msg, nonce):
        # Build raw data: random(16) + len(4) + msg + corp_id
        random_str = os.urandom(16)
        msg_bytes = reply_msg.encode('utf-8')
        msg_len = struct.pack(">I", len(msg_bytes))
        raw_data = random_str + msg_len + msg_bytes + self.corp_id.encode('utf-8')
        
        # PKCS7 Padding
        block_size = 32
        pad_len = block_size - (len(raw_data) % block_size)
        raw_data += bytes([pad_len] * pad_len)
        
        cipher = AES.new(self.key, AES.MODE_CBC, self.key[:16])
        encrypt_msg = base64.b64encode(cipher.encrypt(raw_data)).decode('utf-8')
        
        timestamp = str(int(time.time()))
        signature = self._get_signature(timestamp, nonce, encrypt_msg)
        
        return f"""<xml>
<Encrypt><![CDATA[{encrypt_msg}]]></Encrypt>
<MsgSignature><![CDATA[{signature}]]></MsgSignature>
<TimeStamp>{timestamp}</TimeStamp>
<Nonce><![CDATA[{nonce}]]></Nonce>
</xml>"""

# ─── AGENT DISPATCHER ────────────────────────────────────────────────────────
def agent_dispatcher(query, user_id):
    """Route queries to different agents based on keywords."""
    query = query.strip()
    
    if query.startswith("!行情") or "行情" in query:
        return "🚀 [Market-Scout] 正在为您抓取最新锆钛大宗行情，请稍候...\n(演示功能：目前仅支持 DeepSeek 模拟回复)"
    
    if query.startswith("!状态") or "运行情况" in query:
        return "🛡️ [Nexus] 系统状态检查：\n- Website: 运行中\n- Intelligence Engine: 运行中\n- Scout-Scheduler: 已就绪"

    # Default to DeepSeek Brain
    try:
        client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"), base_url="https://api.deepseek.com")
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是由正矿供应链部署的AI助手。"},
                {"role": "user", "content": query}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"💡 暂时无法连接到智能体大脑: {str(e)}"

# ─── FLASK ROUTES ────────────────────────────────────────────────────────────
@app.route('/wecom/callback', methods=['GET', 'POST'])
@app.route('/wecom/', methods=['GET', 'POST'])
@app.route('/wecom', methods=['GET', 'POST'])
def wecom_gateway():
    # Load config from env
    token = os.getenv("WECHAT_TOKEN")
    aes_key = os.getenv("WECHAT_ENCODING_AES_KEY")
    corp_id = os.getenv("WECHAT_CORP_ID")
    
    crypto = WXBizMsgCrypt(token, aes_key, corp_id)
    
    msg_signature = request.args.get('msg_signature', '')
    timestamp = request.args.get('timestamp', '')
    nonce = request.args.get('nonce', '')

    # 1. URL Verification (GET)
    if request.method == 'GET':
        echo_str = request.args.get('echostr', '')
        if not echo_str: return "OK"
        content, err = crypto.decrypt(echo_str, msg_signature, timestamp, nonce)
        if err:
            logger.error(f"Verification failed: {err}")
            return err, 403
        return content

    # 2. Message Handling (POST)
    try:
        # Parse Encrypted XML
        root = ET.fromstring(request.data)
        encrypt_msg = root.find('Encrypt').text
        
        xml_content, err = crypto.decrypt(encrypt_msg, msg_signature, timestamp, nonce)
        if err:
            logger.error(f"Decrypt failed: {err}")
            return "Error", 200
        
        # Parse Decrypted Content
        xml_data = ET.fromstring(xml_content)
        from_user = xml_data.find('FromUserName').text
        to_user = xml_data.find('ToUserName').text
        content_node = xml_data.find('Content')
        
        if content_node is None:
            return make_response("")

        user_query = content_node.text
        logger.info(f"Message from {from_user}: {user_query}")

        # Dispatch to Agents
        reply_text = agent_dispatcher(user_query, from_user)

        # Encrypt Reply
        reply_xml = f"""<xml>
<ToUserName><![CDATA[{from_user}]]></ToUserName>
<FromUserName><![CDATA[{to_user}]]></FromUserName>
<CreateTime>{int(time.time())}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[{reply_text}]]></Content>
</xml>"""
        
        return crypto.encrypt(reply_xml, nonce)

    except Exception as e:
        logger.error(f"Gateway logic error: {e}")
        return make_response(""), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
