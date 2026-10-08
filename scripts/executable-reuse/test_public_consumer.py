"""Disposable HTTP consumer harness: receives only the public entry URL.

No repository path, Augnes imports, credentials or fallback method files.
Integrity refusal is this harness's policy, not enforcement on arbitrary clients.
"""
import hashlib
import json
import os
from pathlib import Path
from fractions import Fraction as F
from html.parser import HTMLParser
import subprocess
import sys
from urllib.parse import urljoin, urlsplit
from urllib.request import build_opener, HTTPRedirectHandler, ProxyHandler


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("redirect_refused")


class Entry(HTMLParser):
    def __init__(self):
        super().__init__()
        self.identity = []
        self.manifests = []
        self.scripts = 0

    def handle_starttag(self, tag, attributes):
        values = dict(attributes)
        if tag == "meta" and values.get("name") == "workflow-cost-content-id":
            self.identity.append(values.get("content"))
        if tag == "a" and values.get("rel") == "describedby":
            self.manifests.append(values.get("href"))
        if tag in ("script", "form", "iframe"):
            self.scripts += 1


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()


def digest(value):
    return hashlib.sha256(value).hexdigest()


def consume(entry_url):
    assert sys.version_info >= (3, 9), "Python 3.9+ is required; no automatic install"
    parsed = urlsplit(entry_url)
    assert parsed.scheme in ("http", "https") and not parsed.username and not parsed.password
    assert parsed.path.endswith("/index.html") and not parsed.query and not parsed.fragment
    opener = build_opener(ProxyHandler({}), NoRedirect())
    assert all(not (parent / ".git").exists() for parent in (Path.cwd(), *Path.cwd().parents)), "consumer_must_be_outside_any_checkout"
    downloads = Path.cwd() / "download"
    downloads.mkdir()  # The caller provides a fresh non-repository directory.

    def get(name):
        assert name in ("index.html", "manifest.json", "README.md", "workflow_cost.py", "exact_linear.py"), "unsafe_name"
        url = urljoin(entry_url, name)
        with opener.open(url, timeout=5) as response:
            assert response.status == 200 and response.geturl() == url
            assert not response.headers.get("Set-Cookie")
            body = response.read(96_001)
            assert len(body) <= 96_000, "response_too_large"
            return body

    entry_bytes = get("index.html")
    entry = Entry()
    entry.feed(entry_bytes.decode("utf-8"))
    assert entry.scripts == 0 and entry.manifests == ["manifest.json"] and len(entry.identity) == 1
    manifest_bytes = get(entry.manifests[0])
    manifest = json.loads(manifest_bytes)
    assert set(manifest) == {"schema", "release", "content_id", "files", "publication_sha256"}
    assert manifest["schema"] == "augnes.workflow-cost-download.v1"
    release = manifest["release"]
    assert release["method"] == "workflow-cost" and release["version"] == "1.0.0"
    assert release["entrypoint"] == "workflow_cost.py"
    assert "sha256:" + digest(encoded(release)) == manifest["content_id"] == entry.identity[0], "mixed_release"
    unhashed = {k: v for k, v in manifest.items() if k != "publication_sha256"}
    assert digest(encoded(unhashed)) == manifest["publication_sha256"], "manifest_digest_mismatch"
    names = [item["name"] for item in manifest["files"]]
    assert sorted(names) == ["README.md", "exact_linear.py", "index.html", "workflow_cost.py"], "unsafe_or_missing_member"
    assert [item["name"] for item in release["members"]] == ["workflow_cost.py", "exact_linear.py"]
    received = {}
    for item in manifest["files"]:
        assert set(item) == {"name", "bytes", "sha256"}
        assert type(item["bytes"]) is int and 0 < item["bytes"] <= 96_000
        body = entry_bytes if item["name"] == "index.html" else get(item["name"])
        assert len(body) == item["bytes"] and digest(body) == item["sha256"], "member_integrity_refused"
        received[item["name"]] = body
    for member in release["members"]:
        body = received[member["name"]]
        assert len(body) == member["bytes"] and digest(body) == member["sha256"], "release_member_mismatch"
    # No Python execution or local substitute before ALL members validate.
    for name, body in {**received, "manifest.json": manifest_bytes}.items():
        (downloads / name).write_bytes(body)
    print("INTEGRITY_VALID_EXECUTION_START", flush=True)
    executable = downloads / release["entrypoint"]
    dependency = downloads / "exact_linear.py"
    environment = {key: os.environ[key] for key in ("PATH", "HOME", "TMPDIR", "LANG") if key in os.environ}
    environment["PYTHONDONTWRITEBYTECODE"] = "1"

    def run(arguments, verbose=False):
        command = [sys.executable, "-E", "-s", "-B"] + (["-v"] if verbose else []) + [str(executable)] + arguments
        return subprocess.run(command, cwd=downloads, env=environment, text=True, capture_output=True, timeout=5)

    def arguments(inspection, direct="2/5"):
        return ["--attempt", "10", "--verification", "2", "--repair", "4", "--direct-success", direct,
                "--inspection", str(inspection), "--inspected-success", "4/5"]

    results = []
    for inspection, expected_comparison in ((1, "inspection_reduces_work"), (20, "inspection_adds_work")):
        child = run(arguments(inspection), verbose=inspection == 1)
        assert child.returncode == 0
        if inspection == 1:
            assert str(dependency) in child.stderr, "actual_CLI_dependency_import_path_unobserved"
        result = json.loads(child.stdout)
        # Independent renewal counting; neither matrix nor retained solve is used.
        direct = (F(10) + 2 + (1 - F(2, 5)) * 4) / F(2, 5)
        inspected = (F(10) + 2 + inspection + (1 - F(4, 5)) * 4) / F(4, 5)
        assert F(result["workflows"]["direct"]["expected_work"]) == direct
        assert F(result["workflows"]["inspected"]["expected_work"]) == inspected
        assert F(result["inspection_minus_direct"]) == inspected - direct
        assert result["comparison"] == expected_comparison
        results.append({"inspection": inspection, "direct": str(direct), "inspected": str(inspected),
                        "delta": str(inspected - direct), "comparison": result["comparison"]})
    child = run(arguments(1, "0"))
    assert child.returncode == 0
    result = json.loads(child.stdout)
    assert result["workflows"]["direct"] == {"status": "non_completing", "expected_work": None}
    assert result["comparison"] == "not_comparable" and result["inspection_minus_direct"] is None
    invalid = []
    for extra in (["--repair", "-1"], ["--direct-success", "2"], ["--direct-success", "0.5"]):
        child = run(arguments(1) + extra)
        assert child.returncode == 2 and not child.stdout and "error:" in child.stderr
        invalid.append({"arguments": extra, "exit": child.returncode})
    observed = subprocess.run([sys.executable, "-E", "-s", "-B", "-c",
        "import json, pathlib, workflow_cost, exact_linear; "
        "print(json.dumps({'callable':str(pathlib.Path(workflow_cost.__file__).resolve()),"
        "'dependency':str(pathlib.Path(exact_linear.__file__).resolve()),"
        "'same_solver':workflow_cost.solve_exact is exact_linear.solve_exact}))"],
        cwd=downloads, env=environment, text=True, capture_output=True, timeout=5)
    assert observed.returncode == 0
    imports = json.loads(observed.stdout)
    assert imports == {"callable": str(executable.resolve()), "dependency": str(dependency.resolve()), "same_solver": True}
    assert not list(downloads.glob("__pycache__"))
    return {"python": sys.version.split()[0], "entry_url": entry_url, "download_directory": str(downloads.resolve()),
            "executed_cli": str(executable.resolve()), "imports": imports, "actual_cli_dependency_path_observed": True,
            "content_id": manifest["content_id"], "files_verified": len(received), "renewal_cases": results,
            "non_completing": "not_comparable", "invalid_inputs": invalid, "repository_fallbacks": 0,
            "non_repository_directory": True}


if __name__ == "__main__":
    try:
        print(json.dumps(consume(sys.argv[1])))
    except Exception as error:
        print(json.dumps({"consumer_refused": type(error).__name__, "reason": str(error)}))
        raise SystemExit(2)
