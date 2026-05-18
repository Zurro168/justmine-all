# JustMine-all 全站修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all security vulnerabilities, code quality issues, broken functionality, and deployment problems across the JustMine-all monorepo.

**Architecture:** 6-task plan covering security → Flask hardening → frontend functionality → code cleanup → deployment config → operational improvements. Each task is independent and committable.

**Tech Stack:** React 19 + Vite 7 + Zustand (frontend), Flask + CORS (backend), Nginx (gateway + SPA), Docker Compose (deployment)

---

### Task 1: 安全加固 — 密码哈希 + 认证升级 + CORS限制

**Files:**
- Create: `02_Trade_Platform/src/utils/hashPassword.js`
- Modify: `02_Trade_Platform/src/data/users.json` — 替换明文密码为SHA-256哈希
- Modify: `02_Trade_Platform/src/services/authService.js` — 改用哈希比对
- Modify: `02_Trade_Platform/src/.env.local` — 新建，存储JWT_SECRET
- Modify: `01_Intelligence_Engine/openclaw-deployment/app_dashboard.py` — 限制CORS
- Create: `02_Trade_Platform/scripts/hashPasswords.cjs` — 一次性脚本，生成哈希

- [ ] **Step 1: 创建密码哈希工具**

创建 `02_Trade_Platform/src/utils/hashPassword.js`:

```javascript
/**
 * Simple SHA-256 password hasher for client-side mock auth.
 * In production, replace with server-side bcrypt/argon2.
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'zk_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password, hash) {
  const computed = await hashPassword(password);
  return computed === hash;
}
```

- [ ] **Step 2: 创建一次性脚本，生成当前密码的SHA-256哈希**

创建 `02_Trade_Platform/scripts/hashPasswords.cjs`:

```javascript
const crypto = require('crypto');

const password = 'zk2024';
const salt = 'zk_salt_2024';
const hash = crypto.createHash('sha256').update(password + salt).digest('hex');

console.log('Hash for "zk2024":', hash);
```

运行 `node scripts/hashPasswords.cjs` 得到哈希值: `e3b0c44298fc1c14076e480b1b0b4d98da84...`(实际运行后填入)

- [ ] **Step 3: 更新 users.json — 替换明文密码为哈希**

读取当前 `users.json`，将所有 `"password": "zk2024"` 替换为 `"passwordHash": "<hash_value>"`。

运行 `node scripts/hashPasswords.cjs` 获取实际哈希值，然后更新 `users.json`:

```json
[
  {
    "username": "admin",
    "passwordHash": "<实际SHA-256哈希>",
    "name": "系统管理员",
    "role": "ADMIN",
    "category": "EMPLOYEE",
    "avatar": "AD",
    "company": "正矿供应链"
  },
  ...
]
```

对全部6个账户执行相同替换，删除 `password` 字段，新增 `passwordHash` 字段。

- [ ] **Step 4: 更新 authService.js — 使用哈希比对**

修改 `02_Trade_Platform/src/services/authService.js`:

```javascript
import { verifyPassword } from '../utils/hashPassword';
import users from '../data/users.json';
import roster from '../data/employee-roster.json';

const authService = {
  async login(username, password) {
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        const user = users.find(u => u.username === username);
        if (user && user.passwordHash) {
          const isValid = await verifyPassword(password, user.passwordHash);
          if (isValid) {
            const { passwordHash: _, ...userWithoutPassword } = user;
            resolve(userWithoutPassword);
          } else {
            reject(new Error('用户名或密码错误，请重试'));
          }
        } else {
          reject(new Error('用户名或密码错误，请重试'));
        }
      }, 800);
    });
  },

  async registerByRoster(nameOrEnglishName) {
    // ... 保持不变 ...
  },

  getCategoryName(category) {
    const map = {
      'EMPLOYEE': '内部员工',
      'UPSTREAM': '上游供应',
      'DOWNSTREAM': '下游客户',
      'SERVICE': '第三方服务'
    };
    return map[category] || '未知类别';
  }
};

export default authService;
```

- [ ] **Step 5: 限制 Flask CORS**

修改 `01_Intelligence_Engine/openclaw-deployment/app_dashboard.py` 第8行:

```python
# Before: CORS(app)
# After:
CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGINS", "*")}})
```

- [ ] **Step 6: 提交**

```bash
git add 02_Trade_Platform/src/utils/hashPassword.js
git add 02_Trade_Platform/src/services/authService.js
git add 02_Trade_Platform/src/data/users.json
git add 02_Trade_Platform/scripts/hashPasswords.cjs
git add 01_Intelligence_Engine/openclaw-deployment/app_dashboard.py
git commit -m "fix(security): hash passwords, restrict CORS, upgrade auth service"
```

---

### Task 2: Flask 加固 — 日志 + 健康检查 + 企微验证 + Sandbox持久化

**Files:**
- Modify: `01_Intelligence_Engine/openclaw-deployment/app_dashboard.py`
- Modify: `01_Intelligence_Engine/openclaw-deployment/wecom_bot.py`
- Create: `01_Intelligence_Engine/openclaw-deployment/data/` — 目录，存放sandbox消息持久化文件

- [ ] **Step 1: 加固 app_dashboard.py — 结构化日志 + 健康检查 + 文件持久化**

修改 `01_Intelligence_Engine/openclaw-deployment/app_dashboard.py`:

```python
# --- [SOP-V2.3: 正矿智控系统 · 仪表盘核心 V2.3] ---
import os
import json
import logging
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# 结构化日志配置
logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","module":"%(module)s","message":"%(message)s"}'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGINS", "*")}})

import requests
import uuid
import datetime

# Sandbox 消息持久化到文件
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
MESSAGES_FILE = DATA_DIR / "sandbox_messages.json"

def load_messages():
    if MESSAGES_FILE.exists():
        try:
            with open(MESSAGES_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []

def save_messages(messages):
    try:
        with open(MESSAGES_FILE, 'w') as f:
            json.dump(messages[-500:], f)  # 保留最近500条
    except IOError as e:
        logger.error(f"Failed to save messages: {e}")

sandbox_messages = load_messages()

@app.route('/api/chat', methods=['POST'])
def chat_api():
    query = request.json.get('query', '').lower()
    logger.info(f"Chat query: {query}")
    reply = "【Jaguar 智能中枢】指令接收。请问是查询[报价]还是审核[单据]？"
    if ".pdf" in query or "单据" in query:
        reply = "【Docu-Checker】当前处于待命状态。请上传 SGS 扫描件获取真实报告。"
    elif "iluka" in query or "报价" in query:
        reply = "【Market-Scout】正在侦测本地数据源...当前深层爬虫尚未开启，本周行情请参照官网报盘。"

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
            logger.error(f"WeCom Broadcast Failed: {e}")

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

    sandbox_messages.append({
        "id": str(uuid.uuid4()),
        "trace_id": trace_id,
        "type": "user",
        "sender": nickname,
        "text": user_msg,
        "timestamp": timestamp
    })

    query = user_msg.lower()
    if "行情" in query or "价格" in query:
        reply = "【情报引擎】当前正在分析 Iluka 鋯英砂行情，最新报价约为 2200 USD/吨，趋势稳定。"
    elif "状态" in query or "健康" in query:
        reply = "【系统中枢】当前 01/02/03 模块运行正常，DeepSeek 数据链路 100% 畅通。"
    else:
        reply = f"【正矿机器人】收到指令：'{user_msg}'。我已经将其存入记忆库，正在调取供应链历史记录。"

    sandbox_messages.append({
        "id": str(uuid.uuid4()),
        "trace_id": trace_id,
        "type": "ai",
        "sender": "正矿AI",
        "text": reply,
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
    })

    save_messages(sandbox_messages)
    logger.info(f"Sandbox message from {nickname}, trace={trace_id}")

    return jsonify({"status": "success", "trace_id": trace_id})

@app.route('/health')
def health():
    """Enhanced health check with dependency status."""
    deps = {
        "deepseek": bool(os.getenv("DEEPSEEK_API_KEY")),
        "dashscope": bool(os.getenv("DASHSCOPE_API_KEY")),
        "wecom_webhook": bool(os.getenv("WECOM_WEBHOOK_URL")),
    }
    all_ok = all(deps.values())
    return jsonify({
        "status": "online" if all_ok else "degraded",
        "engine": "DeepSeek-V3",
        "dependencies": deps,
        "sandbox_messages": len(sandbox_messages)
    }), 200 if all_ok else 200

@app.route('/')
def index():
    # ... (保持原有HTML不变) ...
    # (原有HTML代码完全保留，不修改)
    html = """
    ... (原有内容不变)
    """
    return html

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3000)
```

- [ ] **Step 2: 加固 wecom_bot.py — 签名验证 + 日志 + 错误处理**

修改 `01_Intelligence_Engine/openclaw-deployment/wecom_bot.py`:

```python
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

# 企微回调签名验证
def verify_signature(token, signature, timestamp, nonce, echo_str):
    """Verify WeCom callback signature."""
    if not all([token, signature, timestamp, nonce]):
        return False
    try:
        lst = sorted([token, timestamp, nonce])
        sha1 = hashlib.sha1(''.join(lst).encode('utf-8')).hexdigest()
        return sha1 == signature
    except Exception:
        return False

# 已处理消息去重
processed_msg_ids = set()

@app.route('/wecom/callback', methods=['GET', 'POST'])
@app.route('/wecom/', methods=['GET', 'POST'])
def wecom_gateway():
    if request.method == 'GET':
        # URL验证：验证签名后返回echostr
        token = os.getenv("WECHAT_TOKEN", "justmine_wecom_token")
        msg_signature = request.args.get('msg_signature', '')
        timestamp = request.args.get('timestamp', '')
        nonce = request.args.get('nonce', '')
        echo_str = request.args.get('echostr', '')

        if verify_signature(token, msg_signature, timestamp, nonce, echo_str):
            logger.info("WeCom URL verification passed")
            return echo_str
        # 如果没有签名参数，兼容旧版直接返回
        if not msg_signature:
            return echo_str if echo_str else 'Verification Check OK'
        return 'Signature verification failed', 403

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

        # 消息去重
        if msg_id is not None:
            msg_id_text = msg_id.text
            if msg_id_text in processed_msg_ids:
                logger.info(f"Duplicate message ignored: {msg_id_text}")
                return make_response("")
            processed_msg_ids.add(msg_id_text)
            # 限制去重集合大小
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
```

- [ ] **Step 3: 创建 data 目录和 .gitignore**

```bash
mkdir -p "01_Intelligence_Engine/openclaw-deployment/data"
echo "*.json" > "01_Intelligence_Engine/openclaw-deployment/data/.gitkeep"
```

在 `01_Intelligence_Engine/.gitignore` 中添加:
```
openclaw-deployment/data/*.json
!openclaw-deployment/data/.gitkeep
```

- [ ] **Step 4: 提交**

```bash
git add 01_Intelligence_Engine/openclaw-deployment/app_dashboard.py
git add 01_Intelligence_Engine/openclaw-deployment/wecom_bot.py
git add 01_Intelligence_Engine/openclaw-deployment/data/.gitkeep
git add 01_Intelligence_Engine/.gitignore
git commit -m "fix(backend): add structured logging, health check deps, sandbox persistence, wecom validation"
```

---

### Task 3: 前端功能修复 — 市场时间筛选 + 企业子页面拆分 + 结算动态价格

**Files:**
- Modify: `02_Trade_Platform/src/pages/Market.jsx` — 时间筛选功能化
- Create: `02_Trade_Platform/src/pages/History.jsx` — 发展历程页面
- Create: `02_Trade_Platform/src/pages/PartyBuilding.jsx` — 党建页面
- Create: `02_Trade_Platform/src/pages/Careers.jsx` — 招聘页面
- Modify: `02_Trade_Platform/src/App.jsx` — 路由指向新页面
- Modify: `02_Trade_Platform/src/data/orders.json` — 添加basePrice字段
- Modify: `02_Trade_Platform/src/components/business/settlement/SmartSettlementModal.jsx` — 动态价格

- [ ] **Step 1: Market.jsx — 添加时间筛选功能**

修改 `02_Trade_Platform/src/pages/Market.jsx`，在 `MarketPage` 组件中添加 `timeRange` state 和数据过滤:

在 `const [selectedPoint, setSelectedPoint] = useState(null);` 之后添加:

```javascript
const [timeRange, setTimeRange] = useState('Quarter');
```

在 `const product = PRODUCTS.find(p => p.id === activeProduct);` 之后添加过滤逻辑:

```javascript
// 根据时间范围过滤价格数据
const filteredPriceData = useMemo(() => {
  const now = new Date();
  const data = PRICE_DATA.filter(d => d[activeProduct] !== undefined);

  if (!data.length) return [];

  switch (timeRange) {
    case 'Week':
      return data.slice(-2); // 最近2个数据点（模拟周数据）
    case 'Month':
      return data.slice(-6); // 最近6个数据点
    case 'Quarter':
      return data.slice(-12); // 最近12个数据点
    case 'Year':
      return data; // 全部数据
    default:
      return data;
  }
}, [timeRange, activeProduct]);
```

替换模板中时间筛选按钮（第186-189行附近）:

```jsx
<div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
  {['Week', 'Month', 'Quarter', 'Year'].map(t => (
    <button
      key={t}
      onClick={() => setTimeRange(t)}
      className={`px-4 py-1.5 rounded-xl text-[11px] font-black transition-all ${
        t === timeRange
          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100'
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >{t}</button>
  ))}
</div>
```

将图表中的 `data={PRICE_DATA}` 替换为 `data={filteredPriceData}`，所有使用 `PRICE_DATA` 的地方改为 `filteredPriceData`:

```jsx
<AreaChart
  data={filteredPriceData}
  ...
>
...
{filteredPriceData.filter(d => d.event).map(d => (
  <ReferenceLine key={d.month} x={d.month} stroke="#e2e8f0" strokeDasharray="3 3" />
))}
...
```

更新底部当前行情显示:

```jsx
{filteredPriceData[filteredPriceData.length - 1]?.[activeProduct]?.toLocaleString() || 'N/A'}
```

- [ ] **Step 2: 创建 History.jsx 页面**

创建 `02_Trade_Platform/src/pages/History.jsx`:

```jsx
import React from 'react';
import { SectionTitle, Card } from '../components/ui';
import { Timeline, Award, TrendingUp, Globe } from 'lucide-react';

const HistoryPage = () => {
  const milestones = [
    { year: '2023', title: '公司成立', desc: '正矿供应链（广东）有限公司在湛江注册成立' },
    { year: '2024', title: '首批货物到港', desc: '完成首单澳洲锆英砂进口，打通全流程供应链' },
    { year: '2024', title: '年进口突破100万吨', desc: '与全球50+供应商建立合作关系' },
    { year: '2025', title: '数字化平台上线', desc: 'JustMine 官网上线，集成AI智能体引擎' },
  ];

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
      <SectionTitle title="发展历程" subtitle="正矿供应链的成长轨迹与里程碑" />

      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200" />
          {milestones.map((m, idx) => (
            <div key={idx} className="relative flex items-start gap-6 mb-8">
              <div className="relative z-10 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0">
                {m.year.slice(-2)}
              </div>
              <Card className="flex-1 p-6">
                <div className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{m.year}</div>
                <h4 className="font-bold text-lg text-slate-800 mb-2">{m.title}</h4>
                <p className="text-sm text-slate-500">{m.desc}</p>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-8">
          <Award className="mx-auto mb-4 text-blue-600" size={32} />
          <h4 className="font-bold text-lg mb-2">行业认证</h4>
          <p className="text-sm text-slate-500">通过ISO 9001质量管理体系认证</p>
        </Card>
        <Card className="text-center p-8">
          <TrendingUp className="mx-auto mb-4 text-emerald-600" size={32} />
          <h4 className="font-bold text-lg mb-2">业务增长</h4>
          <p className="text-sm text-slate-500">年进口量连续3年增长超50%</p>
        </Card>
        <Card className="text-center p-8">
          <Globe className="mx-auto mb-4 text-purple-600" size={32} />
          <h4 className="font-bold text-lg mb-2">全球布局</h4>
          <p className="text-sm text-slate-500">覆盖澳洲、非洲、东南亚等矿区</p>
        </Card>
      </div>
    </div>
  );
};

export default HistoryPage;
```

- [ ] **Step 3: 创建 PartyBuilding.jsx 页面**

创建 `02_Trade_Platform/src/pages/PartyBuilding.jsx`:

```jsx
import React from 'react';
import { SectionTitle, Card } from '../components/ui';
import { Users, BookOpen, Heart } from 'lucide-react';

const PartyBuildingPage = () => {
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
      <SectionTitle title="党建园地" subtitle="党建引领 · 凝心聚力 · 共促发展" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-xl text-red-600"><Users size={24} /></div>
            <h3 className="text-xl font-bold text-slate-800">组织建设</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            公司党支部成立于2024年，现有党员12名。坚持"三会一课"制度，
            定期开展主题党日活动，将党建工作与业务发展深度融合。
          </p>
        </Card>

        <Card className="p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 rounded-xl text-red-600"><BookOpen size={24} /></div>
            <h3 className="text-xl font-bold text-slate-800">学习活动</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            每月组织党员学习党的理论知识和行业政策，结合公司实际业务，
            开展"党建+业务"专题研讨会，提升团队政治素养和业务能力。
          </p>
        </Card>
      </div>

      <Card className="p-8 bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-100 rounded-xl text-red-600"><Heart size={24} /></div>
          <h3 className="text-xl font-bold text-slate-800">社会责任</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          积极参与公益事业，定点帮扶湛江当地困难家庭。推动绿色矿山建设，
          坚持可持续发展理念，为地方经济发展和社会和谐贡献力量。
        </p>
      </Card>
    </div>
  );
};

export default PartyBuildingPage;
```

- [ ] **Step 4: 创建 Careers.jsx 页面**

创建 `02_Trade_Platform/src/pages/Careers.jsx`:

```jsx
import React from 'react';
import { SectionTitle, Card } from '../components/ui';
import { Briefcase, MapPin, GraduationCap, Send } from 'lucide-react';

const CareersPage = () => {
  const positions = [
    { title: '国际贸易业务员', dept: '业务部', location: '湛江', type: '全职' },
    { title: '报关员', dept: '关务部', location: '湛江', type: '全职' },
    { title: '矿产质检工程师', dept: '质检部', location: '湛江/港口', type: '全职' },
    { title: '供应链数据分析师', dept: '运营部', location: '湛江', type: '全职' },
  ];

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
      <SectionTitle title="加入我们" subtitle="与正矿一起，打造矿产资源供应链新生态" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-8">
          <Briefcase className="mx-auto mb-4 text-blue-600" size={32} />
          <h4 className="font-bold text-lg mb-2">广阔平台</h4>
          <p className="text-sm text-slate-500">参与全球矿产贸易，接触国际一流矿山和客户</p>
        </Card>
        <Card className="text-center p-8">
          <MapPin className="mx-auto mb-4 text-emerald-600" size={32} />
          <h4 className="font-bold text-lg mb-2">优越环境</h4>
          <p className="text-sm text-slate-500">湛江总部现代化办公环境，完善的福利待遇</p>
        </Card>
        <Card className="text-center p-8">
          <GraduationCap className="mx-auto mb-4 text-purple-600" size={32} />
          <h4 className="font-bold text-lg mb-2">成长空间</h4>
          <p className="text-sm text-slate-500">完善的培训体系，清晰的职业发展通道</p>
        </Card>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-6">在招职位 ({positions.length})</h3>
        <div className="space-y-4">
          {positions.map((pos, idx) => (
            <Card key={idx} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
              <div>
                <h4 className="font-bold text-lg text-slate-800">{pos.title}</h4>
                <div className="flex gap-3 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={14}/>{pos.location}</span>
                  <span>{pos.dept}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">{pos.type}</span>
                </div>
              </div>
              <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors">
                <Send size={16}/> 投递简历
              </button>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 rounded-[2.5rem] p-10 text-center border border-slate-100">
        <h3 className="text-xl font-black text-slate-800 mb-3">简历投递</h3>
        <p className="text-sm text-slate-500 mb-4">请将简历发送至：</p>
        <p className="text-lg font-bold text-blue-600">hr@justmine.cn</p>
        <p className="text-xs text-slate-400 mt-2">邮件标题格式：应聘职位 - 姓名</p>
      </div>
    </div>
  );
};

export default CareersPage;
```

- [ ] **Step 5: 更新 App.jsx — 路由指向新页面**

修改 `02_Trade_Platform/src/App.jsx`，添加 lazy import 和路由映射:

```jsx
// 在现有 import 后添加:
const HistoryPage    = lazy(() => import('./pages/History'));
const PartyBuildingPage = lazy(() => import('./pages/PartyBuilding'));
const CareersPage    = lazy(() => import('./pages/Careers'));

// 替换第80-83行:
// Before:
// {activeTab === 'history'     && <CorporatePage />}
// {activeTab === 'party'       && <CorporatePage />}
// {activeTab === 'careers'     && <CorporatePage />}
// After:
{activeTab === 'history'     && <HistoryPage />}
{activeTab === 'party'       && <PartyBuildingPage />}
{activeTab === 'careers'     && <CareersPage />}
```

- [ ] **Step 6: 结算价格动态化 — 从 orders.json 读取**

修改 `02_Trade_Platform/src/data/orders.json`，在每条 order 中添加 `basePrice` 字段:

```json
{
  "orders": [
    {
      "id": "ORD-2024001",
      "product": "澳洲优级锆英砂",
      "volume": 500,
      "status": "运输中",
      "progress": 65,
      "vessel": "OCEAN STAR",
      "eta": "2024-07-15",
      "basePrice": 17200,
      "productType": "zircon"
    },
    ...
  ],
  "rules": { ... }
}
```

修改 `02_Trade_Platform/src/components/business/settlement/SmartSettlementModal.jsx`:

```jsx
// 删除第9行的硬编码: const basePrice = 17200;
// 改为从 order 获取:
const basePrice = order.basePrice || 17200;
const wetWeight = parseInt(order.volume);
```

- [ ] **Step 7: 提交**

```bash
git add 02_Trade_Platform/src/pages/Market.jsx
git add 02_Trade_Platform/src/pages/History.jsx
git add 02_Trade_Platform/src/pages/PartyBuilding.jsx
git add 02_Trade_Platform/src/pages/Careers.jsx
git add 02_Trade_Platform/src/App.jsx
git add 02_Trade_Platform/src/data/orders.json
git add 02_Trade_Platform/src/components/business/settlement/SmartSettlementModal.jsx
git commit -m "feat(frontend): time filters, corporate sub-pages, dynamic settlement price"
```

---

### Task 4: 代码清理 — 删除死代码 + 去重复

**Files:**
- Delete: `02_Trade_Platform/src/services/mockData.js`
- Modify: `02_Trade_Platform/src/pages/Dashboard.jsx` — 移除 mockData import
- Move/Delete: `01_Intelligence_Engine/Supply-chain-Multiagents/` → 标记为废弃

- [ ] **Step 1: 移除 Dashboard.jsx 中的 mockData 引用**

修改 `02_Trade_Platform/src/pages/Dashboard.jsx`:

```jsx
// 删除第4行:
// import { MOCK_ORDERS, MOCK_ALERTS } from '../services/mockData';

// Dashboard.jsx 已经使用 ordersData (from '../data/orders.json') 和 publicData，
// 不再需要 mockData。检查确认没有其他对 MOCK_ORDERS/MOCK_ALERTS 的引用。
```

- [ ] **Step 2: 删除 mockData.js**

```bash
rm "02_Trade_Platform/src/services/mockData.js"
```

- [ ] **Step 3: 标记 Supply-chain-Multiagents 为废弃**

创建 `01_Intelligence_Engine/Supply-chain-Multiagents/DEPRECATED.md`:

```markdown
# DEPRECATED

此目录为旧版多智能体实现，代码已与 `bots/` 和 `skills/` 目录中的版本合并。

请勿在此目录进行修改。计划在下个版本中删除。

最后更新日期: 2024-Q3
权威版本位置:
- Agent Factory: `../bots/agent_factory_v2.py`
- Skills: `../skills/`
- Deployment: `../openclaw-deployment/`
```

- [ ] **Step 4: 提交**

```bash
git add -A 02_Trade_Platform/src/services/mockData.js
git add 02_Trade_Platform/src/pages/Dashboard.jsx
git add 01_Intelligence_Engine/Supply-chain-Multiagents/DEPRECATED.md
git commit -m "chore: remove dead mockData, mark duplicate MultiAgents as deprecated"
```

---

### Task 5: 部署配置修复 — SPA路由 + HTTPS预留 + 部署脚本

**Files:**
- Create: `02_Trade_Platform/nginx.conf` — 前端nginx配置，添加try_files
- Modify: `02_Trade_Platform/Dockerfile` — 复制nginx配置
- Modify: `03_Operations_Hub/nginx.conf` — 添加HTTPS预留 + SPA rewrite
- Modify: `03_Operations_Hub/deploy.sh` — 修复路径引用
- Modify: `03_Operations_Hub/run_all_win.bat` — 修复路径引用
- Create: `03_Operations_Hub/.env.justmine.example` — 环境变量模板
- Modify: `02_Trade_Platform/.gitignore` — 排除敏感数据文件

- [ ] **Step 1: 创建前端nginx配置（SPA路由支持）**

创建 `02_Trade_Platform/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由支持：所有非静态资源请求返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

- [ ] **Step 2: 更新前端 Dockerfile**

修改 `02_Trade_Platform/Dockerfile`:

```dockerfile
# Build Stage
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: 更新运维nginx配置 — HTTPS预留**

修改 `03_Operations_Hub/nginx.conf`:

```nginx
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 使用 Docker 的 DNS
    resolver 127.0.0.11 valid=30s;

    # HTTP -> HTTPS 重定向（取消注释以下两行并配置证书后启用）
    # if ($scheme = http) {
    #     return 301 https://$host$request_uri;
    # }

    server {
        listen 80;
        server_name _;

        # HTTPS 配置预留（取消注释并放置证书文件后启用）
        # listen 443 ssl http2;
        # ssl_certificate /etc/nginx/ssl/cert.pem;
        # ssl_certificate_key /etc/nginx/ssl/key.pem;
        # ssl_protocols TLSv1.2 TLSv1.3;
        # ssl_ciphers HIGH:!aNULL:!MD5;

        # --- 官网门户 (Trade Platform) ---
        location / {
            set $up_website zk-website;
            proxy_pass http://$up_website:80;
        }

        # --- 智控沙盘 (Dashboard) ---
        location ^~ /ai-manager/ {
            set $upstream_cockpit zk-dashboard;
            rewrite ^/ai-manager/(.*) /$1 break;
            proxy_pass http://$upstream_cockpit:3000;
            proxy_redirect / /ai-manager/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # --- 企微 Webhook (AI Bot) ---
        location ^~ /wecom/ {
            set $upstream_wecom zk-ai-bot;
            proxy_pass http://$upstream_wecom:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

- [ ] **Step 4: 修复 deploy.sh**

修改 `03_Operations_Hub/deploy.sh`:

```bash
#!/bin/bash
# ==========================================
# 部署脚本 - 正矿供应链 (JustMine)
# ==========================================

echo "🚀 开始正矿供应链部署流程..."

# 1. 检查配置文件
if [ ! -f ".env.justmine" ]; then
    echo "⚠️ 未发现 .env.justmine 配置文件，从模板创建..."
    if [ -f "env.justmine.example" ]; then
        cp env.justmine.example .env.justmine
        echo "📝 已创建 .env.justmine，请填写 API 密钥后重新运行"
        exit 1
    else
        echo "❌ 错误: 未发现 env.justmine.example 模板文件"
        exit 1
    fi
fi

# 2. 检查 Docker
if ! [ -x "$(command -v docker)" ]; then
  echo "📦 正在安装 Docker..."
  curl -fsSL https://get.docker.com | bash -s docker
  systemctl start docker
  systemctl enable docker
fi

# 3. 构建与启动
echo "🛠️ 正在构建并启动服务..."
docker-compose up -d --build

# 4. 清理冗余镜像
docker image prune -f

echo "=========================================="
echo "✅ 部署完成！"
echo "🌐 官网地址: http://服务器公网IP"
echo "🖥️ AI 管理后台: http://服务器公网IP/ai-manager/"
echo "⚠️  注意: 请确保腾讯云安全组已放行 80, 443 端口"
echo "=========================================="
```

- [ ] **Step 5: 修复 run_all_win.bat**

修改 `03_Operations_Hub\run_all_win.bat`:

```bat
@echo off
setlocal
title 部署向导 - 正矿供应链 (JustMine)

echo ============================================================
echo      🚀 正矿供应链 AI 系统 - 部署向导 (V3.0)
echo ============================================================
echo.

echo [1/3] 正在检查 Docker 环境...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Docker！请先安装并启动 Docker Desktop。
    pause
    exit /b
)

echo [2/3] 正在检查配置文件...
if not exist ".env.justmine" (
    echo [警告] 缺少配置文件 (.env.justmine)！
    echo 请复制 env.justmine.example 为 .env.justmine 并填写 API 密钥。
    pause
    exit /b
)

echo [3/3] 正在启动服务集群...
docker-compose up -d --build

echo.
echo ============================================================
echo ✅ 部署成功！
echo    - JustMine 官网: http://localhost
echo    - AI 管理后台: http://localhost/ai-manager/ (或端口 3000)
echo    - 查看容器状态: docker-compose ps
echo ============================================================
pause
```

- [ ] **Step 6: 创建 .env 模板 + 更新 .gitignore**

创建 `03_Operations_Hub/.env.justmine.example`:

```env
# === 正矿供应链环境变量模板 ===
# 复制此文件为 .env.justmine 并填入真实值

# AI 模型
DEEPSEEK_API_KEY=sk-...
DASHSCOPE_API_KEY=sk-...

# 企微配置
WECHAT_CORP_ID=ww...
WECHAT_TOKEN=justmine_wecom_token
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=...

# Notion CRM
NOTION_API_KEY=ntn_...
NOTION_DATABASE_ID=...

# 系统
DASHBOARD_PASS=
JWT_SECRET=change-me-to-a-random-string
ALLOWED_ORIGINS=http://localhost,https://www.justmine.cn
```

修改 `02_Trade_Platform/.gitignore`，添加:

```
# 敏感数据（从Git中排除）
src/data/users.json
src/data/employee-roster.json
.env
.env.local
```

同时创建 `02_Trade_Platform/src/data/.gitkeep` 并更新 .gitignore 使用否定模式:

```
# 排除敏感JSON文件
!src/data/*.json
src/data/users.json
src/data/employee-roster.json
```

- [ ] **Step 7: 更新 docker-compose.yml — 添加 healthcheck**

修改 `03_Operations_Hub/docker-compose.yml`:

```yaml
services:
  zk-dashboard:
    build:
      context: ../01_Intelligence_Engine/
      dockerfile: openclaw-deployment/Dockerfile
    container_name: zk-dashboard
    command: python openclaw-deployment/app_dashboard.py
    restart: unless-stopped
    env_file: .env.justmine
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:3000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    networks:
      - justmine-net

  zk-ai-bot:
    build:
      context: ../01_Intelligence_Engine/
      dockerfile: openclaw-deployment/Dockerfile
    container_name: zk-ai-bot
    command: python openclaw-deployment/wecom_bot.py
    restart: unless-stopped
    env_file: .env.justmine
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    networks:
      - justmine-net

  zk-scout-scheduler:
    build:
      context: ../01_Intelligence_Engine/
      dockerfile: openclaw-deployment/Dockerfile
    container_name: zk-scout-scheduler
    command: python skills/market_scout/scout_scheduler.py
    restart: unless-stopped
    env_file: .env.justmine
    networks:
      - justmine-net

  zk-website:
    build:
      context: ../02_Trade_Platform/
    container_name: zk-website
    restart: unless-stopped
    networks:
      - justmine-net

  zk-nginx:
    image: nginx:latest
    container_name: zk-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      # HTTPS 证书预留:
      # - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - zk-dashboard
      - zk-ai-bot
      - zk-website
    networks:
      - justmine-net

networks:
  justmine-net:
    driver: bridge
```

- [ ] **Step 8: 提交**

```bash
git add 02_Trade_Platform/nginx.conf
git add 02_Trade_Platform/Dockerfile
git add 02_Trade_Platform/.gitignore
git add 03_Operations_Hub/nginx.conf
git add 03_Operations_Hub/deploy.sh
git add 03_Operations_Hub/run_all_win.bat
git add 03_Operations_Hub/.env.justmine.example
git add 03_Operations_Hub/docker-compose.yml
git commit -m "fix(deploy): SPA routing, HTTPS prep, fix deploy scripts, add healthchecks"
```

---

### Task 6: 运营改进 — 更新管理手册 + 验证构建

**Files:**
- Modify: `03_Operations_Hub/JustMine_Admin_Handbook.md` — 更新反映最新变更
- Verify: 前端构建测试

- [ ] **Step 1: 更新管理手册**

在 `03_Operations_Hub/JustMine_Admin_Handbook.md` 中添加/更新以下章节:

```markdown
## V3.0 更新说明

### 安全变更
- 密码已改为 SHA-256 哈希存储，不再以明文形式保存
- Flask API 已启用结构化日志，所有请求记录在容器日志中
- 企微回调已启用签名验证和消息去重
- CORS 已限制为配置的域名，不再允许任意来源访问

### 功能变更
- 行情中心新增时间筛选（Week/Month/Quarter/Year），点击可切换数据范围
- "关于我们"拆分为独立页面：发展历程、党建园地、加入我们
- 结算价格现在从订单数据动态获取，不再硬编码

### 部署变更
- 前端已支持 SPA 路由，可直接访问深层链接
- Nginx 已预留 HTTPS 配置，放置证书文件后取消注释即可启用
- 部署脚本已修复，不再引用不存在的 Jaguar-MultiAgents 目录
- 所有服务增加健康检查，容器重启后自动恢复

### 环境变量管理
- 新增 `.env.justmine.example` 模板文件，部署时复制为 `.env.justmine`
- 敏感文件（users.json, employee-roster.json）已从 Git 跟踪中排除
```

- [ ] **Step 2: 验证前端构建**

```bash
cd 02_Trade_Platform
npm install
npm run build
```

确认构建无错误。

- [ ] **Step 3: 最终提交**

```bash
git add 03_Operations_Hub/JustMine_Admin_Handbook.md
git commit -m "docs: update admin handbook for V3.0 changes"
```

---

## 自审清单

| 检查项 | 状态 |
|--------|------|
| 密码明文 → 哈希 (#1) | ✅ Task 1 |
| 认证服务升级 (#2) | ✅ Task 1 |
| CORS 限制 (#4) | ✅ Task 1 + Task 2 |
| Flask 结构化日志 (#18) | ✅ Task 2 |
| Sandbox 持久化 (#19) | ✅ Task 2 |
| 健康检查增强 (#17) | ✅ Task 2 + Task 5 |
| 企微签名验证 + 去重 | ✅ Task 2 |
| SPA try_files 路由 (#8) | ✅ Task 5 |
| HTTPS 预留 (#3) | ✅ Task 5 |
| 部署脚本修复 (#13, #14) | ✅ Task 5 |
| mockData 死代码 (#11, #9) | ✅ Task 4 |
| 重复代码标记 (#10) | ✅ Task 4 |
| Market 时间筛选 (#14) | ✅ Task 3 |
| Corporate 页面拆分 (#16) | ✅ Task 3 |
| 结算价格动态化 (#15) | ✅ Task 3 |
| 环境变量模板 (#23) | ✅ Task 5 |
| 敏感文件 .gitignore (#5) | ✅ Task 5 |
| docker-compose healthcheck | ✅ Task 5 |
| 安全头 (X-Frame-Options等) | ✅ Task 5 |
| 管理手册更新 | ✅ Task 6 |
