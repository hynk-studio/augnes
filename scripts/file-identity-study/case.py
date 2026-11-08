"""Evaluator/development entry point. Never export this file to consumers.

Small constructed exact-file-identity case. Python >=3.9, standard library only.
Expected facts are built from literal fixture data, not seed/consumer traversal.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import tempfile

HERE = Path(__file__).resolve().parent

# Developer-only facts. These IDs are ordinary source identifiers, not labels
# for a diagnosis. The same two r/s list bytes describe different actual trees.
A_TREES = {
    "r": {"catalog.txt": b"north\n", "notes.txt": b"south\n",
          "z-config/data.json": b'{"active":true}\n', "z-read me.md": b"release\n"},
    "s": {"catalog.txt\nnotes.txt": b"north and south\n",
          "z-config/data.json": b'{"active":true}\n', "z-read me.md": b"release\n"},
    "t": {"-index": b"", "docs/Part 1.txt": b"one\n", "notes\t2026.txt": b"two\n",
          "path\\literal.txt": bytes([0, 255, 10]), "status:ok": b"yes\n"},
}
B_TREES = {
    "m-before": {"ledger.txt": b"old\n", "notes.txt": b"same\n", "docs/plan.md": b"alpha\n",
                 "empty": b"", "-draft": b"moved content\n"},
    "m-after": {"ledger.txt\nnotes.txt": b"combined\n", "docs/plan.md": b"beta\n",
                "empty": b"", "draft-final": b"moved content\n"},
    "n-before": {"section\nappendix/report.txt": b"v1\n", "notes\tfinal.txt": b"same\n",
                 "plain/a": b"a", "plain/b": b"b"},
    "n-after": {"section\nappendix/report.txt": b"v2\n", "notes\tfinal.txt": b"same\n",
                "plain/a\nplain/b": b"a and b", "status:ready": b"\x00\x10\xff"},
    "p-before": {},
    "p-after": {"space file": b"new\n", "back\\slash": b"literal\n"},
}
PAIRS = [("release-m", "m-before", "m-after"),
         ("release-n", "n-before", "n-after"),
         ("release-p", "p-before", "p-after")]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def save(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=True, indent=2) + "\n", encoding="ascii")


def unique(pairs):
    obj = {}
    for k, v in pairs:
        if k in obj:
            raise ValueError("duplicate JSON key")
        obj[k] = v
    return obj


def load(path):
    return json.loads(Path(path).read_text(), object_pairs_hook=unique)


def facts(files):
    return [{"path": p, "bytes": len(data), "sha256": digest(data)}
            for p, data in sorted(files.items())]


def expected_a():
    return {"inventories": [{"id": "source-" + k, "status": "complete",
                             "files": facts(v), "reason": None} for k, v in A_TREES.items()] +
            [{"id": "archive-u", "status": "unresolved", "files": [], "reason": "UNSCORED_TEXT"}]}


def expected_b():
    result = []
    for ident, before, after in PAIRS:
        b, a = B_TREES[before], B_TREES[after]
        rows = []
        for name in sorted(set(b) | set(a)):
            status = ("added" if name not in b else "removed" if name not in a else
                      "retained" if b[name] == a[name] else "changed")
            side = lambda d: {"bytes": len(d[name]), "sha256": digest(d[name])} if name in d else None
            rows.append({"path": name, "status": status, "before": side(b), "after": side(a)})
        result.append({"id": ident, "changes": rows})
    return {"pairs": result}


def inventory(root):
    """Immutable-file coverage, separate from task expected outputs."""
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError("aliased or missing root")
    result = {}
    for p in sorted(root.rglob("*")):
        s = p.lstat()
        if p.is_symlink() or not (stat.S_ISREG(s.st_mode) or stat.S_ISDIR(s.st_mode)):
            raise ValueError("aliased or non-regular export input")
        if p.is_file():
            if s.st_nlink != 1:
                raise ValueError("hard-linked input")
            result[p.relative_to(root).as_posix()] = {"bytes": s.st_size, "sha256": digest(p.read_bytes())}
        else:
            result[p.relative_to(root).as_posix()] = {"type": "directory"}
    return result


def build(destination):
    out = Path(destination)
    out.mkdir(parents=True, exist_ok=False)
    for arm, trees in [("a", A_TREES), ("b", B_TREES)]:
        base = out / ("task-" + arm)
        base.mkdir()
        shutil.copyfile(HERE / "materials" / (arm.upper() + ".md"), base / "BRIEF.md")
        for name, files in trees.items():
            root = base / "trees" / name
            root.mkdir(parents=True)
            for path, data in files.items():
                p = root / path
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_bytes(data)
        if arm == "a":
            shutil.copyfile(HERE / "seed.py", base / "seed.py")
            (base / "PRIOR.md").write_text("Constructed supplied prior work: seed.py was used for the restricted original exports described in its docstring. It computes raw content sizes and hashes from the earlier producer lists. It is not a certified solution to a new request. Preserve this original and any observations you make.\n")
            sources = []
            for k, files in trees.items():
                listing = "".join(p + "\n" for p in sorted(files))
                (base / (k + ".list")).write_bytes(listing.encode("ascii"))
                sources.append({"id": "source-" + k, "raw_root": "trees/" + k, "listing": k + ".list"})
            (base / "u.list").write_bytes(b"a.md\nb.md\n")
            sources.append({"id": "archive-u", "raw_root": None, "listing": "u.list"})
            save(base / "input.json", {"sources": sources})
        else:
            save(base / "input.json", {"pairs": [{"id": i, "before": "trees/" + b,
                                                   "after": "trees/" + a} for i, b, a in PAIRS]})
    save(out / "IMMUTABLE.json", {k: inventory(out / k) for k in ["task-a", "task-b"]})
    save(out / "ORACLE.json", {"A": expected_a(), "B": expected_b(),
                                "basis": "Literal independent developer-authored synthetic file facts in case.py; no consumer traversal or seed defines expectations."})
    return out


def verify_inputs(package, consumer, stage):
    original = Path(package)
    target = Path(consumer) / ("task-" + stage.lower())
    expected = load(original / "IMMUTABLE.json")["task-" + stage.lower()]
    actual = inventory(target)
    if actual != expected:
        raise ValueError("immutable input path/size/hash coverage mismatch")
    # Confirm judging source itself, then use its separately preserved oracle.
    if inventory(original / ("task-" + stage.lower())) != expected:
        raise ValueError("judging inputs changed")


def check(package, consumer, stage, output):
    verify_inputs(package, consumer, stage)
    p = Path(output)
    if p.is_symlink() or not p.is_file() or p.stat().st_nlink != 1:
        raise ValueError("aliased or nonregular output")
    value = load(output)
    expected = load(Path(package) / "ORACLE.json")[stage]
    if stage == "A":
        if not isinstance(value, dict) or list(value) != ["inventories"]:
            raise ValueError("A root schema")
        rows = value["inventories"]
        if not isinstance(rows, list) or len(rows) != 4:
            raise ValueError("missing A source")
        reason = rows[-1].get("reason") if isinstance(rows[-1], dict) else None
        if not isinstance(reason, str) or not reason.strip():
            raise ValueError("unresolved reason absent")
        expected["inventories"][-1]["reason"] = reason
    # Exact JSON types matter: Python True == 1, so compare canonical JSON too.
    if json.dumps(value, sort_keys=True) != json.dumps(expected, sort_keys=True):
        raise ValueError("independent exact semantic output mismatch")
    return {"status": "PASS", "stage": stage, "output_sha256": digest(Path(output).read_bytes()),
            "input_basis": digest((Path(package) / "IMMUTABLE.json").read_bytes()),
            "oracle_basis": digest((Path(package) / "ORACLE.json").read_bytes())}


def transfer(a, b, package):
    """Whole A, no curation. Only declared Python bytecode bookkeeping excluded."""
    a, b = Path(a), Path(b)
    if b.exists():
        raise ValueError("B destination already exists")
    inventory(a)  # fail closed on aliases/special files
    b.mkdir()
    shutil.copytree(a, b / "predecessor", ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    shutil.copytree(Path(package) / "task-b", b / "task-b")
    return inventory(b)


def replay(package, consumer, output):
    """Faithful command recipe. No method repair. Private HOME/temp; no shell."""
    consumer, output = Path(consumer).resolve(), Path(output).resolve()
    if output.exists():
        raise ValueError("replay output already exists")
    spec = load(consumer / "METHOD.json")
    if set(spec) != {"argv", "cwd"} or spec["cwd"] != "$TASK" or not isinstance(spec["argv"], list):
        raise ValueError("invalid method command recipe")
    if not all(isinstance(v, str) for v in spec["argv"]):
        raise ValueError("argv strings required")
    verify_inputs(package, consumer, "B")
    replacements = {"$TASK": str(consumer), "$INPUT": str(consumer / "task-b"), "$OUTPUT": str(output)}
    argv = []
    for value in spec["argv"]:
        for key, replacement in replacements.items():
            value = value.replace(key, replacement)
        argv.append(value)
    private = tempfile.mkdtemp(prefix="augnes-1526-replay-")
    try:
        env = {"PATH": os.environ["PATH"], "HOME": private, "TMPDIR": private,
               "PYTHONDONTWRITEBYTECODE": "1", "PYTHONHASHSEED": "0", "LANG": "C"}
        child = subprocess.run(["node", str(HERE / "replay-child.mjs"), json.dumps(argv), str(consumer)],
                               cwd=consumer, env=env, capture_output=True, timeout=90)
        if child.returncode != 0:
            raise RuntimeError("replay owner failed; retain evidence, settlement unestablished: " + child.stderr.decode("utf-8", "replace"))
        run = json.loads(child.stdout)
        record = {"argv": argv, "cwd": str(consumer), "returncode": run["result"]["exit_code"],
                  "stdout": run["stdout"], "stderr": run["stderr"], "owner": run,
                  "acceptance": run["acceptance"], "private_root": private}
    except Exception as error:
        raise RuntimeError("replay owner unknown; private resources retained at " + private) from error
    result = run["result"]
    # Settlement is independent of execution acceptance: a rejected interrupted
    # child may be fully settled. Unknown settlement retains its private root.
    settled = (result.get("exit_observed") is True and result.get("streams_closed") is True
               and result.get("cleanup_completed") is True and result.get("remaining_owned_processes") == 0)
    record["settlement"] = "complete" if settled else "unknown"
    if settled:
        try:
            shutil.rmtree(private)
        except OSError as error:
            # Retain the full execution record if independent resource cleanup
            # fails; do not replace known execution facts with an exception.
            record["private_cleanup_error"] = {"type": type(error).__name__, "message": str(error)}
    record["private_cleanup"] = settled and not Path(private).exists()
    if run["acceptance"] != {"status": "accepted", "reason": None} or not record["private_cleanup"]:
        return {**record, "check": "NOT_RUN"}
    return {**record, "check": check(package, consumer, "B", output / "reconciliation.json")}


def controls(destination):
    out = build(destination)
    results = []
    for name in ["r", "s", "t"]:
        p = out / "task-a"
        result = subprocess.run([sys.executable, str(p / "seed.py"), str(p / "trees" / name),
                                 str(p / (name + ".list"))], capture_output=True, timeout=10)
        (out / ("seed-" + name + ".stdout")).write_bytes(result.stdout)
        (out / ("seed-" + name + ".stderr")).write_bytes(result.stderr)
        good = result.returncode == 0
        if name in ["r", "t"]:
            assert good and json.loads(result.stdout) == facts(A_TREES[name])
        else:
            assert not good  # retained original actual failure, not a simulated trace
        results.append({"control": "seed-" + name, "returncode": result.returncode})
    assert (out / "task-a/r.list").read_bytes() == (out / "task-a/s.list").read_bytes()
    assert facts(A_TREES["r"]) != facts(A_TREES["s"])
    results.append({"control": "actual-listing-collision", "status": "PASS"})
    altered = out / "irrelevant"
    shutil.copytree(out / "task-a/trees/r", altered)
    for p in altered.rglob("*"):
        os.utime(p, (1234567890, 1234567890))
    raw = subprocess.check_output([sys.executable, str(out / "task-a/seed.py"), str(altered), str(out / "task-a/r.list")])
    assert json.loads(raw) == facts(A_TREES["r"])
    results.append({"control": "mtime-irrelevance", "status": "PASS"})
    assert "".join(x + "\n" for x in ["a.md", "b.md"]) == "a.md\nb.md\n"
    assert "".join(x + "\n" for x in ["a.md\nb.md"]) == "a.md\nb.md\n"
    results.append({"control": "archive-insufficient-information", "status": "PASS",
                    "basis": "two possible path sets and arbitrary contents; no raw/count/hash metadata"})
    for stage in ["A", "B"]:
        good = expected_a() if stage == "A" else expected_b()
        save(out / (stage + "-valid.json"), good)
        results.append({"control": stage + "-valid-DEVELOPER", **check(out, out, stage, out / (stage + "-valid.json"))})
        foils = []
        if stage == "A":
            missing = json.loads(json.dumps(good)); missing["inventories"][0]["files"].pop();foils.append(("missing-complete", missing))
            collapsed = json.loads(json.dumps(good));collapsed["inventories"][1]["files"] = facts(A_TREES["r"]);foils.append(("collapsed-identity", collapsed))
            false = json.loads(json.dumps(good));false["inventories"][-1].update(status="complete", reason=None);foils.append(("invented-archive", false))
        else:
            wrong = json.loads(json.dumps(good));wrong["pairs"][0]["changes"][0]["status"] = "renamed";foils.append(("rename-heuristic", wrong))
            missing = json.loads(json.dumps(good));missing["pairs"].pop();foils.append(("missing-pair", missing))
            wronghash = json.loads(json.dumps(good));wronghash["pairs"][0]["changes"][0]["before"]["sha256"] = "0" * 64;foils.append(("wrong-hash", wronghash))
        for name, value in foils:
            p = out / (stage + "-foil-" + name + ".json");save(p, value)
            try:
                check(out, out, stage, p)
            except ValueError as error:
                results.append({"control": stage + "-" + name + "-DEVELOPER", "rejected": str(error)})
            else:
                raise AssertionError("wrong-output foil accepted")
    save(out / "CONTROLS.json", results)
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=["build", "controls", "check", "transfer", "replay"])
    parser.add_argument("paths", nargs="+")
    args = parser.parse_args()
    if args.operation == "build":
        print(build(*args.paths))
    elif args.operation == "controls":
        print(json.dumps(controls(*args.paths), indent=2))
    elif args.operation == "check":
        print(json.dumps(check(*args.paths), indent=2))
    elif args.operation == "transfer":
        print(json.dumps(transfer(*args.paths), indent=2))
    else:
        print(json.dumps(replay(*args.paths), indent=2))


if __name__ == "__main__":
    main()
