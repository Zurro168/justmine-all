import json
import os
import re
import hashlib
import base64
import struct
import logging
import time
import threading
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
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

# === 文件归档系统 ===
ARCHIVE_ROOT = os.path.join(os.path.dirname(__file__), "archive")
os.makedirs(ARCHIVE_ROOT, exist_ok=True)

# 文件扩展名 → 格式
FORMAT_MAP = {
    ".pdf": "PDF", ".jpg": "JPG", ".jpeg": "JPG", ".png": "PNG",
    ".gif": "GIF", ".bmp": "BMP", ".doc": "DOC", ".docx": "DOCX",
    ".xls": "XLS", ".xlsx": "XLSX", ".csv": "CSV", ".zip": "ZIP",
    ".rar": "RAR", ".txt": "TXT", ".tif": "TIF", ".tiff": "TIFF",
}

# 文件名关键词 → 业务类型（覆盖中英文 + 常见变体）
FILE_KEYWORDS = {
    "invoice": [
        "invoice", "commercial invoice", "ci", "invoice number",
        "发票", "商业发票", "fapiao", "factura",
        "proforma invoice", "performa"
    ],
    "bill_of_lading": [
        "bill of lading", "b/l", "bl", "ocean bill", "sea bill",
        "提单", "海运提单", "海运单",
        "bill of landing", "consignment note", "waybill"
    ],
    "packing_list": [
        "packing list", "pack list", "pl", "package list",
        "装箱单", "包装清单",
        "detailed packing", "weight list", "weight note"
    ],
    "certificate_of_origin": [
        "certificate of origin", "origin certificate", "coo", "c/o",
        "原产地证", "产地证", "origin",
        "form e", "form a", "certificate of origin"
    ],
    "quality_inspection": [
        "sgs", "ahk", "inspection", "inspection report", "quality",
        "品检", "质检", "品质报告", "分析报告", "品质证书",
        "assay", "analysis", "certificate of analysis", "coa",
        "survey", "survey report", "test report"
    ],
    "contract": [
        "contract", "agreement", "proforma", "sales contract",
        "合同", "采购合同", "销售合同", "协议",
        "purchase order", "sales confirmation", "pi"
    ],
    "customs": [
        "customs", "declaration", "custom declaration",
        "报关", "清关", "报关单", "海关",
        "clearance", "import declaration", "export declaration"
    ],
    "other": []
}

CAT_DIR_NAMES = {
    "invoice": "01_发票",
    "bill_of_lading": "02_提单",
    "packing_list": "03_装箱单",
    "certificate_of_origin": "04_原产地证",
    "quality_inspection": "05_质检报告",
    "contract": "06_合同协议",
    "customs": "07_报关清关",
    "image": "08_现场照片",
    "other": "00_其他"
}

def classify_file(filename: str) -> str:
    """根据文件名判断文件类型，支持中英文 + 常见缩写"""
    fname_lower = filename.lower().strip()
    # 先匹配完整关键词
    for category, keywords in FILE_KEYWORDS.items():
        if category == "other":
            continue
        for kw in keywords:
            if kw in fname_lower:
                return category
    return "other"

def get_file_ext(filename: str) -> str:
    """安全获取文件扩展名"""
    _, ext = os.path.splitext(filename)
    return ext.lower() or ".unknown"

def archive_file(data: bytes, filename: str, sender: str, msg_id: str, category: str = None) -> str:
    """下载并归档文件，返回归档路径"""
    if category is None:
        category = classify_file(filename)
    cat_dir = CAT_DIR_NAMES.get(category, "00_其他")

    # 日期目录
    date_dir = datetime.now().strftime("%Y%m%d")
    archive_path = os.path.join(ARCHIVE_ROOT, cat_dir, date_dir)
    os.makedirs(archive_path, exist_ok=True)

    # 重命名: 类别_时间_发件人_md5哈希_原文件名
    ts = datetime.now().strftime("%H%M%S")
    file_hash = hashlib.md5(data).hexdigest()[:8]
    safe_name = re.sub(r'[^\w\.\-]', '_', filename)[:50]
    archived_name = f"{category}_{ts}_{sender}_{file_hash}_{safe_name}"

    full_path = os.path.join(archive_path, archived_name)
    with open(full_path, "wb") as f:
        f.write(data)
    logger.info(f"[Archive] {cat_dir}/{archived_name} ({len(data)} bytes)")
    return full_path

def smart_classify_by_content(filename: str, file_size: int, user_message: str = "") -> dict:
    """智能推断文件类型，即使文件名没有关键词
    返回: {"category": str, "is_single_doc": bool, "description": str}
    """
    category = classify_file(filename)
    ext = get_file_ext(filename)
    fmt = FORMAT_MAP.get(ext, ext.lstrip(".").upper() if ext else "未知")

    # 文件名无关键词 → 通过上下文/用户消息辅助判断
    if category == "other" and user_message:
        user_lower = user_message.lower()
        if any(k in user_lower for k in ["发票", "invoice"]):
            category = "invoice"
        elif any(k in user_lower for k in ["提单", "bill of lading"]):
            category = "bill_of_lading"
        elif any(k in user_lower for k in ["装箱单", "packing"]):
            category = "packing_list"
        elif any(k in user_lower for k in ["sgs", "质检", "inspection"]):
            category = "quality_inspection"
        elif any(k in user_lower for k in ["合同", "contract"]):
            category = "contract"
        elif any(k in user_lower for k in ["原产地", "产地证"]):
            category = "certificate_of_origin"

    # 判断是否是单证类型（需要审单）
    is_single_doc = category in ("invoice", "bill_of_lading", "packing_list",
                                  "certificate_of_origin", "quality_inspection")

    description = f"文件：{filename} | 格式：{fmt} | 大小：{file_size/1024:.1f}KB | 推断类型：{CAT_DIR_NAMES.get(category, '未知')}"

    return {"category": category, "is_single_doc": is_single_doc, "description": description}

def download_wecom_media(media_id: str) -> bytes:
    """从企微下载媒体文件"""
    token = push_client._get_access_token()
    if not token:
        raise RuntimeError("Failed to get access_token for media download")
    url = f"https://qyapi.weixin.qq.com/cgi-bin/media/get?access_token={token}&media_id={media_id}"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    # 企微可能返回错误 JSON 而不是文件流
    if resp.headers.get("Content-Type", "").startswith("application/json"):
        err = resp.json()
        raise RuntimeError(f"Media download failed: {err}")
    return resp.content

# === Notion 归档记录 ===
def create_notion_record(filename: str, category: str, sender: str, saved_path: str, file_size: int, description: str = "") -> bool:
    """在 Notion 数据库创建一条文件归档记录"""
    api_key = os.getenv("NOTION_API_KEY", "")
    database_id = os.getenv("NOTION_DATABASE_ID", "")
    if not api_key or not database_id:
        logger.warning("Notion not configured, skipping archive record")
        return False

    cat_display = CAT_DIR_NAMES.get(category, "未知")
    now_iso = datetime.now().isoformat()

    payload = {
        "parent": {"database_id": database_id},
        "properties": {
            "文件名": {"title": [{"text": {"content": filename}}]},
            "类型": {"select": {"name": cat_display}},
            "发件人": {"rich_text": [{"text": {"content": sender}}]},
            "归档路径": {"rich_text": [{"text": {"content": saved_path}}]},
            "大小(KB)": {"number": round(file_size / 1024, 1)},
            "归档时间": {"date": {"start": now_iso}},
            "备注": {"rich_text": [{"text": {"content": description}}]},
        }
    }

    try:
        resp = requests.post(
            "https://api.notion.com/v1/pages",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=15
        )
        if resp.status_code == 200:
            logger.info(f"[Notion] Archive record created: {filename}")
            return True
        logger.error(f"[Notion] Failed: {resp.status_code} {resp.text}")
        return False
    except Exception as e:
        logger.error(f"[Notion] Error: {e}")
        return False

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

# === 消息去重（防止企微重试导致重复处理）===
_processing: dict[str, dict] = {}  # msgid -> {"done": threading.Event(), "reply": str}
_processing_lock = threading.Lock()

# === 推送策略 ===
# Kit 群聊：用 webhook URL 回复（无 response_url 异步限制）
# 1v1 私聊：用自建应用推送 API
def send_reply_to_source(user_id: str, ai_reply: str, response_url: str, is_group: bool = False) -> bool:
    """Send reply via the best available channel."""
    # 群聊优先用 webhook
    if is_group:
        webhook = os.getenv("WECOM_WEBHOOK_URL", "")
        if webhook:
            try:
                resp = requests.post(webhook, json={
                    "msgtype": "text",
                    "text": {"content": ai_reply}
                }, timeout=10)
                if resp.status_code == 200:
                    logger.info(f"[Kit] Reply sent via webhook to group")
                    return True
                logger.error(f"[Kit] Webhook failed: {resp.status_code} {resp.text}")
            except Exception as e:
                logger.error(f"[Kit] Webhook error: {e}")

    # 私聊用应用推送 API
    if push_client.send_text(user_id, ai_reply):
        logger.info(f"[Kit] Reply pushed to {user_id}")
        return True

    # 最后尝试 response_url
    try:
        resp = requests.post(response_url, json={
            "msgtype": "text",
            "text": {"content": ai_reply}
        }, timeout=10)
        logger.info(f"[Kit] response_url: {resp.status_code}")
    except Exception as e:
        logger.error(f"[Kit] All reply channels failed: {e}")
    return False

# === 企微主动推送（异步回复备用通道，通过自建应用 API）===
class WecomPushClient:
    """Send messages to users via WeCom Application Message API."""
    def __init__(self):
        self.agent_id = os.getenv("WECHAT_AGENT_ID", "")
        self.app_secret = os.getenv("WECHAT_SECRET", "")
        self.corp_id = os.getenv("WECHAT_CORP_ID", "")
        self._access_token = None
        self._token_expires_at = 0
        self._enabled = bool(self.agent_id and self.app_secret)

    def _get_access_token(self) -> str:
        if time.time() < self._token_expires_at and self._access_token:
            return self._access_token
        try:
            url = "https://qyapi.weixin.qq.com/cgi-bin/gettoken"
            resp = requests.get(url, params={
                "corpid": self.corp_id,
                "corpsecret": self.app_secret
            }, timeout=10).json()
            if "access_token" in resp:
                self._access_token = resp["access_token"]
                self._token_expires_at = time.time() + resp.get("expires_in", 7000) - 200
                return self._access_token
            logger.error(f"Failed to get access_token: {resp}")
            return ""
        except Exception as e:
            logger.error(f"get_token error: {e}")
            return ""

    def send_text(self, user_id: str, text: str) -> bool:
        if not self._enabled:
            return False
        token = self._get_access_token()
        if not token:
            return False
        try:
            url = f"https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token={token}"
            payload = {
                "touser": user_id,
                "agentid": int(self.agent_id),
                "msgtype": "text",
                "text": {"content": text}
            }
            resp = requests.post(url, json=payload, timeout=10).json()
            if resp.get("errcode", 1) != 0:
                logger.error(f"Push failed: {resp}")
                return False
            logger.info(f"Push OK to {user_id}")
            return True
        except Exception as e:
            logger.error(f"Push error: {e}")
            return False

push_client = WecomPushClient()

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
            # --- Kit (智能机器人) ---
            msg_id = msg_json.get("msgid", "")
            user_id = msg_json.get("from", {}).get("userid", "unknown")
            msg_type = msg_json.get("msgtype", "")
            response_url = msg_json.get("response_url", "")
            content = msg_json.get("text", {}).get("content", "")

            if msg_type == "text":
                # Check for duplicate (WeCom retry)
                with _processing_lock:
                    if msg_id in _processing:
                        logger.info(f"[Kit] Duplicate msg {msg_id[:8]}..., returning success immediately")
                        return "success"
                    _processing[msg_id] = {"done": threading.Event(), "reply": None}

                logger.info(f"[Kit] Received msg {msg_id[:8]}... from {user_id}: {content}")

                def _async_reply():
                    try:
                        t_start = time.time()
                        ai_reply = process_message_via_agents(content, user_id)
                        t_elapsed = time.time() - t_start
                        logger.info(f"[Kit] Reply generated in {t_elapsed:.1f}s")
                        send_reply_to_source(user_id, ai_reply, response_url)
                    except Exception as e:
                        logger.error(f"[Kit] Async pipeline FAILED: {type(e).__name__}: {e}", exc_info=True)
                    finally:
                        with _processing_lock:
                            _processing[msg_id]["done"].set()
                            stale = [k for k, v in _processing.items() if v["done"].is_set()]
                            for k in stale[:50]:
                                del _processing[k]

                threading.Thread(target=_async_reply, daemon=True).start()
                return "success"

            elif msg_type in ("file", "image"):
                # 群聊文件/图片自动归档+审单
                if msg_type == "file":
                    file_info = msg_json.get("file", {})
                    media_id = file_info.get("media_id", "")
                    file_title = file_info.get("title", "unknown")
                    file_size = file_info.get("file_size", 0)
                elif msg_type == "image":
                    image_info = msg_json.get("image", {})
                    media_id = image_info.get("media_id", "")
                    file_title = "photo.jpg"  # 企微图片无文件名，默认 JPG
                    file_size = 0
                    category = "image"  # 图片默认归类

                with _processing_lock:
                    if msg_id in _processing:
                        return "success"
                    _processing[msg_id] = {"done": threading.Event(), "reply": None}

                logger.info(f"[Kit] {msg_type.upper()} received: {file_title} from {user_id}")

                def _async_file_process():
                    try:
                        # 1. 下载文件
                        file_data = download_wecom_media(media_id)
                        logger.info(f"[Kit] Downloaded: {file_title} ({len(file_data)} bytes)")

                        # 2. 智能分类（文件名+上下文+扩展名）
                        if msg_type == "image":
                            category = "image"
                            info = {"category": "image", "is_single_doc": False, "description": f"图片：{file_title}"}
                        else:
                            info = smart_classify_by_content(file_title, len(file_data))
                            category = info["category"]

                        # 3. 归档
                        saved_path = archive_file(file_data, file_title, user_id, msg_id, category)

                        # 4. 写入 Notion 归档记录
                        create_notion_record(file_title, category, user_id, saved_path, len(file_data), info["description"])

                        # 5. 根据类型决定回复策略
                        if info["is_single_doc"]:
                            # 单证类：自动交给 Docu-Checker
                            prompt = (
                                f"群里客户上传了文件：{file_title}\n"
                                f"文件大小 {len(file_data)/1024:.0f} KB，格式 {get_file_ext(file_title)}\n"
                                f"系统推断类型：{CAT_DIR_NAMES.get(category, '未知')}\n"
                                f"文件已归档到 {saved_path}\n\n"
                                f"你无法直接读取文件内容，但请根据单证类型给出：\n"
                                f"1. 该类型单证必须核对的关键字段清单\n"
                                f"2. 常见造假/错误风险点\n"
                                f"3. 提醒业务员手动打开归档文件逐一核对"
                            )
                            ai_reply = process_message_via_agents(prompt, user_id)
                        elif category == "image":
                            ai_reply = (
                                f"📸 **图片已归档**\n"
                                f"发件人：{user_id}\n"
                                f"存档：{saved_path}\n"
                                f"如需分析图片内容，请发送指令：「分析这张图片」"
                            )
                        elif category == "other":
                            # 无法判断类型 → 让 AI 智能猜测
                            ai_reply = (
                                f"📁 **文件已归档**\n"
                                f"文件名：{file_title}\n"
                                f"发件人：{user_id}\n"
                                f"存档：{saved_path}\n\n"
                                f"系统未识别此文件类型。如需审核，请描述文件类型（如「这是发票」或「帮我审提单」），我会自动调对应智能体。"
                            )
                        else:
                            ai_reply = (
                                f"📁 **文件已归档**\n"
                                f"文件名：{file_title}\n"
                                f"类型：{CAT_DIR_NAMES.get(category, '未知')}\n"
                                f"发件人：{user_id}\n"
                                f"存档：{saved_path}\n\n"
                                f"如需审核此单证，请发送指令：「审核此文件」"
                            )

                        send_reply_to_source(user_id, ai_reply, response_url)
                        logger.info(f"[Kit] {msg_type} processed: {category}")
                    except Exception as e:
                        logger.error(f"[Kit] File processing FAILED: {type(e).__name__}: {e}", exc_info=True)
                        try:
                            send_reply_to_source(user_id, f"⚠️ 文件处理失败：{str(e)[:100]}", response_url)
                        except Exception:
                            pass
                    finally:
                        with _processing_lock:
                            _processing[msg_id]["done"].set()
                            stale = [k for k, v in _processing.items() if v["done"].is_set()]
                            for k in stale[:50]:
                                del _processing[k]

                threading.Thread(target=_async_file_process, daemon=True).start()
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
    app.run(host='0.0.0.0', port=5000, threaded=True)
