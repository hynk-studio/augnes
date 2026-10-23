"""Deterministic development checks; no research consumers or provider calls."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("case", HERE / "case.py")
case = importlib.util.module_from_spec(spec)
spec.loader.exec_module(case)


class CaseTests(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix="augnes-1526-dev-"))
        self.unsettled = False
        self.package = case.build(self.root / "basis")

    def tearDown(self):
        evidence = os.environ.get("AUGNES_FILE_IDENTITY_TEST_EVIDENCE")
        if evidence:
            shutil.copytree(self.root, Path(evidence) / self._testMethodName)
        if self.unsettled:
            raise RuntimeError("unsettled development resources retained: " + str(self.root))
        shutil.rmtree(self.root)
        self.assertFalse(self.root.exists())

    def replay(self, consumer, output):
        self.unsettled = True
        result = case.replay(self.package, consumer, output)
        self.unsettled = result["settlement"] != "complete"
        case.save(self.root / "replay-record.json", result)
        return result

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
        result = self.replay(b, replay_out)
        self.assertEqual(result["acceptance"], {"status": "accepted", "reason": None})
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
        before = case.inventory(b)
        result = self.replay(b, self.root / "failed-output")
        self.assertEqual(result["returncode"], 7)
        self.assertEqual(result["acceptance"], {"status": "rejected", "reason": "canonical_child_failed"})
        self.assertEqual(result["check"], "NOT_RUN")
        self.assertTrue(result["private_cleanup"])
        self.assertFalse((self.root / "failed-output").exists())
        self.assertEqual(case.inventory(b), before)

    def interrupted_replay(self, mode):
        """Actual Mac/host adapter wiring with the unchanged 60-second deadline."""
        b, output = self.root / "b", self.root / "interrupted-output"
        shutil.copytree(self.package / "task-b", b / "task-b")
        shutil.copyfile(HERE / "developer_control.py", b / "method.py")
        # This DEVELOPER method derives the correct output, then handles the
        # owner's termination with exit0. It is never a consumer artifact.
        (b / "interrupted.py").write_text(
            "import os, signal, sys, time, json\nfrom pathlib import Path\nfrom method import main\n"
            "signal.signal(signal.SIGTERM, lambda *args: sys.exit(0))\n"
            "main(sys.argv[1], sys.argv[2])\n"
            "Path(sys.argv[2], 'owned-pids.json').write_text(json.dumps({'method':os.getpid(),'owner':os.getppid()}))\n"
            + ("os.kill(os.getppid(), signal.SIGTERM)\n" if mode == "cancelled" else "")
            + "while True: time.sleep(0.05)\n")
        case.save(b / "METHOD.json", {"argv": [sys.executable, "$TASK/interrupted.py", "$INPUT", "$OUTPUT"], "cwd": "$TASK"})
        before, inputs = case.inventory(b), case.inventory(self.package)
        with mock.patch.object(case, "check", side_effect=AssertionError("interrupted replay reached semantic check")) as check:
            result = self.replay(b, output)
            check.assert_not_called()
        self.assertEqual(result["returncode"], 0)
        self.assertIs(result["owner"]["result"][mode], True)
        reason = "canonical_child_cancelled" if mode == "cancelled" else "canonical_child_timeout"
        self.assertEqual(result["acceptance"], {"status": "rejected", "reason": reason})
        self.assertEqual(result["check"], "NOT_RUN")
        self.assertEqual(result["settlement"], "complete")
        self.assertTrue(result["private_cleanup"])
        self.assertEqual(result["owner"]["result"]["remaining_owned_processes"], 0)
        self.assertEqual(case.inventory(b), before)
        self.assertEqual(case.inventory(self.package), inputs)
        # This independent artifact-only control proves that correct bytes do
        # not override an interrupted execution. It is not replay acceptance.
        artifact = case.check(self.package, b, "B", output / "reconciliation.json")
        case.save(self.root / "artifact-only-control.json", artifact)
        self.assertEqual(artifact["status"], "PASS")

    def test_timeout_then_graceful_exit_zero_is_rejected(self):
        self.interrupted_replay("timed_out")

    def test_cancellation_then_graceful_exit_zero_is_rejected(self):
        self.interrupted_replay("cancelled")

    def test_component_spawn_failure_and_unknown_settlement(self):
        # Controlled owner records, NOT live lifecycle observations.
        b = self.root / "b"
        shutil.copytree(self.package / "task-b", b / "task-b")
        case.save(b / "METHOD.json", {"argv": ["not-executed"], "cwd": "$TASK"})
        complete = dict(label="component", exit_code=0, signal=None, timed_out=False,
                        cancelled=False, duration_ms=1, spawn_error_code=None,
                        exit_observed=True, streams_closed=True, cleanup_started=True,
                        cleanup_completed=True, remaining_owned_processes=0, termination_reason="natural_exit")
        controls = [({"spawn_error_code": "ENOENT", "exit_code": None}, "canonical_child_spawn_failed", True),
                    ({"streams_closed": False}, "canonical_child_cleanup_required", False),
                    ({"timed_out": True, "cleanup_completed": False}, "canonical_child_timeout", False)]
        helper = (HERE.parent / "canonical-child-runner.mjs").as_uri()
        for index, (delta, reason, settled) in enumerate(controls):
            result = {**complete, **delta}
            code = ("import {canonicalChildAcceptanceFailure as check} from " + json.dumps(helper) + ";"
                    "const r=JSON.parse(process.argv[1]);const e=check(r,{suite:'component',timeoutMs:60000,requireCompleteCleanup:true});"
                    "console.log(JSON.stringify({status:e?'rejected':'accepted',reason:e?.code??null}));")
            acceptance = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", code, json.dumps(result)], timeout=10))
            run = {"result": result, "acceptance": acceptance, "stdout": "retained", "stderr": "component"}
            fake = subprocess.CompletedProcess([], 0, stdout=json.dumps(run).encode(), stderr=b"")
            with mock.patch.object(case.subprocess, "run", return_value=fake), mock.patch.object(case, "check") as checker:
                observed = case.replay(self.package, b, self.root / ("component-output-" + str(index)))
                checker.assert_not_called()
            self.assertEqual(observed["acceptance"], {"status": "rejected", "reason": reason})
            self.assertEqual(observed["owner"], run)
            self.assertEqual(observed["check"], "NOT_RUN")
            self.assertEqual(observed["private_cleanup"], settled)
            self.assertEqual(observed["settlement"], "complete" if settled else "unknown")
            case.save(self.root / ("component-" + str(index) + ".json"), observed)
            if not settled:
                self.assertTrue(Path(observed["private_root"]).exists())
                # No child existed in this explicitly mocked component control.
                shutil.rmtree(observed["private_root"])

    def test_component_private_cleanup_failure_preserves_owner_record(self):
        b = self.root / "b"
        shutil.copytree(self.package / "task-b", b / "task-b")
        (b / "method.py").write_text("print('settled child evidence')\n")
        case.save(b / "METHOD.json", {"argv": [sys.executable, "$TASK/method.py"], "cwd": "$TASK"})
        # The child is real and settled; only filesystem cleanup failure is
        # injected. Keep this distinct from unknown process settlement.
        with mock.patch.object(case.shutil, "rmtree", side_effect=OSError("developer cleanup fault")), mock.patch.object(case, "check") as check:
            result = case.replay(self.package, b, self.root / "unused-output")
            check.assert_not_called()
        case.save(self.root / "cleanup-fault-record.json", result)
        self.assertEqual(result["acceptance"], {"status": "accepted", "reason": None})
        self.assertEqual(result["settlement"], "complete")
        self.assertEqual(result["check"], "NOT_RUN")
        self.assertIn("settled child evidence", result["stdout"])
        self.assertFalse(result["private_cleanup"])
        self.assertEqual(result["private_cleanup_error"]["message"], "developer cleanup fault")
        self.assertTrue(Path(result["private_root"]).exists())
        shutil.rmtree(result["private_root"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
