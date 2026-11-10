# Software change investigations

## Installation says complete, but updates the wrong profile

### Request

“The installer says it completed. Verify that candidate 0.2 was installed into
the requested `selected_profile` and that the other profile was left unchanged.
Do not repair the installer while checking it; leave a reproducible result.”

### Supplied material and reproduction

This is a deliberately faulty, developer-authored local fixture, not a customer
incident or a defect in an Augnes installer. Its behavior was observed on
2026-11-09 KST with Linux x86_64 and Python 3.12.14. No account, network,
third-party package or Augnes installation is needed. This replay does not
measure whether a Skill outperforms an agent's ordinary tools.

In a new disposable directory, save and run the following as `make_fixture.py`.
It creates `subject/` and refuses an already existing subject directory. Both
profiles start at 0.1; the candidate reports 0.2.

```python
from pathlib import Path

root = Path("subject")
root.mkdir()
for name, version in (("candidate", "0.2"),
                      ("selected_profile", "0.1"), ("default_profile", "0.1")):
    folder = root / name
    folder.mkdir()
    (folder / "status.py").write_text(
        'import json\nprint(json.dumps({"version": "' + version
        + '", "ready": True}))\n', encoding="utf-8")
(root / "install.py").write_text('''import argparse
from pathlib import Path
import shutil
parser = argparse.ArgumentParser()
parser.add_argument("--profile", required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parent
shutil.copyfile(root / "candidate/status.py", root / "default_profile/status.py")
print("Install complete")
''', encoding="utf-8")
```

Use the received snapshot helper unchanged as `received.py` in the disposable
directory, outside `subject/`. Individual-file hosts fetch that file through
their loader; directory users copy the exact helper bytes. From this directory:

```sh
python3 -E -s -S -B make_fixture.py
python3 -E -s -S -B received.py snapshot subject install.py candidate/status.py selected_profile/status.py default_profile/status.py > before.json
python3 -E -s -S -B subject/selected_profile/status.py
python3 -E -s -S -B subject/default_profile/status.py
python3 -E -s -S -B subject/candidate/status.py
python3 -E -s -S -B subject/install.py --profile subject/selected_profile
python3 -E -s -S -B subject/selected_profile/status.py
python3 -E -s -S -B subject/default_profile/status.py
python3 -E -s -S -B received.py snapshot subject install.py candidate/status.py selected_profile/status.py default_profile/status.py > after.json
python3 -E -s -S -B received.py compare before.json after.json
```

### Observed result and handoff

| Check | Exit | Original stdout | Assessment |
| --- | ---: | --- | --- |
| Selected profile before | 0 | `{"version": "0.1", "ready": true}` | Baseline |
| Other profile before | 0 | `{"version": "0.1", "ready": true}` | Baseline |
| Candidate directly | 0 | `{"version": "0.2", "ready": true}` | PASS |
| Installer | 0 | `Install complete` | Completion only |
| Requested profile after | 0 | `{"version": "0.1", "ready": true}` | FAIL: expected 0.2 |
| Other profile after | 0 | `{"version": "0.2", "ready": true}` | FAIL: expected unchanged |

Stderr was empty for every command. Both snapshot captures exited 0. Their
comparison exited **1**, the helper's documented difference status, and returned:

```json
{"added": [], "changed": ["default_profile/status.py"], "equal": false, "removed": [], "scope": "selected-files-only"}
```

**Result: FAIL.** The installer parses `--profile` but copies into the hardcoded
default profile. The requested profile remains at 0.1 despite exit 0 and the
completion message. The installer and candidate bytes were unchanged across the
check. Executing the installed status scripts establishes the version behavior;
the snapshots identify which selected file changed. Hashes alone would not
establish successful installation.

**Next action:** the installer owner should honor the requested destination,
then repeat these checks in a fresh fixture. Do not treat the candidate's direct
execution as proof that the selected profile was upgraded. Live Agensi loading,
real installed-product integration and other runtimes remain **NOT_RUN**.

**Cleanup:** after retaining any permitted evidence outside it, remove only the
task-owned disposable directory, including `received.py`. The development replay
removed its temporary directory; it changed no actual installed profile. The
repository's existing test command replays this published fixture and checks
both status results and the ZIP-delivered helper's snapshot comparison:
`python3 -E -s -S -B scripts/test-software-change-inputs.py`.

## A calculator that works as a directory but not as one temporary script

This is an actual, developer-supplied delivery investigation observed on
2026-11-09 KST, using Linux x86_64 and Python 3.12.14. It is a local simulation of
individual-script delivery, not an Agensi run, independent customer request,
software upgrade, or comparison against using ordinary tools without this Skill.

### Request

“Can this existing retry-work calculator run if a host delivers each script as
one unchanged temporary file without sibling package files? Compare that with
its existing directory use and leave a result another developer can reproduce.”

### Basis

The subject was the unchanged workflow-cost method 1.0.0 from Augnes source
`52ebce394b1c9381b57cd2bbf0e4eb40c474b57e`, under
`publications/workflow-cost-v1/`. Both Python files matched their public manifest:

| File | SHA-256 |
| --- | --- |
| `workflow_cost.py` | `7a0fabc8a0672f97d4c5a81b5eef9e61f5c7fca6447d50ae1bf09bc2be149c11` |
| `exact_linear.py` | `7cdd11476badfed7b206a84ed5195209e38465dd74cc5e265a7d9ced203a804a` |

The subject is separate from this Skill. These calculator files are not included
in the Skill ZIP. The original public material is available through the
[workflow-cost release](https://github.com/hynk-studio/augnes/releases/tag/augnes-workflow-cost-v0.1.0).
Reading that source is not necessary for unrelated verification tasks.

### Procedure and observed result

1. Copy both exact Python files to a new disposable directory outside the
   checkout. Run from that directory with no installed third-party dependencies:

```sh
python3 -E -s -S -B workflow_cost.py --attempt 7 --verification 2 --repair 3 --direct-success 1/2 --inspection 2 --inspected-success 3/4
```

Exit **0**, empty stderr, JSON output:

```json
{
  "inputs": {"attempt":"7","verification":"2","repair":"3","direct_success":"1/2","inspection":"2","inspected_success":"3/4"},
  "evidence": "constructed development calculation; probabilities and costs are stipulated",
  "workflows": {
    "direct": {"status":"finite","expected_work":"21"},
    "inspected": {"status":"finite","expected_work":"47/3"}
  },
  "inspection_minus_direct": "-16/3",
  "comparison": "inspection_reduces_work"
}
```

Whitespace is compacted here; values are unchanged. A separate renewal check
gives `(7 + 2 + (1 - 1/2) * 3) / (1/2) = 21` and
`(2 + 7 + 2 + (1 - 3/4) * 3) / (3/4) = 47/3`.

2. In a different empty temporary directory, copy only the exact
   `workflow_cost.py` bytes to `received.py`. Run there with the same flags and
   inputs, substituting `received.py` for `workflow_cost.py`.

Exit **1**, empty stdout. The stderr tail was:

```text
    from exact_linear import exact_system, exact_value, solve_exact
ModuleNotFoundError: No module named 'exact_linear'
```

No dependency was fetched from the checkout, installed cache or another folder,
and the received implementation was not rewritten to force a successful result.
Python's isolation flags are import controls, not a security sandbox.

### Handoff

- **PASS, bounded directory calculation:** the complete two-file method ran on
  the stated environment and inputs, matching the independent calculation.
- **FAIL, individual-script compatibility:** the original script needs its
  sibling module. An upload accepting the ZIP would not remove that dependency.
- **NOT_RUN:** live Agensi loading, other runtimes, installed-host integration,
  and any skill-versus-ordinary-tools usefulness comparison.
- **Next action:** retain the working directory distribution. Choose a different
  standalone asset for this delivery mode; reconsider only if the host contract
  or package changes. No change to the published calculator is required.
- **Cleanup:** both task-owned temporary directories were removed. No account,
  project state, installed profile, service or published release was changed.
