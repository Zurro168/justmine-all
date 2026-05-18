# Multi-Agent System Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all broken components in the JustMine multi-agent system and wire them together into a working pipeline where WeCom messages → Agent Factory → specialized agents → reply.

**Architecture:** 5 tasks covering critical bugs → real agent dispatch → WeCom integration → missing skills → Docker deployment. Each task builds on the previous and is independently testable.

**Tech Stack:** Python 3, Flask, DeepSeek API, APScheduler, Playwright, Docker, pycryptodome

---

## File Structure Map

| File | Role | Change |
|------|------|--------|
| `openclaw-deployment/app_dashboard.py` | Flask dashboard + chat API | Fix syntax error, wire to agent factory |
| `openclaw-deployment/wecom_bot.py` | WeCom bot (AES encrypted) | Add null-check, wire to agent factory |
| `openclaw-deployment/requirements.txt` | Python dependencies | Add missing libs |
| `openclaw-deployment/Dockerfile` | Container build | Fix CMD to start both services |
| `bots/agent_factory_v2.py` | Agent router | Replace fake routing with real DeepSeek calls |
| `skills/trust_master/trust_master_engine.py` | AIS verification | Fix logic bug (and → or) |
| `skills/notion_bridge/notion_bridge.py` | CRM integration | New: read Notion database |
| `skills/webhook_robot/send_wecom.py` | Notification sender | New: send WeCom group messages |

---

### Task 1: Fix 3 Critical Bugs (P0)

**Files:**
- Modify: `01_Intelligence_Engine/openclaw-deployment/app_dashboard.py:35-38`
- Modify: `01_Intelligence_Engine/skills/trust_master/trust_master_engine.py:68`
- Modify: `01_Intelligence_Engine/openclaw-deployment/wecom_bot.py:102-106`

- [ ] **Step 1: Fix app_dashboard.py syntax error**

Line 35-38 has a `try:` with no `except`. Fix it:

```python
def save_messages(messages):
    try:
        with open(MESSAGES_FILE, 'w') as f:
            json.dump(messages[-500:], f)
    except IOError as e:
        logger.error(f"Failed to save sandbox messages: {e}")
```

- [ ] **Step 2: Fix trust_master_engine.py logic bug**

Line 68: `if "At sea" in status and "In port" in status:` is always False. Fix:

```python
# Line 67-71: replace the entire block
                if "At sea" in status or "In port" in status:
                    verification_report["trust_score"] = 90
                else:
                    verification_report["trust_score"] = 60
```

- [ ] **Step 3: Add null-check in wecom_bot.py before instantiating WXBizMsgCrypt**

Line 102-106: add validation before creating the crypt object:

```python
    token = os.getenv("WECHAT_TOKEN")
    aes_key = os.getenv("WECHAT_ENCODING_AES_KEY")
    corp_id = os.getenv("WECHAT_CORP_ID")

    if not all([token, aes_key, corp_id]):
        logger.error("Missing WeCom credentials in environment variables")
        return make_response("Server misconfigured", 500)

    crypto = WXBizMsgCrypt(token, aes_key, corp_id)
```

- [ ] **Step 4: Verify app_dashboard.py imports correctly**

Run: `cd 01_Intelligence_Engine/openclaw-deployment && python -c "import app_dashboard; print('OK')"`

Expected: `OK` (no SyntaxError)

- [ ] **Step 5: Commit**

```bash
git add 01_Intelligence_Engine/openclaw-deployment/app_dashboard.py
git add 01_Intelligence_Engine/skills/trust_master/trust_master_engine.py
git add 01_Intelligence_Engine/openclaw-deployment/wecom_bot.py
git commit -m "fix(P0): fix syntax error, trust logic bug, and null-check in wecom_bot"
```

---

### Task 2: Wire Agent Factory to DeepSeek LLM

**Files:**
- Modify: `01_Intelligence_Engine/bots/agent_factory_v2.py`

- [ ] **Step 1: Replace fake routing with real DeepSeek calls**

Replace the entire `agent_factory_v2.py` content:

```python
import json
import os
import requests

class OpenClawAgentFactory:
    def __init__(self, config_path="openclaw_prompts_v2.json"):
        self.config_path = config_path
        self._agents = {}
        self.load_prompts()

    def load_prompts(self):
        if os.path.exists(self.config_path):
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self._agents = data.get("agents", {})
        else:
            print("[Factory] Config not found, running with defaults.")

    def get_agent_prompt(self, agent_id: str) -> str:
        if agent_id in self._agents:
            return self._agents[agent_id].get("system_prompt", "You are an AI assistant.")
        return "You are an AI assistant."

    def _call_deepseek(self, system_prompt: str, user_message: str) -> str:
        """Send a message to DeepSeek API and return the response."""
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            return "Error: DEEPSEEK_API_KEY not configured."

        try:
            response = requests.post(
                "https://api.deepseek.com/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "temperature": 0.3
                },
                timeout=60
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error calling AI: {str(e)}"

    def dispatch_task(self, unstructured_message: str) -> dict:
        """Use Jaguar (LLM) to classify and route the message."""
        jaguar_prompt = self.get_agent_prompt("jaguar")
        if not jaguar_prompt or jaguar_prompt == "You are an AI assistant.":
            # Fallback: no prompts loaded, route to scout by default
            return {"target_agent": "scout", "priority": "medium", "action_required": unstructured_message, "extracted_parameters": {}}

        routing_response = self._call_deepseek(jaguar_prompt, unstructured_message)

        try:
            routing_json = json.loads(routing_response)
            return routing_json
        except json.JSONDecodeError:
            return {"target_agent": "scout", "priority": "medium", "action_required": routing_response, "extracted_parameters": {}}

    def execute_agent(self, agent_id: str, message: str, context: dict = None) -> str:
        """Execute a specific agent with a message and optional context."""
        agent_prompt = self.get_agent_prompt(agent_id)
        if agent_prompt == "You are an AI assistant.":
            # Agent not defined in config, use generic DeepSeek
            return self._call_deepseek("你是一个专业的矿业供应链助手。", message)

        # Build context-aware message
        full_message = message
        if context:
            context_str = "\n\n".join(f"{k}: {v}" for k, v in context.items())
            full_message = f"{message}\n\n## 上下文信息\n{context_str}"

        return self._call_deepseek(agent_prompt, full_message)

if __name__ == "__main__":
    factory = OpenClawAgentFactory()
    result = factory.dispatch_task("刚收到莫桑比克供应商发的最终 PDF 发票和提单，麻烦审核一下能否打尾款。")
    print(json.dumps(result, indent=2, ensure_ascii=False))
```

- [ ] **Step 2: Test agent factory locally**

Run: `cd 01_Intelligence_Engine/bots && DEEPSEEK_API_KEY=sk-test python agent_factory_v2.py`

Expected: JSON output with `target_agent: docu_checker`

- [ ] **Step 3: Commit**

```bash
git add 01_Intelligence_Engine/bots/agent_factory_v2.py
git commit -m "feat(agent-factory): wire Jaguar to DeepSeek LLM for real routing"
```

---

### Task 3: Wire WeCom Bot to Agent Factory

**Files:**
- Modify: `01_Intelligence_Engine/openclaw-deployment/wecom_bot.py`

- [ ] **Step 1: Add Agent Factory import and dispatch**

Add the import at the top of wecom_bot.py (after existing imports, before `def ask_deepseek`):

```python
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "bots"))
from agent_factory_v2 import OpenClawAgentFactory

factory = OpenClawAgentFactory(config_path=os.path.join(os.path.dirname(__file__), "..", "bots", "openclaw_prompts_v2.json"))
```

- [ ] **Step 2: Replace ask_deepseek call with agent dispatch**

In the POST handler (line 138), replace:

```python
# Before (line 137-138):
# ai_reply = ask_deepseek(content)

# After:
ai_reply = process_message_via_agents(content, user_id)
```

Add the new function before the Flask app definition:

```python
def process_message_via_agents(user_message: str, user_id: str) -> str:
    """Route message through Jaguar and execute the target agent."""
    # Step 1: Jaguar routes the message
    routing = factory.dispatch_task(user_message)
    target = routing.get("target_agent", "scout")
    
    # Step 2: Execute the target agent
    reply = factory.execute_agent(target, user_message, {
        "user_id": user_id,
        "source": "wecom",
        "routing_params": routing.get("extracted_parameters", {})
    })
    
    return reply
```

- [ ] **Step 3: Test wecom_bot.py imports correctly**

Run: `cd 01_Intelligence_Engine/openclaw-deployment && python -c "import wecom_bot; print('OK')"`

Expected: `OK` (no import error)

- [ ] **Step 4: Commit**

```bash
git add 01_Intelligence_Engine/openclaw-deployment/wecom_bot.py
git commit -m "feat(wecom): wire bot to agent factory for multi-agent routing"
```

---

### Task 4: Implement Missing Skills

**Files:**
- Create: `01_Intelligence_Engine/skills/notion_bridge/notion_bridge.py`
- Create: `01_Intelligence_Engine/skills/webhook_robot/send_wecom.py`
- Modify: `01_Intelligence_Engine/openclaw-deployment/requirements.txt`

- [ ] **Step 1: Implement notion_bridge.py**

Create `01_Intelligence_Engine/skills/notion_bridge/notion_bridge.py`:

```python
import os
import requests
import logging

logger = logging.getLogger("notion_bridge")

def query_customers(database_id=None, filter_params=None):
    """Query Notion CRM for customer records."""
    api_key = os.getenv("NOTION_API_KEY")
    if not api_key:
        logger.warning("NOTION_API_KEY not configured")
        return []

    db_id = database_id or os.getenv("NOTION_DATABASE_ID")
    if not db_id:
        logger.warning("NOTION_DATABASE_ID not configured")
        return []

    url = f"https://api.notion.com/v1/databases/{db_id}/query"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
    }

    body = {}
    if filter_params:
        body["filter"] = filter_params

    try:
        response = requests.post(url, headers=headers, json=body, timeout=30)
        response.raise_for_status()
        data = response.json()
        results = []
        for row in data.get("results", []):
            props = row.get("properties", {})
            name = ""
            for k, v in props.items():
                if v.get("type") == "title":
                    title_items = v.get("title", [])
                    if title_items:
                        name = title_items[0].get("plain_text", "")
            results.append({"id": row["id"], "name": name, "properties": props})
        return results
    except Exception as e:
        logger.error(f"Notion query failed: {e}")
        return []

if __name__ == "__main__":
    customers = query_customers()
    print(f"Found {len(customers)} customers in Notion CRM")
    for c in customers[:3]:
        print(f"  - {c['name']}")
```

- [ ] **Step 2: Implement send_wecom.py**

Create `01_Intelligence_Engine/skills/webhook_robot/send_wecom.py`:

```python
import os
import requests
import logging

logger = logging.getLogger("webhook_robot")

def send_wecom_message(content: str, mention_all: bool = False) -> dict:
    """Send a text message to a WeCom group via webhook."""
    webhook_url = os.getenv("WECOM_WEBHOOK_URL")
    if not webhook_url:
        logger.warning("WECOM_WEBHOOK_URL not configured")
        return {"status": "error", "reason": "Webhook URL not configured"}

    payload = {"msgtype": "text", "text": {"content": content}}
    if mention_all:
        payload["text"]["mentioned_list"] = ["@all"]

    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        response.raise_for_status()
        result = response.json()
        if result.get("errcode") == 0:
            logger.info("WeCom message sent successfully")
            return {"status": "ok"}
        else:
            return {"status": "error", "reason": result.get("errmsg", "Unknown error")}
    except Exception as e:
        logger.error(f"WeCom webhook failed: {e}")
        return {"status": "error", "reason": str(e)}

def send_risk_alert(title: str, details: str):
    """Send a formatted risk alert to WeCom group."""
    content = f"🚨 [风控警报] {title}\n\n{details}"
    return send_wecom_message(content, mention_all=True)

if __name__ == "__main__":
    result = send_wecom_message("测试消息：正矿智控系统 webhook 连通性验证通过。")
    print(result)
```

- [ ] **Step 3: Verify new modules import correctly**

Run:
```bash
cd 01_Intelligence_Engine
python -c "from skills.notion_bridge.notion_bridge import query_customers; print('notion_bridge OK')"
python -c "from skills.webhook_robot.send_wecom import send_wecom_message; print('send_wecom OK')"
```

Expected: Both print `OK`

- [ ] **Step 4: Commit**

```bash
git add 01_Intelligence_Engine/skills/notion_bridge/notion_bridge.py
git add 01_Intelligence_Engine/skills/webhook_robot/send_wecom.py
git commit -m "feat(skills): implement notion_bridge and webhook_robot"
```

---

### Task 5: Fix Dockerfile to Start Both Services

**Files:**
- Modify: `01_Intelligence_Engine/openclaw-deployment/Dockerfile`
- Create: `01_Intelligence_Engine/openclaw-deployment/start.sh`

- [ ] **Step 1: Create start.sh to run both services**

Create `01_Intelligence_Engine/openclaw-deployment/start.sh`:

```bash
#!/bin/bash
# Start both dashboard (port 3000) and wecom_bot (port 5000)

# Start dashboard in background
python openclaw-deployment/app_dashboard.py &
DASHBOARD_PID=$!

# Start wecom bot in background
python openclaw-deployment/wecom_bot.py &
WECOM_PID=$!

# Wait for either process to exit
wait -n
EXIT_CODE=$?

# Kill the other process
kill $DASHBOARD_PID $WECOM_PID 2>/dev/null
wait

exit $EXIT_CODE
```

- [ ] **Step 2: Update Dockerfile CMD**

Modify the Dockerfile line 17-18:

```dockerfile
# Before:
# CMD ["python", "app_dashboard.py"]

# After:
COPY openclaw-deployment/start.sh start.sh
RUN chmod +x start.sh
CMD ["./start.sh"]
```

- [ ] **Step 3: Test Dockerfile builds successfully**

Run: `cd 01_Intelligence_Engine && docker build -f openclaw-deployment/Dockerfile . --no-cache 2>&1 | tail -5`

Expected: `Successfully tagged ...`

- [ ] **Step 4: Commit**

```bash
git add 01_Intelligence_Engine/openclaw-deployment/start.sh
git add 01_Intelligence_Engine/openclaw-deployment/Dockerfile
git commit -m "fix(docker): start both dashboard and wecom_bot via supervisord script"
```

---

## Self-Review

| Check | Status |
|-------|--------|
| Task 1 fixes all 3 P0 bugs (syntax, logic, null-check) | ✅ |
| Task 2 replaces fake routing with real DeepSeek calls | ✅ |
| Task 3 wires wecom_bot → agent_factory → agents | ✅ |
| Task 4 implements notion_bridge and send_wecom from scratch | ✅ |
| Task 5 fixes Docker CMD to start both services | ✅ |
| No placeholders or TBD in any step | ✅ |
| All file paths are exact and relative to repo root | ✅ |
| No type/signature mismatches between tasks | ✅ |
| Each task is independently testable | ✅ |

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-13-multi-agent-activation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
