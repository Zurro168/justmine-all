import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List
from .rag_indexer import ZhengkuangRAG

# Logger setup
logger = logging.getLogger("zk_audit_pro")

class AuditProService:
    """
    Audit-Pro (单据勾稽专家) V2.0
    三向联动：[单据核对] + [金融安全] + [时效监控]
    """
    
    def __init__(self, orchestrator=None):
        self.rag = ZhengkuangRAG()
        self.orchestrator = orchestrator # Linked Handoff Manager
        logger.info("Audit-Pro Service V2.0 initialized with Cross-Reconciler.")

    async def run_full_audit(self, documents: List[Dict[str, Any]], current_date: str = None):
        """
        全量审计入口
        """
        if not current_date:
            current_date = datetime.now().strftime('%Y-%m-%d')
            
        results = {
            "overall_status": "SUCCESS",
            "findings": [],
            "risk_score": 0,
            "recommendations": []
        }

        # 1. 解构文档池
        pl = next((d for d in documents if d.get('type') == 'PACKING_LIST'), None)
        bl = next((d for d in documents if d.get('type') == 'BILL_OF_LADING'), None)
        inv = next((d for d in documents if d.get('type') == 'INVOICE'), None)
        lc = next((d for d in documents if d.get('type') == 'LETTER_OF_CREDIT'), None)

        # 2. 核心逻辑 A：三方重量与金额核对 (PL vs BL vs INV)
        if pl and bl and inv:
            reconcile_finding = self._reconcile_weight_and_value(pl, bl, inv)
            if reconcile_finding:
                results["findings"].extend(reconcile_finding)
                results["overall_status"] = "DISCREPANCY_DETECTED"
                results["risk_score"] += 40

        # 3. 核心逻辑 B：信用证时效审计 (L/C Compliance)
        if lc:
            lc_finding = self._check_lc_compliance(lc, current_date)
            if lc_finding:
                results["findings"].extend(lc_finding)
                results["overall_status"] = "WARNING"
                results["risk_score"] += 30

        # 4. 如果发现高风险，立即通过 Handoff Manager 触发 Sentinel 重评
        if results["risk_score"] >= 40 and self.orchestrator:
            logger.warning(f"CRITICAL: Risk Score {results['risk_score']}! Triggering Sentinel via Orchestrator.")
            # 模拟联动逻辑
            await self.orchestrator.handle_audit_discrepancy(packing_list_data=pl, bl_data=bl)

        return results

    def _reconcile_weight_and_value(self, pl, bl, inv) -> List[Dict]:
        """
        子模块：核对逻辑。金额 = 净重 * 单价
        """
        discrepancies = []
        
        # 重量交叉验证
        if pl.get('net_weight') != bl.get('net_weight'):
            discrepancies.append({
                "module": "WEIGHT_CHECK",
                "finding": f"重量不符！PL: {pl.get('net_weight')} vs BL: {bl.get('net_weight')}",
                "severity": "HIGH"
            })

        # 计算逻辑验证：(净重 * 单价) vs 总额
        calc_total = float(pl.get('net_weight', 0)) * float(inv.get('unit_price', 0))
        inv_total = float(inv.get('total_amount', 0))
        
        if abs(calc_total - inv_total) > 1.0: # 允许 1 元以内的舍入误差
            discrepancies.append({
                "module": "VALUE_CHECK",
                "finding": f"金额计算逻辑不符！计算值: {calc_total} vs 发票值: {inv_total}",
                "severity": "CRITICAL"
            })
            
        return discrepancies

    def _check_lc_compliance(self, lc, current_date_str) -> List[Dict]:
        """
        子模块：信用证时效审计
        """
        alerts = []
        try:
            lsd = datetime.strptime(lc.get('latest_shipment_date'), '%Y-%m-%d')
            curr = datetime.strptime(current_date_str, '%Y-%m-%d')
            days_left = (lsd - curr).days
            
            if days_left < 3:
                alerts.append({
                    "module": "LC_EXPIRY",
                    "finding": f"⚠️ 紧急：信用证最晚装运期倒计时仅剩 {days_left} 天！",
                    "severity": "CRITICAL"
                })
            elif days_left < 7:
                alerts.append({
                    "module": "LC_EXPIRY",
                    "finding": f"提醒：信用证装运期余量为 {days_left} 天。",
                    "severity": "MEDIUM"
                })
        except Exception as e:
            logger.error(f"LC Date Parsing Error: {e}")
            
        return alerts

if __name__ == "__main__":
    audit = AuditProService()
    print("Audit-Pro V2.0 Expert Logic Ready.")
