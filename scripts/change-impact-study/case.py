"""Developer/evaluator only. Never export this module or its oracle to workers.

Constructed source facts and an independently enumerated relationship basis.
The checker never calls components.py or parses worker/source ASTs.
"""
import argparse
import copy
import importlib.util
import itertools
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("file_identity_io", HERE.parent / "file-identity-study" / "case.py")
io = importlib.util.module_from_spec(spec)
spec.loader.exec_module(io)
digest, save, load, inventory = io.digest, io.save, io.load, io.inventory

A_BEFORE = {
    "billing.py": 'def subtotal(items):\n    return sum(items)\n\ndef fee(amount):\n    return amount * 0.05\n\ndef label():\n    return "USD"\n',
    "service.py": 'from billing import fee as charge\nfrom billing import subtotal\n\ndef invoice(items):\n    return subtotal(items) + charge(subtotal(items))\n\ndef preview(items):\n    return subtotal(items)\n',
    "gateway.py": 'from service import invoice as issue, preview\n\ndef checkout(items):\n    return issue(items)\n\ndef estimate(items):\n    return preview(items)\n\ndef route(callback, x):\n    return callback(x)\n',
    "admin.py": 'from billing import label\n\ndef status():\n    return label()\n# stable display\n',
    "unrelated.py": 'def token():\n    return "old"\n',
}
A_AFTER = dict(A_BEFORE, **{
    "billing.py": A_BEFORE["billing.py"].replace("0.05", "0.07"),
    "admin.py": A_BEFORE["admin.py"].replace("stable display", "display documentation updated"),
    "unrelated.py": A_BEFORE["unrelated.py"].replace('"old"', '"new"'),
})
A_GRAPH = {"billing:subtotal": [], "billing:fee": [], "billing:label": [],
           "service:invoice": ["billing:subtotal", "billing:fee"],
           "service:preview": ["billing:subtotal"], "gateway:checkout": ["service:invoice"],
           "gateway:estimate": ["service:preview"], "gateway:route": [],
           "admin:status": ["billing:label"], "unrelated:token": []}
A_TARGETS = ["admin:status", "gateway:checkout", "gateway:estimate", "gateway:route", "service:invoice"]

B_BEFORE = {
    "core/rates.py": 'def rate(x):\n    return x * 2\n\ndef tag():\n    return "standard"\n',
    "legacy.py": 'def discount(x):\n    return x - 1\n',
    "api.py": 'import core.rates as tariff\nfrom legacy import discount as old\n\ndef cart(x):\n    return tariff.rate(x)\n\ndef shipping(x):\n    return tariff.rate(x) + 1\n\ndef old_cart(x):\n    return old(x)\n\ndef health():\n    return "ok"\n\ndef dispatch(callback, x):\n    return callback(x)\n',
}
B_AFTER = dict(B_BEFORE, **{
    "core/rates.py": B_BEFORE["core/rates.py"].replace("x * 2", "x * 3"),
    "legacy.py": "# The legacy function has been retired.\n",
    "api.py": B_BEFORE["api.py"].replace("from legacy import discount as old", "from core.rates import rate as old"),
})
B_GRAPH_BEFORE = {"core.rates:rate": [], "core.rates:tag": [], "legacy:discount": [],
                  "api:cart": ["core.rates:rate"], "api:shipping": ["core.rates:rate"],
                  "api:old_cart": ["legacy:discount"], "api:health": [], "api:dispatch": []}
B_GRAPH_AFTER = {k: list(v) for k, v in B_GRAPH_BEFORE.items() if k != "legacy:discount"}
B_GRAPH_AFTER["api:old_cart"] = ["core.rates:rate"]
B_TARGETS = ["api:cart", "api:dispatch", "api:health", "api:old_cart", "api:shipping"]
TESTS = [{"id": "cart", "cost": 3, "covers": ["api:cart"]},
         {"id": "combined", "cost": 5, "covers": ["api:cart", "api:shipping"]},
         {"id": "full", "cost": 10, "covers": B_TARGETS},
         {"id": "health", "cost": 1, "covers": ["api:health"]},
         {"id": "legacy", "cost": 2, "covers": ["api:old_cart"]},
         {"id": "shipping", "cost": 4, "covers": ["api:shipping"]}]


def definitions():
    """Literal evidence map authored separately from the supplied inspection code."""
    def basis(ident, changed, before, after, targets, unknown, tests=None):
        return {"id": ident, "changed_symbols": changed,
                "graphs": {"before": before, "after": after}, "targets": targets,
                "unknown": {"before": unknown, "after": unknown}, "tests": tests}
    return {
        "A": [basis("release", ["billing:fee", "unrelated:token"], A_GRAPH, A_GRAPH, A_TARGETS,
                    [{"caller": "gateway:route", "callee": "callback", "line": 10}])],
        "B": [basis("documentation", [], B_GRAPH_BEFORE, B_GRAPH_BEFORE, B_TARGETS,
                    [{"caller": "api:dispatch", "callee": "callback", "line": 17}], TESTS),
              basis("release", ["core.rates:rate", "legacy:discount"], B_GRAPH_BEFORE, B_GRAPH_AFTER,
                    B_TARGETS, [{"caller": "api:dispatch", "callee": "callback", "line": 17}], TESTS)],
    }


def build(destination):
    root = Path(destination)
    root.mkdir(parents=True, exist_ok=False)
    for stage in ["A", "B"]:
        task = root / ("task-" + stage.lower())
        task.mkdir()
        for source, target in [("materials/" + stage + ".md", "BRIEF.md"),
                               ("materials/CONTRACT.md", "CONTRACT.md")]:
            shutil.copyfile(HERE / source, task / target)
        if stage == "A":
            shutil.copyfile(HERE / "components.py", task / "components.py")
            shutil.copyfile(HERE / "materials/COMPONENTS.md", task / "COMPONENTS.md")
        cases = []
        pairs = [("release", A_BEFORE, A_AFTER)] if stage == "A" else [
            ("documentation", B_BEFORE, dict(B_BEFORE, **{"legacy.py": B_BEFORE["legacy.py"] + "# comment only\n"})),
            ("release", B_BEFORE, B_AFTER)]
        for ident, before, after in pairs:
            for version, files in [("before", before), ("after", after)]:
                for relative, content in files.items():
                    path = task / "sources" / ident / version / relative
                    path.parent.mkdir(parents=True, exist_ok=True)
                    path.write_text(content, encoding="utf-8")
            row = {"id": ident, "before": "sources/" + ident + "/before",
                   "after": "sources/" + ident + "/after", "targets": A_TARGETS if stage == "A" else B_TARGETS}
            if stage == "B":
                row["tests"] = TESTS
            cases.append(row)
        save(task / "input.json", {"cases": cases})
    save(root / "IMMUTABLE.json", {stage: inventory(root / stage) for stage in ["task-a", "task-b"]})
    save(root / "ORACLE.json", {"basis": "Separate literal source relationship map and change facts; no components or worker output used.",
                                "stages": definitions()})
    return root


def reachable(graph, start):
    paths, pending = {start: [start]}, [start]
    while pending:
        node = pending.pop(0)
        for child in graph[node]:
            if child not in paths:
                paths[child] = paths[node] + [child]
                pending.append(child)
    return paths


def expected_case(basis):
    """One valid reference witness; checker permits other actual valid paths."""
    rows = []
    for target in basis["targets"]:
        reached = {v: reachable(g, target) for v, g in basis["graphs"].items()}
        impacts = []
        for symbol in basis["changed_symbols"]:
            for v in ["after", "before"]:
                if symbol in reached[v]:
                    impacts.append({"symbol": symbol, "version": v, "path": reached[v][symbol]})
                    break
        unresolved = []
        for v in ["after", "before"]:
            for unknown in basis["unknown"][v]:
                if unknown["caller"] in reached[v]:
                    unresolved.append(dict(unknown, version=v, path=reached[v][unknown["caller"]]))
        unresolved.sort(key=lambda r: (r["version"], r["caller"], r["callee"], r["line"]))
        rows.append({"symbol": target, "status": "impacted" if impacts else "unresolved" if unresolved else "unaffected",
                     "impacts": impacts, "unresolved": unresolved})
    result = {"id": basis["id"], "changed_symbols": basis["changed_symbols"], "targets": rows}
    if basis["tests"] is not None:
        needed = {r["symbol"] for r in rows if r["status"] == "impacted"}
        choices = []
        tests = basis["tests"]
        for size in range(len(tests) + 1):
            for subset in itertools.combinations(tests, size):
                covered = {symbol for test in subset for symbol in test["covers"]}
                if needed <= covered:
                    choices.append((sum(test["cost"] for test in subset), sorted(test["id"] for test in subset)))
        cost, selected = min(choices)
        result["selection"] = {"tests": selected, "cost": cost,
                               "unresolved_targets": [r["symbol"] for r in rows if r["unresolved"]]}
    return result


def same(left, right):
    return json.dumps(left, sort_keys=True) == json.dumps(right, sort_keys=True)


def check_value(value, bases, stage):
    if not isinstance(value, dict) or set(value) != {"cases"} or not isinstance(value["cases"], list):
        raise ValueError("result schema")
    if len(value["cases"]) != len(bases):
        raise ValueError("case coverage")
    for actual, basis in zip(value["cases"], bases):
        expected = expected_case(basis)
        if not isinstance(actual, dict) or set(actual) != set(expected):
            raise ValueError("case schema")
        if not same(actual["id"], expected["id"]) or not same(actual["changed_symbols"], expected["changed_symbols"]):
            raise ValueError("changed function identity/coverage")
        if stage == "B" and not same(actual["selection"], expected["selection"]):
            raise ValueError("minimum complete test selection")
        if not isinstance(actual["targets"], list) or len(actual["targets"]) != len(expected["targets"]):
            raise ValueError("target coverage")
        for row, ref in zip(actual["targets"], expected["targets"]):
            if not isinstance(row, dict) or set(row) != set(ref):
                raise ValueError("target schema")
            for field in ["symbol", "status"]:
                if not same(row[field], ref[field]):
                    raise ValueError("target identity/status")
            if not isinstance(row["impacts"], list) or not isinstance(row["unresolved"], list):
                raise ValueError("witness lists")
            if [r.get("symbol") for r in row["impacts"]] != [r["symbol"] for r in ref["impacts"]]:
                raise ValueError("reachable change coverage")
            unresolved_keys = lambda rows: [{k: r.get(k) for k in ["version", "caller", "callee", "line"]} for r in rows]
            if not same(unresolved_keys(row["unresolved"]), unresolved_keys(ref["unresolved"])):
                raise ValueError("unresolved call coverage")
            for kind in ["impacts", "unresolved"]:
                for witness in row[kind]:
                    fields = {"symbol", "version", "path"} if kind == "impacts" else {"version", "caller", "callee", "line", "path"}
                    if set(witness) != fields or witness["version"] not in ["before", "after"]:
                        raise ValueError("witness schema")
                    graph, route = basis["graphs"][witness["version"]], witness["path"]
                    endpoint = witness["symbol"] if kind == "impacts" else witness["caller"]
                    if (not isinstance(route, list) or not route or not all(isinstance(x, str) for x in route)
                            or route[0] != row["symbol"] or route[-1] != endpoint
                            or len(route) != len(set(route)) or any(x not in graph for x in route)
                            or any(b not in graph[a] for a, b in zip(route, route[1:]))):
                        raise ValueError("unsupported source witness")
    return {"status": "PASS", "stage": stage, "cases": len(bases)}


def check(package, consumer, stage, output):
    io.verify_inputs(package, consumer, stage)
    p = Path(output)
    if p.is_symlink() or not p.is_file() or p.stat().st_nlink != 1:
        raise ValueError("unsafe output")
    result = check_value(load(p), load(Path(package) / "ORACLE.json")["stages"][stage], stage)
    result.update(output_sha256=digest(p.read_bytes()), oracle_sha256=digest((Path(package) / "ORACLE.json").read_bytes()),
                  input_sha256=digest((Path(package) / "IMMUTABLE.json").read_bytes()))
    return result


def transfer(a, b, package):
    before = inventory(a)
    transferred = io.transfer(a, b, package)
    expected = {k: v for k, v in before.items() if "__pycache__" not in Path(k).parts and not k.endswith(".pyc")}
    if inventory(Path(b) / "predecessor") != expected or inventory(a) != before:
        raise ValueError("whole predecessor transfer mismatch")
    return {"before": before, "transferred": transferred,
            "excluded": sorted(set(before) - set(expected)), "selection": "none; whole settled directory"}


def replay(package, consumer, output):
    """Original delivered command, new input copy/output, existing bounded owner."""
    consumer, output = Path(consumer).resolve(), Path(output).resolve()
    if output.exists():
        raise ValueError("output already exists")
    io.verify_inputs(package, consumer, "B")
    inventory(consumer)
    recipe = load(consumer / "METHOD.json")
    if (set(recipe) != {"argv", "cwd"} or recipe["cwd"] != "$TASK" or not isinstance(recipe["argv"], list)
            or not recipe["argv"] or not all(isinstance(x, str) for x in recipe["argv"])):
        raise ValueError("invalid delivered method recipe")
    private = Path(tempfile.mkdtemp(prefix="ag-1527-replay-"))
    source = private / "input"
    shutil.copytree(Path(package) / "task-b", source)
    before = inventory(consumer)
    argv = []
    for token in recipe["argv"]:
        for key, replacement in {"$TASK": str(consumer), "$INPUT": str(source), "$OUTPUT": str(output)}.items():
            token = token.replace(key, replacement)
        argv.append(token)
    env = {"PATH": os.environ["PATH"], "HOME": str(private), "TMPDIR": str(private),
           "PYTHONDONTWRITEBYTECODE": "1", "PYTHONHASHSEED": "0", "LANG": "C"}
    try:
        child = subprocess.run(["node", str(HERE.parent / "file-identity-study/replay-child.mjs"), json.dumps(argv), str(consumer)],
                               cwd=consumer, env=env, capture_output=True, timeout=90)
        if child.returncode:
            raise RuntimeError("replay owner error: " + child.stderr.decode("utf-8", "replace"))
        run = json.loads(child.stdout)
    except Exception as error:
        raise RuntimeError("settlement unknown; retain " + str(private)) from error
    result = run["result"]
    settled = (result.get("exit_observed") is True and result.get("streams_closed") is True
               and result.get("cleanup_completed") is True and result.get("remaining_owned_processes") == 0)
    record = {"argv": argv, "owner": run, "settlement": "complete" if settled else "unknown",
              "method_sha256": digest((consumer / "METHOD.json").read_bytes()),
              "unchanged_assets": inventory(consumer) == before,
              "unchanged_separate_inputs": inventory(source) == inventory(Path(package) / "task-b")}
    if settled:
        shutil.rmtree(private)
    record["private_cleanup"] = settled and not private.exists()
    if (run["acceptance"]["status"] == "accepted" and record["private_cleanup"]
            and record["unchanged_assets"] and record["unchanged_separate_inputs"] and not run["truncated"]):
        try:
            record["check"] = check(package, consumer, "B", output / "result.json")
        except Exception as error:
            record["check"] = {"status": "FAIL", "error": str(error)}
    else:
        record["check"] = {"status": "NOT_RUN", "reason": "execution or preservation not accepted"}
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=["build", "check", "transfer", "replay"])
    parser.add_argument("paths", nargs="+")
    args = parser.parse_args()
    operation = {"build": build, "check": check, "transfer": transfer, "replay": replay}[args.operation]
    value = operation(*args.paths)
    print(json.dumps(str(value) if isinstance(value, Path) else value, indent=2))


if __name__ == "__main__":
    main()
