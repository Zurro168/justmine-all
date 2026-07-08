import asyncio
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS_DIR = ROOT / "skills"
sys.path.insert(0, str(SKILLS_DIR))

from audit_pro.audit_pro import AuditProService  # noqa: E402
from risk_sentinel.risk_sentinel import RiskSentinelService  # noqa: E402

sys.path.insert(0, str(ROOT / "openclaw-deployment"))
import wecom_bot  # noqa: E402


class DocumentAuditPipelineTests(unittest.TestCase):
    def test_sentinel_holds_payment_when_audit_finds_document_mismatch(self):
        audit = AuditProService()

        result = asyncio.run(audit.run_full_audit([
            {"type": "PACKING_LIST", "net_weight": 100, "container_no": "ABCD1234567"},
            {"type": "BILL_OF_LADING", "net_weight": 95, "container_no": "ABCD1234567"},
            {"type": "INVOICE", "net_weight": 100, "unit_price": 10, "total_amount": 1000},
        ]))

        self.assertEqual(result["overall_status"], "DISCREPANCY_DETECTED")
        self.assertIn("sentinel_result", result)
        self.assertIn(result["sentinel_result"]["tactical_action"], ["HOLD", "KILL"])
        self.assertTrue(any("Risk-Sentinel" in finding["module"] for finding in result["findings"]))

    def test_risk_sentinel_uses_audit_risk_score_for_payment_decision(self):
        sentinel = RiskSentinelService()

        result = asyncio.run(sentinel.evaluate_trade_risk(
            {"overall_status": "DISCREPANCY_DETECTED", "risk_score": 40},
            {"trust_score": 100},
        ))

        self.assertEqual(result["tactical_action"], "HOLD")
        self.assertGreaterEqual(result["deduction_summary"]["document_risk"], 40)

    def test_text_docu_checker_message_runs_real_audit_pipeline(self):
        original_dispatch = wecom_bot.factory.dispatch_task
        original_extractor = wecom_bot.file_extractor
        original_audit_service = wecom_bot.audit_service
        original_sessions = dict(wecom_bot.USER_DOCUMENT_SESSIONS)

        class FakeExtractor:
            @staticmethod
            def extract_fields_from_text(text, category):
                return {
                    "type": "INVOICE",
                    "net_weight": 100,
                    "unit_price": 10,
                    "total_amount": 900,
                }

        try:
            wecom_bot.factory.dispatch_task = lambda message: {
                "target_agent": "docu_checker",
                "routing_mode": "test",
                "extracted_parameters": {},
            }
            wecom_bot.file_extractor = FakeExtractor()
            wecom_bot.audit_service = AuditProService()
            wecom_bot.USER_DOCUMENT_SESSIONS.clear()

            reply = wecom_bot.process_message_via_agents("请审核这份发票：净重100，单价10，总金额900", "tester")
        finally:
            wecom_bot.factory.dispatch_task = original_dispatch
            wecom_bot.file_extractor = original_extractor
            wecom_bot.audit_service = original_audit_service
            wecom_bot.USER_DOCUMENT_SESSIONS.clear()
            wecom_bot.USER_DOCUMENT_SESSIONS.update(original_sessions)

        self.assertIn("Docu-Checker", reply)
        self.assertIn("Audit-Pro", reply)
        self.assertIn("Risk-Sentinel", reply)
        self.assertNotIn("指令接收", reply)


if __name__ == "__main__":
    unittest.main()
