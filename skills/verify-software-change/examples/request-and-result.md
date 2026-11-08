# A calculator that works as a directory but not as one temporary script

This is an actual, developer-supplied delivery investigation observed on
2026-11-09 KST, using Linux x86_64 and Python 3.12.14. It is a local simulation of
individual-script delivery, not an Agensi run, independent customer request,
software upgrade, or comparison against using ordinary tools without this Skill.

## Request

“Can this existing retry-work calculator run if a host delivers each script as
one unchanged temporary file without sibling package files? Compare that with
its existing directory use and leave a result another developer can reproduce.”

## Basis

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

## Procedure and observed result

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

## Handoff

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
