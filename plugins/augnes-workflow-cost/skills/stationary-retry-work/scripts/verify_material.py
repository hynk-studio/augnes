"""Verify the immutable workflow-cost publication without importing its code."""

import hashlib
import json
from pathlib import Path
import stat
import sys


MANIFEST_SHA256 = "bfb25d551682362d4aba8b8c8dc5627ff24709bbf6f2a9402d3ca62fa4928aba"
NAMES = {"manifest.json", "README.md", "index.html", "workflow_cost.py", "exact_linear.py"}


def verify(directory):
    if sys.version_info < (3, 9):
        raise ValueError("Python 3.9+ required")
    root = Path(directory).absolute()
    if root.resolve() != root or not root.is_dir():
        raise ValueError("material directory must be a physical directory")

    def read(name):
        item = root / name
        info = item.lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_size > 96000:
            raise ValueError("regular bounded material file required: " + name)
        return item.read_bytes()

    raw = read("manifest.json")
    if hashlib.sha256(raw).hexdigest() != MANIFEST_SHA256:
        raise ValueError("manifest identity mismatch; obtain the complete pinned release")
    manifest = json.loads(raw)
    if {entry.name for entry in root.iterdir()} != NAMES:
        raise ValueError("incomplete or unexpected material; keep output outside this directory")
    for item in manifest["files"]:
        raw = read(item["name"])
        if len(raw) != item["bytes"] or hashlib.sha256(raw).hexdigest() != item["sha256"]:
            raise ValueError("material integrity mismatch: " + item["name"])
    return {"verified": True, "method": manifest["release"]["method"],
            "version": manifest["release"]["version"], "content_id": manifest["content_id"],
            "manifest_sha256": MANIFEST_SHA256, "files_verified": len(NAMES)}


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("usage: verify_material.py MATERIAL_DIRECTORY")
        print(json.dumps(verify(sys.argv[1])))
    except (OSError, ValueError) as error:
        print("material refused: " + str(error), file=sys.stderr)
        raise SystemExit(2)
