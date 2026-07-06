import os
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "bots"))
sys.path.insert(0, str(ROOT / "openclaw-deployment"))

from agent_factory_v2 import OpenClawAgentFactory  # noqa: E402
import app_dashboard  # noqa: E402


class AgentConfigTests(unittest.TestCase):
    def test_secret_status_distinguishes_missing_placeholder_and_configured(self):
        self.assertEqual(app_dashboard.secret_status(None), "missing")
        self.assertEqual(app_dashboard.secret_status(""), "missing")
        self.assertEqual(app_dashboard.secret_status("sk-..."), "placeholder")
        self.assertEqual(app_dashboard.secret_status("__REPLACE_WITH_REAL_KEY__"), "placeholder")
        self.assertEqual(app_dashboard.secret_status("sk-realistic-key-value-123456"), "configured")

    def test_health_status_allows_mock_mode_without_real_secrets(self):
        deps = {
            "deepseek": "placeholder",
            "dashscope": "missing",
            "wecom_webhook": "placeholder",
        }

        self.assertEqual(app_dashboard.resolve_health_status(deps, mock_mode=True), "mock")
        self.assertEqual(app_dashboard.resolve_health_status(deps, mock_mode=False), "degraded")

    def test_agent_aliases_normalize_to_config_keys(self):
        factory = OpenClawAgentFactory()

        self.assertEqual(factory.normalize_agent_id("Docu-Checker"), "docu_checker")
        self.assertEqual(factory.normalize_agent_id("Scout"), "scout")
        self.assertEqual(factory.normalize_agent_id("Ding-Bot"), "sentinel")

    def test_dispatch_falls_back_to_keyword_router_when_ai_is_unavailable(self):
        old_key = os.environ.pop("DEEPSEEK_API_KEY", None)
        try:
            factory = OpenClawAgentFactory()
            routing = factory.dispatch_task("请审核这份 SGS PDF 和提单")
        finally:
            if old_key is not None:
                os.environ["DEEPSEEK_API_KEY"] = old_key

        self.assertEqual(routing["target_agent"], "docu_checker")
        self.assertEqual(routing["priority"], "high")


if __name__ == "__main__":
    unittest.main()
