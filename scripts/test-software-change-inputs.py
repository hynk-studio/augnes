"""Focused controls for the portable selected-input observer (Python stdlib)."""

import hashlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile

SCRIPT = (Path(__file__).resolve().parents[1] / "skills/verify-software-change"
          / "scripts/snapshot_inputs.py")
spec = importlib.util.spec_from_file_location("software_change_inputs", SCRIPT)
observer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(observer)
BUILDER = SCRIPT.parents[3] / "scripts/build-software-change-skill.py"
build_spec = importlib.util.spec_from_file_location("software_change_package", BUILDER)
builder = importlib.util.module_from_spec(build_spec)
build_spec.loader.exec_module(builder)


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


class PackageChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="augnes-change-package-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.skill = self.root / "skill"
        shutil.copytree(SCRIPT.parents[1], self.skill)

    def test_zip_is_reproducible_and_excludes_unlisted_material(self):
        (self.skill / "private.env").write_text("not public", encoding="utf8")
        data, identity = builder.package(self.skill)
        other = self.root / "other"
        shutil.copytree(self.skill, other)
        self.assertEqual(builder.package(other)[0], data)
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            self.assertEqual(archive.namelist(), [
                "SKILL.md", "examples/request-and-result.md",
                "references/handoff.md", "scripts/snapshot_inputs.py"])
            for name in archive.namelist():
                self.assertEqual(archive.read(name), (self.skill / name).read_bytes())
        self.assertEqual(identity["sha256"], hashlib.sha256(data).hexdigest())
        self.assertEqual(identity["bytes"], len(data))

    def test_missing_or_linked_member_refuses_before_output(self):
        target = self.skill / "references/handoff.md"
        target.unlink()
        with self.assertRaises(ValueError):
            builder.package(self.skill)
        target.symlink_to(SCRIPT)
        with self.assertRaises(ValueError):
            builder.package(self.skill)

    def test_existing_destination_is_preserved(self):
        target = self.root / "existing.zip"
        target.write_bytes(b"keep this previous file")
        result = subprocess.run([sys.executable, "-E", "-s", "-S", "-B",
                                 str(BUILDER), "--output", str(target)],
                                capture_output=True, text=True, timeout=5)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(target.read_bytes(), b"keep this previous file")

    def test_zip_delivered_helper_runs_without_package_siblings(self):
        data, _ = builder.package(self.skill)
        alone = self.root / "temporary"; alone.mkdir()
        helper = alone / "received.py"
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            helper.write_bytes(archive.read("scripts/snapshot_inputs.py"))
        subject = self.root / "subject"; subject.mkdir()
        (subject / "version.txt").write_bytes(b"1.0\n")
        result = subprocess.run([sys.executable, "-E", "-s", "-S", "-B",
                                 str(helper), "snapshot", str(subject), "version.txt"],
                                cwd=alone, capture_output=True, text=True, timeout=5)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["files"]["version.txt"]["sha256"],
                         hashlib.sha256(b"1.0\n").hexdigest())
        self.assertEqual(list(alone.iterdir()), [helper])


if __name__ == "__main__":
    unittest.main()
