"""Deterministic development checks; no research consumers or provider calls."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("case", HERE / "case.py")
case = importlib.util.module_from_spec(spec)
spec.loader.exec_module(case)


class CaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="augnes-1526-dev-")
        self.root = Path(self.temp.name)
        self.package = case.build(self.root / "basis")

    def tearDown(self):
        self.temp.cleanup()
        self.assertFalse(self.root.exists())

    def test_controls(self):
        results = case.controls(self.root / "controls")
        self.assertEqual(len(results), 14)
        self.assertEqual(sum("rejected" in x for x in results), 6)

    def test_input_and_output_integrity(self):
        p = self.package
        case.save(p / "good.json", case.expected_b())
        self.assertEqual(case.check(p, p, "B", p / "good.json")["status"], "PASS")
        (p / "duplicate.json").write_text('{"pairs":[],"pairs":[]}')
        with self.assertRaisesRegex(ValueError, "duplicate"):
            case.check(p, p, "B", p / "duplicate.json")
        work = self.root / "work"
        shutil.copytree(p / "task-b", work / "task-b")
        (work / "task-b/trees/m-after/empty").write_bytes(b"altered")
        with self.assertRaisesRegex(ValueError, "immutable"):
            case.check(p, work, "B", p / "good.json")
        shutil.rmtree(work / "task-b")
        (work / "task-b").symlink_to(p / "task-b", target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "aliased"):
            case.check(p, work, "B", p / "good.json")
        (work / "task-b").unlink()
        shutil.copytree(p / "task-b", work / "task-b")
        (work / "task-b/trees/p-before").rmdir()
        with self.assertRaisesRegex(ValueError, "immutable"):
            case.check(p, work, "B", p / "good.json")

    def test_whole_transfer_and_fresh_replay(self):
        a, b = self.root / "a", self.root / "b"
        shutil.copytree(self.package / "task-a", a / "task-a")
        (a / "failed-method.py").write_text("raise RuntimeError('retained failure')\n")
        (a / "failure.txt").write_text("original failure\n")
        original = case.inventory(a)
        case.transfer(a, b, self.package)
        self.assertEqual(case.inventory(b / "predecessor"), original)
        with self.assertRaisesRegex(ValueError, "already exists"):
            case.transfer(a, b, self.package)
        shutil.copyfile(HERE / "developer_control.py", b / "method.py")
        case.save(b / "METHOD.json", {"argv": [sys.executable, "$TASK/method.py", "$INPUT", "$OUTPUT"], "cwd": "$TASK"})
        original_out = b / "original-output"
        subprocess.run([sys.executable, str(b / "method.py"), str(b / "task-b"), str(original_out)], check=True, timeout=10)
        before = case.inventory(b)
        replay_out = self.root / "fresh-output"
        result = case.replay(self.package, b, replay_out)
        self.assertEqual(result["check"]["status"], "PASS")
        self.assertFalse(Path(result["private_root"]).exists())
        self.assertEqual((original_out / "reconciliation.json").read_bytes(), (replay_out / "reconciliation.json").read_bytes())
        self.assertEqual(case.inventory(b), before)
        self.assertEqual(case.inventory(a), original)
        with self.assertRaisesRegex(ValueError, "already exists"):
            case.replay(self.package, b, replay_out)

    def test_static_case_lookup_is_not_derivation(self):
        # A correct stored answer alone is insufficient: an independently changed
        # input value in an isolated DEVELOPMENT control must change the answer.
        original = case.expected_b()
        changed = self.package / "task-b/trees/m-after/empty"
        changed.write_bytes(b"independent new fact")
        output = self.root / "varied-output"
        subprocess.run([sys.executable, str(HERE / "developer_control.py"), str(self.package / "task-b"), str(output)], check=True, timeout=10)
        actual = json.loads((output / "reconciliation.json").read_text())
        self.assertNotEqual(actual, original)
        row = next(x for x in actual["pairs"][0]["changes"] if x["path"] == "empty")
        self.assertEqual(row["status"], "changed")
        self.assertEqual(row["after"]["bytes"], len(b"independent new fact"))

    def test_replay_preserves_nonzero_failure(self):
        b = self.root / "b"
        shutil.copytree(self.package / "task-b", b / "task-b")
        (b / "method.py").write_text("raise SystemExit(7)\n")
        case.save(b / "METHOD.json", {"argv": [sys.executable, "$TASK/method.py", "$INPUT", "$OUTPUT"], "cwd": "$TASK"})
        result = case.replay(self.package, b, self.root / "failed-output")
        self.assertEqual(result["returncode"], 7)
        self.assertEqual(result["check"], "NOT_RUN")
        self.assertTrue(result["private_cleanup"])
        self.assertFalse((self.root / "failed-output").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
