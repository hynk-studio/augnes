"""Offline #1526 request binding. No model client, allocation or credentials.

The exposed collaboration.spawn_agent schema was observed on 2026-10-23.
This case's prospective profile requires all five fields explicitly and fresh
context. A PASS proves only this local schema/profile, never route readiness.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import stat


FIELDS = ("task_name", "message", "fork_turns", "model", "reasoning_effort")
EFFORTS = ["low", "medium", "high", "xhigh", "max", "ultra"]
HOST_SCHEMA = {
    "tool": "collaboration.spawn_agent",
    "observed_date": "2026-10-23",
    "required": ["task_name", "message"],
    "properties": {name: "string" for name in FIELDS},
    "task_name_pattern": "^[a-z0-9_]+$",
    "fork_turns": ["all", "none"],
    "fork_turns_default": "all",
    "model_efforts": {"gpt-6.1-sol": EFFORTS, "gpt-6-astra": EFFORTS,
                      "gpt-6-sol": EFFORTS, "gpt-6-luna": EFFORTS[:-1],
                      "gpt-5.6-sol": EFFORTS},
    "overrides_require_fork_none": True,
    "case_profile": "Explicit five fields, fork_turns=none; unknown fields refused.",
    "backend_version_provider_readiness": "UNKNOWN",
}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def serialize(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def parse(data):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("duplicate request field")
            result[key] = value
        return result
    return json.loads(data.decode("utf-8"), object_pairs_hook=pairs)


def validate(request, prompt):
    if not isinstance(request, dict) or set(request) != set(FIELDS):
        raise ValueError("complete prospective request requires exactly the five exposed fields")
    if any(type(request[key]) is not str for key in FIELDS):
        raise ValueError("request fields must be strings")
    if not re.fullmatch(r"[a-z0-9_]+", request["task_name"]):
        raise ValueError("task_name must use lowercase letters, digits, and underscores")
    if request["fork_turns"] != "none":
        raise ValueError("this prospective fresh-context profile requires fork_turns=none")
    efforts = HOST_SCHEMA["model_efforts"].get(request["model"])
    if efforts is None or request["reasoning_effort"] not in efforts:
        raise ValueError("unsupported exposed model/reasoning combination")
    if not prompt or request["message"].encode("utf-8") != prompt:
        raise ValueError("exact prompt bytes do not match request.message")
    return request


def regular_bytes(path):
    path = Path(path).absolute()
    info = path.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or path.resolve() != path:
        raise ValueError("request artifact must be regular and unaliased")
    return path.read_bytes()


def freeze(request, prompt, destination):
    validate(request, prompt)  # before creating artifacts or any reservation
    destination = Path(destination)
    destination.mkdir()  # never replace an existing freeze
    payload = serialize(request)
    manifest = {
        "format": "file-identity-prospective-request.v1",
        "allocation": "NONE; offline fixture, not dispatch authority",
        "tool": HOST_SCHEMA["tool"],
        "schema": HOST_SCHEMA,
        "schema_sha256": digest(serialize(HOST_SCHEMA)),
        "validator_sha256": digest(Path(__file__).read_bytes()),
        "prompt_bytes": len(prompt), "prompt_sha256": digest(prompt),
        "request_bytes": len(payload), "request_sha256": digest(payload),
        "request_identity": "sha256:" + digest(payload),
    }
    frozen = serialize(manifest)
    (destination / "PROMPT.txt").write_bytes(prompt)
    (destination / "REQUEST.json").write_bytes(payload)
    (destination / "REQUEST-FREEZE.json").write_bytes(frozen)
    return digest(frozen)


def verified_request(bundle, expected_freeze_sha256):
    bundle = Path(bundle)
    frozen = regular_bytes(bundle / "REQUEST-FREEZE.json")
    if digest(frozen) != expected_freeze_sha256:
        raise ValueError("prospective freeze digest mismatch")
    manifest = parse(frozen)
    prompt, payload = regular_bytes(bundle / "PROMPT.txt"), regular_bytes(bundle / "REQUEST.json")
    if (manifest["schema"] != HOST_SCHEMA or manifest["schema_sha256"] != digest(serialize(HOST_SCHEMA))
            or manifest["validator_sha256"] != digest(Path(__file__).read_bytes())):
        raise ValueError("prospective schema or validator changed")
    if (len(prompt) != manifest["prompt_bytes"] or digest(prompt) != manifest["prompt_sha256"]
            or len(payload) != manifest["request_bytes"] or digest(payload) != manifest["request_sha256"]
            or manifest["request_identity"] != "sha256:" + digest(payload)):
        raise ValueError("prompt or complete request payload changed after hashing")
    request = validate(parse(payload), prompt)
    if serialize(request) != payload:
        raise ValueError("noncanonical request serialization")
    return request, manifest


def validated_handoff(bundle, expected_freeze_sha256, reserve, dispatch):
    """Thin future integration seam; callers supply authority and accounting.

    Tests use inert callbacks only. No model route is imported or called here.
    Reservation receives identities, not a mutable request. Dispatch receives
    the very object decoded/validated before reservation, without field rebuild.
    A post-reservation change stops dispatch; callers must retain that reservation.
    """
    request, manifest = verified_request(bundle, expected_freeze_sha256)
    reservation = reserve({key: manifest[key] for key in ("request_identity", "request_sha256", "prompt_sha256")})
    verified_request(bundle, expected_freeze_sha256)
    return dispatch(request, reservation)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="operation", required=True)
    create = commands.add_parser("freeze")
    create.add_argument("request")
    create.add_argument("prompt")
    create.add_argument("destination")
    check = commands.add_parser("verify")
    check.add_argument("bundle")
    check.add_argument("expected_freeze_sha256")
    args = parser.parse_args()
    if args.operation == "freeze":
        print(freeze(parse(regular_bytes(args.request)), regular_bytes(args.prompt), args.destination))
    else:
        _, manifest = verified_request(args.bundle, args.expected_freeze_sha256)
        print(json.dumps({"status": "PASS_OFFLINE_ONLY", "request_identity": manifest["request_identity"],
                          "route_readiness": "UNKNOWN", "dispatches": 0}))


if __name__ == "__main__":
    main()
