# Agent Workplane Native Replacement Browser Regression v0.1

## 1. Status And Scope

Status: Browser Regression for Native Workplane Replacement v0.1.

Scope: repeatable browser/server-rendered regression coverage for native Agent
Workplane replacement surfaces before any future Legacy Cockpit shrink
candidate. This is not a shrink PR, not a deletion PR, and not a UI behavior
redesign PR.

This slice adds a type contract, pure HTML parsing helper, local GET-only
runner, documentation, package scripts, and smoke coverage. It does not change
product render behavior.

browser regression is evidence, not shrink authority. Metrics are signals, not
shrink authority. Dogfood reports are evidence, not shrink authority. Future
deletion requires a separate PR.

Follow-on Bridge/Trace detail hardening is documented in
`docs/AGENT_WORKPLANE_BRIDGE_TRACE_DETAIL_V0_1.md`. The regression now expects
the native Source Ref Bridge detail marker and visible Source Ref Bridge,
Trace Bridge, Bridge matrix, validation summary, evidence refs, and diagnostic
refs copy. This improves browser evidence for Bridge, Source/ref visibility,
and Validation/smoke visibility but does not make browser regression shrink
authority.

Follow-on Review / Memory Proposal detail hardening is documented in
`docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md`. The regression now expects
the native review memory detail marker and visible Review / memory proposal
detail, durable memory review, Perspective review, validation required, needs
user judgment, no durable memory apply, and no Perspective apply copy. This
improves browser evidence for Review / memory proposal visibility but does not
make browser regression shrink authority.

Follow-on Run Postmortem detail hardening is documented in
`docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md`. The regression now
expects the native run postmortem detail marker and visible Run Postmortem
detail, source-backed run postmortem, run_id, step refs, event refs, recovered
DeltaBatch, validation status, no runner execution, no runner tick, and no
DeltaBatch recovery copy. This improves browser evidence for Work/run
visibility but does not make browser regression shrink authority.

Follow-on Legacy Cockpit Local UI Control Classification is documented in
`docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md`.
The classification records read-only, copy/export, preview/local-draft,
local-write, forbidden, compatibility-only, and unknown/manual-review control
buckets before any shrink candidate. Browser regression can use that
classification as evidence/signaling, but it remains not shrink authority and
does not move local-write controls into native Workplane.

Follow-on repeated dogfood/metrics baseline is documented in
`docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md`. The baseline can attach
server-rendered browser regression evidence to repeated dogfood/metrics
signals, but it remains evidence/signaling only. A
`browser_regression_passed_shrink_gated` recommendation means structural
browser evidence passed while shrink still waits on metrics, dogfood,
local-control, rollback, and human review gates.

## 2. Why Browser Regression Exists

Legacy Cockpit remains reachable in `/workbench` as compatibility content while
native Agent Workplane surfaces absorb useful AI-operational capabilities.
The Legacy Cockpit Shrink Plan v0.1 requires browser or server-rendered
coverage before any shrink candidate because static docs and helper contracts
are not enough to prove the replacement surfaces still render together.

The regression exists before any shrink candidate to prove:

Why it happens before any shrink candidate: a future candidate must already
have evidence that native replacement surfaces are reachable and explainable
while compatibility rollback remains reachable.

- Legacy Cockpit compatibility remains reachable.
- Native replacement panels are rendered.
- Stable `data-workplane-*` panel/node IDs are present.
- GuideBrief Workplane Debug Context is rendered.
- GuideBrief Intent Projection and Workplane Intent Mode are rendered.
- Runner / Workplane Metrics are rendered.
- Projected DeltaBatch and recovered runner DeltaBatch remain structurally
  distinct.
- Native replacement/debug/projection/metrics areas do not expose mutation or
  action controls.
- The local check produces a repeatable JSON report.

## 3. What It Validates

The regression validates server-rendered or browser DOM HTML for:

- required native panel markers;
- required GuideBrief debug, intent projection, intent mode, and metrics
  markers;
- required Legacy Cockpit compatibility marker;
- visible/server-rendered section text for `Agent Workplane`, `Legacy Cockpit
  compatibility`, `GuideBrief Workplane Debug Context`, `GuideBrief Intent
  Projection`, `Workplane Intent Mode`, `Runner / Workplane Metrics`,
  `Projected Delta Batch`, `Recovered Runner DeltaBatch`, `Observed`,
  `Inferred`, `Suggested`, `Needs user judgment`, `Metrics are signals`, `not
  authority`, `reversible`, and `non-executable`;
- capability replacement coverage for Work Brief, Handoff, Perspective,
  Bridge, Operator visibility, Work/run visibility, Source/ref visibility,
  Review / memory proposal visibility, Validation / smoke visibility, and
  local UI controls;
- no-control checks in native replacement/debug/projection/metrics areas;
- recommendation logic that blocks shrink unless regression, dogfood, metrics,
  and explicit human review all pass.

## 4. What It Does Not Validate

This regression does not prove that native replacement is complete enough to
delete compatibility content. It does not measure live resume latency, live
review burden, dogfood usefulness, operator satisfaction, or human approval.
It does not validate local-write legacy controls beyond retaining compatibility
and pointing to
`docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md`.
It does not run a browser interaction suite by itself.

It also does not start the dev server. The runner expects an already-running
local server.

## 5. Server-Rendered HTML Fallback Model

`scripts/run-workplane-native-browser-regression-v0-1.mjs` performs one GET
against an already-running `/workbench` URL, parses the returned HTML string
with `lib/workplane/workplane-browser-regression.ts`, and prints a concise JSON
summary.

The helper is pure and local. It accepts supplied HTML text and optional
metadata, then returns a structured report. It does not fetch, call routes,
start a dev server, read or write DB state, call providers/OpenAI/GitHub/Codex,
run a runner, recover DeltaBatches, mutate state, delete or shrink Legacy
Cockpit, use browser storage, or use browser-only DOM APIs.

## 6. Optional Browser / CDP / Computer-Use Model

When DOM-capable browser/CDP tooling is available, the same marker checks can
be verified against the live DOM. Computer-use can add visual confirmation that
`/workbench` renders and the compatibility content is visible, but exact
marker assertions should use DOM inspection or the server-rendered HTML helper.

If DOM-capable tooling is unavailable, the server-rendered HTML runner is the
required fallback and must report that fallback explicitly.

## 7. Required Markers

Native replacement panel markers:

- `data-workplane-panel-id="work_queue"`
- `data-workplane-panel-id="current_perspective"`
- `data-workplane-panel-id="delta_projection"`
- `data-workplane-panel-id="projected_delta_batch"`
- `data-workplane-panel-id="delta_batch"`
- `data-workplane-panel-id="review_queue"`
- `data-workplane-panel-id="review_memory_detail"`
- `data-workplane-review-memory-detail-panel="v0.1"`
- `data-workplane-panel-id="evidence_handoff"`
- `data-workplane-panel-id="workplane_inspector"`
- `data-workplane-panel-id="source_ref_bridge"`
- `data-workplane-bridge-trace-detail-panel="v0.1"`
- `data-workplane-panel-id="projection_candidates"`
- `data-workplane-panel-id="handoff_builder_preview"`
- `data-workplane-panel-id="run_postmortem"`
- `data-workplane-run-postmortem-detail-panel="v0.1"`
- `data-workplane-panel-id="trace_diagnostics"`

Required compatibility marker:

- `data-workplane-panel-id="legacy_cockpit_compatibility"`

Required GuideBrief / metrics markers:

- `data-guide-workplane-debug-panel="v0.1"`
- `data-guide-intent-projection-panel="v0.1"`
- `data-workplane-intent-mode-panel="v0.1"`
- `data-workplane-metrics-panel="v0.1"`

## 8. DeltaBatch Identity Separation

The regression requires these identities to remain separate:

- `delta_projection` / `perspective_delta` is native Delta Projection.
- `projected_delta_batch` / `perspective_delta` is projected Delta Batch
  preview context.
- `delta_batch` / `runner_delta_batch` is recovered runner DeltaBatch
  readback.

If those identities collide or go missing, the recommendation is `do_not_shrink`.

## 9. No-Control Checks

For the native replacement/debug/projection/metrics target areas, the helper
checks that relevant HTML segments contain no:

- `button`
- `form`
- `input`
- `textarea`
- `formAction`
- `onClick`
- server action marker
- apply/approve/reject/recover/tick/schedule/launch/execute button copy

Boundary copy may mention denied actions. A denied-action sentence is not a
mutation control. The regression fails only when a target segment exposes a
control or server-action-looking affordance.

## 10. Capability Replacement Checks

The helper maps legacy Cockpit capabilities to native markers:

- Work Brief -> `work_queue` / `current_objective`
- Handoff -> `handoff_builder_preview` / `evidence_handoff`
- Perspective -> `current_perspective` / `delta_projection` /
  `projected_delta_batch`
- Bridge -> `source_ref_bridge` / `workplane_inspector` /
  `trace_diagnostics` plus Bridge matrix copy
- Operator visibility -> metrics, GuideBrief debug, and `review_queue`
- Work/run visibility -> `delta_batch` / `runner_delta_batch` /
  `run_postmortem`, `data-workplane-run-postmortem-detail-panel="v0.1"`,
  Run Postmortem detail, source-backed run postmortem, run_id, step refs,
  event refs, recovered DeltaBatch, validation status, no runner execution,
  no runner tick, and no DeltaBatch recovery copy
- Source/ref visibility -> `source_ref_bridge`, `workplane_inspector`,
  `trace_diagnostics`, `evidence_handoff`, and source refs copy
- Review / memory proposal visibility -> `review_queue`,
  `review_memory_detail`, `data-workplane-review-memory-detail-panel="v0.1"`,
  Review / memory proposal detail, durable memory review, Perspective review,
  validation required, needs user judgment, no durable memory apply, and no
  Perspective apply copy
- Validation / smoke visibility -> `source_ref_bridge`,
  `trace_diagnostics`, `evidence_handoff`, validation summary copy, evidence
  refs copy, and diagnostic refs copy
- Local UI controls -> `legacy_cockpit_compatibility` retained, with
  classification evidence in
  `docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md`;
  local-write controls are not natively shrunk

Capability checks can pass, be partial, or require review. Partial and
needs-review statuses block shrink authority.

## 11. Recommendation Logic

The report recommends:

- `do_not_shrink` if any required marker is missing;
- `do_not_shrink` if the Legacy Cockpit compatibility marker is missing;
- `do_not_shrink` if any no-control check fails;
- `do_not_shrink` if DeltaBatch identities collide or are missing;
- `browser_regression_passed_shrink_gated` when browser regression markers pass
  but dogfood/metrics/capability readiness remains `watch`, `needs_review`, or
  partial;
- `eligible_for_shrink_candidate_review` only when regression passes and the
  other gates are also healthy, with a dedicated future review PR and no
  automatic deletion.

## 12. How To Run

Start a dev server first:

```bash
AUGNES_DB_PATH=/tmp/augnes-native-browser-regression.db npm run dev -- --port 3000
```

Then run:

```bash
npm run browser:workplane-native-regression-v0-1
npm run smoke:workplane-native-browser-regression-v0-1
```

Optional environment variables:

- `AUGNES_BROWSER_REGRESSION_URL`, default
  `http://127.0.0.1:3000/workbench`
- `AUGNES_BROWSER_REGRESSION_OUTPUT_PATH`, optional JSON report path

The runner writes a JSON report only when `AUGNES_BROWSER_REGRESSION_OUTPUT_PATH`
is supplied.

## 13. Output Report Shape

`WorkplaneBrowserRegressionReport` includes:

- `version`
- `status`
- `url`
- `checked_at`
- `source`
- `marker_checks`
- `section_checks`
- `no_control_checks`
- `capability_checks`
- `deltabatch_identity_checks`
- `deltabatch_identity_status`
- `legacy_compatibility_status`
- `no_control_status`
- `marker_summary`
- `capability_summary`
- `authority_boundary`
- `recommendation`
- `notes`

The concise script summary prints version, status, URL, marker pass/fail
counts, capability counts, no-control status, legacy compatibility status,
DeltaBatch identity status, and recommendation.

## 14. Authority Boundary

This PR adds:

- no Legacy Cockpit deletion
- no Legacy Cockpit shrink
- no hiding of Cockpit content
- no removal of compatibility path
- no product UI behavior change
- no route
- no API write route
- no server action
- no chat composer
- no execution button
- no apply/approve/reject control
- no provider/OpenAI/GitHub/Codex execution
- no Codex launch, branch creation, PR creation, merge, publish, retry, replay, or deploy
- no runner execution
- no runner tick
- no runner recovery write
- no scheduled runner behavior
- no product DB write or persistence
- no proof/evidence write
- no durable memory apply
- no Perspective apply
- no delta auto-apply
- no localStorage/sessionStorage durable view mode
- no new local-write product controls

No Legacy Cockpit functionality is deleted or shrunk. No compatibility path is
removed. Future deletion requires a separate PR.

## 15. How This Feeds Shrink Review

This regression supplies Gate 7 evidence for the Legacy Cockpit Shrink Plan:
native replacement and compatibility rollback reachability. It does not satisfy
the metrics, dogfood, native absorption, rollback, or explicit human-approval
gates by itself.

Shrink remains blocked unless browser regression, dogfood, metrics, and
explicit human review all pass.

## 16. Not Implemented Yet

This slice does not implement:

- full Playwright/Chrome screenshot regression;
- multi-viewport layout assertions;
- visual diffing;
- click/keyboard interaction checks;
- local-write control classification;
- source-backed Run Postmortem fields;
- any Legacy Cockpit shrink candidate.

## 17. Recommended Next Phase

If this regression reports partial readiness, run another dogfood/metrics
baseline. Only if every gate is satisfied should Augnes consider Legacy
Cockpit Shrink Candidate v0.1 as a dedicated planning/removal-candidate PR.
No automatic deletion is allowed.
