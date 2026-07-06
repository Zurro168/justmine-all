import json
import os
import sys
import requests

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PLACEHOLDER_MARKERS = (
    "...",
    "your_",
    "your-",
    "replace",
    "__replace",
    "placeholder",
    "changeme",
    "change-me",
    "mock",
)

AGENT_ALIASES = {
    "jaguar": "jaguar",
    "command": "jaguar",
    "nexus": "jaguar",
    "scout": "scout",
    "market-scout": "scout",
    "market_scout": "scout",
    "docu-checker": "docu_checker",
    "docu_checker": "docu_checker",
    "docuchecker": "docu_checker",
    "guard": "docu_checker",
    "negotiator": "negotiator",
    "matchmaker": "matchmaker",
    "pitcher": "pitcher",
    "sentinel": "sentinel",
    "ding-bot": "sentinel",
    "ding_bot": "sentinel",
}


def is_placeholder_secret(value: str | None) -> bool:
    if not value:
        return True
    normalized = value.strip().lower()
    return not normalized or any(marker in normalized for marker in PLACEHOLDER_MARKERS)


class OpenClawAgentFactory:
    def __init__(self, config_path=None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), "openclaw_prompts_v2.json")
        self.config_path = config_path
        self._agents = {}
        self.load_prompts()

    def load_prompts(self):
        if os.path.exists(self.config_path):
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self._agents = data.get("agents", {})
            print(f"[Factory] 成功挂载 {len(self._agents)} 位AI特工")
        else:
            print(f"[Factory] 配置文件未找到: {self.config_path}")

    def normalize_agent_id(self, agent_id: str) -> str:
        normalized = (agent_id or "").strip().lower().replace(" ", "-")
        return AGENT_ALIASES.get(normalized, normalized.replace("-", "_"))

    def get_agent_prompt(self, agent_id: str) -> str:
        normalized_agent_id = self.normalize_agent_id(agent_id)
        if normalized_agent_id in self._agents:
            return self._agents[normalized_agent_id].get("system_prompt", "You are an AI assistant.")
        return "You are an AI assistant."

    def _call_deepseek(self, system_prompt: str, user_message: str) -> str:
        """Send a message to DeepSeek API and return the response."""
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if is_placeholder_secret(api_key):
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

    def _keyword_router(self, message: str) -> dict:
        normalized = (message or "").lower()
        if any(token in normalized for token in [".pdf", "pdf", "sgs", "invoice", "b/l", "bill of lading", "单据", "审核", "提单", "发票", "装箱单"]):
            return {
                "target_agent": "docu_checker",
                "priority": "high",
                "action_required": "审核贸易单据并识别付款风险",
                "extracted_parameters": {},
                "routing_mode": "keyword_fallback",
            }
        if any(token in normalized for token in ["market", "price", "iluka", "报价", "行情", "矿山", "海运费"]):
            return {
                "target_agent": "scout",
                "priority": "medium",
                "action_required": "分析矿产行情与供应风险",
                "extracted_parameters": {},
                "routing_mode": "keyword_fallback",
            }
        if any(token in normalized for token in ["tt", "付款", "谈判", "供应商", "邮件", "whatsapp"]):
            return {
                "target_agent": "negotiator",
                "priority": "medium",
                "action_required": "起草供应商沟通与付款条款谈判建议",
                "extracted_parameters": {},
                "routing_mode": "keyword_fallback",
            }
        if any(token in normalized for token in ["到港", "指标", "tio2", "客户", "销售", "撮合"]):
            return {
                "target_agent": "matchmaker",
                "priority": "medium",
                "action_required": "匹配潜在客户并生成销售跟进建议",
                "extracted_parameters": {},
                "routing_mode": "keyword_fallback",
            }
        return {
            "target_agent": "scout",
            "priority": "low",
            "action_required": "记录通用指令并等待人工确认",
            "extracted_parameters": {},
            "routing_mode": "keyword_fallback",
        }

    def dispatch_task(self, unstructured_message: str) -> dict:
        """Use Jaguar (LLM) to classify and route the message."""
        jaguar_prompt = self.get_agent_prompt("jaguar")
        if not jaguar_prompt or jaguar_prompt == "You are an AI assistant.":
            return self._keyword_router(unstructured_message)

        if is_placeholder_secret(os.getenv("DEEPSEEK_API_KEY")):
            return self._keyword_router(unstructured_message)

        routing_response = self._call_deepseek(jaguar_prompt, unstructured_message)

        try:
            routing_json = json.loads(routing_response)
            routing_json["target_agent"] = self.normalize_agent_id(routing_json.get("target_agent", "scout"))
            return routing_json
        except json.JSONDecodeError:
            fallback = self._keyword_router(unstructured_message)
            fallback["action_required"] = routing_response
            return fallback

    def execute_agent(self, agent_id: str, message: str, context: dict = None) -> str:
        """Execute a specific agent with a message and optional context."""
        normalized_agent_id = self.normalize_agent_id(agent_id)
        agent_prompt = self.get_agent_prompt(normalized_agent_id)
        if agent_prompt == "You are an AI assistant.":
            return self._call_deepseek("你是一个专业的矿业供应链助手。", message)

        full_message = message
        if context:
            context_str = "\n".join(f"- {k}: {v}" for k, v in context.items())
            full_message = f"{message}\n\n## 上下文信息\n{context_str}"

        return self._call_deepseek(agent_prompt, full_message)

if __name__ == "__main__":
    factory = OpenClawAgentFactory()
    result = factory.dispatch_task("刚收到莫桑比克供应商发的最终 PDF 发票和提单，麻烦审核一下能否打尾款。")
    print(json.dumps(result, indent=2, ensure_ascii=False))
