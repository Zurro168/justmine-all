import importlib
import os
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCOUT_DIR = ROOT / "skills" / "market_scout"
sys.path.insert(0, str(SCOUT_DIR))

scout_report_engine = importlib.import_module("scout_report_engine")


class ScoutReportEngineConfigTests(unittest.TestCase):
    def test_resolve_output_path_is_relative_to_scout_module(self):
        previous_cwd = os.getcwd()
        try:
            os.chdir(ROOT)
            resolved = scout_report_engine.resolve_output_path("../data/scout")
        finally:
            os.chdir(previous_cwd)

        expected = (SCOUT_DIR / "../data/scout").resolve()
        self.assertEqual(Path(resolved), expected)
        self.assertTrue(os.path.isabs(resolved))

    def test_configured_secret_rejects_empty_and_placeholder_values(self):
        invalid_values = [
            None,
            "",
            "   ",
            "__REPLACE_WITH_REAL_KEY__",
            "sk-...",
            "your-notion-token",
            "placeholder",
        ]
        for value in invalid_values:
            with self.subTest(value=value):
                self.assertFalse(scout_report_engine.is_configured_secret(value))

        self.assertTrue(scout_report_engine.is_configured_secret("sk-real-key-value-1234567890"))

    def test_push_status_uses_actual_push_result(self):
        self.assertEqual(scout_report_engine.push_status_name(True), "已推送")
        self.assertEqual(scout_report_engine.push_status_name(False), "未推送")


if __name__ == "__main__":
    unittest.main()
