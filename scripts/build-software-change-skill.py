"""Build the four-file Software Change Check ZIP; never publish or overwrite."""

import argparse
import hashlib
import io
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "skills/verify-software-change"
MEMBERS = (
    "SKILL.md",
    "examples/request-and-result.md",
    "references/handoff.md",
    "scripts/snapshot_inputs.py",
)
VERSION = "0.1.0"


def package(skill=SKILL):
    """Return deterministic ZIP bytes and member identities from the allowlist."""
    payload = {}
    for name in MEMBERS:
        item = skill
        if item.is_symlink():
            raise ValueError("Skill directory must not be a symlink")
        for part in name.split("/"):
            item = item / part
            if item.is_symlink():
                raise ValueError("package members must not be symlinks: " + name)
        if not item.is_file():
            raise ValueError("missing regular package member: " + name)
        raw = item.read_bytes()
        raw.decode("utf-8")
        payload[name] = raw
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_STORED) as archive:
        for name, raw in payload.items():
            member = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            member.create_system = 3
            member.external_attr = 0o100644 << 16
            archive.writestr(member, raw)
    data = stream.getvalue()
    return data, {
        "skill": "verify-software-change", "version": VERSION,
        "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
        "files": [{"name": name, "bytes": len(raw),
                   "sha256": hashlib.sha256(raw).hexdigest()}
                  for name, raw in payload.items()],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path,
                        help="new ZIP path; omit to check and print its identity")
    args = parser.parse_args()
    try:
        data, identity = package()
        if args.output is not None:
            # Build fully before acquiring a destination. Exclusive creation
            # preserves any previous release or user file, including symlinks.
            with args.output.open("xb") as output:
                output.write(data)
        print(json.dumps(identity, sort_keys=True))
    except (OSError, ValueError) as error:
        parser.exit(2, "Skill package refused: " + str(error) + "\n")


if __name__ == "__main__":
    main()
