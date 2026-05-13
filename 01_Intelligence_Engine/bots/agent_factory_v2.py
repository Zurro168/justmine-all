import json
import os
import requests

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
