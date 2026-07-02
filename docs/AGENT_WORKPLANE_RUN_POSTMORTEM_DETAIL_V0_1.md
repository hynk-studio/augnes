# Agent Workplane Run Postmortem Detail v0.1

## Status And Scope

Status: Agent Workplane Source-backed Run Postmortem Detail v0.1.

Scope: native Agent Workplane run postmortem visibility for `/workbench`.
This slice adds a type contract, pure read-only helper, native read-only Run
Postmortem detail panel, docs, smoke coverage, node-context updates, and
browser-regression marker updates. It does not create a Legacy Cockpit Shrink
Candidate PR.

No Legacy Cockpit functionality is deleted, shrunk, hidden, or disabled.
Compatibility path remains rendered. Future deletion requires a separate PR.
Browser regression, metrics, and dogfood are evidence/signals, not shrink
authority.

Run postmortem detail is visibility only, not runner authority.

## Why Run Postmortem Detail Hardening Exists

Bridge Trace Detail v0.1 improved Bridge, Source/ref visibility, Validation /
smoke visibility, and trace detail. Review / Memory Proposal Detail v0.1
improved native proposal review, durable memory review, Perspective review,
validation-required lanes, and no-apply visibility. The main remaining native
absorption gap before any future shrink candidate is source-backed Run
Postmortem detail.

This slice addresses that gap by making run summaries, step refs, event refs,
recovered DeltaBatch summaries, timeline rows, validation status, source refs,
postmortem signals, gaps, and runner no-authority boundaries explicit in the
native Workplane.

## Shrink-Plan Gaps Addressed

This slice improves:

- Work/run visibility: `RunPostmortemDetailPanel` renders source-backed run
  postmortem rows from existing recovered runner DeltaBatch readback.
- Runner output explainability: run_id, latest batch id, validation status,
  recovered delta count, step refs, event refs, and source refs are visible
  without rerunning the runner.
- Run / step / event / DeltaBatch traceability: the helper groups recovered
  batches by run and exposes related step, event, delta, and batch refs.
- Run Postmortem native replacement evidence: browser regression can inspect
  `data-workplane-run-postmortem-detail-panel="v0.1"` and visible no-runner
  authority copy.

## Native Run Postmortem Absorption

`types/workplane-run-postmortem-detail.ts` defines
`WORKPLANE_RUN_POSTMORTEM_DETAIL_VERSION`,
`WorkplaneRunPostmortemDetailRead`, run summaries, step summaries, event
summaries, DeltaBatch summaries, timeline items, postmortem signals, gap
details, statuses, run statuses, event kinds, signal statuses, and an authority
boundary with all mutation/execution/apply/shrink fields denied.

`lib/workplane/workplane-run-postmortem-detail.ts` builds detail from existing
`WorkplaneContextRead` and `AgentWorkplaneNodeContextRead`. It uses
`runner_delta_batch_read` already present in `WorkplaneContextRead`. It does
not read the runner ledger directly, call runner lifecycle helpers, call
`recoverDeltaBatchForRun`, call routes, fetch, write DB state, call
provider/OpenAI/GitHub/Codex, mutate state, tick a runner, schedule a runner,
recover DeltaBatch, apply memory, apply Perspective, auto-apply deltas, or
delete or hide Legacy Cockpit.

## UI Panel Behavior

`RunPostmortemDetailPanel` replaces the active skeleton render inside
`/workbench` so there is only one primary rendered native panel with
`data-workplane-panel-id="run_postmortem"`. The previous skeleton file remains
available for compatibility/history, but the active native surface is the new
detail panel.

The panel exposes:

- `data-workplane-run-postmortem-detail-panel="v0.1"`
- `data-workplane-panel-id="run_postmortem"`
- `data-workplane-node-id="run_postmortem"`
- `data-workplane-node-kind="runner_context_source"`
- `data-workplane-node-status` based on the read status

The panel renders Run Postmortem detail, Run summaries, Step refs, Event refs,
Recovered DeltaBatch summaries, Timeline, Postmortem signals, Gap details, and
Authority boundary.

Visible copy includes Run Postmortem detail, source-backed run postmortem,
run_id, step refs, event refs, recovered DeltaBatch, validation status, source
refs, no runner execution, no runner tick, no DeltaBatch recovery, no durable
memory apply, no Perspective apply, and legacy compatibility retained.

The panel is read-only run postmortem visibility, not runner authority and not
shrink authority. It renders no buttons, no forms, no textarea, no input, no
`onClick`, and no `formAction`.

## GuideBrief Debug Explainability

The node context keeps `run_postmortem` as a stable runner context source and
now derives related run ids, step ids, event ids, batch ids, delta ids, source
refs, validation smoke refs, fallback notes, staleness notes, and debug notes
from recovered runner DeltaBatch readback.

GuideBrief debug remains read-only explanation. It does not execute, tick,
schedule, recover, apply, send, mutate, run validation, write evidence, write
durable memory, apply Perspective, or auto-apply deltas.

## Browser Regression Expectations

`lib/workplane/workplane-browser-regression.ts` now recognizes:

- `data-workplane-run-postmortem-detail-panel="v0.1"`
- `data-workplane-panel-id="run_postmortem"`
- Run Postmortem detail
- source-backed run postmortem
- run_id
- step refs
- event refs
- recovered DeltaBatch
- validation status
- no runner execution
- no runner tick
- no DeltaBatch recovery

Browser regression can move Work/run visibility and Run Postmortem capability
checks toward stronger native evidence while still keeping the overall
recommendation gated when dogfood, metrics, legacy local UI control
classification, rollback, or human approval remain incomplete.

## Remaining Gaps

The following gaps intentionally remain:

- direct runner ledger event payload detail is not read by this helper;
- richer postmortem timeline detail may be needed later;
- richer proposal diff detail may be needed later;
- legacy local UI control classification remains separate;
- repeated metrics/dogfood baselines for review burden and resume latency;
- explicit rollback and human approval before any deletion PR.

## Authority Boundary

Boundary phrase: run postmortem detail is visibility only, not runner
authority.

This slice adds no route, no API write route, no server action, no chat
composer, no provider/OpenAI/GitHub/Codex execution, no Codex launch, branch
creation, PR creation, merge, publish, retry, replay, or deploy, no runner
execution, no runner tick, no runner recovery write, no scheduled runner
behavior, no product DB write or persistence, no proof/evidence write, no
durable memory apply, no Perspective apply, no delta auto-apply, no
localStorage/sessionStorage durable view mode, and no product UI action
authority.

No Legacy Cockpit deletion, shrink, hiding, disabling, or compatibility-path
removal is implemented here.

## Validation

Primary smoke:

```bash
npm run smoke:agent-workplane-run-postmortem-detail-v0-1
```

Related browser regression:

```bash
npm run browser:workplane-native-regression-v0-1
```

The browser regression requires an already-running dev server and remains
evidence, not shrink authority.

## Not Implemented Yet

This slice intentionally does not implement:

- Legacy Cockpit shrink or deletion;
- runner execution;
- runner tick;
- runner recovery write;
- scheduled runner behavior;
- durable memory apply;
- Perspective apply;
- delta auto-apply;
- proposal approve/reject/commit controls;
- rich runner event payload rendering;
- rich proposal diff UI;
- product route or API write route;
- server action or chat composer;
- provider/OpenAI/GitHub/Codex execution;
- proof/evidence write;
- product DB write or persistence;
- localStorage/sessionStorage durable view mode;
- product UI action authority.

## Recommended Next Phase

Recommended next phase: legacy local UI control classification or repeated
dogfood/metrics baseline. Do not proceed to Legacy Cockpit deletion yet.
