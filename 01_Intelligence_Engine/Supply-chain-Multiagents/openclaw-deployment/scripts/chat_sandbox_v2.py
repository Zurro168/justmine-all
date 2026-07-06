import sys
import os
import json
import time

# ==========================================
# 💎 正矿智控 · 多智能体线下沙盘 (V2.2.SANDBOX)
# ==========================================

def simulate_chat_sandbox():
    print("="*60)
    print("      💎 JUSTMINE · 线下沙盘 (OFFLINE CHAT BOX)      ")
    print("      状态: 腾讯云隔离模式 | 核心引擎: DeepSeek-V3      ")
    print("="*60)
    print(" 系统已就绪，请输入你想对【正矿机器人】说的话 (输入 'quit' 退出):")
    
    # 模拟从 skills 模块加载灵魂逻辑
    while True:
        try:
            user_input = input("\n👤 您 (模拟输入): ")
            if user_input.lower() in ['quit', 'exit', '退出']:
                print("👋 正在关闭沙盘...")
                break
                
            print(f"🤖 正矿 AI 正在思考 (DeepSeek-V3 推理中)...")
            time.sleep(1) # 模拟思考延迟
            
            # --- 这里就是你设计的核心对话逻辑模拟 ---
            # 它会模拟 wecom_bot 处理逻辑
            response = simulate_agent_logic(user_input)
            
            print(f"✅ 机器人回复: {response}")
            
        except KeyboardInterrupt:
            break

def simulate_agent_logic(query):
    # 这里复刻了你之前写的逻辑判断
    if "行情" in query or "价格" in query:
        return "【情报引擎】当前正在分析 Iluka 鋯英砂行情，最新报价约为 2200 USD/吨，趋势稳定。"
    elif "状态" in query or "健康" in query:
        return "【系统中枢】当前 01/02/03 模块运行正常，DeepSeek 数据链路 100% 畅通。"
    else:
        return f"【正矿机器人】收到指令：'{query}'。我已经将其存入记忆库，正在调取供应链历史记录。"

if __name__ == "__main__":
    simulate_chat_sandbox()
