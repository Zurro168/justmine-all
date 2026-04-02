import json
import os

class OpenClawAgentFactory:
    def __init__(self, config_path="openclaw_prompts_v2.json"):
        # 1. 尝试从 JSON 实体文件加载全部 7 个大模型 Prompt 模板
        self.config_path = config_path
        self._agents = {}
        self.load_prompts()

    def load_prompts(self):
        """解析我们刚刚固化的 V2 版多层级 Prompt """
        if os.path.exists(self.config_path):
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self._agents = data.get("agents", {})
                print(f"[Factory] 成功挂载 OpenClaw V2.0 节点组，共有 {len(self._agents)} 位AI特工就绪。")
        else:
            print("[Factory] 尚未找到配置文件。")

    def get_agent_prompt(self, agent_id: str) -> str:
        """根据 agent 名字获取具体 Role 和 Task"""
        if agent_id in self._agents:
            return self._agents[agent_id]["system_prompt"]
        return "You are an AI assistant."
    
    def dispatch_task(self, unstructured_message: str):
        """Jaguar 大脑路由模式 (高度解耦)"""
        print(f"\n[Jaguar 网关拦截] 📥 收到新消息：{unstructured_message}")
        
        jaguar_prompt = self.get_agent_prompt("jaguar")
        # 伪代码：向 Qwen-Max (Jaguar) 请求 JSON 输出
        # response = await llm.chat(system=jaguar_prompt, user_msg=unstructured_message, response_format="json_object")
        
        # [伪造 LLM 输出] 模拟 Jaguar 输出的 JSON
        if "发票" in unstructured_message or ".pdf" in unstructured_message:
            routing_json = {
                "target_agent": "docu_checker",
                "priority": "high",
                "action_required": "扫描附件单证并进行毛净重、收发货人核验",
                "extracted_parameters": {"file_type": "PDF"}
            }
        else:
            routing_json = {
                "target_agent": "scout",
                "priority": "medium",
                "action_required": "抓取今日钛矿行情",
                "extracted_parameters": {}
            }
            
        print(f"🎯 Jaguar 分析完毕，正在唤醒下层智能体: {routing_json['target_agent'].upper()}")
        
        # 触发下层智能体...
        target_agent = routing_json["target_agent"]
        target_prompt = self.get_agent_prompt(target_agent)
        
        print(f"[系统] 正在为 {target_agent.upper()} 注入灵魂...\n【Prompt 首行预览】: {target_prompt.splitlines()[1]}")
        # 伪代码：实际交给该 Agent 运行对应的链路...

if __name__ == "__main__":
    # 测试沙盘的 V2 逻辑
    factory = OpenClawAgentFactory()
    factory.dispatch_task("刚收到莫桑比克供应商发的最终 PDF 发票和提单，麻烦审核一下能否打尾款。")
