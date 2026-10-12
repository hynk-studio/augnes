# Material and execution

The sibling `assets/workflow-cost-v1/` directory contains the unchanged public
workflow-cost **1.0.0** release: `manifest.json`, `README.md`, `index.html`,
`workflow_cost.py` and its required `exact_linear.py`. Its content identity is
`sha256:88706b91f4889b4e62a1a42b217be9c79ad61292bb31197f0677c7a21507b8d2`.
Plugin 0.1.0 is a separate entry/package version, not a new calculator release.

From this skill's directory, use Python 3.9+ and the standard library:

```sh
python3 -E -s -S -B scripts/verify_material.py assets/workflow-cost-v1
```

The checker pins the original manifest bytes, then checks every declared byte
count and SHA-256. Stop on a nonzero exit. It does not authenticate a publisher,
grant execution permission, run the calculator or sandbox later execution.
The whole downloaded/installed skill must come from a trusted source. Do not
edit the release, bless changed hashes or silently substitute another version.

Copy the five verified files into a new task directory and verify that copy
with the same checker before using it. No Augnes repository, npm installation,
account, project, private upload, Companion, MCP connection or network read is
needed to compute with the delivered files. The flags ignore Python environment
overrides and user/system site packages and suppress bytecode. They are not a
security boundary; only run code within the host's existing permissions.

## Choose the applicable interface

For optional inspection before **every** attempt, including retries, supply all
six inputs from the task. From the verified material directory:

```sh
python3 -E -s -S -B workflow_cost.py --attempt 10 --verification 2 --repair 4 --direct-success 2/5 --inspection 1 --inspected-success 4/5
```

Those numbers are a constructed example only. Costs share one additive unit;
use integers or rational fractions, not floats. Mandatory verification remains
part of each attempt. For success probability `p > 0`, a strong direct baseline
is `(attempt + verification + inspection + (1-p)*repair)/p`, with inspection
zero in the direct arm. An inspection used only once, changed attempt costs,
learning rates or history-dependent behavior does not fit this CLI.

For a justified finite stationary process, use the existing callable:

```sh
python3 -E -s -S -B -c 'from fractions import Fraction as F; from workflow_cost import expected_work; print(expected_work([[F(1, 2)]], [3]))'
```

It takes an exact rational substochastic matrix `Q` and nonnegative cost per
state visit, for **1–8 transient states**. Missing row mass completes the work
with zero remaining cost. Every supplied state must reach completion. Document
what each state, edge and cost represents; keeping a finite sufficient state
does not allow rates or costs to change on later visits to that state. A caller
may construct its task's matrix; do not copy or replace the solver. Larger or
unbounded models, parallel scheduling and deadline probabilities need a suitable
ordinary alternative. Missing verification cost cannot silently become zero.

The CLI returns exact rational JSON values. Zero success is `non_completing` /
`not_comparable`, not a completed workflow; invalid input exits 2. The callable
raises `ValueError` (including `NonCompletingWorkflow`) for unsupported input.
Read the bundled README for numerical bounds and full scope.

## Leave useful ordinary references

Keep the requested result, the manifest and any task-specific calculation with
the output. In ordinary prose record:

- The task, used public source, method 1.0.0 and content identity above; distinguish
  plugin packaging version and the actual retrieved commit when known.
- Inputs/units and whether each is observed, stipulated or derived; original
  exact output and what was known when the judgment was made.
- Applicability, missing information and what change would require reconsidering
  the judgment. Do not infer present suitability from a hash or read time.
- The new action the calculation supports, including non-use if appropriate.

The [public release directory](https://github.com/hynk-studio/augnes/tree/main/publications/workflow-cost-v1)
and its [file history](https://github.com/hynk-studio/augnes/commits/main/publications/workflow-cost-v1)
are ordinary source/review routes. [Issue #1375](https://github.com/hynk-studio/augnes/issues/1375)
and [entry issue #1447](https://github.com/hynk-studio/augnes/issues/1447) provide
public discussion where accessible. They are not a correction notification
service or a guarantee that every correction is recorded. Preserve a failed or
unavailable recheck as uncertainty. A later task can use sufficient inherited
material without a redundant network read; it never inherits execution authority.

The pinned release's development-only qualification paragraph records its
original scope. Later [#1422/#1423 anonymous delivery acceptance](https://github.com/hynk-studio/augnes/issues/1209#issuecomment-6059444075)
does not establish this plugin's publication, activation or usefulness.
