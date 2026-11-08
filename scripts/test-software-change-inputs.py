"""Focused controls for the portable selected-input observer (Python stdlib)."""

import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

SCRIPT = (Path(__file__).resolve().parents[1] / "skills/verify-software-change"
          / "scripts/snapshot_inputs.py")
spec = importlib.util.spec_from_file_location("software_change_inputs", SCRIPT)
observer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(observer)


class InputChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="augnes-change-inputs-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.subject = self.root / "subject"
        self.subject.mkdir()
        (self.subject / "entry.py").write_bytes(b"print('example')\n")

    def save(self, name, value):
        target = self.root / name
        target.write_text(json.dumps(value), encoding="utf8")
        return target

    def test_exact_selected_bytes_without_absolute_paths(self):
        result = observer.snapshot(self.subject, ["entry.py"])
        raw = (self.subject / "entry.py").read_bytes()
        self.assertEqual(result["files"], {"entry.py": {
            "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}})
        self.assertNotIn(str(self.root), json.dumps(result))

    def test_changes_additions_removals_and_equal_copy(self):
        before = self.save("before.json", observer.snapshot(self.subject, ["entry.py"]))
        self.assertTrue(observer.compare(before, before)["equal"])
        (self.subject / "entry.py").write_text("changed", encoding="utf8")
        after = self.save("after.json", observer.snapshot(self.subject, ["entry.py"]))
        self.assertEqual(observer.compare(before, after)["changed"], ["entry.py"])
        (self.subject / "new.txt").write_text("added", encoding="utf8")
        other = self.save("other.json", observer.snapshot(self.subject, ["new.txt"]))
        self.assertEqual(observer.compare(before, other)["added"], ["new.txt"])
        self.assertEqual(observer.compare(before, other)["removed"], ["entry.py"])

    def test_unselected_changes_are_not_claimed_as_covered(self):
        before = observer.snapshot(self.subject, ["entry.py"])
        (self.subject / "unselected.txt").write_text("outside scope", encoding="utf8")
        self.assertEqual(before, observer.snapshot(self.subject, ["entry.py"]))
        self.assertEqual(before["scope"], "selected-files-only")

    def test_missing_and_directory_inputs_refused(self):
        for name in ["absent", "directory"]:
            if name == "directory":
                (self.subject / name).mkdir()
            with self.assertRaises((OSError, ValueError)):
                observer.snapshot(self.subject, [name])

    def test_relative_path_and_inventory_limits(self):
        for names in [[], ["entry.py", "entry.py"], ["../entry.py"],
                      ["/entry.py"], ["a//b"], ["./entry.py"], ["C:x"],
                      ["a\\b"], ["a\nb"], [str(i) for i in range(129)]]:
            with self.subTest(names=names), self.assertRaises(ValueError):
                observer.snapshot(self.subject, names)

    def test_symlink_file_and_parent_refused(self):
        (self.subject / "linked.py").symlink_to(self.subject / "entry.py")
        (self.subject / "linked-dir").symlink_to(self.subject, target_is_directory=True)
        for name in ["linked.py", "linked-dir/entry.py"]:
            with self.assertRaises(ValueError):
                observer.snapshot(self.subject, [name])

    def test_oversize_file_refused(self):
        target = self.subject / "large"
        with target.open("wb") as stream:
            stream.truncate(observer.MAX_FILE_BYTES + 1)
        with self.assertRaises(ValueError):
            observer.snapshot(self.subject, ["large"])

    def test_duplicate_json_and_invalid_fingerprints_refused(self):
        target = self.root / "invalid.json"
        target.write_text('{"schema":"x","schema":"y"}', encoding="utf8")
        with self.assertRaises(ValueError):
            observer.read_snapshot(target)
        original = observer.snapshot(self.subject, ["entry.py"])
        for change in [{"bytes": True}, {"sha256": "not-a-digest"},
                       {"bytes": -1}, {"unexpected": 0}]:
            value = json.loads(json.dumps(original))
            value["files"]["entry.py"].update(change)
            with self.assertRaises(ValueError):
                observer.read_snapshot(self.save("invalid.json", value))

    def test_single_temporary_script_and_cli_statuses(self):
        isolated = self.root / "one-script"
        isolated.mkdir()
        standalone = isolated / "observer.py"
        shutil.copyfile(SCRIPT, standalone)

        def run(*args):
            return subprocess.run([sys.executable, "-E", "-s", "-S", "-B",
                                   str(standalone), *map(str, args)], cwd=isolated,
                                  capture_output=True, text=True, timeout=5)

        result = run("snapshot", self.subject, "entry.py")
        self.assertEqual(result.returncode, 0, result.stderr)
        before = self.save("before.json", json.loads(result.stdout))
        self.assertEqual(run("compare", before, before).returncode, 0)
        (self.subject / "entry.py").write_text("new bytes", encoding="utf8")
        after = self.save("after.json", json.loads(run("snapshot", self.subject, "entry.py").stdout))
        changed = run("compare", before, after)
        self.assertEqual(changed.returncode, 1, changed.stderr)
        self.assertFalse(json.loads(changed.stdout)["equal"])
        refused = run("snapshot", self.subject, "absent")
        self.assertEqual(refused.returncode, 2)
        self.assertEqual(refused.stdout, "")
        nested = self.root / "nested.json"
        nested.write_text("[" * 2000 + "0" + "]" * 2000, encoding="utf8")
        invalid = run("compare", nested, before)
        self.assertEqual(invalid.returncode, 2, invalid.stderr)
        self.assertEqual(invalid.stdout, "")
        self.assertEqual(list(isolated.iterdir()), [standalone])


if __name__ == "__main__":
    unittest.main()
