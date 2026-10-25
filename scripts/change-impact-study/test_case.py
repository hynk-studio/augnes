"""Zero-model controls; fixture authors have seen all answers. No consumer sample."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

import case
import components


class CaseControls(unittest.TestCase):
    def test_parts_are_useful_without_whole_solution(self):
        with tempfile.TemporaryDirectory(prefix="ag-1527-parts-") as tmp:
            before, after = Path(tmp) / "before", Path(tmp) / "after"
            before.mkdir(); after.mkdir()
            for directory in [before, after]:
                (directory / "same.txt").write_text("stable")
            (before / "old.txt").write_text("old")
            (after / "new.txt").write_text("new")
            (before / "edit.py").write_text("# before\n")
            (after / "edit.py").write_text("# after\n")
            rows = components.changed_files(before, after)
            self.assertEqual([(r["path"], r["status"]) for r in rows],
                             [("edit.py", "modified"), ("new.txt", "added"), ("old.txt", "removed")])
            (after / "alias").symlink_to(before / "same.txt")
            with self.assertRaises(ValueError): components.file_inventory(after)
        source = "from math import floor as down\n\ndef measure(value):\n    return down(value)\n"
        facts = components.python_facts(source)
        self.assertEqual(facts["imports"][0]["names"], [{"name": "floor", "asname": "down"}])
        self.assertEqual(facts["functions"][0]["calls"], [{"callee": "down", "line": 4, "expression": "down(value)"}])
        moved = components.python_facts("# annotation\n" + source)
        self.assertEqual(facts["functions"][0]["syntax"], moved["functions"][0]["syntax"])
        self.assertNotEqual(facts["functions"][0]["line"], moved["functions"][0]["line"])
        with self.assertRaises(SyntaxError): components.python_facts("def ?")
        self.assertEqual(components.markdown_table(["name", "note"], [["x|y", "a\nb"]]),
                         "| name | note |\n| --- | --- |\n| x\\|y | a<br>b |\n")
        with self.assertRaises(ValueError): components.markdown_table(["a"], [[1, 2]])
        # Exported public operations are partial; none accepts tasks/test coverage
        # or implements name resolution, reachability or test selection.
        public = {name for name, value in vars(components).items()
                  if callable(value) and getattr(value, "__module__", None) == "components"}
        self.assertEqual(public, {"file_inventory", "changed_files", "python_facts", "markdown_table"})

    def test_literal_judging_basis_supported_and_still_valid(self):
        bases = case.definitions()
        a = case.expected_case(bases["A"][0])
        self.assertEqual(a["changed_symbols"], ["billing:fee", "unrelated:token"])
        self.assertEqual([(r["symbol"], r["status"]) for r in a["targets"]], [
            ("admin:status", "unaffected"), ("gateway:checkout", "impacted"),
            ("gateway:estimate", "unaffected"), ("gateway:route", "unresolved"),
            ("service:invoice", "impacted")])
        b = case.expected_case(bases["B"][1])
        self.assertEqual(b["selection"], {"tests": ["combined", "legacy"], "cost": 7,
                                         "unresolved_targets": ["api:dispatch"]})
        # Regression for independently reviewed oracle error: definition line 16
        # is not the actual call line 17. Judge source evidence, not self-agreement.
        for source in [case.B_BEFORE["api.py"], case.B_AFTER["api.py"]]:
            for unknown in bases["B"][1]["unknown"]["before"]:
                self.assertEqual(source.splitlines()[unknown["line"] - 1].strip(), "return callback(x)")
        unchanged = case.expected_case(bases["B"][0])
        self.assertEqual(unchanged["changed_symbols"], [])
        self.assertEqual(unchanged["selection"]["tests"], [])
        # Independently stipulated costs alter the selected plan; no static answer.
        changed = copy.deepcopy(bases["B"][1])
        next(t for t in changed["tests"] if t["id"] == "combined")["cost"] = 20
        self.assertEqual(case.expected_case(changed)["selection"]["tests"], ["cart", "legacy", "shipping"])
        # Same-name functions from unrelated modules cannot form an edge.
        self.assertNotIn("billing:fee", case.reachable(case.A_GRAPH, "gateway:estimate"))
        for stage in ["A", "B"]:
            value = {"cases": [case.expected_case(x) for x in bases[stage]]}
            self.assertEqual(case.check_value(value, bases[stage], stage)["status"], "PASS")

    def test_plausible_wrong_outputs_rejected(self):
        bases = case.definitions()
        a = {"cases": [case.expected_case(x) for x in bases["A"]]}
        b = {"cases": [case.expected_case(x) for x in bases["B"]]}
        mutations = [
            ("A", a, lambda v: v["cases"][0]["changed_symbols"].append("admin:status")),
            ("A", a, lambda v: v["cases"][0]["targets"][1]["impacts"].clear()),
            ("A", a, lambda v: v["cases"][0]["targets"][1]["impacts"][0].update(path=["gateway:checkout", "billing:fee"])),
            ("A", a, lambda v: v["cases"][0]["targets"][2].update(status="impacted")),
            ("A", a, lambda v: v["cases"][0]["targets"][3].update(status="unaffected", unresolved=[])),
            ("A", a, lambda v: v["cases"][0]["targets"][3]["unresolved"][0].update(line=True)),
            ("B", b, lambda v: v["cases"][1]["selection"].update(tests=["cart", "legacy", "shipping"], cost=9)),
            ("B", b, lambda v: v["cases"][1]["selection"].update(tests=["combined"], cost=5)),
            ("B", b, lambda v: v["cases"][1]["selection"].update(unresolved_targets=[])),
            ("B", b, lambda v: v["cases"][1]["targets"][1]["unresolved"][0].update(line=16)),
            ("B", b, lambda v: v["cases"][0]["selection"].update(tests=["health"], cost=1)),
            ("B", b, lambda v: v["cases"][1]["targets"][3]["impacts"][1].update(version="after")),
            ("B", b, lambda v: v["cases"].pop()),
        ]
        for stage, initial, mutate in mutations:
            value = copy.deepcopy(initial); mutate(value)
            with self.subTest(stage=stage, value=value):
                with self.assertRaises(ValueError): case.check_value(value, bases[stage], stage)

    def test_export_boundary_complete_transfer_and_input_integrity(self):
        with tempfile.TemporaryDirectory(prefix="ag-1527-transfer-") as tmp:
            root = Path(tmp); package = case.build(root / "judge")
            a = root / "a"; a.mkdir()
            case.shutil.copytree(package / "task-a", a / "task-a")
            (a / "failed-first.py").write_text("raise RuntimeError('original failure')\n")
            (a / "notes.txt").write_text("no curator selects this file")
            (a / "__pycache__").mkdir(); (a / "__pycache__" / "cache.pyc").write_bytes(b"bookkeeping")
            before = case.inventory(a)
            manifest = case.transfer(a, root / "b", package)
            self.assertEqual(case.inventory(a), before)
            self.assertTrue((root / "b/predecessor/failed-first.py").is_file())
            self.assertEqual(manifest["excluded"], ["__pycache__", "__pycache__/cache.pyc"])
            self.assertFalse(any("ORACLE" in k or "case.py" in k or "task-b" in k for k in case.inventory(a / "task-a")))
            result = {"cases": [case.expected_case(x) for x in case.definitions()["A"]]}
            case.save(a / "result.json", result)
            self.assertEqual(case.check(package, a, "A", a / "result.json")["status"], "PASS")
            (a / "task-a/input.json").write_text("{}")
            with self.assertRaises(ValueError): case.check(package, a, "A", a / "result.json")
            (root / "duplicate.json").write_text('{"cases":[],"cases":[]}')
            with self.assertRaises(ValueError): case.load(root / "duplicate.json")


if __name__ == "__main__":
    unittest.main()
