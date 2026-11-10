"""Fingerprint explicitly selected inputs; no subject execution or dependencies."""

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import sys

SCHEMA = "software-change-inputs.v1"
MAX_FILES = 128
MAX_FILE_BYTES = 8 * 1024 * 1024
MAX_TOTAL_BYTES = 32 * 1024 * 1024
MAX_SNAPSHOT_BYTES = 128 * 1024


def names_checked(names):
    if not 1 <= len(names) <= MAX_FILES or len(set(names)) != len(names):
        raise ValueError("select 1-128 distinct relative files")
    for name in names:
        if not isinstance(name, str) or len(name) > 1024:
            raise ValueError("invalid relative file name")
        parts = name.split("/")
        if (PurePosixPath(name).is_absolute() or "\\" in name or ":" in name
                or any(p in ("", ".", "..") for p in parts)
                or any(ord(c) < 32 for c in name)):
            raise ValueError("use normalized relative file names")
    return sorted(names)


def signature(info):
    return (info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns,
            info.st_ctime_ns, info.st_mode)


def bounded_bytes(path, limit):
    before = path.lstat()
    if not stat.S_ISREG(before.st_mode) or before.st_size > limit:
        raise ValueError("bounded regular file required")
    with path.open("rb") as stream:
        import os
        if signature(os.fstat(stream.fileno())) != signature(before):
            raise ValueError("file changed before read")
        raw = stream.read(limit + 1)
        if len(raw) > limit or signature(os.fstat(stream.fileno())) != signature(before):
            raise ValueError("file changed during read or exceeds limit")
    if signature(path.lstat()) != signature(before):
        raise ValueError("file changed after read")
    return raw


def snapshot(root, names):
    base = Path(root).resolve(strict=True)
    if not base.is_dir():
        raise ValueError("subject must be a directory")
    files, total = {}, 0
    for name in names_checked(names):
        item = base
        for part in name.split("/"):
            item = item / part
            if item.is_symlink():
                raise ValueError("selected paths must not contain symlinks")
        raw = bounded_bytes(item, MAX_FILE_BYTES)
        total += len(raw)
        if total > MAX_TOTAL_BYTES:
            raise ValueError("selected inputs exceed total byte limit")
        files[name] = {"bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}
    return {"schema": SCHEMA, "scope": "selected-files-only", "files": files}


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON key")
        result[key] = value
    return result


def read_snapshot(path):
    value = json.loads(bounded_bytes(Path(path), MAX_SNAPSHOT_BYTES),
                       object_pairs_hook=unique_object)
    if (not isinstance(value, dict) or set(value) != {"schema", "scope", "files"}
            or value["schema"] != SCHEMA or value["scope"] != "selected-files-only"
            or not isinstance(value["files"], dict)):
        raise ValueError("unsupported input snapshot")
    names_checked(list(value["files"]))
    total = 0
    for item in value["files"].values():
        if (not isinstance(item, dict) or set(item) != {"bytes", "sha256"}
                or type(item["bytes"]) is not int or not 0 <= item["bytes"] <= MAX_FILE_BYTES
                or not isinstance(item["sha256"], str)
                or re.fullmatch(r"[0-9a-f]{64}", item["sha256"]) is None):
            raise ValueError("invalid file fingerprint")
        total += item["bytes"]
    if total > MAX_TOTAL_BYTES:
        raise ValueError("snapshot exceeds total byte limit")
    return value["files"]


def compare(before, after):
    a, b = read_snapshot(before), read_snapshot(after)
    changed = sorted(name for name in a.keys() & b.keys() if a[name] != b[name])
    added, removed = sorted(b.keys() - a.keys()), sorted(a.keys() - b.keys())
    return {"equal": not (changed or added or removed), "scope": "selected-files-only",
            "changed": changed, "added": added, "removed": removed}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_subparsers(dest="mode", required=True)
    capture = modes.add_parser("snapshot")
    capture.add_argument("root")
    capture.add_argument("files", nargs="+")
    diff = modes.add_parser("compare")
    diff.add_argument("before")
    diff.add_argument("after")
    args = parser.parse_args()
    try:
        result = (snapshot(args.root, args.files) if args.mode == "snapshot"
                  else compare(args.before, args.after))
    except (OSError, ValueError, TypeError, RecursionError) as error:
        print("input snapshot refused: " + str(error), file=sys.stderr)
        return 2
    print(json.dumps(result, sort_keys=True))
    return 1 if args.mode == "compare" and not result["equal"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
