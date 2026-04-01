import os
import json
import logging
from typing import Dict, Any, List

# Logger setup
logger = logging.getLogger("zk_risk_sentinel")

class RiskSentinelService:
    """
    Risk-Sentinel (风控哨兵) V2.0
    核心职能：量化加权算法评分，决定业务是“通过”、“挂起”还是“熔断”。
    """
    
    def __init__(self, orchestrator=None):
        self.orchestrator = orchestrator # 关联系统大脑 (Handoff Manager)
        # 固定参数权重：物理实事 > 单证逻辑 > 利润预期
        self.WEIGHTS = {
            "PHYSICAL_TRUST": 0.5,  # Trust-Master 提供 (船位、轨迹)
            "DOCUMENT_AUDIT": 0.3,  # Audit-Pro 提供 (重量匹配、金额逻辑)
            "MARKET_VOLATILITY": 0.2 # Market-Scout 提供 (利差波动)
        }
        logger.info("Risk-Sentinel V2.0 Quant-Engine initialized.")

    async def evaluate_trade_risk(self, audit_results: Dict, trust_results: Dict, market_data: Dict = None):
        """
        核心评分逻辑：把专家的抽象发现转换为 0-100 的量化分值。
        """
        logger.info("🔍 [Risk-Sentinel] Collating expert inputs for trade risk quantization...")

        # 1. 物理风险扣分 (基于 Trust-Master)
        trust_deduction = 0
        trust_score = trust_results.get('trust_score', 100)
        if trust_score < 70:
            trust_deduction = (100 - trust_score) * self.WEIGHTS["PHYSICAL_TRUST"]
            logger.warning(f"🚨 Physical Trust deduction: {trust_deduction}")

        # 2. 单证风险扣分 (基于 Audit-Pro)
        audit_deduction = 0
        if audit_results.get('overall_status') == 'DISCREPANCY_DETECTED':
            audit_deduction = 30 * self.WEIGHTS["DOCUMENT_AUDIT"]
            logger.warning(f"🚨 Document Audit deduction: {audit_deduction}")

        # 3. 市场波动风险扣分 (基于 Market-Scout)
        market_deduction = 0
        if market_data and market_data.get('volatility') == 'HIGH':
            market_deduction = 15 * self.WEIGHTS["MARKET_VOLATILITY"]

        # 4. 计算综合风险分 (0 = 安全, 100 = 危险)
        total_risk_score = min(100, trust_deduction + audit_deduction + market_deduction)
        
        # 5. 决定战术动作 (Action Determinator)
        action = "PASS"
        if total_risk_score > 60:
            action = "KILL (熔断)"
        elif total_risk_score > 30:
            action = "HOLD (待复核)"
        
        report = {
            "final_risk_score": total_risk_score,
            "tactical_action": action,
            "deduction_summary": {
                "physical_risk": trust_deduction,
                "document_risk": audit_deduction,
                "market_risk": market_deduction
            },
            "timestamp": "2026-03-31T20:00:00Z"
        }

        # 6. 如果结果是 KILL，同步通知指挥官
        if action == "KILL (熔断)" and self.orchestrator:
             logger.critical(f"🔥🔥🔥 [Risk-Sentinel] CRITICAL RISK DETECTED ({total_risk_score}/100). STOPPING TRADE.")
             # 调用 Handoff 指令，下令给邮件專家准备“拒绝函”草稿
             
        return report

if __name__ == "__main__":
    # Mock Test
    rs = RiskSentinelService()
    # 模拟：单证基本对齐，但船只位置存在重大偏差
    mock_audit = {"overall_status": "SUCCESS"}
    mock_trust = {"trust_score": 40} # 低分
    
    import asyncio
    print(json.dumps(asyncio.run(rs.evaluate_trade_risk(mock_audit, mock_trust)), indent=2, ensure_ascii=False))
