"""DEVELOPER-AUTHORED lossless control, evaluator only, never consumer material."""
import hashlib
import json
from pathlib import Path
import sys


def scan(root):
    return {p.relative_to(root).as_posix(): {"bytes": p.stat().st_size,
            "sha256": hashlib.sha256(p.read_bytes()).hexdigest()}
            for p in root.rglob("*") if p.is_file()}


def main(source, output):
    source, output = Path(source), Path(output)
    output.mkdir(parents=True, exist_ok=False)
    pairs = json.loads((source / "input.json").read_text())["pairs"]
    rows = []
    for pair in pairs:
        before, after = scan(source / pair["before"]), scan(source / pair["after"])
        changes = []
        for p in sorted(before.keys() | after.keys()):
            b, a = before.get(p), after.get(p)
            status = "added" if b is None else "removed" if a is None else "retained" if b == a else "changed"
            changes.append({"path": p, "status": status, "before": b, "after": a})
        rows.append({"id": pair["id"], "changes": changes})
    (output / "reconciliation.json").write_text(json.dumps({"pairs": rows}, indent=2) + "\n")


if __name__ == "__main__":
    main(*sys.argv[1:])
