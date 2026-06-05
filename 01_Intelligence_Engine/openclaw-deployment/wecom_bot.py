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

try:
    import file_extractor
except ImportError:
    file_extractor = None

# 初始化日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("wecom_bot")

# === 审单文档缓存池 ===
USER_DOCUMENT_SESSIONS = {}
USER_LAST_FILE = {}

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

# 引入 Audit-Pro
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "skills"))
try:
    from audit_pro.audit_pro import AuditProService
    audit_service = AuditProService()
except Exception as e:
    logger.error(f"Failed to load AuditProService: {e}")
    audit_service = None


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
    
    # 匹配提单号格式：通常为4位字母前缀+7至12位数字（例如：cosu6445120930）
    base, _ = os.path.splitext(fname_lower)
    if re.match(r'^[a-z]{4}\d{7,12}$', base):
        return "bill_of_lading"
        
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
    database_id = os.getenv("NOTION_ARCHIVE_DATABASE_ID", os.getenv("NOTION_DATABASE_ID", ""))
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

def call_vision_ocr(file_path: str, doc_type: str) -> dict:
    """调用 qwen-vl-max 提取图片上的单证字段"""
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        logger.error("DASHSCOPE_API_KEY not configured")
        return {}
    
    ext = get_file_ext(file_path)
    if ext not in [".jpg", ".jpeg", ".png", ".bmp"]:
        logger.warning(f"File {file_path} is not an image, cannot OCR with qwen-vl")
        return {}
        
    try:
        with open(file_path, "rb") as f:
            base64_img = base64.b64encode(f.read()).decode("utf-8")
            
        mime = "image/jpeg"
        if ext == ".png": mime = "image/png"
        
        prompt = (
            f"你是一个智能审单专家。这是一份类型为 {doc_type} 的单据图片。\n"
            f"请仔细提取以下关键字段的值（如果没有找到，请将其值设为 null）：\n"
            f"- type (固定为 {doc_type.upper()})\n"
            f"- net_weight (提取净重数值)\n"
            f"- unit_price (提取单价)\n"
            f"- total_amount (提取总金额)\n"
            f"- latest_shipment_date (提取最晚装运期，格式 YYYY-MM-DD)\n"
            f"- container_no (提取集装箱号，通常格式为4位字母+7位数字)\n"
            f"- seal_no (提取封条号)\n"
            f"- shipper_name (提取发货人/公司名称)\n"
            f"- shipper_address (提取发货人地址)\n"
            f"- consignee_name (提取收货人/公司名称)\n"
            f"- consignee_address (提取收货人地址)\n"
            f"仅输出 JSON 格式，不要包含任何 markdown 标记或其他解释文本。"
        )
        
        payload = {
            "model": "qwen-vl-max",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{base64_img}"}}
                    ]
                }
            ]
        }
        
        resp = requests.post(
            "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=45
        )
        
        if resp.status_code == 200:
            content = resp.json()["choices"][0]["message"]["content"]
            clean_json = content.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_json)
        else:
            logger.error(f"OCR Failed: {resp.text}")
            return {}
            
    except Exception as e:
        logger.error(f"OCR Exception: {e}")
        return {}


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

                content_clean = content.strip()
                if content_clean in ["清空", "重置", "重新审核"]:
                    if user_id in USER_DOCUMENT_SESSIONS:
                        USER_DOCUMENT_SESSIONS[user_id] = {}
                    send_reply_to_source(user_id, "🧹 已为您清空当前的审单文档缓存，可以开始上传新的单证进行审核。", response_url)
                    with _processing_lock:
                        _processing[msg_id]["done"].set()
                    return "success"

                # Check for manual category override
                matched_category = None
                category_name_cn = ""
                if any(kw in content_clean for kw in ["这是提单", "设为提单", "改为提单", "为提单"]):
                    matched_category = "bill_of_lading"
                    category_name_cn = "提单"
                elif any(kw in content_clean for kw in ["这是发票", "设为发票", "改为发票", "为发票"]):
                    matched_category = "invoice"
                    category_name_cn = "发票"
                elif any(kw in content_clean for kw in ["这是装箱单", "设为装箱单", "改为装箱单", "为装箱单"]):
                    matched_category = "packing_list"
                    category_name_cn = "装箱单"

                if matched_category:
                    last_file_info = USER_LAST_FILE.get(user_id)
                    if not last_file_info:
                        send_reply_to_source(user_id, "⚠️ 未找到您最近上传的文件，请先发送文件/图片。", response_url)
                        with _processing_lock:
                            _processing[msg_id]["done"].set()
                        return "success"
                    
                    saved_path = last_file_info["path"]
                    file_title = last_file_info["filename"]
                    
                    send_reply_to_source(user_id, f"🔍 已收到指令，正在将 {file_title} 重新识别为【{category_name_cn}】并运行审核...", response_url)
                    
                    def _async_manual_process():
                        try:
                            ext = get_file_ext(saved_path)
                            if ext in [".jpg", ".jpeg", ".png", ".bmp"]:
                                ocr_data = call_vision_ocr(saved_path, matched_category)
                                if ocr_data and audit_service:
                                    if user_id not in USER_DOCUMENT_SESSIONS:
                                        USER_DOCUMENT_SESSIONS[user_id] = {}
                                    
                                    doc_type_key = ocr_data.get('type') or matched_category.upper()
                                    ocr_data['type'] = doc_type_key
                                    USER_DOCUMENT_SESSIONS[user_id][doc_type_key] = ocr_data
                                    
                                    import asyncio
                                    audit_result = asyncio.run(audit_service.run_full_audit(list(USER_DOCUMENT_SESSIONS[user_id].values())))
                                    
                                    session_docs = USER_DOCUMENT_SESSIONS[user_id]
                                    doc_types_str = ", ".join([k for k in session_docs.keys()])
                                    
                                    extracted_summary = []
                                    for dtype, ddata in session_docs.items():
                                        parts = []
                                        if ddata.get('net_weight') is not None: parts.append(f"净重: {ddata.get('net_weight')}")
                                        if ddata.get('unit_price') is not None: parts.append(f"单价: {ddata.get('unit_price')}")
                                        if ddata.get('total_amount') is not None: parts.append(f"总金额: {ddata.get('total_amount')}")
                                        if ddata.get('container_no') is not None: parts.append(f"箱号: {ddata.get('container_no')}")
                                        if ddata.get('seal_no') is not None: parts.append(f"封条号: {ddata.get('seal_no')}")
                                        if ddata.get('shipper_name') is not None: parts.append(f"发货人: {ddata.get('shipper_name')}")
                                        if ddata.get('shipper_address') is not None: parts.append(f"发货人地址: {ddata.get('shipper_address')}")
                                        if ddata.get('consignee_name') is not None: parts.append(f"收货人: {ddata.get('consignee_name')}")
                                        if ddata.get('consignee_address') is not None: parts.append(f"收货人地址: {ddata.get('consignee_address')}")
                                        extracted_summary.append(f"📍 **{dtype}**:\n  - " + "\n  - ".join(parts))
                                    
                                    extracted_summary_str = "\n".join(extracted_summary)

                                    if audit_result.get("findings"):
                                        findings_str = "\n".join([f"- {f['finding']}" for f in audit_result["findings"]])
                                    else:
                                        findings_str = "- 未发现任何不符点或需要核对的内容。"

                                    if audit_result["overall_status"] in ("DISCREPANCY_DETECTED", "WARNING"):
                                        status_icon = "🚨"
                                        status_title = "发现单据不符点/风险项"
                                    else:
                                        status_icon = "✅"
                                        status_title = "审核核对完毕"

                                    ai_reply = (
                                        f"{status_icon} **Docu-Checker 智能审核结果 ({status_title})**\n"
                                        f"当前接收文件：{file_title} ({matched_category.upper()})\n"
                                        f"当前缓存池单证：{doc_types_str}\n\n"
                                        f"📋 **提取单证关键信息：**\n{extracted_summary_str}\n\n"
                                        f"🔍 **比对与核对结果：**\n{findings_str}\n\n"
                                        f"👉 建议核实存档文件路径：{saved_path}\n"
                                        f"💡 提示：如需重新开始审核，可发送指令“清空”或“重置”清空缓存池。"
                                    )
                                else:
                                    ai_reply = f"⚠️ 视觉 OCR 提取失败或审核模块出错，请人工核实文件：{saved_path}"
                            else:
                                ai_reply = f"⚠️ 该文件不是图片格式，无法进行视觉识别：{saved_path}"
                            
                            send_reply_to_source(user_id, ai_reply, response_url)
                        except Exception as e:
                            logger.error(f"[Kit] Manual file process FAILED: {e}", exc_info=True)
                            send_reply_to_source(user_id, f"⚠️ 处理失败：{str(e)}", response_url)
                        finally:
                            with _processing_lock:
                                _processing[msg_id]["done"].set()
                                stale = [k for k, v in _processing.items() if v["done"].is_set()]
                                for k in stale[:50]:
                                    del _processing[k]

                    threading.Thread(target=_async_manual_process, daemon=True).start()
                    return "success"

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

                        # 记录最近上传的文件，便于后续手动修正类型
                        USER_LAST_FILE[user_id] = {
                            "path": saved_path,
                            "filename": file_title,
                            "size": len(file_data)
                        }

                        # 4. 写入 Notion 归档记录
                        create_notion_record(file_title, category, user_id, saved_path, len(file_data), info["description"])

                        # 5. 根据类型决定回复策略
                        if info["is_single_doc"]:
                            # 单证类：自动交给 Docu-Checker
                            ext = get_file_ext(saved_path)
                            if ext in [".jpg", ".jpeg", ".png", ".bmp"]:
                                send_reply_to_source(user_id, f"🔍 正在启动【Docu-Checker 视觉中枢】读取 {file_title} 的内容...", response_url)
                                
                                ocr_data = call_vision_ocr(saved_path, category)
                                
                                if ocr_data and audit_service:
                                    if user_id not in USER_DOCUMENT_SESSIONS:
                                        USER_DOCUMENT_SESSIONS[user_id] = {}
                                    
                                    doc_type_key = ocr_data.get('type') or category.upper()
                                    ocr_data['type'] = doc_type_key
                                    USER_DOCUMENT_SESSIONS[user_id][doc_type_key] = ocr_data
                                    
                                    import asyncio
                                    audit_result = asyncio.run(audit_service.run_full_audit(list(USER_DOCUMENT_SESSIONS[user_id].values())))
                                    
                                    session_docs = USER_DOCUMENT_SESSIONS[user_id]
                                    doc_types_str = ", ".join([k for k in session_docs.keys()])
                                    
                                    extracted_summary = []
                                    for dtype, ddata in session_docs.items():
                                        parts = []
                                        if ddata.get('net_weight') is not None: parts.append(f"净重: {ddata.get('net_weight')}")
                                        if ddata.get('unit_price') is not None: parts.append(f"单价: {ddata.get('unit_price')}")
                                        if ddata.get('total_amount') is not None: parts.append(f"总金额: {ddata.get('total_amount')}")
                                        if ddata.get('container_no') is not None: parts.append(f"箱号: {ddata.get('container_no')}")
                                        if ddata.get('seal_no') is not None: parts.append(f"封条号: {ddata.get('seal_no')}")
                                        if ddata.get('shipper_name') is not None: parts.append(f"发货人: {ddata.get('shipper_name')}")
                                        if ddata.get('shipper_address') is not None: parts.append(f"发货人地址: {ddata.get('shipper_address')}")
                                        if ddata.get('consignee_name') is not None: parts.append(f"收货人: {ddata.get('consignee_name')}")
                                        if ddata.get('consignee_address') is not None: parts.append(f"收货人地址: {ddata.get('consignee_address')}")
                                        extracted_summary.append(f"📍 **{dtype}**:\n  - " + "\n  - ".join(parts))
                                    
                                    extracted_summary_str = "\n".join(extracted_summary)

                                    if audit_result.get("findings"):
                                        findings_str = "\n".join([f"- {f['finding']}" for f in audit_result["findings"]])
                                    else:
                                        findings_str = "- 未发现任何不符点或需要核对的内容。"

                                    if audit_result["overall_status"] in ("DISCREPANCY_DETECTED", "WARNING"):
                                        status_icon = "🚨"
                                        status_title = "发现单据不符点/风险项"
                                    else:
                                        status_icon = "✅"
                                        status_title = "审核核对完毕"

                                    ai_reply = (
                                        f"{status_icon} **Docu-Checker 智能审核结果 ({status_title})**\n"
                                        f"当前接收文件：{file_title} ({category.upper()})\n"
                                        f"当前缓存池单证：{doc_types_str}\n\n"
                                        f"📋 **提取单证关键信息：**\n{extracted_summary_str}\n\n"
                                        f"🔍 **比对与核对结果：**\n{findings_str}\n\n"
                                        f"👉 建议核实存档文件路径：{saved_path}\n"
                                        f"💡 提示：如需重新开始审核，可发送指令“清空”或“重置”清空缓存池。"
                                    )
                                else:
                                    ai_reply = f"⚠️ 视觉 OCR 提取失败或审核模块出错，请人工核实文件：{saved_path}"
                            else:
                                # PDF, Word, Excel 等文档自动提取和审核
                                send_reply_to_source(user_id, f"🔍 正在启动【Docu-Checker 文档中枢】解析 {file_title} 的内容...", response_url)
                                
                                ocr_data = None
                                error_msg = None
                                
                                try:
                                    extracted_text = ""
                                    if ext == ".pdf":
                                        try:
                                            extracted_text = file_extractor.extract_pdf_text(saved_path)
                                        except ImportError:
                                            error_msg = "pip install pypdf"
                                    elif ext in [".docx", ".doc"]:
                                        try:
                                            extracted_text = file_extractor.extract_docx_text(saved_path)
                                        except ImportError:
                                            error_msg = "pip install python-docx"
                                    elif ext in [".xlsx", ".xls"]:
                                        try:
                                            extracted_text = file_extractor.extract_xlsx_text(saved_path)
                                        except ImportError:
                                            error_msg = "pip install pandas openpyxl"
                                    elif ext in [".csv", ".txt"]:
                                        with open(saved_path, "r", encoding="utf-8", errors="ignore") as f:
                                            extracted_text = f.read()
                                            
                                    if error_msg:
                                        ai_reply = (
                                            f"⚠️ **解析库未安装**\n"
                                            f"系统检测到未安装处理 {ext} 文件所需的 Python 依赖库。\n"
                                            f"请联系系统管理员在服务器上运行以下安装命令：\n"
                                            f"`pip install pypdf python-docx pandas openpyxl`\n\n"
                                            f"👉 临时方案：请将文件另存为 **图片** 发送给机器人进行自动审核。"
                                        )
                                        send_reply_to_source(user_id, ai_reply, response_url)
                                        return
                                        
                                    if not extracted_text.strip():
                                        # 如果是 PDF 且无文本，尝试转换为图片再识别
                                        if ext == ".pdf":
                                            send_reply_to_source(user_id, f"💡 检测到 {file_title} 可能是扫描件 PDF，正在尝试转换为图片以进行视觉识别...", response_url)
                                            images = file_extractor.convert_pdf_to_images(saved_path, os.path.dirname(saved_path))
                                            if images:
                                                # 使用第一页的图片运行视觉识别
                                                ocr_data = call_vision_ocr(images[0], category)
                                                # 清理生成的临时图片
                                                for img in images:
                                                    try: os.remove(img)
                                                    except: pass
                                            if not ocr_data:
                                                ai_reply = f"⚠️ 该 PDF 文件无数字化文本且系统未配置 pdf2image 转换环境，请直接发送单证的清晰图片进行审核。"
                                                send_reply_to_source(user_id, ai_reply, response_url)
                                                return
                                        else:
                                            ai_reply = f"⚠️ 无法读取 {file_title} 中的任何内容，请确认该文档非空且没有被加密。"
                                            send_reply_to_source(user_id, ai_reply, response_url)
                                            return
                                    else:
                                        # 使用文本提取器获取 JSON
                                        ocr_data = file_extractor.extract_fields_from_text(extracted_text, category)
                                        
                                    # 运行多文档全量比对审核
                                    if ocr_data and audit_service:
                                        if user_id not in USER_DOCUMENT_SESSIONS:
                                            USER_DOCUMENT_SESSIONS[user_id] = {}
                                        
                                        doc_type_key = ocr_data.get('type') or category.upper()
                                        ocr_data['type'] = doc_type_key
                                        USER_DOCUMENT_SESSIONS[user_id][doc_type_key] = ocr_data
                                        
                                        import asyncio
                                        audit_result = asyncio.run(audit_service.run_full_audit(list(USER_DOCUMENT_SESSIONS[user_id].values())))
                                        
                                        session_docs = USER_DOCUMENT_SESSIONS[user_id]
                                        doc_types_str = ", ".join([k for k in session_docs.keys()])
                                        
                                        extracted_summary = []
                                        for dtype, ddata in session_docs.items():
                                            parts = []
                                            if ddata.get('net_weight') is not None: parts.append(f"净重: {ddata.get('net_weight')}")
                                            if ddata.get('unit_price') is not None: parts.append(f"单价: {ddata.get('unit_price')}")
                                            if ddata.get('total_amount') is not None: parts.append(f"总金额: {ddata.get('total_amount')}")
                                            if ddata.get('container_no') is not None: parts.append(f"箱号: {ddata.get('container_no')}")
                                            if ddata.get('seal_no') is not None: parts.append(f"封条号: {ddata.get('seal_no')}")
                                            if ddata.get('shipper_name') is not None: parts.append(f"发货人: {ddata.get('shipper_name')}")
                                            if ddata.get('shipper_address') is not None: parts.append(f"发货人地址: {ddata.get('shipper_address')}")
                                            if ddata.get('consignee_name') is not None: parts.append(f"收货人: {ddata.get('consignee_name')}")
                                            if ddata.get('consignee_address') is not None: parts.append(f"收货人地址: {ddata.get('consignee_address')}")
                                            extracted_summary.append(f"📍 **{dtype}**:\n  - " + "\n  - ".join(parts))
                                        
                                        extracted_summary_str = "\n".join(extracted_summary)

                                        if audit_result.get("findings"):
                                            findings_str = "\n".join([f"- {f['finding']}" for f in audit_result["findings"]])
                                        else:
                                            findings_str = "- 未发现任何不符点或需要核对的内容。"

                                        if audit_result["overall_status"] in ("DISCREPANCY_DETECTED", "WARNING"):
                                            status_icon = "🚨"
                                            status_title = "发现单据不符点/风险项"
                                        else:
                                            status_icon = "✅"
                                            status_title = "审核核对完毕"

                                        ai_reply = (
                                            f"{status_icon} **Docu-Checker 智能审核结果 ({status_title})**\n"
                                            f"当前接收文件：{file_title} ({category.upper()})\n"
                                            f"当前缓存池单证：{doc_types_str}\n\n"
                                            f"📋 **提取单证关键信息：**\n{extracted_summary_str}\n\n"
                                            f"🔍 **比对与核对结果：**\n{findings_str}\n\n"
                                            f"👉 建议核实存档文件路径：{saved_path}\n"
                                            f"💡 提示：如需重新开始审核，可发送指令“清空”或“重置”清空缓存池。"
                                        )
                                    else:
                                        ai_reply = f"⚠️ 提取失败或审核模块出错，请人工核实文件内容。"
                                        
                                    send_reply_to_source(user_id, ai_reply, response_url)
                                except Exception as e:
                                    logger.error(f"Failed to process doc: {e}", exc_info=True)
                                    send_reply_to_source(user_id, f"⚠️ 处理文档 {file_title} 时发生错误：{e}", response_url)
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

                content_clean = content.strip()
                if content_clean in ["清空", "重置", "重新审核"]:
                    if user_id in USER_DOCUMENT_SESSIONS:
                        USER_DOCUMENT_SESSIONS[user_id] = {}
                    ai_reply = "🧹 已为您清空当前的审单文档缓存，可以开始上传新的单证进行审核。"
                else:
                    # Check for manual category override
                    matched_category = None
                    category_name_cn = ""
                    if any(kw in content_clean for kw in ["这是提单", "设为提单", "改为提单", "为提单"]):
                        matched_category = "bill_of_lading"
                        category_name_cn = "提单"
                    elif any(kw in content_clean for kw in ["这是发票", "设为发票", "改为发票", "为发票"]):
                        matched_category = "invoice"
                        category_name_cn = "发票"
                    elif any(kw in content_clean for kw in ["这是装箱单", "设为装箱单", "改为装箱单", "为装箱单"]):
                        matched_category = "packing_list"
                        category_name_cn = "装箱单"

                    if matched_category:
                        last_file_info = USER_LAST_FILE.get(user_id)
                        if not last_file_info:
                            ai_reply = "⚠️ 未找到您最近上传的文件，请先发送文件/图片。"
                        else:
                            saved_path = last_file_info["path"]
                            file_title = last_file_info["filename"]
                            
                            ai_reply = f"🔍 已收到指令，正在将 {file_title} 重新识别为【{category_name_cn}】并运行审核..."
                            
                            def _async_manual_process_xml():
                                try:
                                    ext = get_file_ext(saved_path)
                                    if ext in [".jpg", ".jpeg", ".png", ".bmp"]:
                                        ocr_data = call_vision_ocr(saved_path, matched_category)
                                        if ocr_data and audit_service:
                                            if user_id not in USER_DOCUMENT_SESSIONS:
                                                USER_DOCUMENT_SESSIONS[user_id] = {}
                                            
                                            doc_type_key = ocr_data.get('type') or matched_category.upper()
                                            ocr_data['type'] = doc_type_key
                                            USER_DOCUMENT_SESSIONS[user_id][doc_type_key] = ocr_data
                                            
                                            import asyncio
                                            audit_result = asyncio.run(audit_service.run_full_audit(list(USER_DOCUMENT_SESSIONS[user_id].values())))
                                            
                                            session_docs = USER_DOCUMENT_SESSIONS[user_id]
                                            doc_types_str = ", ".join([k for k in session_docs.keys()])
                                            
                                            extracted_summary = []
                                            for dtype, ddata in session_docs.items():
                                                parts = []
                                                if ddata.get('net_weight') is not None: parts.append(f"净重: {ddata.get('net_weight')}")
                                                if ddata.get('unit_price') is not None: parts.append(f"单价: {ddata.get('unit_price')}")
                                                if ddata.get('total_amount') is not None: parts.append(f"总金额: {ddata.get('total_amount')}")
                                                if ddata.get('container_no') is not None: parts.append(f"箱号: {ddata.get('container_no')}")
                                                if ddata.get('seal_no') is not None: parts.append(f"封条号: {ddata.get('seal_no')}")
                                                if ddata.get('shipper_name') is not None: parts.append(f"发货人: {ddata.get('shipper_name')}")
                                                if ddata.get('shipper_address') is not None: parts.append(f"发货人地址: {ddata.get('shipper_address')}")
                                                if ddata.get('consignee_name') is not None: parts.append(f"收货人: {ddata.get('consignee_name')}")
                                                if ddata.get('consignee_address') is not None: parts.append(f"收货人地址: {ddata.get('consignee_address')}")
                                                extracted_summary.append(f"📍 **{dtype}**:\n  - " + "\n  - ".join(parts))
                                            
                                            extracted_summary_str = "\n".join(extracted_summary)

                                            if audit_result.get("findings"):
                                                findings_str = "\n".join([f"- {f['finding']}" for f in audit_result["findings"]])
                                            else:
                                                findings_str = "- 未发现任何不符点或需要核对的内容。"

                                            if audit_result["overall_status"] in ("DISCREPANCY_DETECTED", "WARNING"):
                                                status_icon = "🚨"
                                                status_title = "发现单据不符点/风险项"
                                            else:
                                                status_icon = "✅"
                                                status_title = "审核核对完毕"

                                            push_reply = (
                                                f"{status_icon} **Docu-Checker 智能审核结果 ({status_title})**\n"
                                                f"当前接收文件：{file_title} ({matched_category.upper()})\n"
                                                f"当前缓存池单证：{doc_types_str}\n\n"
                                                f"📋 **提取单证关键信息：**\n{extracted_summary_str}\n\n"
                                                f"🔍 **比对与核对结果：**\n{findings_str}\n\n"
                                                f"👉 建议核实存档文件路径：{saved_path}\n"
                                                f"💡 提示：如需重新开始审核，可发送指令“清空”或“重置”清空缓存池。"
                                            )
                                        else:
                                            push_reply = f"⚠️ 视觉 OCR 提取失败或审核模块出错，请人工核实文件：{saved_path}"
                                    else:
                                        push_reply = f"⚠️ 该文件不是图片格式，无法进行视觉识别：{saved_path}"
                                    
                                    send_reply_to_source(user_id, push_reply, "")
                                except Exception as e:
                                    logger.error(f"[XML-App] Manual manual process XML failed: {e}", exc_info=True)
                                    send_reply_to_source(user_id, f"⚠️ 修正处理失败：{str(e)}", "")

                            threading.Thread(target=_async_manual_process_xml, daemon=True).start()
                    else:
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
            
            elif msg_type in ("file", "image"):
                msg_id = msg_root.find("MsgId").text if msg_root.find("MsgId") is not None else str(int(time.time() * 1000))
                
                if msg_type == "file":
                    media_id_node = msg_root.find(".//MediaId")
                    file_title_node = msg_root.find(".//FileName") or msg_root.find(".//Title")
                    file_size_node = msg_root.find(".//FileSize")
                    
                    media_id = media_id_node.text if media_id_node is not None else ""
                    file_title = file_title_node.text if file_title_node is not None else "unknown"
                    file_size = int(file_size_node.text) if file_size_node is not None else 0
                elif msg_type == "image":
                    media_id_node = msg_root.find(".//MediaId")
                    media_id = media_id_node.text if media_id_node is not None else ""
                    file_title = "photo.jpg"
                    file_size = 0
                    category = "image"

                with _processing_lock:
                    if msg_id in _processing:
                        return "success"
                    _processing[msg_id] = {"done": threading.Event(), "reply": None}

                logger.info(f"[XML-App] {msg_type.upper()} received: {file_title} from {user_id}")

                def _async_file_process_xml():
                    try:
                        # 1. 下载文件
                        file_data = download_wecom_media(media_id)
                        logger.info(f"[XML-App] Downloaded: {file_title} ({len(file_data)} bytes)")

                        # 2. 智能分类
                        if msg_type == "image":
                            category = "image"
                            info = {"category": "image", "is_single_doc": False, "description": f"图片：{file_title}"}
                        else:
                            info = smart_classify_by_content(file_title, len(file_data))
                            category = info["category"]

                        # 3. 归档
                        saved_path = archive_file(file_data, file_title, user_id, msg_id, category)

                        # 记录最近上传的文件
                        USER_LAST_FILE[user_id] = {
                            "path": saved_path,
                            "filename": file_title,
                            "size": len(file_data)
                        }

                        # 4. 写入 Notion 归档记录
                        create_notion_record(file_title, category, user_id, saved_path, len(file_data), info["description"])

                        # 5. 根据类型决定回复策略
                        if info["is_single_doc"]:
                            ext = get_file_ext(saved_path)
                            if ext in [".jpg", ".jpeg", ".png", ".bmp"]:
                                send_reply_to_source(user_id, f"🔍 正在启动【Docu-Checker 视觉中枢】读取 {file_title} 的内容...", "")
                                
                                ocr_data = call_vision_ocr(saved_path, category)
                                
                                if ocr_data and audit_service:
                                    if user_id not in USER_DOCUMENT_SESSIONS:
                                        USER_DOCUMENT_SESSIONS[user_id] = {}
                                    
                                    doc_type_key = ocr_data.get('type') or category.upper()
                                    ocr_data['type'] = doc_type_key
                                    USER_DOCUMENT_SESSIONS[user_id][doc_type_key] = ocr_data
                                    
                                    import asyncio
                                    audit_result = asyncio.run(audit_service.run_full_audit(list(USER_DOCUMENT_SESSIONS[user_id].values())))
                                    
                                    session_docs = USER_DOCUMENT_SESSIONS[user_id]
                                    doc_types_str = ", ".join([k for k in session_docs.keys()])
                                    
                                    extracted_summary = []
                                    for dtype, ddata in session_docs.items():
                                        parts = []
                                        if ddata.get('net_weight') is not None: parts.append(f"净重: {ddata.get('net_weight')}")
                                        if ddata.get('unit_price') is not None: parts.append(f"单价: {ddata.get('unit_price')}")
                                        if ddata.get('total_amount') is not None: parts.append(f"总金额: {ddata.get('total_amount')}")
                                        if ddata.get('container_no') is not None: parts.append(f"箱号: {ddata.get('container_no')}")
                                        if ddata.get('seal_no') is not None: parts.append(f"封条号: {ddata.get('seal_no')}")
                                        if ddata.get('shipper_name') is not None: parts.append(f"发货人: {ddata.get('shipper_name')}")
                                        if ddata.get('shipper_address') is not None: parts.append(f"发货人地址: {ddata.get('shipper_address')}")
                                        if ddata.get('consignee_name') is not None: parts.append(f"收货人: {ddata.get('consignee_name')}")
                                        if ddata.get('consignee_address') is not None: parts.append(f"收货人地址: {ddata.get('consignee_address')}")
                                        extracted_summary.append(f"📍 **{dtype}**:\n  - " + "\n  - ".join(parts))
                                    
                                    extracted_summary_str = "\n".join(extracted_summary)

                                    if audit_result.get("findings"):
                                        findings_str = "\n".join([f"- {f['finding']}" for f in audit_result["findings"]])
                                    else:
                                        findings_str = "- 未发现任何不符点或需要核对的内容。"

                                    if audit_result["overall_status"] in ("DISCREPANCY_DETECTED", "WARNING"):
                                        status_icon = "🚨"
                                        status_title = "发现单据不符点/风险项"
                                    else:
                                        status_icon = "✅"
                                        status_title = "审核核对完毕"

                                    ai_reply = (
                                        f"{status_icon} **Docu-Checker 智能审核结果 ({status_title})**\n"
                                        f"当前接收文件：{file_title} ({category.upper()})\n"
                                        f"当前缓存池单证：{doc_types_str}\n\n"
                                        f"📋 **提取单证关键信息：**\n{extracted_summary_str}\n\n"
                                        f"🔍 **比对与核对结果：**\n{findings_str}\n\n"
                                        f"👉 建议核实存档文件路径：{saved_path}\n"
                                        f"💡 提示：如需重新开始审核，可发送指令“清空”或“重置”清空缓存池。"
                                    )
                                else:
                                    ai_reply = f"⚠️ 视觉 OCR 提取失败或审核模块出错，请人工核实文件：{saved_path}"
                            else:
                                # PDF, Word, Excel 等文档自动提取和审核
                                send_reply_to_source(user_id, f"🔍 正在启动【Docu-Checker 文档中枢】解析 {file_title} 的内容...", "")
                                
                                ocr_data = None
                                error_msg = None
                                
                                try:
                                    extracted_text = ""
                                    if ext == ".pdf":
                                        try:
                                            extracted_text = file_extractor.extract_pdf_text(saved_path)
                                        except ImportError:
                                            error_msg = "pip install pypdf"
                                    elif ext in [".docx", ".doc"]:
                                        try:
                                            extracted_text = file_extractor.extract_docx_text(saved_path)
                                        except ImportError:
                                            error_msg = "pip install python-docx"
                                    elif ext in [".xlsx", ".xls"]:
                                        try:
                                            extracted_text = file_extractor.extract_xlsx_text(saved_path)
                                        except ImportError:
                                            error_msg = "pip install pandas openpyxl"
                                    elif ext in [".csv", ".txt"]:
                                        with open(saved_path, "r", encoding="utf-8", errors="ignore") as f:
                                            extracted_text = f.read()
                                            
                                    if error_msg:
                                        ai_reply = (
                                            f"⚠️ **解析库未安装**\n"
                                            f"系统检测到未安装处理 {ext} 文件所需的 Python 依赖库。\n"
                                            f"请联系系统管理员在服务器上运行以下安装命令：\n"
                                            f"`pip install pypdf python-docx pandas openpyxl`\n\n"
                                            f"👉 临时方案：请将文件另存为 **图片** 发送给机器人进行自动审核。"
                                        )
                                        send_reply_to_source(user_id, ai_reply, "")
                                        return
                                        
                                    if not extracted_text.strip():
                                        # 如果是 PDF 且无文本，尝试转换为图片再识别
                                        if ext == ".pdf":
                                            send_reply_to_source(user_id, f"💡 检测到 {file_title} 可能是扫描件 PDF，正在尝试转换为图片以进行视觉识别...", "")
                                            images = file_extractor.convert_pdf_to_images(saved_path, os.path.dirname(saved_path))
                                            if images:
                                                # 使用第一页的图片运行视觉识别
                                                ocr_data = call_vision_ocr(images[0], category)
                                                # 清理生成的临时图片
                                                for img in images:
                                                    try: os.remove(img)
                                                    except: pass
                                            if not ocr_data:
                                                ai_reply = f"⚠️ 该 PDF 文件无数字化文本且系统未配置 pdf2image 转换环境，请直接发送单证的清晰图片进行审核。"
                                                send_reply_to_source(user_id, ai_reply, "")
                                                return
                                        else:
                                            ai_reply = f"⚠️ 无法读取 {file_title} 中的任何内容，请确认该文档非空且没有被加密。"
                                            send_reply_to_source(user_id, ai_reply, "")
                                            return
                                    else:
                                        # 使用文本提取器获取 JSON
                                        ocr_data = file_extractor.extract_fields_from_text(extracted_text, category)
                                        
                                    # 运行多文档全量比对审核
                                    if ocr_data and audit_service:
                                        if user_id not in USER_DOCUMENT_SESSIONS:
                                            USER_DOCUMENT_SESSIONS[user_id] = {}
                                        
                                        doc_type_key = ocr_data.get('type') or category.upper()
                                        ocr_data['type'] = doc_type_key
                                        USER_DOCUMENT_SESSIONS[user_id][doc_type_key] = ocr_data
                                        
                                        import asyncio
                                        audit_result = asyncio.run(audit_service.run_full_audit(list(USER_DOCUMENT_SESSIONS[user_id].values())))
                                        
                                        session_docs = USER_DOCUMENT_SESSIONS[user_id]
                                        doc_types_str = ", ".join([k for k in session_docs.keys()])
                                        
                                        extracted_summary = []
                                        for dtype, ddata in session_docs.items():
                                            parts = []
                                            if ddata.get('net_weight') is not None: parts.append(f"净重: {ddata.get('net_weight')}")
                                            if ddata.get('unit_price') is not None: parts.append(f"单价: {ddata.get('unit_price')}")
                                            if ddata.get('total_amount') is not None: parts.append(f"总金额: {ddata.get('total_amount')}")
                                            if ddata.get('container_no') is not None: parts.append(f"箱号: {ddata.get('container_no')}")
                                            if ddata.get('seal_no') is not None: parts.append(f"封条号: {ddata.get('seal_no')}")
                                            if ddata.get('shipper_name') is not None: parts.append(f"发货人: {ddata.get('shipper_name')}")
                                            if ddata.get('shipper_address') is not None: parts.append(f"发货人地址: {ddata.get('shipper_address')}")
                                            if ddata.get('consignee_name') is not None: parts.append(f"收货人: {ddata.get('consignee_name')}")
                                            if ddata.get('consignee_address') is not None: parts.append(f"收货人地址: {ddata.get('consignee_address')}")
                                            extracted_summary.append(f"📍 **{dtype}**:\n  - " + "\n  - ".join(parts))
                                        
                                        extracted_summary_str = "\n".join(extracted_summary)

                                        if audit_result.get("findings"):
                                            findings_str = "\n".join([f"- {f['finding']}" for f in audit_result["findings"]])
                                        else:
                                            findings_str = "- 未发现任何不符点或需要核对的内容。"

                                        if audit_result["overall_status"] in ("DISCREPANCY_DETECTED", "WARNING"):
                                            status_icon = "🚨"
                                            status_title = "发现单据不符点/风险项"
                                        else:
                                            status_icon = "✅"
                                            status_title = "审核核对完毕"

                                        ai_reply = (
                                            f"{status_icon} **Docu-Checker 智能审核结果 ({status_title})**\n"
                                            f"当前接收文件：{file_title} ({category.upper()})\n"
                                            f"当前缓存池单证：{doc_types_str}\n\n"
                                            f"📋 **提取单证关键信息：**\n{extracted_summary_str}\n\n"
                                            f"🔍 **比对与核对结果：**\n{findings_str}\n\n"
                                            f"👉 建议核实存档文件路径：{saved_path}\n"
                                            f"💡 提示：如需重新开始审核，可发送指令“清空”或“重置”清空缓存池。"
                                        )
                                    else:
                                        ai_reply = f"⚠️ 提取失败或审核模块出错，请人工核实文件内容。"
                                        
                                    send_reply_to_source(user_id, ai_reply, "")
                                except Exception as e:
                                    logger.error(f"Failed to process doc: {e}", exc_info=True)
                                    send_reply_to_source(user_id, f"⚠️ 处理文档 {file_title} 时发生错误：{e}", "")
                        elif category == "image":
                            ai_reply = (
                                f"📸 **图片已归档**\n"
                                f"发件人：{user_id}\n"
                                f"存档：{saved_path}\n"
                                f"如需分析图片内容，请发送指令：「分析这张图片」"
                            )
                        elif category == "other":
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
                        
                        send_reply_to_source(user_id, ai_reply, "")
                        logger.info(f"[XML-App] {msg_type} processed: {category}")
                    except Exception as e:
                        logger.error(f"[XML-App] File processing FAILED: {e}", exc_info=True)
                        try:
                            send_reply_to_source(user_id, f"⚠️ 文件处理失败：{str(e)[:100]}", "")
                        except Exception:
                            pass
                    finally:
                        with _processing_lock:
                            _processing[msg_id]["done"].set()
                            stale = [k for k, v in _processing.items() if v["done"].is_set()]
                            for k in stale[:50]:
                                del _processing[k]

                threading.Thread(target=_async_file_process_xml, daemon=True).start()
                return "success"
            
    except Exception as e:
        logger.error(f"Post error: {str(e)}")
        return "success" # 企微要求即便报错也要返回 success 避免重试

    return "success"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)
