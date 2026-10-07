# cloud-reuse-pilot-01: Phase A producer record

Refs #1412. **Producer BLOCKED; Phase B NOT RUN.** This is a bounded Cloud
development attempt, not whole-pilot completion or integration approval.

## Observed outcome and stopping

Both fixture attempts used the existing `startLocal` Worker/D1 owner, normal
empty-fixture migrations/mapping and synthetic local login. No work/history was
inserted with SQL. No work save was reached, so work/revision/file/export
identities are unavailable. There is no v0.3 export or export manifest; revision-1
preservation and revision-2 readback were not observed. Standalone stdout below
is calculation evidence, not a substitute for the missing product handoff.

| Attempt | Observation | Duration | Cleanup |
| --- | --- | --- | --- |
| Initial | Chromium never opened its debug listener; bounded diagnosis found misconfigured SUID sandbox helper | 16,627 ms | Child exit 1; Worker/browser closed; disposable root removed |
| One permitted retry | With Linux `--no-sandbox`, Chromium launched, but the post-login readiness expression called application-defined `$` before the application document was available | 2,423 ms | Child exit 1; Worker/browser closed; disposable root removed |

The separate bounded `about:blank` diagnosis aborted with SIGABRT in 87 ms;
its owned root/processes were removed. A pure VM control of the unguarded
expression returned `ReferenceError`. Both original failure/cleanup records
remain in `attempts/`; the diagnostic summaries contain no raw browser logs.
The retry helper SHA-256 is in `attempts/helper-diagnosis.json`.

The retained helper now uses guarded `document.getElementById` readiness checks
(including producer readback). That correction has static checks only: **no
third producer invocation was run**. Linux browser sandbox isolation is not
claimed; any later authorized synthetic run retains loopback interception and
the existing authentication gates. This does not change the installed browser.

Smallest next step: review the blocker and separately authorize one fresh Phase A
producer execution with this helper correction. No consumer should be launched
until an actual producer export has been reviewed.

## Actual standalone calculation

After the fixture retry exhausted the budget, the still-authorized single
stipulated example ran directly from the pinned checked-in Python source:

```sh
python3 -E -s -B scripts/executable-reuse/workflow_cost.py --help
python3 -E -s -B scripts/executable-reuse/workflow_cost.py --attempt 9 --verification 3 --repair 4 --direct-success 2/5 --inspection 1 --inspected-success 2/3
python3 -E -s -B scripts/executable-reuse/cloud-reuse-pilot-01/oracle.py scripts/executable-reuse/cloud-reuse-pilot-01/calculation/producer-stdout.json
```

Help, calculation and oracle exited 0 in 40, 32 and 23 ms respectively, with
empty stderr, closed streams, completed cleanup and zero remaining owned
processes. `calculation/producer-stdout.json` is exact actual stdout: 523 bytes,
SHA-256 `37869ecc10f665461d7e3f1e53085329b0454bb8c2acda554ed64cae399a37cb`.
`calculation/execution.json` retains invocation, inputs, source identities,
exit/lifecycle observations and the independent oracle result.

Direct expected work was `36`; inspected work `43/2`; inspection-minus-direct
`-29/2`; CLI comparison `inspection_reduces_work`. `oracle.py` imports only
`json`, `sys` and `fractions`, and evaluates
`(attempt + verification + inspection + (1-p)*repair)/p`, with direct inspection
zero. It reads actual stdout and checks fractions/status/comparison without
importing or calling the retained solver. It does not replace observed stdout
with expected answers.

Inputs are stipulated; mandatory verification remains mandatory. This is one
exposed stationary finite-state calculation, not empirical/causal probability
improvement, downstream reuse, or measured general usefulness. History-dependent
probabilities, infinite-state and larger numerical problems remain out of scope;
non-completing workflows have no finite completion answer. `workflow_cost.py`
requires the exact `exact_linear.py` beside it and Python >=3.9 standard library.
The private historical #1366 package/exports were not fetched or published.

## Source, checks and authority

Application/source baseline `b73e5012c699f85a9e3b643b6cba82f8f195d3ce`, tree
`5443ce03a9d193c03274379938fa1b391512ad25`. Remote main matched that baseline
when observed through Git and the connected GitHub branch read. The application,
solver, Core/protocol, auth, storage limits and verification policy are unchanged.
All proposed changes are inside this experiment directory. #1411 was not used.
`provenance.json` records the actual root/origin/branch, prepared Cloud identity,
tool versions, access failures and measured/unmeasured setup facts. Immutable
retention commit/final head/tree and the actual exact-head planner output belong
to the Draft PR report, avoiding a self-referential commit hash here.

Focused checks: Node syntax for both helpers; Python AST syntax and oracle import
review; guarded-readiness VM check; exact stdout hash/JSON and source-byte checks;
review of all retained files for credentials/private material; exact diff and
`git diff --check`. No database copies, cookies, headers, tokens, private data,
full conversations, unrelated logs or hidden reasoning are retained. The records
are synthetic fixture observations and the checked-in-source calculation only.

The real repository planner is run for the final committed head. Any selected
Mac deciding execution is **NOT RUN / integration pending**: this Linux Cloud
host and Node 24.19.0 cannot provide the required macOS arm64 / Node 24.18.0
Local Canonical evidence. Full bootstrap/Canonical/browser suites are not
repeated. No receipt or integration PASS is claimed. All disposable fixture and
calculation roots were removed; prepared dependencies and unrelated resources
were preserved. No live resources, deployment, environment publication, model
API calls, new keys, merge, Ready, auto-merge, issue closure or Phase B occurred.

## Retained reproduction helper

For a **separately authorized** fresh producer attempt, with prepared dependencies
and loopback socket permission, use a new output directory (existing output
refuses rather than overwriting an attempt):

```sh
node scripts/executable-reuse/cloud-reuse-pilot-01/run-producer.mjs work/cloud-reuse-pilot-01-fresh
```

The parent reuses repository bounded child/resource cleanup owners (120 seconds;
Python children 10 seconds). The child pins application/source bytes, keeps
reconstruction disabled, uses normal editor selection/save and original-request
outcome resolution, validates readback/export without reconstruction, and copies
the actual browser export bytes without reserialization. These are intended
future steps in the retained helper; they did not complete in this task.
