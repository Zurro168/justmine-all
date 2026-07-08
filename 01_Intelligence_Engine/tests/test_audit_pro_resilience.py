import asyncio
import builtins
import importlib
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS_DIR = ROOT / "skills"
sys.path.insert(0, str(SKILLS_DIR))


class AuditProResilienceTests(unittest.TestCase):
    def test_audit_service_starts_without_chromadb(self):
        original_import = builtins.__import__
        removed_modules = {}
        for name in ["chromadb", "audit_pro.audit_pro", "audit_pro.rag_indexer"]:
            if name in sys.modules:
                removed_modules[name] = sys.modules.pop(name)

        def blocked_import(name, *args, **kwargs):
            if name == "chromadb":
                raise ModuleNotFoundError("No module named 'chromadb'")
            return original_import(name, *args, **kwargs)

        builtins.__import__ = blocked_import
        try:
            module = importlib.import_module("audit_pro.audit_pro")
            service = module.AuditProService()
        finally:
            builtins.__import__ = original_import
            for name in ["audit_pro.audit_pro", "audit_pro.rag_indexer"]:
                sys.modules.pop(name, None)
            sys.modules.update(removed_modules)

        self.assertIsNotNone(service)
        self.assertFalse(service.rag_enabled)

        result = asyncio.run(service.run_full_audit([
            {"type": "PACKING_LIST", "net_weight": 100, "container_no": "ABCD1234567"},
            {"type": "BILL_OF_LADING", "net_weight": 95, "container_no": "ABCD1234567"},
            {"type": "INVOICE", "net_weight": 100, "unit_price": 10, "total_amount": 1000},
        ]))

        self.assertEqual(result["overall_status"], "DISCREPANCY_DETECTED")
        self.assertTrue(any(item["module"] == "WEIGHT_CHECK" for item in result["findings"]))


if __name__ == "__main__":
    unittest.main()
