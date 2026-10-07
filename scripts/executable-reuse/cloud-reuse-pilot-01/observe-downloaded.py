"""Observe the actual downloaded entry point/import in its calculation process."""
import hashlib
import json
from pathlib import Path
import runpy
import sys

entry = Path(sys.argv[1]).resolve()
destination = Path(sys.argv[2]).resolve()
sys.argv = [str(entry), *sys.argv[3:]]
sys.path.insert(0, str(entry.parent))
observed = {"argv": list(sys.argv), "cwd": str(Path.cwd()), "executable": sys.executable}

def identity(filename):
    location = Path(filename).resolve()
    data = location.read_bytes()
    return {"path": str(location), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}

def profile(frame, event, arg):
    if event == "call" and frame.f_code.co_name == "<module>" and Path(frame.f_code.co_filename).resolve() == entry:
        observed["entry"] = identity(frame.f_code.co_filename)
        sys.setprofile(None)

sys.setprofile(profile)
try:
    runpy.run_path(str(entry), run_name="__main__")
finally:
    sys.setprofile(None)
    module = sys.modules.get("exact_linear")
    observed["exact_linear"] = identity(module.__file__) if module else None
    destination.write_text(json.dumps(observed, indent=2) + "\n", encoding="utf-8")
