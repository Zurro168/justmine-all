import json
import os
import hashlib
import base64
import struct
import logging
import time
import requests
import xml.etree.ElementTree as ET
from flask import Flask, request, make_response, jsonify
from Crypto.Cipher import AES

# 初始化日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("wecom_bot")

class WXBizMsgCrypt:
    def __init__(self, token, encoding_aes_key, corp_id):
        self.token = token
        self.key = base64.b64decode(encoding_aes_key + "=")
        self.corp_id = corp_id

    def _get_signature(self, timestamp, nonce, encrypt_msg):
        v = sorted([self.token, timestamp, nonce, encrypt_msg])
        return hashlib.sha1(''.join(v).encode('utf-8')).hexdigest()

    def decrypt(self, encrypt_msg, msg_signature, timestamp, nonce):
        if msg_signature != self._get_signature(timestamp, nonce, encrypt_msg):
            return None, "Signature Verification Failed"
        try:
            cipher = AES.new(self.key, AES.MODE_CBC, self.key[:16])
            plain_text = cipher.decrypt(base64.b64decode(encrypt_msg))
            pad = plain_text[-1]
            if pad < 1 or pad > 32: pad = 0
            content = plain_text[:-pad] if pad > 0 else plain_text
            if len(content) < 20:
                return None, f"Decrypted content too short: {len(content)} bytes"
            xml_len = struct.unpack(">I", content[16:20])[0]
            xml_content = content[20:20+xml_len].decode('utf-8')
            return xml_content, None
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            return None, str(e)

    def encrypt(self, reply_msg, nonce):
        # 1. Pack: random(16) + length(4) + msg + corp_id
        random_str = os.urandom(16)
        msg_bytes = reply_msg.encode('utf-8')
        msg_len = struct.pack(">I", len(msg_bytes))
        corp_id_bytes = self.corp_id.encode('utf-8')
        
        raw_data = random_str + msg_len + msg_bytes + corp_id_bytes
        
        # 2. PKCS7 Padding
        pad_len = 32 - (len(raw_data) % 32)
        raw_data += bytes([pad_len] * pad_len)
        
        # 3. AES Encrypt
        cipher = AES.new(self.key, AES.MODE_CBC, self.key[:16])
        encrypt_msg = base64.b64encode(cipher.encrypt(raw_data)).decode('utf-8')
        
        # 4. Generate Signature
        timestamp = str(int(time.time()))
        signature = self._get_signature(timestamp, nonce, encrypt_msg)
        
        # 5. Wrap in XML
        xml_tpl = """<xml>
            <Encrypt><![CDATA[{msg}]]></Encrypt>
            <MsgSignature><![CDATA[{sig}]]></MsgSignature>
            <TimeStamp>{ts}</TimeStamp>
            <Nonce><![CDATA[{nonce}]]></Nonce>
        </xml>"""
        return xml_tpl.format(msg=encrypt_msg, sig=signature, ts=timestamp, nonce=nonce)

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "bots"))
from agent_factory_v2 import OpenClawAgentFactory

factory = OpenClawAgentFactory(
    config_path=os.path.join(os.path.dirname(__file__), "..", "bots", "openclaw_prompts_v2.json")
)

def process_message_via_agents(user_message: str, user_id: str) -> str:
    """Route message through Jaguar and execute the target agent."""
    logger.info(f"[Pipeline] Step 1: Dispatching task for user {user_id}")
    routing = factory.dispatch_task(user_message)
    target = routing.get("target_agent", "scout")
    logger.info(f"[Pipeline] Step 2: Executing agent '{target}'")
    reply = factory.execute_agent(target, user_message, {
        "user_id": user_id,
        "source": "wecom",
        "routing_params": routing.get("extracted_parameters", {})
    })
    logger.info(f"[Pipeline] Step 3: Reply generated ({len(reply)} chars)")
    return reply

def ask_deepseek(question):
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key or api_key == "YOUR_DEEPSEEK_KEY":
        return "AI 秘钥未配置，请联系管理员。"
    
    url = "https://api.deepseek.com/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "你是一个名为“正矿智控”的专业助理，致力于为矿业供应链和风险管理提供智能化支持。"},
            {"role": "user", "content": question}
        ],
        "stream": False
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        res_json = response.json()
        return res_json['choices'][0]['message']['content']
    except Exception as e:
        logger.error(f"DeepSeek API Error: {str(e)}")
        return f"AI 思考时遇到了点麻烦: {str(e)}"

app = Flask(__name__)

@app.route('/wecom', methods=['GET', 'POST'])
def wecom_gateway():
    token = os.getenv("WECHAT_TOKEN")
    aes_key = os.getenv("WECHAT_ENCODING_AES_KEY")
    corp_id = os.getenv("WECHAT_CORP_ID")

    if not all([token, aes_key, corp_id]):
        logger.error("Missing WeCom credentials in environment variables")
        return make_response("Server misconfigured", 500)

    crypto = WXBizMsgCrypt(token, aes_key, corp_id)
    
    msg_signature = request.args.get('msg_signature', '')
    timestamp = request.args.get('timestamp', '')
    nonce = request.args.get('nonce', '')

    # 1. 处理企微验证请求 (GET)
    if request.method == 'GET':
        echo_str = request.args.get('echostr', '')
        if not echo_str: return "OK"
        content, err = crypto.decrypt(echo_str, msg_signature, timestamp, nonce)
        return make_response(content, 200) if not err else make_response(err, 403)

    # 2. 处理用户消息 (POST)
    try:
        raw_body = request.get_data()
        if not raw_body:
            logger.error("Empty POST body received")
            return "success"

        # 企微支持两种格式：JSON（新）和 XML（旧）
        is_json_mode = False
        raw_body_str = raw_body.decode("utf-8")
        try:
            body_json = json.loads(raw_body_str)
            encrypt_msg = body_json.get("encrypt", "")
            is_json_mode = True
        except (json.JSONDecodeError, UnicodeDecodeError):
            # Fallback to XML format
            root = ET.fromstring(raw_body)
            encrypt_msg = root.find("Encrypt").text

        xml_content, err = crypto.decrypt(encrypt_msg, msg_signature, timestamp, nonce)
        if err:
            logger.error(f"Decrypt failed: {err}")
            return make_response("decrypt failed", 403)

        # 企微 AI Bot 新接口解密后是 JSON，旧接口是 XML
        is_ai_bot_mode = False
        try:
            msg_json = json.loads(xml_content)
            is_ai_bot_mode = True
        except json.JSONDecodeError:
            msg_json = None

        if is_ai_bot_mode:
            # --- AI Bot 新接口 ---
            user_id = msg_json.get("from", {}).get("userid", "unknown")
            msg_type = msg_json.get("msgtype", "")
            response_url = msg_json.get("response_url", "")
            content = msg_json.get("text", {}).get("content", "")

            if msg_type == "text":
                logger.info(f"[AI Bot] Received msg from {user_id}: {content}")
                try:
                    t_start = time.time()
                    ai_reply = process_message_via_agents(content, user_id)
                    t_elapsed = time.time() - t_start
                    logger.info(f"[AI Bot] AI reply generated in {t_elapsed:.1f}s: {ai_reply[:80]}...")
                except Exception as e:
                    logger.error(f"[AI Bot] Agent pipeline FAILED: {type(e).__name__}: {e}", exc_info=True)
                    ai_reply = f"处理消息时出错: {str(e)[:100]}"
                    logger.info(f"[AI Bot] Sending error fallback reply")

                # 通过 response_url 发送回复
                try:
                    resp = requests.post(response_url, json={
                        "msgtype": "text",
                        "text": {"content": ai_reply}
                    }, timeout=10)
                    logger.info(f"[AI Bot] Reply sent: {resp.status_code}")
                except Exception as e:
                    logger.error(f"[AI Bot] Reply failed: {e}")

                return "success"
        else:
            # --- 旧 XML 接口 ---
            msg_root = ET.fromstring(xml_content)
            msg_type = msg_root.find("MsgType").text
            user_id = msg_root.find("FromUserName").text

            if msg_type == "text":
                content = msg_root.find("Content").text
                logger.info(f"Received msg from {user_id}: {content}")

                ai_reply = process_message_via_agents(content, user_id)

                reply_tpl = """<xml>
                    <ToUserName><![CDATA[{to}]]></ToUserName>
                    <FromUserName><![CDATA[{from_me}]]></FromUserName>
                    <CreateTime>{ts}</CreateTime>
                    <MsgType><![CDATA[text]]></MsgType>
                    <Content><![CDATA[{content}]]></Content>
                </xml>"""
                reply_xml = reply_tpl.format(
                    to=user_id,
                    from_me=corp_id,
                    ts=int(time.time()),
                    content=ai_reply
                )

                encrypted_reply = crypto.encrypt(reply_xml, nonce)

                if is_json_mode:
                    reply_root = ET.fromstring(encrypted_reply)
                    encrypt_val = reply_root.find("Encrypt").text
                    return jsonify({"encrypt": encrypt_val})
                else:
                    return encrypted_reply
            
    except Exception as e:
        logger.error(f"Post error: {str(e)}")
        return "success" # 企微要求即便报错也要返回 success 避免重试

    return "success"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
