# encoding: utf-8
import os
import time
import subprocess

# ==========================================
# 💎 正矿智控 · OpenClaw 多智能体本地沙盘 (V2.2.POWER)
# ==========================================

def print_header():
    print("="*60)
    print(" 🚀 正矿供应链 - OpenClaw 多智能体本地测试沙盒 (JustMine)")
    print("="*60)
    print(" 支持的验证场景：")
    print(" 1. 发送 B/L 或 发票 PDF 路径 (验证 Docu-Checker 审单逻辑)")
    print(" 2. 发送业务微信群聊天内容 (验证 Matchmaker + Pitcher 销售流)")
    print(" 3. 发送海外采购意向 (验证 Negotiator 谈判助手模式)")
    print("="*60)

def nexus_router(user_input):
    print("\n[🧠 智控大脑 (Nexus)] 正在接收消息并进行意图识别...")
    time.sleep(1)
    
    user_input_lower = user_input.lower()
    if ".pdf" in user_input_lower or "单据" in user_input_lower or "提单" in user_input_lower:
        print(" -> 决策结果: 探测到单证特征，路由至 【Docu-Checker (智能审单员)】")
        return "Docu-Checker"
    elif "指标" in user_input_lower or "锆" in user_input_lower or "货" in user_input_lower:
        print(" -> 决策结果: 探测到业务撮合特征，路由至 【Sales-Team (销格大师)】")
        return "Sales-Team"
    else:
        print(" -> 决策结果: 探测到通用沟通或谈判特征，路由至 【Negotiator (谈判专家)】")
        return "Negotiator"

def agent_docu_checker(file_path):
    print("\n[👁️ Docu-Checker (智能审单员)] 启动...")
    time.sleep(1)
    print(f" -> 预设逻辑: 调用 Playwright + OCR 解析路径: {file_path}")
    time.sleep(1)
    print("\n=========== 📑 正矿风控审查报告 ===========")
    print("【状态】: 🟢 逻辑通过")
    print("【关键点】: 核心重量 (825 MT) 与收发货人匹配准确。")
    print("【备注】: 符合 TT 尾款支付安全红线。")
    print(" ==============================================")

def agent_sales_team(text):
    print("\n[📊 Matchmaker (撮合员)] 正在扫描库存...")
    time.sleep(1)
    print("\n[✍️ Pitcher (销冠)] 正在根据 DeepSeek-V3 生成大单话术...")
    time.sleep(1.5)
    print("\n=========== 💬 微信私域话术 (模拟生成) ===========")
    print("【老板版】: '李总，刚到港的这批锆砂指标绝了，为您私下留了 30 柜。'")
    print("【采购版】: '这批货提单刚出来，我看各项指标都包过你们厂里化验标准的。'")

def main():
    print_header()
    while True:
        user_input = input("\n[正矿指挥官] 请输入指令或模拟消息 (输入 q 退出) \n> ")
        if user_input.strip().lower() == 'q':
            print("退出系统。数据已保存。")
            break
        if not user_input.strip():
            continue
            
        target_agent = nexus_router(user_input)
        
        if target_agent == "Docu-Checker":
            agent_docu_checker(user_input)
        elif target_agent == "Sales-Team":
            agent_sales_team(user_input)
        elif target_agent == "Negotiator":
            print("\n[🤝 Negotiator (外贸谈判)] 正在草拟对外邮件...")
            time.sleep(1)
            print("✅ 邮件草稿已生成：Dear Jong Minerals, regarding the Rutile quotation...")

if __name__ == "__main__":
    main()
