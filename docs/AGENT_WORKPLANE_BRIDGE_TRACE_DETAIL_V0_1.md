# Agent Workplane Bridge Trace Detail v0.1

## Status And Scope

Status: Agent Workplane Source Ref / Trace Bridge Detail Hardening v0.1.

Scope: native Agent Workplane bridge/trace detail absorption for `/workbench`.
This slice adds a type contract, pure read-only helper, native read-only
Source Ref Bridge detail panel, docs, smoke coverage, and browser-regression
marker updates. It does not create a Legacy Cockpit Shrink Candidate PR.

No Legacy Cockpit functionality is deleted, shrunk, hidden, or disabled.
Compatibility path remains rendered. Future deletion requires a separate PR.
Browser regression, metrics, and dogfood are evidence/signals, not shrink
authority.

## Why Bridge / Trace Detail Hardening Exists

Workplane Native Replacement Browser Regression v0.1 proved the structural
markers rendered, but capability readiness stayed partial. The Legacy Cockpit
Shrink Plan still identified native absorption gaps around Bridge matrix
detail, source/ref visibility, validation/evidence detail, review/memory
proposal visibility, source-backed Run Postmortem fields, and useful legacy
local UI control classification. Follow-on Review / Memory Proposal Detail
v0.1 is documented in
`docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md`. Follow-on Run
Postmortem Detail v0.1 is documented in
`docs/AGENT_WORKPLANE_RUN_POSTMORTEM_DETAIL_V0_1.md`.

This PR addresses the first bridge/source/ref/validation/trace slice. It makes
native Source Ref Bridge and Trace Bridge detail explicit and browser-visible
without adding authority or weakening compatibility content.

## Shrink-Plan Gaps Addressed

This slice improves:

- Bridge matrix detail: `SourceRefBridgeDetailPanel` renders bridge rows for
  `source_ref_bridge`, `trace_bridge`, `delta_projection`,
  `projected_delta_batch`, `runner_delta_batch`, and
  `legacy_cockpit_compatibility`.
- Source/ref visibility: refs are classified into current Perspective, Delta
  Projection, projected DeltaBatch, runner DeltaBatch, work event,
  coordination event, action record, evidence, artifact, handoff, diagnostic,
  snapshot, smoke, docs, repo, and retained legacy compatibility kinds.
- Validation/evidence detail: validation summary rows, evidence refs, artifact
  refs, handoff refs, diagnostic refs, and snapshot refs are displayed as
  pointer-only native context.
- Work/run visibility: recovered runner DeltaBatch readback remains visible
  and structurally distinct from projected DeltaBatch preview.

## Native Source Ref Bridge / Trace Bridge Absorption

`types/workplane-bridge-trace-detail.ts` defines
`WORKPLANE_BRIDGE_TRACE_DETAIL_VERSION`,
`WorkplaneBridgeTraceDetailRead`, bridge rows, validation details, evidence
details, diagnostic details, gap details, ref kinds, statuses, and an authority
boundary with all mutation/execution/shrink fields denied.

`lib/workplane/workplane-bridge-trace-detail.ts` builds detail from existing
`WorkplaneContextRead` and `AgentWorkplaneNodeContextRead`. It does not read
the runner ledger directly, call runner lifecycle helpers, call
`recoverDeltaBatchForRun`, call routes, fetch, write DB state, call
provider/OpenAI/GitHub/Codex, mutate state, or delete or hide Legacy Cockpit.

## UI Panel Behavior

`SourceRefBridgeDetailPanel` renders inside `/workbench` near Inspector,
Evidence/Handoff, and Trace Diagnostics. It exposes:

- `data-workplane-bridge-trace-detail-panel="v0.1"`
- `data-workplane-panel-id="source_ref_bridge"`
- `data-workplane-node-id="source_ref_bridge"`
- `data-workplane-node-kind="debug_context_source"`
- `data-workplane-node-status` based on the read status

The panel renders Bridge rows, Source ref kinds, Validation details, Evidence /
artifact / handoff details, Diagnostics / snapshots, Gap details, and Authority
boundary. Visible copy includes Source Ref Bridge, Trace Bridge, Bridge matrix,
source refs, validation summary, evidence refs, diagnostic refs, and legacy
compatibility retained.

The panel is read-only bridge/trace detail, not execution authority and not
shrink authority. It renders no buttons, no forms, no textarea, no input, no
`onClick`, and no `formAction`.

## GuideBrief Debug Explainability

The existing node context already exposes `source_ref_bridge` and
`trace_bridge` as stable nodes. This slice adds bridge/trace validation refs and
debug notes so GuideBrief Workplane Debug Context can explain the new native
detail panel through observed source refs, fallback/staleness notes, validation
summary, authority boundary, and needs-user-judgment gaps.

## Browser Regression Expectations

`lib/workplane/workplane-browser-regression.ts` now recognizes:

- `data-workplane-bridge-trace-detail-panel="v0.1"`
- `data-workplane-panel-id="source_ref_bridge"`
- Source Ref Bridge
- Trace Bridge
- Bridge matrix
- validation summary
- evidence refs
- diagnostic refs

Browser regression can move Bridge, Source/ref visibility, and
Validation/smoke visibility checks toward stronger native evidence while still
keeping the overall recommendation gated when dogfood, metrics, capability
readiness, rollback, or human approval remain incomplete.

## Remaining Gaps

The following gaps intentionally remain:

- direct runner event payload detail and richer postmortem timeline detail
  after source-backed Run Postmortem detail;
- repeated review/memory proposal dogfood and metrics baselines after
  `docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md`;
- legacy local UI control classification;
- repeated metrics/dogfood baselines for review burden and resume latency;
- explicit rollback and human approval before any deletion PR.

## Authority Boundary

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
npm run smoke:agent-workplane-bridge-trace-detail-v0-1
```

Related browser regression:

```bash
npm run browser:workplane-native-regression-v0-1
```

The browser regression requires an already-running dev server and remains
evidence, not shrink authority.

## Recommended Next Phase

Recommended next phase: legacy local UI control classification or repeated
dogfood/metrics baseline. Do not proceed to Legacy Cockpit deletion yet.
