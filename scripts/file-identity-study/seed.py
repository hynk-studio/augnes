"""Prior inventory helper: flat LF records from the restricted original producer.

Original domain: regular files, relative printable ASCII/HT paths without CR/LF; paths.list is
the producer's sorted path list, one LF after each path. No symlinks. This helper
was useful for those exports. It makes no claim about other producers/domains.
"""
import hashlib
import json
import pathlib
import sys


def inventory(root, listing):
    root = pathlib.Path(root)
    raw = pathlib.Path(listing).read_text(encoding="ascii")
    if raw and not raw.endswith("\n"):
        raise ValueError("incomplete producer record")
    paths = raw.split("\n")[:-1]
    rows = []
    for name in paths:
        data = (root / name).read_bytes()
        rows.append({"path": name, "bytes": len(data),
                     "sha256": hashlib.sha256(data).hexdigest()})
    return rows


if __name__ == "__main__":
    print(json.dumps(inventory(sys.argv[1], sys.argv[2]), indent=2))
